'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioAnalysis } from '../useAudioAnalysis'
import { getBandEnergy, smooth, rgba, COLORS } from '../ghostPerformanceTypes'

// Canvas dimensions
const CW = 800
const CH = 480
const ROLL_H = 360
const KEY_H  = 120

// MIDI range: C2(36) → C6(84)
const DISPLAY_LO = 36
const DISPLAY_HI = 84

const WHITE_OFFSETS = [0, 2, 4, 5, 7, 9, 11]
const NOTE_NAMES   = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

function isWhite(midi: number)   { return WHITE_OFFSETS.includes(midi % 12) }
function noteName(midi: number)  { return NOTE_NAMES[midi % 12] }

function whitesBefore(midi: number): number {
  let c = 0
  for (let n = DISPLAY_LO; n < midi; n++) if (isWhite(n)) c++
  return c
}

let TOTAL_WHITE = 0
for (let n = DISPLAY_LO; n <= DISPLAY_HI; n++) if (isWhite(n)) TOTAL_WHITE++

const WHITE_KEY_W = CW / TOTAL_WHITE
const BLACK_KEY_W = WHITE_KEY_W * 0.55
const WHITE_KEY_H = KEY_H
const BLACK_KEY_H = KEY_H * 0.65
const HZ_PER_BIN  = 48000 / 2048

function noteToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function getNoteEnergy(freq: Uint8Array, midi: number): number {
  const bin = Math.round(noteToHz(midi) / HZ_PER_BIN)
  if (bin < 1 || bin >= freq.length - 1) return 0
  return (freq[bin - 1] + freq[bin] * 2 + freq[bin + 1]) / (4 * 255)
}

function keyX(midi: number): number {
  return isWhite(midi)
    ? whitesBefore(midi) * WHITE_KEY_W
    : whitesBefore(midi) * WHITE_KEY_W + WHITE_KEY_W * 0.6
}

// ── Note detection constants ─────────────────────────────────────────────────
const MAX_BARS      = 12
const ENERGY_THRESH = 0.38
const MAX_NOTES     = 3
const NOTE_COOLDOWN = 350
const MIN_SEMITONES = 4
const FALL_SPEED    = 160

// Find top N melodic peaks using local-maximum detection + semitone spacing.
function detectTopNotes(
  freq: Uint8Array, lo: number, hi: number, max: number,
): Array<{ midi: number; energy: number }> {
  const cands: Array<{ midi: number; energy: number }> = []
  for (let midi = lo; midi <= hi; midi++) {
    const e = getNoteEnergy(freq, midi)
    if (e < ENERGY_THRESH) continue
    const ep = midi > lo ? getNoteEnergy(freq, midi - 1) : 0
    const en = midi < hi ? getNoteEnergy(freq, midi + 1) : 0
    if (e < ep || e < en) continue
    cands.push({ midi, energy: e })
  }
  cands.sort((a, b) => b.energy - a.energy)
  const kept: Array<{ midi: number; energy: number }> = []
  for (const c of cands) {
    if (kept.every(k => Math.abs(k.midi - c.midi) >= MIN_SEMITONES)) {
      kept.push(c)
      if (kept.length >= max) break
    }
  }
  return kept
}

// ── Data structures ──────────────────────────────────────────────────────────
interface FallingBar {
  midi:      number
  y:         number
  h:         number
  vel:       number
  opacity:   number
  triggered: boolean
  fading:    boolean
  isChord:   boolean
}

interface KeyPress { midi: number; glowT: number }
interface GhostFlash { midi: number; t: number }

// Per-octave tint colors [C2-B2, C3-B3, C4-B4, C5+]
const OCT_TINTS = [
  { lo: 36, hi: 47, r: 130, g: 75,  b: 20  },
  { lo: 48, hi: 59, r: 110, g: 80,  b: 35  },
  { lo: 60, hi: 71, r: 80,  g: 65,  b: 50  },
  { lo: 72, hi: 84, r: 50,  g: 75,  b: 110 },
]

export default function CinematicPianoRoll() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef<number>(0)
  const lastTimeRef  = useRef<number>(0)
  const lastSpawnRef = useRef<number>(0)
  const barsRef      = useRef<FallingBar[]>([])
  const pressesRef   = useRef<Map<number, KeyPress>>(new Map())
  const cooldownRef  = useRef<Map<number, number>>(new Map())
  const flashesRef   = useRef<GhostFlash[]>([])
  const heldRef      = useRef<Map<number, number>>(new Map())

  // BPM detection (item 44)
  const beatTimesRef     = useRef<number[]>([])
  const lastBeatRef      = useRef<number>(0)
  const prevEnergyRef    = useRef<number>(0)
  const spawnIntervalRef = useRef<number>(140)

  // Silence tracking (item 47)
  const silenceTimerRef  = useRef<number>(0)

  // Energy sparkline (item 48)
  const energyHistRef    = useRef<number[]>(Array(60).fill(0))

  // Bass note (item 45)
  const bassNoteRef      = useRef<{ note: string; t: number } | null>(null)

  // Root key (item 46): running pitch-class accumulator
  const pitchClassRef    = useRef<number[]>(Array(12).fill(0))

  // Idle heartbeat (item 13)
  const heartbeatRef     = useRef<{ y: number; dir: number }>({ y: 0, dir: 1 })

  const { getFrequencyData, isPlaying } = useAudioAnalysis()

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current
    if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
    const ctx = canvas.getContext('2d')
    if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }

    const dt   = Math.min((now - lastTimeRef.current) / 1000, 0.05)
    lastTimeRef.current = now

    const freq = isPlaying ? getFrequencyData() : null

    // ── Overall energy + BPM detection (item 44) ─────────────────────
    let overall = 0
    if (freq) {
      let sum = 0
      for (let i = 0; i < freq.length; i++) sum += freq[i]
      overall = sum / (freq.length * 255)

      const prev = prevEnergyRef.current
      if (now - lastBeatRef.current > 220 && overall > prev * 1.32 && overall > 0.30) {
        lastBeatRef.current = now
        const beats = beatTimesRef.current
        beats.push(now)
        if (beats.length > 8) beats.shift()
        if (beats.length >= 4) {
          let total = 0
          for (let i = 1; i < beats.length; i++) total += beats[i] - beats[i - 1]
          const avgMs = total / (beats.length - 1)
          const bpm = 60000 / avgMs
          if (bpm >= 55 && bpm <= 220) spawnIntervalRef.current = Math.max(75, avgMs / 2)
        }
      }
      prevEnergyRef.current = overall
    }

    // ── Energy sparkline history (item 48) ───────────────────────────
    const hist = energyHistRef.current
    hist.push(overall)
    if (hist.length > 60) hist.shift()

    // ── Root key detection (item 46) ─────────────────────────────────
    const pitchClass = pitchClassRef.current
    if (freq) {
      for (let midi = DISPLAY_LO; midi <= DISPLAY_HI; midi++) {
        const e = getNoteEnergy(freq, midi)
        if (e > 0.30) pitchClass[midi % 12] += e * dt * 0.6
      }
    }
    for (let i = 0; i < 12; i++) pitchClass[i] *= 0.9985
    const rootKey = isPlaying ? pitchClass.indexOf(Math.max(...pitchClass)) : -1

    // ── Bass note label (item 45) ─────────────────────────────────────
    if (freq) {
      const bassE = getBandEnergy(freq, 60, 220)
      if (bassE > 0.38) {
        let maxE = 0, maxMidi = 36
        for (let m = 36; m <= 52; m++) {
          const e = getNoteEnergy(freq, m)
          if (e > maxE) { maxE = e; maxMidi = m }
        }
        if (maxE > 0.32) bassNoteRef.current = { note: noteName(maxMidi), t: 1.0 }
      }
    }
    if (bassNoteRef.current) {
      bassNoteRef.current.t -= dt * 0.7
      if (bassNoteRef.current.t <= 0) bassNoteRef.current = null
    }

    // ── Silence detection → fade all bars (item 47) ──────────────────
    if (isPlaying) {
      if (overall < 0.04) {
        silenceTimerRef.current += dt
        if (silenceTimerRef.current > 1.5) {
          for (const b of barsRef.current) b.fading = true
        }
      } else {
        silenceTimerRef.current = 0
      }
    }

    // ── Spawn new bars ────────────────────────────────────────────────
    if (freq && now - lastSpawnRef.current > spawnIntervalRef.current) {
      lastSpawnRef.current = now
      const bars     = barsRef.current
      const cooldown = cooldownRef.current
      const held     = heldRef.current

      if (bars.filter(b => !b.fading).length < MAX_BARS) {
        const top = detectTopNotes(freq, DISPLAY_LO, DISPLAY_HI, MAX_NOTES)
        const isChord = top.length >= 3

        for (const { midi, energy } of top) {
          const lastSeen = cooldown.get(midi) ?? 0
          if (now - lastSeen < NOTE_COOLDOWN) {
            // Extend existing bar for sustained note (item 2)
            const existing = bars.find(b => b.midi === midi && !b.fading && b.y < ROLL_H - 20)
            if (existing) {
              const cnt = (held.get(midi) ?? 0) + 1
              held.set(midi, cnt)
              if (cnt >= 2) existing.h = Math.min(existing.h + 10, 110)
            }
            continue
          }

          const hasDupe = bars.some(b => b.midi === midi && b.y < 40)
          if (hasDupe) continue

          // Item 49: non-linear bar height
          const barH = Math.max(16, Math.sqrt(energy) * 88)
          // Item 1: stagger spawn offset
          const spawnY = -(barH + Math.random() * 22)

          bars.push({
            midi,
            y:         spawnY,
            h:         barH,
            vel:       FALL_SPEED,
            opacity:   0.58 + energy * 0.42,
            triggered: false,
            fading:    false,
            isChord,
          })
          cooldown.set(midi, now)
          held.set(midi, 0)
        }

        for (const [midi] of held) {
          if (!top.some(n => n.midi === midi)) held.delete(midi)
        }
      }
    }

    // ── Update bar positions ──────────────────────────────────────────
    const bars    = barsRef.current
    const presses = pressesRef.current
    const flashes = flashesRef.current
    const kyTop   = ROLL_H

    for (let i = bars.length - 1; i >= 0; i--) {
      const bar = bars[i]

      // Item 14: fade-on-exit
      if (bar.fading) {
        bar.opacity -= dt * 3.5
        bar.y       += bar.vel * dt * 0.3
        if (bar.opacity <= 0) { bars.splice(i, 1); continue }
        continue
      }

      bar.y += bar.vel * dt

      if (!bar.triggered && bar.y + bar.h >= kyTop) {
        bar.triggered = true
        presses.set(bar.midi, { midi: bar.midi, glowT: 1.0 })

        // Item 8: ghost flash for weak hits
        if (bar.opacity < 0.72) flashes.push({ midi: bar.midi, t: 0.55 })
      }

      if (bar.y > kyTop + 12) bar.fading = true
    }

    // Ghost flash decay
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].t -= dt * 3.5
      if (flashes[i].t <= 0) flashes.splice(i, 1)
    }

    // Item 9: pedal sustain — slower decay (1.5/s instead of 3.5)
    for (const [midi, press] of presses) {
      press.glowT -= 1.5 * dt
      if (press.glowT <= 0) presses.delete(midi)
    }

    // Item 13: idle heartbeat
    if (!isPlaying) {
      const hb = heartbeatRef.current
      hb.y += 50 * dt * hb.dir
      if (hb.y >= ROLL_H - 20) hb.dir = -1
      if (hb.y <= 0)           hb.dir =  1
    }

    // ═══════════════════════════ DRAW ════════════════════════════════

    ctx.fillStyle = '#07070f'
    ctx.fillRect(0, 0, CW, CH)

    // G16: subtle sheet music staff watermark behind the roll
    if (!isPlaying) {
      const staffY0 = ROLL_H / 2 - 40
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = 'rgba(196,149,58,0.025)'
        ctx.fillRect(48, staffY0 + i * 20, CW - 96, 1)
      }
    }

    // ── Item 4: per-octave column tinting ────────────────────────────
    for (const oct of OCT_TINTS) {
      const xLo = keyX(oct.lo)
      const xHi = keyX(Math.min(oct.hi + 1, DISPLAY_HI)) + WHITE_KEY_W
      ctx.fillStyle = `rgba(${oct.r},${oct.g},${oct.b},0.028)`
      ctx.fillRect(xLo, 0, xHi - xLo, ROLL_H)
    }

    // ── Item 15: C-note lane highlight ───────────────────────────────
    for (let n = DISPLAY_LO; n <= DISPLAY_HI; n++) {
      if (n % 12 !== 0) continue
      const x = whitesBefore(n) * WHITE_KEY_W
      ctx.fillStyle = rgba(COLORS.GOLD, 0.022)
      ctx.fillRect(x, 0, WHITE_KEY_W, ROLL_H)
    }

    // ── Item 46: root key column ─────────────────────────────────────
    if (rootKey >= 0 && isPlaying) {
      for (let n = DISPLAY_LO; n <= DISPLAY_HI; n++) {
        if (n % 12 !== rootKey) continue
        const x = keyX(n)
        const w = isWhite(n) ? WHITE_KEY_W : BLACK_KEY_W
        ctx.fillStyle = rgba(COLORS.GOLD, 0.038)
        ctx.fillRect(x, 0, w, ROLL_H)
      }
    }

    // ── Item 12: background column ambient behind active bars ─────────
    for (const bar of bars) {
      if (bar.fading) continue
      const x = keyX(bar.midi)
      const w = isWhite(bar.midi) ? WHITE_KEY_W : BLACK_KEY_W
      const cg = ctx.createLinearGradient(x, 0, x, ROLL_H)
      cg.addColorStop(0, rgba(COLORS.GOLD, 0))
      cg.addColorStop(0.6, rgba(COLORS.GOLD, 0.028))
      cg.addColorStop(1, rgba(COLORS.GOLD, 0.055))
      ctx.fillStyle = cg
      ctx.fillRect(x, 0, w, ROLL_H)
    }

    // ── Item 45: bass note large label ───────────────────────────────
    if (isPlaying && bassNoteRef.current) {
      const { note, t } = bassNoteRef.current
      ctx.save()
      ctx.fillStyle = rgba(COLORS.GOLD, Math.min(t * 0.055, 0.055))
      ctx.font = `bold ${70 + t * 15}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(note, CW / 2, ROLL_H * 0.62)
      ctx.restore()
    }

    // ── Grid ─────────────────────────────────────────────────────────
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.038)
    ctx.lineWidth = 1
    for (let y = 0; y < ROLL_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke()
    }
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.028)
    ctx.lineWidth = 0.5
    for (let n = DISPLAY_LO; n <= DISPLAY_HI; n++) {
      if (!isWhite(n)) continue
      const x = whitesBefore(n) * WHITE_KEY_W
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ROLL_H); ctx.stroke()
    }

    // ── Item 6: octave markers on left ───────────────────────────────
    for (let oct = 2; oct <= 5; oct++) {
      const midi = 12 * (oct + 1)
      if (midi < DISPLAY_LO || midi > DISPLAY_HI) continue
      const ratio = (midi - DISPLAY_LO) / (DISPLAY_HI - DISPLAY_LO)
      const y = ROLL_H * (1 - ratio)
      ctx.fillStyle = rgba(COLORS.GOLD, 0.22)
      ctx.font = '7px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`C${oct}`, 4, y + 4)
    }

    // ── Item 50: polyphony counter ────────────────────────────────────
    const activeBars = bars.filter(b => !b.fading)
    if (isPlaying && activeBars.length > 0) {
      ctx.fillStyle = rgba(COLORS.GOLD, 0.22)
      ctx.font = '7px system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${activeBars.length}♩`, CW - 6, 13)
    }

    // ── Item 13: idle heartbeat bar ───────────────────────────────────
    if (!isPlaying) {
      const hb   = heartbeatRef.current
      const midX = keyX(60)
      const wk   = WHITE_KEY_W - 2
      const hg   = ctx.createLinearGradient(midX, hb.y, midX, hb.y + 24)
      hg.addColorStop(0, rgba(COLORS.GOLD, 0))
      hg.addColorStop(0.5, rgba(COLORS.GOLD, 0.22))
      hg.addColorStop(1, rgba(COLORS.GOLD, 0))
      ctx.fillStyle = hg
      ctx.fillRect(midX + 1, hb.y, wk, 24)
    }

    // ── Draw falling bars ─────────────────────────────────────────────
    for (const bar of bars) {
      const white = isWhite(bar.midi)
      const bx    = keyX(bar.midi) + 1
      const bw    = (white ? WHITE_KEY_W : BLACK_KEY_W) - 2
      // Item 3: velocity-to-width
      const bwAdj = bw * (0.86 + bar.opacity * 0.24)
      const bxAdj = bx + (bw - bwAdj) / 2

      const clipY = Math.max(0, bar.y)
      const clipH = Math.min(bar.y + bar.h, ROLL_H) - clipY
      if (clipH <= 0) continue

      const radius  = Math.min(4, clipH / 2)
      const baseA   = bar.fading ? bar.opacity * 0.5 : bar.opacity

      // Item 10: chord coloring
      const cr = bar.isChord ? 218 : COLORS.GOLD.r
      const cg = bar.isChord ? 142 : COLORS.GOLD.g
      const cb = bar.isChord ? 28  : COLORS.GOLD.b

      const grad = ctx.createLinearGradient(bxAdj, clipY, bxAdj, clipY + clipH)
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${baseA * 0.28})`)
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},${baseA * 0.96})`)

      ctx.shadowColor = `rgba(${cr},${cg},${cb},0.55)`
      ctx.shadowBlur  = 8
      ctx.fillStyle   = grad
      ctx.beginPath()
      if (bar.y >= 0) ctx.roundRect(bxAdj, clipY, bwAdj, clipH, [radius, radius, 0, 0])
      else            ctx.rect(bxAdj, clipY, bwAdj, clipH)
      ctx.fill()
      ctx.shadowBlur  = 0
      ctx.shadowColor = 'transparent'

      // Item 7: trail glow below bar
      if (!bar.fading && clipH > 4) {
        const maxTrail = Math.min(20, ROLL_H - clipY - clipH)
        if (maxTrail > 0) {
          const tg = ctx.createLinearGradient(bxAdj, clipY + clipH, bxAdj, clipY + clipH + maxTrail)
          tg.addColorStop(0, `rgba(${cr},${cg},${cb},${baseA * 0.22})`)
          tg.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
          ctx.fillStyle = tg
          ctx.fillRect(bxAdj, clipY + clipH, bwAdj, maxTrail)
        }
      }
    }

    // ── Item 8: ghost flash at keyboard top ───────────────────────────
    for (const flash of flashes) {
      const x = keyX(flash.midi)
      const w = isWhite(flash.midi) ? WHITE_KEY_W : BLACK_KEY_W
      ctx.fillStyle = rgba(COLORS.GOLD, flash.t * 0.35)
      ctx.fillRect(x, ROLL_H - 22, w, 22)
    }

    // ── Item 11: scanlines over roll area ─────────────────────────────
    for (let y = 0; y < ROLL_H; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.045)'
      ctx.fillRect(0, y, CW, 1)
    }

    // ── Divider ───────────────────────────────────────────────────────
    ctx.fillStyle = rgba(COLORS.GOLD, 0.30)
    ctx.fillRect(0, ROLL_H, CW, 2)

    // ── Keyboard ──────────────────────────────────────────────────────
    const kyBase = ROLL_H + 2

    // White keys
    for (let midi = DISPLAY_LO; midi <= DISPLAY_HI; midi++) {
      if (!isWhite(midi)) continue
      const x    = whitesBefore(midi) * WHITE_KEY_W
      const press = presses.get(midi)
      const glow  = press?.glowT ?? 0

      const kg = ctx.createLinearGradient(x, kyBase, x, kyBase + WHITE_KEY_H - 2)
      kg.addColorStop(0, glow > 0 ? rgba(COLORS.GOLD, glow * 0.85) : 'rgba(224,218,205,0.92)')
      kg.addColorStop(0.6, glow > 0 ? rgba(COLORS.GOLD, glow * 0.45) : 'rgba(200,193,178,0.88)')
      kg.addColorStop(1, glow > 0 ? rgba(COLORS.GOLD, glow * 0.20) : 'rgba(180,172,157,0.85)')
      ctx.fillStyle = kg
      ctx.beginPath()
      ctx.roundRect(x + 0.5, kyBase, WHITE_KEY_W - 1, WHITE_KEY_H - 2, [0, 0, 3, 3])
      ctx.fill()
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.15 + glow * 0.3)
      ctx.lineWidth = 0.5
      ctx.stroke()

      if (glow > 0) {
        ctx.shadowColor = rgba(COLORS.GOLD, glow * 0.9)
        ctx.shadowBlur  = 12 * glow
        ctx.fillStyle   = rgba(COLORS.GOLD, glow * 0.18)
        ctx.fillRect(x + 1, kyBase, WHITE_KEY_W - 2, WHITE_KEY_H - 2)
        ctx.shadowBlur  = 0
        ctx.shadowColor = 'transparent'

        // Item 5: note name label on pressed key
        if (glow > 0.45) {
          ctx.fillStyle = rgba(COLORS.GOLD, Math.min(glow * 0.9, 0.85))
          ctx.font      = `${6 + glow * 2}px system-ui, sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(noteName(midi), x + WHITE_KEY_W / 2, kyBase + WHITE_KEY_H - 9)
        }
      }
    }

    // Black keys
    for (let midi = DISPLAY_LO; midi <= DISPLAY_HI; midi++) {
      if (isWhite(midi)) continue
      const x    = whitesBefore(midi) * WHITE_KEY_W + WHITE_KEY_W * 0.6
      const press = presses.get(midi)
      const glow  = press?.glowT ?? 0

      const kg = ctx.createLinearGradient(x, kyBase, x, kyBase + BLACK_KEY_H)
      kg.addColorStop(0, glow > 0 ? rgba(COLORS.GOLD, glow * 0.8) : 'rgba(16,16,24,1)')
      kg.addColorStop(1, glow > 0 ? rgba(COLORS.GOLD, glow * 0.3) : 'rgba(8,8,14,1)')
      ctx.fillStyle = kg
      ctx.beginPath()
      ctx.roundRect(x, kyBase, BLACK_KEY_W, BLACK_KEY_H, [0, 0, 3, 3])
      ctx.fill()
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.12 + glow * 0.3)
      ctx.lineWidth = 0.5
      ctx.stroke()

      if (glow > 0.1) {
        ctx.shadowColor = rgba(COLORS.GOLD, glow * 0.8)
        ctx.shadowBlur  = 10 * glow
        ctx.fillStyle   = rgba(COLORS.GOLD, glow * 0.14)
        ctx.fillRect(x + 1, kyBase, BLACK_KEY_W - 2, BLACK_KEY_H - 1)
        ctx.shadowBlur  = 0
        ctx.shadowColor = 'transparent'
      }
    }

    // ── Item 48: energy sparkline at very bottom of keyboard ──────────
    if (isPlaying) {
      const sw = CW / 60
      for (let i = 0; i < hist.length; i++) {
        const bh = Math.max(1, hist[i] * 5)
        ctx.fillStyle = rgba(COLORS.GOLD, 0.10 + hist[i] * 0.30)
        ctx.fillRect(i * sw, CH - bh, sw - 0.5, bh)
      }
    }

    if (!isPlaying) {
      const breathe = 0.5 + 0.5 * Math.sin((Date.now() / 4000) * Math.PI * 2)
      ctx.beginPath()
      ctx.arc(CW / 2, ROLL_H / 2, 18 + breathe * 4, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.04 + breathe * 0.04)
      ctx.lineWidth = 1
      ctx.stroke()
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [getFrequencyData, isPlaying])

  useEffect(() => {
    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      className="w-full block"
      aria-label="Cinematic Piano Roll"
    />
  )
}
