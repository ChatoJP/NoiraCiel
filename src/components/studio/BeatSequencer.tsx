'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStudio } from './StudioContext'
import * as Tone from 'tone'

type Pattern = boolean[][]
type Velocity = number[][] // 0–1 per step

const TRACKS=[
  {name:'Kick',color:'#C4953A'},{name:'Snare',color:'#B0586C'},
  {name:'Hi-Hat',color:'#6B9EBE'},{name:'Clap',color:'#9480C4'},
  {name:'Tom',color:'#52946F'},{name:'Perc',color:'#C48534'},
]

function makePattern(steps=16):Pattern{return TRACKS.map(()=>Array(steps).fill(false))}
function makeVelocity(steps=16):Velocity{return TRACKS.map(()=>Array(steps).fill(0.8))}

const PRESETS:{[k:string]:Pattern}={
  Empty:makePattern(),
  Basic:(()=>{const p=makePattern();p[0][0]=p[0][4]=p[0][8]=p[0][12]=true;p[1][4]=p[1][12]=true;p[2]=p[2].map((_,i)=>i%2===0);return p})(),
  Funk:(()=>{const p=makePattern();p[0][0]=p[0][6]=p[0][10]=true;p[1][4]=p[1][12]=p[1][14]=true;p[2]=p[2].map((_,i)=>i%2===0);p[3][2]=p[3][10]=true;p[4][8]=true;return p})(),
  Reggae:(()=>{const p=makePattern();p[0][0]=p[0][8]=true;p[1][6]=p[1][14]=true;p[2][2]=p[2][6]=p[2][10]=p[2][14]=true;p[3][4]=p[3][12]=true;return p})(),
  HipHop:(()=>{const p=makePattern();p[0][0]=p[0][4]=p[0][10]=p[0][12]=true;p[1][4]=p[1][12]=true;p[2]=p[2].map((_,i)=>i%2===0);p[3][2]=p[3][14]=true;return p})(),
  Bossa:(()=>{const p=makePattern();p[0][0]=p[0][6]=p[0][8]=true;p[1][4]=p[1][10]=true;p[2][2]=p[2][4]=p[2][6]=p[2][8]=p[2][10]=p[2][12]=true;return p})(),
  Trap:(()=>{const p=makePattern(32);p[0]=Array(32).fill(false);p[0][0]=p[0][16]=true;p[1][8]=p[1][24]=true;p[2]=Array(32).fill(true);p[3][4]=p[3][6]=p[3][20]=p[3][22]=true;return p})(),
}

function makeDrumSynths(){
  return[
    new Tone.MembraneSynth({pitchDecay:0.06,octaves:8,envelope:{attack:0.001,decay:0.35,sustain:0,release:0.1}}),
    new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:0.001,decay:0.18,sustain:0,release:0.08}}),
    new Tone.MetalSynth({envelope:{attack:0.001,decay:0.08,release:0.01},harmonicity:5.1,modulationIndex:32,resonance:4000,octaves:1.5}),
    new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:0.005,decay:0.1,sustain:0,release:0.05}}),
    new Tone.MembraneSynth({pitchDecay:0.04,octaves:4,envelope:{attack:0.001,decay:0.25,sustain:0,release:0.08}}),
    new Tone.MetalSynth({envelope:{attack:0.001,decay:0.15,release:0.02},harmonicity:3.5,modulationIndex:16,resonance:2000,octaves:1.2}),
  ]
}

export default function BeatSequencer(){
  const{isPlaying,currentStep,masterGainRef,savePatternToBank,loadPatternFromBank,patternBank,timeSignature}=useStudio()
  const[steps,setSteps]=useState(16)
  const[pattern,setPattern]=useState<Pattern>(PRESETS.Basic)
  const[velocity,setVelocity]=useState<Velocity>(makeVelocity(16))
  const[muted,setMuted]=useState<boolean[][]>(TRACKS.map(()=>Array(16).fill(false)))
  const[volumes,setVolumes]=useState<number[]>(TRACKS.map(()=>0.85))
  const[preset,setPreset]=useState('Basic')
  const[humanize,setHumanize]=useState(0) // ms of timing jitter
  const[copiedRow,setCopiedRow]=useState<{row:number;pattern:boolean[];vel:number[]}|null>(null)
  const[bankSlot,setBankSlot]=useState(0)
  const[dragRow,setDragRow]=useState<number|null>(null)
  const[dragStep,setDragStep]=useState<number|null>(null)
  const[velDragStart,setVelDragStart]=useState<{row:number;step:number;startY:number;startVel:number}|null>(null)

  const synthsRef=useRef<Tone.ToneAudioNode[]|null>(null)
  const gainsRef=useRef<Tone.Gain[]>([])
  const patternRef=useRef<Pattern>(PRESETS.Basic)
  const velocityRef=useRef<Velocity>(makeVelocity(16))
  const mutedRef=useRef<boolean[][]>(TRACKS.map(()=>Array(16).fill(false)))
  const stepsRef=useRef(16)

  useEffect(()=>{patternRef.current=pattern},[pattern])
  useEffect(()=>{velocityRef.current=velocity},[velocity])
  useEffect(()=>{mutedRef.current=muted},[muted])
  useEffect(()=>{stepsRef.current=steps},[steps])

  useEffect(()=>{
    const synths=makeDrumSynths()
    const gains=synths.map((s,i)=>{
      const g=new Tone.Gain(volumes[i]); s.connect(g); g.toDestination(); return g
    })
    synthsRef.current=synths; gainsRef.current=gains
    return()=>{synths.forEach(s=>{try{(s as unknown as Tone.PolySynth).releaseAll?.();s.dispose()}catch{}});gains.forEach(g=>{try{g.dispose()}catch{}})}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(()=>{gainsRef.current.forEach((g,i)=>{if(g)g.gain.value=volumes[i]})},[volumes])

  useEffect(()=>{
    if(!isPlaying||currentStep<0||!synthsRef.current) return
    const synths=synthsRef.current
    const pat=patternRef.current; const vel=velocityRef.current; const mut=mutedRef.current
    const stepMod=currentStep%stepsRef.current

    pat.forEach((track,ti)=>{
      if(!track[stepMod]||mut[ti]?.[stepMod]) return
      const jitter=humanize>0?Math.random()*humanize:0
      const v=vel[ti]?.[stepMod]??0.8
      setTimeout(()=>{
        const s=synths[ti]; const now=Tone.now()
        // Scale gain for velocity
        if(gainsRef.current[ti]) gainsRef.current[ti].gain.value=volumes[ti]*v
        if(ti===0)(s as Tone.MembraneSynth).triggerAttackRelease('C1','8n',now)
        else if(ti===1)(s as Tone.NoiseSynth).triggerAttackRelease('8n',now)
        else if(ti===2)(s as Tone.MetalSynth).triggerAttackRelease('16n',now)
        else if(ti===3)(s as Tone.NoiseSynth).triggerAttackRelease('16n',now)
        else if(ti===4)(s as Tone.MembraneSynth).triggerAttackRelease('G1','8n',now)
        else if(ti===5)(s as Tone.MetalSynth).triggerAttackRelease('16n',now)
      },jitter)
    })
  },[isPlaying,currentStep,humanize,volumes])

  const toggleStep=useCallback((track:number,step:number)=>{
    setPattern(prev=>{const next=prev.map(r=>[...r]);next[track][step]=!next[track][step];return next})
  },[])

  const toggleMute=useCallback((track:number,step:number)=>{
    setMuted(prev=>{const next=prev.map(r=>[...r]);next[track][step]=!next[track][step];return next})
  },[])

  const setStepVelocity=useCallback((track:number,step:number,vel:number)=>{
    setVelocity(prev=>{const next=prev.map(r=>[...r]);next[track][step]=Math.max(0.05,Math.min(1,vel));return next})
  },[])

  const loadPreset=(name:string)=>{
    const p=PRESETS[name].map(r=>[...r])
    const newSteps=p[0]?.length??16
    setPreset(name); setSteps(newSteps)
    setPattern(p.map(r=>{const row=[...r];while(row.length<newSteps)row.push(false);return row.slice(0,newSteps)}))
    setVelocity(makeVelocity(newSteps))
    setMuted(TRACKS.map(()=>Array(newSteps).fill(false)))
  }

  const changeSteps=(n:number)=>{
    setSteps(n)
    setPattern(prev=>prev.map(r=>{const row=[...r];while(row.length<n)row.push(false);return row.slice(0,n)}))
    setVelocity(prev=>prev.map(r=>{const row=[...r];while(row.length<n)row.push(0.8);return row.slice(0,n)}))
    setMuted(prev=>prev.map(r=>{const row=[...r];while(row.length<n)row.push(false);return row.slice(0,n)}))
  }

  const randomize=(trackIdx?:number)=>{
    setPattern(prev=>{
      const next=prev.map((r,ti)=>{
        if(trackIdx!==undefined&&ti!==trackIdx) return r
        return r.map(()=>Math.random()>0.7)
      })
      return next
    })
  }

  const clearAll=()=>{setPreset('Empty');setPattern(makePattern(steps));setVelocity(makeVelocity(steps));setMuted(TRACKS.map(()=>Array(steps).fill(false)))}

  const saveBank=()=>savePatternToBank(bankSlot,pattern)
  const loadBank=()=>{const p=loadPatternFromBank(bankSlot);if(p){setPattern(p);setVelocity(makeVelocity(p[0]?.length??16))}}

  const beatsPerBar=timeSignature
  const barLabel=(i:number)=>{
    const beat=i%beatsPerBar; const bar=Math.floor(i/beatsPerBar)+1
    return beat===0?`${bar}`:'·'
  }

  // Velocity drag
  const onVelMouseDown=(ti:number,si:number,e:React.MouseEvent)=>{
    e.preventDefault()
    setVelDragStart({row:ti,step:si,startY:e.clientY,startVel:velocity[ti][si]??0.8})
  }
  useEffect(()=>{
    const onMove=(e:MouseEvent)=>{
      if(!velDragStart) return
      const dy=velDragStart.startY-e.clientY
      setStepVelocity(velDragStart.row,velDragStart.step,velDragStart.startVel+dy*0.007)
    }
    const onUp=()=>setVelDragStart(null)
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp)
    return()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)}
  },[velDragStart,setStepVelocity])

  const activeStep=currentStep%steps

  return(
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Preset</span>
        {Object.keys(PRESETS).filter(k=>k!=='Empty').map(k=>(
          <button key={k} onClick={()=>loadPreset(k)}
            className={`font-body text-[10px] tracking-[0.2em] uppercase px-3 py-1 border transition-all ${preset===k?'border-t-accent/50 text-t-accent bg-t-accent/8':'border-noir-silver/15 text-noir-silver/40 hover:border-t-accent/30'}`}>
            {k}
          </button>
        ))}

        <div className="w-px h-4 bg-noir-silver/12 mx-1"/>

        <span className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Steps</span>
        {[8,16,32].map(n=>(
          <button key={n} onClick={()=>changeSteps(n)}
            className={`font-body text-[10px] px-2 py-1 border transition-all ${steps===n?'border-t-accent/50 text-t-accent':'border-noir-silver/12 text-noir-silver/35 hover:border-t-accent/25'}`}>
            {n}
          </button>
        ))}

        <button onClick={()=>randomize()}
          className="font-body text-[10px] tracking-[0.2em] uppercase px-3 py-1 border border-noir-silver/12 text-noir-silver/35 hover:border-t-accent/30 hover:text-t-accent/60 transition-all">
          ⟳ Random
        </button>
        <button onClick={clearAll}
          className="font-body text-[10px] tracking-[0.2em] uppercase px-3 py-1 border border-noir-silver/10 text-noir-silver/25 hover:border-red-400/30 hover:text-red-400/60 transition-all ml-auto">
          Clear
        </button>
      </div>

      {/* Humanize + bank */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Humanize</span>
        <input type="range" min={0} max={60} step={1} value={humanize} onChange={e=>setHumanize(Number(e.target.value))}
          className="w-20"
          style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${humanize/60*100}%,rgba(184,197,208,0.12) ${humanize/60*100}%)`}}/>
        <span className="font-body text-[8px] text-noir-silver/30 tabular-nums w-8">{humanize}ms</span>

        <div className="w-px h-4 bg-noir-silver/12 mx-1"/>
        <span className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Bank</span>
        {[0,1,2,3].map(i=>(
          <button key={i} onClick={()=>setBankSlot(i)}
            className={`w-7 h-7 border font-body text-[9px] transition-all ${bankSlot===i?'border-t-accent/60 text-t-accent':'border-noir-silver/12 text-noir-silver/30 hover:border-t-accent/25'}`}>
            {String.fromCharCode(65+i)}
            {patternBank[i]&&<div className="w-1 h-1 rounded-full bg-t-accent/60 mx-auto mt-0.5"/>}
          </button>
        ))}
        <button onClick={saveBank} className="px-2 py-1 border border-noir-silver/15 text-noir-silver/30 font-body text-[8px] tracking-[0.15em] uppercase hover:border-t-accent/30 hover:text-t-accent/60 transition-all">Save</button>
        {patternBank[bankSlot]&&<button onClick={loadBank} className="px-2 py-1 border border-t-accent/25 text-t-accent/50 font-body text-[8px] tracking-[0.15em] uppercase hover:border-t-accent/50 transition-all">Load</button>}

        {copiedRow!==null&&(
          <span className="font-body text-[8px] text-t-accent/40 ml-1">Row {copiedRow.row+1} copied</span>
        )}
      </div>

      {/* Step numbers */}
      <div className="flex gap-px ml-[80px]">
        {Array.from({length:steps},(_,i)=>(
          <div key={i} className={`flex-1 text-center font-body text-[7px] transition-colors ${activeStep===i&&isPlaying?'text-t-accent':'text-noir-silver/20'}`}>
            {barLabel(i)}
          </div>
        ))}
      </div>

      {/* Tracks */}
      {TRACKS.map((track,ti)=>(
        <div key={ti} className="flex items-center gap-1.5">
          {/* Label + row ops */}
          <div className="w-[76px] flex-shrink-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:track.color}}/>
              <span className="font-body text-[9px] tracking-[0.12em] uppercase text-noir-silver/50 truncate">{track.name}</span>
            </div>
            <div className="flex gap-0.5">
              <button onClick={()=>{setCopiedRow({row:ti,pattern:[...pattern[ti]],vel:[...velocity[ti]]})}}
                title="Copy row" className="text-[7px] px-1 border border-noir-silver/8 text-noir-silver/20 hover:border-t-accent/20 hover:text-t-accent/40">C</button>
              {copiedRow&&<button onClick={()=>{setPattern(prev=>{const n=prev.map(r=>[...r]);n[ti]=[...copiedRow.pattern];return n});setVelocity(prev=>{const n=prev.map(r=>[...r]);n[ti]=[...copiedRow.vel];return n})}}
                title="Paste" className="text-[7px] px-1 border border-t-accent/20 text-t-accent/30 hover:border-t-accent/40">P</button>}
              <button onClick={()=>randomize(ti)} title="Randomise row"
                className="text-[7px] px-1 border border-noir-silver/8 text-noir-silver/20 hover:border-t-accent/20 hover:text-t-accent/40">R</button>
            </div>
          </div>

          {/* Steps */}
          {Array.from({length:steps},(_,si)=>{
            const active=pattern[ti][si]; const isCur=activeStep===si&&isPlaying
            const isMuted=muted[ti]?.[si]; const vel=velocity[ti]?.[si]??0.8
            const isBar=si%4===0
            return(
              <button key={si}
                onClick={()=>toggleStep(ti,si)}
                onContextMenu={e=>{e.preventDefault();toggleMute(ti,si)}}
                onMouseDown={e=>{if(e.button===0&&e.altKey){setVelDragStart({row:ti,step:si,startY:e.clientY,startVel:velocity[ti][si]??0.8})}}}
                className={`flex-1 h-8 border transition-all duration-75 relative ${active?isCur?'border-white/60 scale-105':'border-transparent':isCur?'border-noir-silver/30 bg-noir-silver/5':isBar?'border-noir-silver/12 bg-noir-silver/3 hover:bg-noir-silver/8':'border-noir-silver/8 hover:bg-noir-silver/5'}`}
                style={{
                  background:active?(isMuted?`${track.color}33`:(isCur?track.color:`${track.color}${Math.round(vel*153).toString(16).padStart(2,'0')}`)):undefined,
                  opacity:isMuted&&active?0.35:1,
                }}>
                {active&&<div className="absolute inset-x-0 bottom-0 h-0.5" style={{background:`rgba(255,255,255,${vel*0.4})`}}/>}
              </button>
            )
          })}

          {/* Volume */}
          <input type="range" min={0} max={1} step={0.01} value={volumes[ti]}
            onChange={e=>setVolumes(v=>v.map((x,i)=>i===ti?Number(e.target.value):x))}
            className="w-12 flex-shrink-0"
            style={{background:`linear-gradient(to right,${track.color} ${volumes[ti]*100}%,rgba(184,197,208,0.1) ${volumes[ti]*100}%)`}}/>
        </div>
      ))}

      <p className="font-body text-[8px] text-noir-silver/18">Right-click a step to mute it · Alt+drag to adjust velocity · Row C/P to copy/paste rows</p>
    </div>
  )
}
