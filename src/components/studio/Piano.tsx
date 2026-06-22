'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStudio } from './StudioContext'
import * as Tone from 'tone'

const WHITE_NOTES = ['C','D','E','F','G','A','B']
const HAS_BLACK_AFTER = [true,true,false,true,true,true,false]
const NOTE_SEMITONES: Record<string,number> = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11}
const NOTE_NAMES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const KEY_TO_NOTE: Record<string,{note:string;octOffset:number}> = {
  'a':{note:'C',octOffset:0},'s':{note:'D',octOffset:0},'d':{note:'E',octOffset:0},
  'f':{note:'F',octOffset:0},'g':{note:'G',octOffset:0},'h':{note:'A',octOffset:0},
  'j':{note:'B',octOffset:0},'k':{note:'C',octOffset:1},'l':{note:'D',octOffset:1},
  ';':{note:'E',octOffset:1},"'":{note:'F',octOffset:1},'z':{note:'G',octOffset:1},
  'x':{note:'A',octOffset:1},'c':{note:'B',octOffset:1},
  'w':{note:'C#',octOffset:0},'e':{note:'D#',octOffset:0},'t':{note:'F#',octOffset:0},
  'y':{note:'G#',octOffset:0},'u':{note:'A#',octOffset:0},
  'o':{note:'C#',octOffset:1},'p':{note:'D#',octOffset:1},'[':{note:'F#',octOffset:1},']':{note:'G#',octOffset:1},
}
const CHORD_INTERVALS: Record<string,number[]> = {
  Major:[0,4,7],Minor:[0,3,7],Sus2:[0,2,7],Sus4:[0,5,7],
  Dom7:[0,4,7,10],Maj7:[0,4,7,11],Min7:[0,3,7,10],Dim:[0,3,6],Aug:[0,4,8],
  HalfDim:[0,3,6,10],Dim7:[0,3,6,9],MinMaj7:[0,3,7,11],Aug7:[0,4,8,10],
}
const SCALES: Record<string,number[]> = {
  'Off':[],'Major':[0,2,4,5,7,9,11],'Natural Minor':[0,2,3,5,7,8,10],
  'Pentatonic Maj':[0,2,4,7,9],'Pentatonic Min':[0,3,5,7,10],
  'Blues':[0,3,5,6,7,10],'Dorian':[0,2,3,5,7,9,10],'Mixolydian':[0,2,4,5,7,9,10],
  'Harmonic Minor':[0,2,3,5,7,8,11],'Chromatic':[0,1,2,3,4,5,6,7,8,9,10,11],
}
const SCALE_ROOTS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const ARP_MODES=['Up','Down','Up↓','Random'] as const
type ArpMode=typeof ARP_MODES[number]
const SYNTH_PRESETS={
  Piano:{oscillator:{type:'triangle' as const},envelope:{attack:0.005,decay:0.4,sustain:0.25,release:1.4}},
  Synth:{oscillator:{type:'sawtooth' as const},envelope:{attack:0.01,decay:0.1,sustain:0.7,release:0.5}},
  Pad:{oscillator:{type:'sine' as const},envelope:{attack:0.5,decay:0.2,sustain:0.9,release:2.5}},
  Electric:{oscillator:{type:'square' as const},envelope:{attack:0.005,decay:0.5,sustain:0.2,release:1.0}},
  Bells:{oscillator:{type:'sine' as const},envelope:{attack:0.001,decay:1.0,sustain:0.0,release:2.0}},
  Bass:{oscillator:{type:'triangle' as const},envelope:{attack:0.02,decay:0.2,sustain:0.6,release:0.3}},
}

function semitoneToNote(semi:number,oct:number):string{
  let s=semi,o=oct; while(s>=12){s-=12;o++} while(s<0){s+=12;o--}
  return`${NOTE_NAMES_SHARP[s]}${o}`
}

// Chord detection from a set of active note strings (like "C4", "E4")
function detectChord(active: Set<string>): string {
  if (active.size < 2) return ''
  const semis = [...active].map(n => NOTE_SEMITONES[n.replace(/[0-9]/g, '')] ?? 0)
  const classes = [...new Set(semis)].sort((a, b) => a - b)
  if (classes.length < 2) return ''
  for (const root of classes) {
    const ints = classes.map(c => ((c - root + 12) % 12)).sort((a, b) => a - b)
    for (const [name, pattern] of Object.entries(CHORD_INTERVALS)) {
      if (ints.length === pattern.length && ints.every((v, i) => v === pattern[i])) {
        return `${NOTE_NAMES_SHARP[root]} ${name}`
      }
    }
  }
  // Try subset match (3-note subset of active notes)
  if (classes.length > 3) {
    for (const root of classes) {
      const ints = classes.map(c => ((c - root + 12) % 12)).filter(i => i > 0).sort((a, b) => a - b)
      for (const [name, pattern] of Object.entries(CHORD_INTERVALS)) {
        const sub = pattern.slice(1)
        if (sub.every(p => ints.includes(p))) return `${NOTE_NAMES_SHARP[root]} ${name}~`
      }
    }
  }
  return '...'
}

const WK_W=64,WK_H=260,BK_W=40,BK_H=163,WK_GAP=2,NUM_OCTAVES=3
interface KeyInfo{note:string;octOffset:number;keyHint?:string;whiteIndex:number}
function buildKeyboard(){
  const whites:KeyInfo[]=[],blacks:KeyInfo[]=[]
  const wMap=['a','s','d','f','g','h','j','k','l',';',"'",'z','x','c',null,null,null,null,null,null,null]
  const bMap=['w','e',null,'t','y','u',null,'o','p',null,'[',']',null,null,null,null,null,null,null,null,null]
  let wi=0,bi=0
  for(let oct=0;oct<NUM_OCTAVES;oct++){
    WHITE_NOTES.forEach((n,ni)=>{
      whites.push({note:n,octOffset:oct,keyHint:wMap[wi]??undefined,whiteIndex:wi}); wi++
      if(HAS_BLACK_AFTER[ni]){blacks.push({note:`${n}#`,octOffset:oct,keyHint:bMap[bi]??undefined,whiteIndex:wi-1}); bi++}
    })
  }
  return{whites,blacks}
}
const{whites:WHITE_KEYS,blacks:BLACK_KEYS}=buildKeyboard()
const TOTAL_W=WHITE_KEYS.length*(WK_W+WK_GAP)-WK_GAP

export default function Piano() {
  const{bpm,toneGainRef,globalScale,setGlobalScale,globalScaleRoot,setGlobalScaleRoot}=useStudio()
  const synthRef=useRef<Tone.PolySynth|null>(null)
  const chorusRef=useRef<Tone.Chorus|null>(null)
  const bitCrRef=useRef<Tone.BitCrusher|null>(null)
  const tremoloRef=useRef<Tone.Tremolo|null>(null)
  const activeRef=useRef<Set<string>>(new Set())
  const heldRef=useRef<string[]>([])
  const arpRef=useRef<ReturnType<typeof setInterval>|null>(null)
  const arpIdxRef=useRef(0)
  const sustainRef=useRef(false)
  const sustainedRef=useRef<Set<string>>(new Set())
  const touchStartXRef=useRef(0)

  const[octave,setOctave]=useState(3)
  const[instrument,setInstrument]=useState<keyof typeof SYNTH_PRESETS>('Piano')
  const[chordMode,setChordMode]=useState('Single')
  const[arpOn,setArpOn]=useState(false)
  const[arpMode,setArpMode]=useState<ArpMode>('Up')
  const[arpSpeed,setArpSpeed]=useState<'8n'|'16n'|'4n'>('8n')
  const[transpose,setTranspose]=useState(0)
  const[portamento,setPortamento]=useState(0)
  const[chorus,setChorus]=useState(false)
  const[bitCrush,setBitCrush]=useState(false)
  const[tremolo,setTremolo]=useState(false)
  const[sustain,setSustain]=useState(false)
  const[activeKeys,setActiveKeys]=useState<Set<string>>(new Set())
  const[lastNotes,setLastNotes]=useState<string[]>([])
  const[noteHistory,setNoteHistory]=useState<string[]>([])
  const[chordDetect,setChordDetect]=useState('')

  // Stable refs for closures
  const octRef=useRef(3); useEffect(()=>{octRef.current=octave},[octave])
  const chordRef=useRef('Single'); useEffect(()=>{chordRef.current=chordMode},[chordMode])
  const scaleRef=useRef('Off'); useEffect(()=>{scaleRef.current=globalScale},[globalScale])
  const scaleRootRef=useRef('C'); useEffect(()=>{scaleRootRef.current=globalScaleRoot},[globalScaleRoot])
  const arpOnRef=useRef(false); useEffect(()=>{arpOnRef.current=arpOn},[arpOn])
  const arpModeRef=useRef<ArpMode>('Up'); useEffect(()=>{arpModeRef.current=arpMode},[arpMode])
  const arpSpeedRef=useRef<'8n'|'16n'|'4n'>('8n'); useEffect(()=>{arpSpeedRef.current=arpSpeed},[arpSpeed])
  const bpmRef=useRef(90); useEffect(()=>{bpmRef.current=bpm},[bpm])
  const transRef=useRef(0); useEffect(()=>{transRef.current=transpose},[transpose])

  const isInScale=useCallback((note:string)=>{
    const sc=scaleRef.current; if(sc==='Off') return true
    const intervals=SCALES[sc]; if(!intervals?.length) return true
    const rootSemi=NOTE_SEMITONES[scaleRootRef.current]??0
    const noteSemi=NOTE_SEMITONES[note.replace(/[0-9]/g,'')]??0
    return intervals.includes(((noteSemi-rootSemi)+12)%12)
  },[])

  const buildChain=useCallback((inst:keyof typeof SYNTH_PRESETS,withChorus:boolean,withBitCr:boolean,withTremolo:boolean,port:number)=>{
    synthRef.current?.releaseAll(); synthRef.current?.dispose()
    chorusRef.current?.dispose(); bitCrRef.current?.dispose(); tremoloRef.current?.dispose()
    const poly=new Tone.PolySynth(Tone.Synth,{...SYNTH_PRESETS[inst],volume:-6,portamento:port/1000})
    let last:Tone.ToneAudioNode=poly
    if(withTremolo){const tr=new Tone.Tremolo({frequency:5,depth:0.5}).start();poly.connect(tr);last=tr;tremoloRef.current=tr}
    if(withChorus){const ch=new Tone.Chorus({frequency:3,delayTime:3.5,depth:0.7}).start();last.connect(ch);last=ch;chorusRef.current=ch}
    if(withBitCr){const bc=new Tone.BitCrusher(4);last.connect(bc);last=bc;bitCrRef.current=bc}
    last.connect(toneGainRef.current??Tone.getDestination())
    synthRef.current=poly
  },[toneGainRef])

  useEffect(()=>{
    buildChain(instrument,chorus,bitCrush,tremolo,portamento)
    return()=>{synthRef.current?.dispose();chorusRef.current?.dispose();bitCrRef.current?.dispose();tremoloRef.current?.dispose()}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[instrument,chorus,bitCrush,tremolo,portamento])

  const resolveNotes=useCallback((rootNote:string,o:number):string[]=>{
    const tr=transRef.current
    const base=(NOTE_SEMITONES[rootNote]??0)+tr
    const baseOct=o+Math.floor(base/12)
    const baseSemi=((base%12)+12)%12
    const rootStr=semitoneToNote(baseSemi,baseOct)
    if(chordRef.current==='Single'||!CHORD_INTERVALS[chordRef.current]) return[rootStr]
    return CHORD_INTERVALS[chordRef.current].map(i=>semitoneToNote(baseSemi+i,baseOct))
  },[])

  const stopArp=useCallback(()=>{
    if(arpRef.current){clearInterval(arpRef.current);arpRef.current=null}
    synthRef.current?.releaseAll(); activeRef.current.clear(); setActiveKeys(new Set())
  },[])

  const startArp=useCallback(()=>{
    if(arpRef.current) clearInterval(arpRef.current)
    const speedMap:{[k:string]:number}={'4n':1,'8n':0.5,'16n':0.25}
    const ms=(60/bpmRef.current)*(speedMap[arpSpeedRef.current]??0.5)*1000
    arpRef.current=setInterval(()=>{
      const held=heldRef.current; if(!held.length||!synthRef.current) return
      synthRef.current.releaseAll(); activeRef.current.clear()
      let notes:string[]
      const mode=arpModeRef.current; const l=held.length
      if(mode==='Up'){arpIdxRef.current=arpIdxRef.current%l;notes=[held[arpIdxRef.current++]]}
      else if(mode==='Down'){arpIdxRef.current=arpIdxRef.current%l;notes=[held[l-1-(arpIdxRef.current++%l)]]}
      else if(mode==='Up↓'){const tot=Math.max(1,l*2-2);const idx=arpIdxRef.current++%tot;notes=[held[idx<l?idx:tot-idx]]}
      else{notes=[held[Math.floor(Math.random()*l)]]}
      notes.forEach(n=>{synthRef.current?.triggerAttack(n,Tone.now());activeRef.current.add(n)})
      setActiveKeys(new Set(activeRef.current)); setLastNotes(notes)
    },ms)
  },[])

  useEffect(()=>{if(arpOn&&heldRef.current.length>0)startArp()},[arpSpeed,bpm,startArp,arpOn])
  useEffect(()=>{return()=>stopArp()},[stopArp])

  const attack=useCallback((note:string,octOffset:number)=>{
    const synth=synthRef.current; if(!synth) return
    Tone.start()
    const o=octRef.current+octOffset; const noteStr=`${note}${o}`
    if(!isInScale(noteStr)) return
    if(arpOnRef.current){
      const notes=resolveNotes(note,o)
      notes.forEach(n=>{if(!heldRef.current.includes(n))heldRef.current.push(n)})
      heldRef.current.sort()
      if(heldRef.current.length===1||!arpRef.current)startArp()
      return
    }
    const notes=resolveNotes(note,o); const now=Tone.now()
    notes.forEach(n=>{if(!activeRef.current.has(n)){synth.triggerAttack(n,now);activeRef.current.add(n)};sustainedRef.current.delete(n)})
    const nextActive=new Set(activeRef.current)
    setActiveKeys(nextActive); setLastNotes(notes)
    setNoteHistory(prev=>[...notes,...prev].slice(0,12))
    setChordDetect(detectChord(nextActive))
  },[isInScale,resolveNotes,startArp])

  const release=useCallback((note:string,octOffset:number)=>{
    const synth=synthRef.current; if(!synth) return
    const o=octRef.current+octOffset; const notes=resolveNotes(note,o)
    if(arpOnRef.current){notes.forEach(n=>{heldRef.current=heldRef.current.filter(h=>h!==n)});if(heldRef.current.length===0)stopArp();return}
    if(sustainRef.current){notes.forEach(n=>sustainedRef.current.add(n));return}
    notes.forEach(n=>{synth.triggerRelease(n,Tone.now());activeRef.current.delete(n)})
    const nextActive=new Set(activeRef.current)
    setActiveKeys(nextActive); if(activeRef.current.size===0){setLastNotes([]);setChordDetect('')}
    else setChordDetect(detectChord(nextActive))
  },[resolveNotes,stopArp])

  useEffect(()=>{
    const pressed=new Set<string>()
    const onDown=(e:KeyboardEvent)=>{
      if(e.repeat) return
      const tag=(e.target as HTMLElement).tagName
      if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA') return
      const k=e.key.toLowerCase(); if(pressed.has(k)) return
      const m=KEY_TO_NOTE[k]; if(m){pressed.add(k);attack(m.note,m.octOffset)}
      if(e.key==='ArrowLeft')setOctave(o=>Math.max(1,o-1))
      if(e.key==='ArrowRight')setOctave(o=>Math.min(6,o+1))
      if(e.code==='Space'){e.preventDefault();sustainRef.current=true;setSustain(true)}
    }
    const onUp=(e:KeyboardEvent)=>{
      const k=e.key.toLowerCase(); pressed.delete(k)
      const m=KEY_TO_NOTE[k]; if(m)release(m.note,m.octOffset)
      if(e.code==='Space'){
        sustainRef.current=false; setSustain(false)
        sustainedRef.current.forEach(n=>{synthRef.current?.triggerRelease(n,Tone.now());activeRef.current.delete(n)})
        sustainedRef.current.clear(); setActiveKeys(new Set(activeRef.current))
        setChordDetect(detectChord(activeRef.current))
      }
    }
    window.addEventListener('keydown',onDown); window.addEventListener('keyup',onUp)
    return()=>{window.removeEventListener('keydown',onDown);window.removeEventListener('keyup',onUp)}
  },[attack,release])

  const isActive=(note:string,octOffset:number)=>activeKeys.has(`${note}${octave+octOffset}`)
  const outOfScale=(note:string,octOffset:number)=>globalScale!=='Off'&&!isInScale(`${note}${octave+octOffset}`)
  // Is the note IN scale (and scale is active)?
  const inScaleHighlight=(note:string,octOffset:number)=>globalScale!=='Off'&&isInScale(`${note}${octave+octOffset}`)

  const BTN=(on:boolean)=>`px-2.5 py-1 font-body text-[9px] tracking-[0.15em] uppercase border transition-all ${on?'border-t-accent/60 bg-t-accent/12 text-t-accent':'border-noir-silver/12 text-noir-silver/35 hover:border-t-accent/25 hover:text-t-accent/60'}`
  const LBL='font-body text-[9px] tracking-[0.35em] uppercase text-noir-silver/35 flex-shrink-0'
  const SEL='bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-xs px-1.5 py-1 focus:outline-none focus:border-t-accent/40'

  return(
    <div className="flex flex-col gap-4 -mx-5 md:-mx-8">

      {/* Row 1: Sound + Synth FX */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 md:px-8">
        <span className={LBL}>Sound</span>
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(SYNTH_PRESETS) as (keyof typeof SYNTH_PRESETS)[]).map(k=>(
            <button key={k} onClick={()=>setInstrument(k)} className={BTN(instrument===k)}>{k}</button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto flex-wrap">
          <button onClick={()=>setChorus(v=>!v)} className={BTN(chorus)}>{chorus?'◉':'○'} Chorus</button>
          <button onClick={()=>setBitCrush(v=>!v)} className={BTN(bitCrush)}>{bitCrush?'◉':'○'} Bit Crush</button>
          <button onClick={()=>setTremolo(v=>!v)} className={BTN(tremolo)}>{tremolo?'◉':'○'} Tremolo</button>
        </div>
      </div>

      {/* Row 2: Chord + Octave + Transpose + Glide + Sustain */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 md:px-8 border-t border-noir-silver/8 pt-3">
        <span className={LBL}>Chord</span>
        <select value={chordMode} onChange={e=>setChordMode(e.target.value)} className={SEL}>
          <option value="Single">Single</option>
          {Object.keys(CHORD_INTERVALS).map(k=><option key={k} value={k}>{k}</option>)}
        </select>

        <span className={LBL}>Oct</span>
        <div className="flex items-center gap-1">
          <button onClick={()=>setOctave(o=>Math.max(1,o-1))} className="w-6 h-6 border border-noir-silver/20 text-noir-silver/50 hover:border-t-accent/50 hover:text-t-accent text-sm">‹</button>
          <span className="font-heading text-lg text-noir-ivory w-4 text-center tabular-nums">{octave}</span>
          <button onClick={()=>setOctave(o=>Math.min(6,o+1))} className="w-6 h-6 border border-noir-silver/20 text-noir-silver/50 hover:border-t-accent/50 hover:text-t-accent text-sm">›</button>
        </div>

        <span className={LBL}>Transp.</span>
        <div className="flex items-center gap-1">
          <button onClick={()=>setTranspose(t=>Math.max(-12,t-1))} className="w-6 h-6 border border-noir-silver/15 text-noir-silver/40 hover:text-t-accent text-sm">−</button>
          <span className={`font-body text-xs tabular-nums w-8 text-center ${transpose!==0?'text-t-accent':'text-noir-silver/30'}`}>{transpose>0?`+${transpose}`:transpose}</span>
          <button onClick={()=>setTranspose(t=>Math.min(12,t+1))} className="w-6 h-6 border border-noir-silver/15 text-noir-silver/40 hover:text-t-accent text-sm">+</button>
          {transpose!==0&&<button onClick={()=>setTranspose(0)} className="font-body text-[7px] text-noir-silver/25 hover:text-red-400/70">↺</button>}
        </div>

        <span className={LBL}>Glide</span>
        <input type="range" min={0} max={500} step={10} value={portamento}
          onChange={e=>setPortamento(Number(e.target.value))} className="w-16"
          style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${portamento/5}%,rgba(184,197,208,0.12) ${portamento/5}%)`}}/>
        <span className="font-body text-[8px] text-noir-silver/30 tabular-nums">{portamento}ms</span>

        <button onClick={()=>{const nv=!sustain;setSustain(nv);sustainRef.current=nv;if(!nv){sustainedRef.current.forEach(n=>{synthRef.current?.triggerRelease(n,Tone.now());activeRef.current.delete(n)});sustainedRef.current.clear();setActiveKeys(new Set(activeRef.current))}}}
          className={`ml-auto ${BTN(sustain)}`}>{sustain?'◉':'○'} Sustain (Space)</button>
      </div>

      {/* Row 3: Scale Lock (global) + Arp */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 md:px-8 border-t border-noir-silver/8 pt-3">
        <span className={LBL}>Scale</span>
        <select value={globalScaleRoot} onChange={e=>setGlobalScaleRoot(e.target.value)} className={SEL}>
          {SCALE_ROOTS.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select value={globalScale} onChange={e=>setGlobalScale(e.target.value)} className={SEL}>
          {Object.keys(SCALES).map(k=><option key={k} value={k}>{k}</option>)}
        </select>
        {globalScale!=='Off'&&(
          <span className="font-body text-[8px] text-t-accent/60 flex items-center gap-1">
            🔒 <span className="text-noir-silver/40">Synced globally · Piano Roll highlights scale rows</span>
          </span>
        )}

        <div className="w-px h-4 bg-noir-silver/12 flex-shrink-0 mx-1"/>

        <span className={LBL}>Arp</span>
        <button onClick={()=>{setArpOn(v=>!v);if(arpOn)stopArp()}} className={BTN(arpOn)}>{arpOn?'◉ ON':'○ OFF'}</button>
        {arpOn&&(
          <>
            {ARP_MODES.map(m=><button key={m} onClick={()=>setArpMode(m)} className={BTN(arpMode===m)}>{m}</button>)}
            {(['16n','8n','4n'] as const).map(s=><button key={s} onClick={()=>setArpSpeed(s)} className={BTN(arpSpeed===s)}>{s}</button>)}
          </>
        )}
      </div>

      {/* Active notes + Chord detection + Note history */}
      <div className="px-5 md:px-8 flex flex-col gap-1.5">
        <div className="h-9 flex items-center gap-3">
          {lastNotes.length>0?(
            <>
              <div className="flex items-center gap-2">
                {lastNotes.map((n,i)=>(
                  <span key={i} className="font-heading italic text-lg" style={{color:'rgb(var(--t-accent-rgb))',opacity:activeKeys.has(n)?1:0.4}}>{n}</span>
                ))}
                {sustain&&<span className="font-body text-[7px] tracking-[0.25em] uppercase text-noir-ivory/30">HOLD</span>}
              </div>
              {chordDetect&&(
                <div className="flex items-center gap-2 px-3 py-1 border border-t-accent/30 bg-t-accent/8">
                  <span className="font-body text-[7px] tracking-[0.3em] uppercase text-noir-silver/35">Chord</span>
                  <span className="font-heading italic text-base" style={{color:'rgb(var(--t-accent-rgb))'}}>
                    {chordDetect}
                  </span>
                </div>
              )}
            </>
          ):(
            <span className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-silver/18">
              {arpOn?'Hold a key to arpeggiate':'Play a key · A–J · ← → shift octave · Space = sustain'}
            </span>
          )}
        </div>
        {noteHistory.length>0&&(
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-body text-[7px] tracking-[0.25em] uppercase text-noir-silver/18">History</span>
            {noteHistory.map((n,i)=>(
              <span key={i} className="font-body text-[8px]"
                style={{color:`rgba(var(--t-accent-rgb),${Math.max(0.12,0.6-i*0.04)})`}}>{n}</span>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard */}
      <div className="overflow-x-auto pb-4 px-5 md:px-8"
        onTouchStart={e=>{touchStartXRef.current=e.touches[0].clientX}}
        onTouchEnd={e=>{const dx=e.changedTouches[0].clientX-touchStartXRef.current;if(Math.abs(dx)>60)setOctave(o=>dx>0?Math.min(6,o+1):Math.max(1,o-1))}}>
        <div className="relative" style={{width:TOTAL_W,height:WK_H+8}}>
          {Array.from({length:NUM_OCTAVES},(_,oi)=>(
            <div key={oi} className="absolute -top-5 font-body text-[8px] tracking-[0.2em] uppercase text-noir-silver/22"
              style={{left:oi*7*(WK_W+WK_GAP)}}>{octave+oi}</div>
          ))}
          {WHITE_KEYS.map((k,i)=>{
            const active=isActive(k.note,k.octOffset)
            const muted=outOfScale(k.note,k.octOffset)
            const inScale=inScaleHighlight(k.note,k.octOffset)
            const x=i*(WK_W+WK_GAP)
            return(
              <button key={i}
                onMouseDown={()=>attack(k.note,k.octOffset)}
                onMouseUp={()=>release(k.note,k.octOffset)}
                onMouseLeave={()=>release(k.note,k.octOffset)}
                onTouchStart={e=>{e.preventDefault();e.stopPropagation();attack(k.note,k.octOffset)}}
                onTouchEnd={e=>{e.preventDefault();e.stopPropagation();release(k.note,k.octOffset)}}
                className="absolute top-0 select-none outline-none transition-all duration-75"
                style={{
                  left:x,width:WK_W,height:WK_H,zIndex:1,
                  background:active
                    ?'linear-gradient(to bottom,rgb(var(--t-accent-rgb)/0.28) 0%,rgb(var(--t-accent-rgb)/0.1) 60%,rgb(var(--t-accent-rgb)/0.18) 100%)'
                    :muted
                      ?'linear-gradient(to bottom,#c8c2b6 0%,#b8b0a0 100%)'
                      :inScale
                        ?'linear-gradient(to bottom,#f5f0e5 0%,#ede5d5 60%,#e0d8c8 100%)'
                        :'linear-gradient(to bottom,#f0ece3 0%,#e8e2d4 60%,#d8d0be 100%)',
                  border:active?'1px solid rgb(var(--t-accent-rgb)/0.7)':'1px solid rgba(0,0,0,0.18)',
                  borderTop:active?'3px solid rgb(var(--t-accent-rgb))':inScale&&!muted?'3px solid rgb(var(--t-accent-rgb)/0.35)':muted?'3px solid rgba(0,0,0,0.1)':'1px solid rgba(0,0,0,0.18)',
                  borderRadius:'0 0 5px 5px',
                  boxShadow:active?'0 0 18px rgb(var(--t-accent-rgb)/0.35),inset 0 -4px 12px rgba(0,0,0,0.08)':'inset 0 -4px 12px rgba(0,0,0,0.06),2px 4px 8px rgba(0,0,0,0.25)',
                  transform:active?'translateY(3px)':'translateY(0)',opacity:muted?0.55:1,
                }}>
                {k.note==='C'&&<div className="absolute top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{background:active?'rgb(var(--t-accent-rgb))':inScale?'rgb(var(--t-accent-rgb)/0.35)':'rgba(0,0,0,0.12)'}}/>}
                {inScale&&!muted&&!active&&(
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{background:'rgb(var(--t-accent-rgb)/0.4)'}}/>
                )}
                <div className="absolute bottom-2.5 left-0 right-0 flex flex-col items-center gap-0.5">
                  <span className="font-body text-[10px] tracking-wide"
                    style={{color:active?'rgb(var(--t-accent-rgb))':muted?'rgba(0,0,0,0.2)':inScale?'rgba(0,0,0,0.4)':'rgba(0,0,0,0.35)'}}>{k.note}{octave+k.octOffset}</span>
                  {k.keyHint&&<span className="font-body text-[7px] uppercase"
                    style={{color:active?'rgb(var(--t-accent-rgb)/0.7)':'rgba(0,0,0,0.18)'}}>{k.keyHint}</span>}
                </div>
              </button>
            )
          })}
          {BLACK_KEYS.map((k,i)=>{
            const active=isActive(k.note,k.octOffset)
            const muted=outOfScale(k.note,k.octOffset)
            const inScale=inScaleHighlight(k.note,k.octOffset)
            const x=k.whiteIndex*(WK_W+WK_GAP)+WK_W-Math.floor(BK_W/2)-1
            return(
              <button key={i}
                onMouseDown={e=>{e.stopPropagation();attack(k.note,k.octOffset)}}
                onMouseUp={()=>release(k.note,k.octOffset)}
                onMouseLeave={()=>release(k.note,k.octOffset)}
                onTouchStart={e=>{e.preventDefault();e.stopPropagation();attack(k.note,k.octOffset)}}
                onTouchEnd={e=>{e.preventDefault();e.stopPropagation();release(k.note,k.octOffset)}}
                className="absolute top-0 select-none outline-none transition-all duration-75"
                style={{
                  left:x,width:BK_W,height:BK_H,zIndex:3,
                  background:active
                    ?'linear-gradient(to bottom,rgb(var(--t-accent-rgb)/0.65) 0%,rgb(var(--t-accent-rgb)/0.35) 100%)'
                    :inScale&&!muted
                      ?'linear-gradient(to bottom,#282418 0%,#3a3020 70%,#2a2418 100%)'
                      :muted?'linear-gradient(to bottom,#2a2a2a 0%,#333 100%)'
                      :'linear-gradient(to bottom,#1a1a1a 0%,#2e2e2e 70%,#222 100%)',
                  border:active?'1px solid rgb(var(--t-accent-rgb))':inScale?'1px solid rgb(var(--t-accent-rgb)/0.25)':'1px solid rgba(255,255,255,0.06)',
                  borderTop:active?'2px solid rgb(var(--t-accent-rgb))':inScale?'2px solid rgb(var(--t-accent-rgb)/0.4)':'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'0 0 4px 4px',
                  boxShadow:active?'0 0 14px rgb(var(--t-accent-rgb)/0.5),inset 0 1px 0 rgb(var(--t-accent-rgb)/0.3)':'2px 5px 10px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.07)',
                  transform:active?'translateY(2px)':'translateY(0)',opacity:muted?0.35:1,
                }}>
                {k.keyHint&&<span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-body text-[7px] uppercase"
                  style={{color:active?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.18)'}}>{k.keyHint}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
