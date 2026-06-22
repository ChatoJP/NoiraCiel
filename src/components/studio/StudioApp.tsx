'use client'

import dynamic from 'next/dynamic'
import { useState, useRef, useEffect, useCallback } from 'react'
import { StudioProvider } from './StudioContext'
import StudioTransport from './StudioTransport'

const Piano         = dynamic(() => import('./Piano'),         { ssr: false, loading: () => <PanelLoading /> })
const BeatSequencer = dynamic(() => import('./BeatSequencer'), { ssr: false, loading: () => <PanelLoading /> })
const SampleSlicer  = dynamic(() => import('./SampleSlicer'),  { ssr: false, loading: () => <PanelLoading /> })
const SamplePads    = dynamic(() => import('./SamplePads'),    { ssr: false, loading: () => <PanelLoading /> })
const AutoMashup    = dynamic(() => import('./AutoMashup'),    { ssr: false, loading: () => <PanelLoading /> })
const Looper        = dynamic(() => import('./Looper'),        { ssr: false, loading: () => <PanelLoading /> })
const PianoRoll     = dynamic(() => import('./PianoRoll'),     { ssr: false, loading: () => <PanelLoading /> })
const EffectsRack   = dynamic(() => import('./EffectsRack'),   { ssr: false, loading: () => <PanelLoading /> })
const TheoryTools   = dynamic(() => import('./TheoryTools'),   { ssr: false, loading: () => <PanelLoading /> })
const SongStructure = dynamic(() => import('./SongStructure'), { ssr: false, loading: () => <PanelLoading /> })
const AIComposer    = dynamic(() => import('./AIComposer'),    { ssr: false, loading: () => <PanelLoading /> })
const MoodRadio     = dynamic(() => import('./MoodRadio'),     { ssr: false, loading: () => <PanelLoading /> })
const AnalyticsDash = dynamic(() => import('./AnalyticsDashboard'), { ssr: false, loading: () => <PanelLoading /> })
const Visualiser    = dynamic(() => import('./Visualiser'),    { ssr: false })

function PanelLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="font-body text-[9px] tracking-[0.4em] uppercase text-t-accent/40 animate-pulse">Loading…</span>
    </div>
  )
}

const TABS = [
  { id: 'piano',     label: 'Piano',       icon: '♩' },
  { id: 'roll',      label: 'Piano Roll',  icon: '▤' },
  { id: 'sequencer', label: 'Sequencer',   icon: '▦' },
  { id: 'slicer',    label: 'Slicer',      icon: '◈' },
  { id: 'pads',      label: 'Pads',        icon: '⊞' },
  { id: 'looper',    label: 'Looper',      icon: '↺' },
  { id: 'mashup',    label: 'Auto Mashup', icon: '⟳' },
  { id: 'effects',   label: 'Effects',     icon: '≋' },
  { id: 'theory',    label: 'Theory',      icon: '𝄞' },
  { id: 'structure', label: 'Structure',   icon: '▣' },
  { id: 'ai',        label: 'AI Music',    icon: '✦' },
  { id: 'radio',     label: 'Mood Radio',  icon: '◈' },
  { id: 'stats',     label: 'Analytics',   icon: '▦' },
] as const

type TabId = typeof TABS[number]['id']

// Studio skins — CSS variable overrides applied as inline style on root container
const SKINS = [
  { id: 'default', label: 'Noir', accentRgb: null, bgClass: '' },
  { id: 'amber',   label: 'Amber', accentRgb: '196,149,58',  bgClass: 'studio-skin-amber' },
  { id: 'teal',    label: 'Teal',  accentRgb: '52,160,148',  bgClass: 'studio-skin-teal' },
  { id: 'rose',    label: 'Rose',  accentRgb: '188,80,108',  bgClass: 'studio-skin-rose' },
] as const

type SkinId = typeof SKINS[number]['id']

const SHORTCUT_MAP = [
  { section: 'Transport', shortcuts: [
    ['Space (in transport)', 'Play / Stop'],
    ['`, 1–0', 'Piano octave keys'],
    ['←/→', 'Shift piano octave'],
    ['Space (in piano)', 'Sustain pedal'],
  ]},
  { section: 'Piano Roll', shortcuts: [
    ['Ctrl+Z', 'Undo'],
    ['Ctrl+Y', 'Redo'],
    ['Click cell', 'Draw note'],
    ['Alt+drag', 'Adjust velocity'],
  ]},
  { section: 'Beat Sequencer', shortcuts: [
    ['Right-click step', 'Mute/unmute step'],
    ['Alt+drag step', 'Set step velocity'],
    ['C / P buttons', 'Copy / Paste row'],
  ]},
  { section: 'Sample Pads', shortcuts: [
    ['1–8 keys', 'Trigger pads'],
    ['Slicer → assign', 'Load sample to pad'],
  ]},
  { section: 'Theory Tools', shortcuts: [
    ['Tuner', 'Grant mic → auto-detects pitch'],
    ['Chord Dict', 'Click chord → hear it'],
    ['BPM Calc → Apply', 'Sync BPM to transport'],
  ]},
  { section: 'General', shortcuts: [
    ['F key (header)', 'Toggle fullscreen'],
    ['? (header)', 'This shortcut map'],
  ]},
]

function ShortcutMapModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,6,10,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-noir-deep border border-noir-silver/15 max-w-xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-noir-silver/10">
          <div>
            <p className="font-body text-[9px] tracking-[0.4em] uppercase text-t-accent/60">Studio</p>
            <h2 className="font-heading text-lg text-noir-ivory font-light">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-noir-silver/15 text-noir-silver/40 hover:border-t-accent/30 hover:text-t-accent transition-all">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-5">
          {SHORTCUT_MAP.map(sec => (
            <div key={sec.section}>
              <p className="font-body text-[8px] tracking-[0.4em] uppercase text-t-accent/50 mb-2">{sec.section}</p>
              <div className="space-y-1.5">
                {sec.shortcuts.map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-3">
                    <kbd className="font-mono text-[10px] px-2 py-0.5 border border-noir-silver/15 text-noir-ivory/70 bg-noir-void/50 min-w-[120px] flex-shrink-0">
                      {key}
                    </kbd>
                    <span className="font-body text-[10px] text-noir-silver/50">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4">
          <p className="font-body text-[8px] text-noir-silver/20">Press Esc to close</p>
        </div>
      </div>
    </div>
  )
}

export default function StudioApp() {
  const [activeTab, setActiveTab] = useState<TabId>('piano')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [skin, setSkin] = useState<SkinId>('default')
  const [showSkinPicker, setShowSkinPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeSkin = SKINS.find(s => s.id === skin)!

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onFsc = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsc)
    return () => document.removeEventListener('fullscreenchange', onFsc)
  }, [])

  // Keyboard: F = fullscreen, ? = shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) toggleFullscreen()
      if (e.key === '?') setShowShortcuts(v => !v)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleFullscreen])

  const containerStyle = activeSkin.accentRgb
    ? { '--t-accent-rgb': activeSkin.accentRgb } as React.CSSProperties
    : {}

  return (
    <StudioProvider>
      <div
        ref={containerRef}
        className="min-h-screen bg-noir-void flex flex-col"
        style={containerStyle}
      >
        {/* Header */}
        <div className="border-b border-noir-silver/10 px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <div>
            <p className="font-body text-[9px] tracking-[0.5em] uppercase text-t-accent/60">NoiraCiel</p>
            <h1 className="font-heading text-2xl text-noir-ivory font-light tracking-wide">Studio</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="font-body text-[8px] tracking-[0.25em] uppercase text-noir-silver/20 hidden md:block">
              Browser · No cloud · No data stored
            </span>

            {/* Skin picker */}
            <div className="relative">
              <button onClick={() => setShowSkinPicker(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 border font-body text-[8px] tracking-[0.15em] uppercase transition-all ${showSkinPicker ? 'border-t-accent/50 text-t-accent' : 'border-noir-silver/15 text-noir-silver/35 hover:border-t-accent/30'}`}
                title="Studio skin">
                <span className="w-2.5 h-2.5 rounded-full border border-current inline-block"
                  style={activeSkin.accentRgb ? { background: `rgb(${activeSkin.accentRgb})`, borderColor: `rgb(${activeSkin.accentRgb})` } : {}}/>
                {activeSkin.label}
              </button>
              {showSkinPicker && (
                <div className="absolute right-0 top-full mt-1 bg-noir-deep border border-noir-silver/15 z-20 min-w-[100px]">
                  {SKINS.map(s => (
                    <button key={s.id}
                      onClick={() => { setSkin(s.id); setShowSkinPicker(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 font-body text-[9px] uppercase tracking-[0.15em] transition-colors ${skin === s.id ? 'text-t-accent bg-t-accent/8' : 'text-noir-silver/40 hover:text-noir-ivory/60 hover:bg-noir-silver/5'}`}>
                      <span className="w-2 h-2 rounded-full border border-current inline-block"
                        style={s.accentRgb ? { background: `rgb(${s.accentRgb})`, borderColor: `rgb(${s.accentRgb})` } : {}}/>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shortcut map */}
            <button onClick={() => setShowShortcuts(true)}
              className="w-8 h-8 flex items-center justify-center border border-noir-silver/15 text-noir-silver/35 hover:border-t-accent/30 hover:text-t-accent transition-all font-body text-sm"
              title="Keyboard shortcuts (?)">?</button>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen}
              className={`w-8 h-8 flex items-center justify-center border transition-all ${isFullscreen ? 'border-t-accent/50 text-t-accent bg-t-accent/8' : 'border-noir-silver/15 text-noir-silver/35 hover:border-t-accent/30 hover:text-t-accent'}`}
              title="Fullscreen (F)">
              {isFullscreen
                ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                : <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>}
            </button>
          </div>
        </div>

        {/* Transport */}
        <StudioTransport />

        {/* Visualiser — always visible */}
        <Visualiser />

        {/* Tab bar */}
        <div className="flex border-b border-noir-silver/10 overflow-x-auto scrollbar-none flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-body text-[9px] tracking-[0.18em] uppercase transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-t-accent text-t-accent bg-t-accent/5'
                  : 'border-transparent text-noir-silver/38 hover:text-noir-silver/65 hover:bg-noir-silver/3'
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className={`flex-1 overflow-auto ${activeTab === 'piano' ? 'py-6' : 'p-5 md:p-8'}`}>
          <div className={activeTab === 'piano' ? 'w-full' : 'max-w-5xl mx-auto'}>
            {activeTab === 'piano'     && <Piano />}
            {activeTab === 'roll'      && <PianoRoll />}
            {activeTab === 'sequencer' && <BeatSequencer />}
            {activeTab === 'slicer'    && <SampleSlicer />}
            {activeTab === 'pads'      && <SamplePads />}
            {activeTab === 'looper'    && <Looper />}
            {activeTab === 'mashup'    && <AutoMashup />}
            {activeTab === 'effects'   && <EffectsRack />}
            {activeTab === 'theory'    && <TheoryTools />}
            {activeTab === 'structure' && <SongStructure />}
            {activeTab === 'ai'        && <AIComposer />}
            {activeTab === 'radio'     && <MoodRadio />}
            {activeTab === 'stats'     && <AnalyticsDash />}
          </div>
        </div>

        {/* Footer hint */}
        <div className="border-t border-noir-silver/8 px-5 py-2 flex flex-wrap gap-4 text-noir-silver/20 flex-shrink-0">
          {activeTab === 'piano' && (
            <>
              <span className="font-body text-[8px]">Oct 0: A–J (white) · W E T Y U (black)</span>
              <span className="font-body text-[8px]">Oct 1: K L ; ' Z X C · O P [ ]</span>
              <span className="font-body text-[8px]">← → shift octave · Space = sustain</span>
            </>
          )}
          {activeTab === 'roll'      && <span className="font-body text-[8px]">Click to draw · Alt+drag velocity · Ctrl+Z undo · Ctrl+Y redo</span>}
          {activeTab === 'sequencer' && <span className="font-body text-[8px]">Right-click = mute step · Alt+drag = velocity · C/P = copy/paste row</span>}
          {activeTab === 'slicer'    && <span className="font-body text-[8px]">Drag the yellow region · Assign / Reverse / Normalize → pad</span>}
          {activeTab === 'pads'      && <span className="font-body text-[8px]">Keys 1–8 trigger pads · Load samples in the Slicer tab first</span>}
          {activeTab === 'looper'    && <span className="font-body text-[8px]">Record up to 4 audio loops · Overdub · Export Mix as WAV</span>}
          {activeTab === 'mashup'    && <span className="font-body text-[8px]">Pick 2–4 songs → Generate → Play · Each run is unique</span>}
          {activeTab === 'effects'   && <span className="font-body text-[8px]">EQ + Dynamics → pad/slicer/looper chain · Synth FX → piano/roll chain</span>}
          {activeTab === 'theory'    && <span className="font-body text-[8px]">Tuner · Chord Builder · Scale Finder · Circle of Fifths · BPM Calc</span>}
          {activeTab === 'structure' && <span className="font-body text-[8px]">Drag blocks to reorder · Auto-Advance follows the sequencer beat</span>}
          {activeTab === 'ai'        && <span className="font-body text-[8px]">Describe your track · choose genre &amp; mood · Suno generates 2 variants</span>}
          {activeTab === 'radio'     && <span className="font-body text-[8px]">Choose a mood · auto-curated queue from the catalogue · shuffle at any time</span>}
          {activeTab === 'stats'     && <span className="font-body text-[8px]">Simulated data — connect Plausible or Fathom for real analytics</span>}
          <span className="font-body text-[8px] ml-auto hidden md:block">F = fullscreen · ? = shortcuts</span>
        </div>

        {/* Modals */}
        {showShortcuts && <ShortcutMapModal onClose={() => setShowShortcuts(false)} />}
      </div>
    </StudioProvider>
  )
}
