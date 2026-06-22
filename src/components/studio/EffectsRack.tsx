'use client'

import { useEffect, useRef, useState } from 'react'
import { useStudio } from './StudioContext'

type Tab = 'eq'|'dynamics'|'synth'

interface KnobProps{label:string;value:number;min:number;max:number;step:number;unit:string;onChange:(v:number)=>void;color?:string}
function Knob({label,value,min,max,step,unit,onChange,color='t-accent'}:KnobProps){
  const pct=((value-min)/(max-min))*100
  return(
    <div className="flex flex-col items-center gap-1.5">
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}
        className="w-24"
        style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${pct}%,rgba(184,197,208,0.12) ${pct}%)`}}/>
      <span className="font-body text-[9px] tabular-nums text-noir-ivory/60">{value}{unit}</span>
      <span className="font-body text-[8px] tracking-[0.15em] uppercase text-noir-silver/35">{label}</span>
    </div>
  )
}

export default function EffectsRack(){
  const{bassEqRef,midEqRef,highEqRef,compressorRef,toneReverbRef,tonePhaserRef,toneDistRef,toneWidenerRef}=useStudio()
  const[tab,setTab]=useState<Tab>('eq')
  // EQ state
  const[bass,setBass]=useState(0)
  const[mid,setMid]=useState(0)
  const[high,setHigh]=useState(0)
  const[midFreq,setMidFreq]=useState(1000)
  // Dynamics state
  const[threshold,setThreshold]=useState(-24)
  const[ratio,setRatio]=useState(4)
  const[attack,setAttack]=useState(3)
  const[release,setRelease]=useState(250)
  const[compOn,setCompOn]=useState(false)
  // Synth chain state
  const[revDecay,setRevDecay]=useState(2)
  const[revWet,setRevWet]=useState(0)
  const[phWet,setPhWet]=useState(0)
  const[phRate,setPhRate]=useState(0.5)
  const[distWet,setDistWet]=useState(0)
  const[distAmt,setDistAmt]=useState(0.4)
  const[widener,setWidener]=useState(0.5)

  // EQ → Web Audio refs
  useEffect(()=>{if(bassEqRef.current)bassEqRef.current.gain.value=bass},[bass,bassEqRef])
  useEffect(()=>{if(midEqRef.current)midEqRef.current.gain.value=mid},[mid,midEqRef])
  useEffect(()=>{if(highEqRef.current)highEqRef.current.gain.value=high},[high,highEqRef])
  useEffect(()=>{if(midEqRef.current)midEqRef.current.frequency.value=midFreq},[midFreq,midEqRef])

  // Compressor → Web Audio refs
  useEffect(()=>{if(compressorRef.current){compressorRef.current.threshold.value=threshold}},[threshold,compressorRef])
  useEffect(()=>{if(compressorRef.current){compressorRef.current.ratio.value=ratio}},[ratio,compressorRef])
  useEffect(()=>{if(compressorRef.current){compressorRef.current.attack.value=attack/1000}},[attack,compressorRef])
  useEffect(()=>{if(compressorRef.current){compressorRef.current.release.value=release/1000}},[release,compressorRef])

  // Synth chain → Tone.js refs
  useEffect(()=>{try{if(toneReverbRef.current){toneReverbRef.current.wet.value=revWet}}catch{}},[revWet,toneReverbRef])
  useEffect(()=>{try{if(toneReverbRef.current){toneReverbRef.current.decay=revDecay}}catch{}},[revDecay,toneReverbRef])
  useEffect(()=>{try{if(tonePhaserRef.current){tonePhaserRef.current.wet.value=phWet}}catch{}},[phWet,tonePhaserRef])
  useEffect(()=>{try{if(tonePhaserRef.current){tonePhaserRef.current.frequency.value=phRate}}catch{}},[phRate,tonePhaserRef])
  useEffect(()=>{try{if(toneDistRef.current){toneDistRef.current.wet.value=distWet}}catch{}},[distWet,toneDistRef])
  useEffect(()=>{try{if(toneDistRef.current){toneDistRef.current.distortion=distAmt}}catch{}},[distAmt,toneDistRef])
  useEffect(()=>{try{if(toneWidenerRef.current){toneWidenerRef.current.width.value=widener}}catch{}},[widener,toneWidenerRef])

  const TABS:Tab[]=['eq','dynamics','synth']
  const TAB_LABEL:{[k in Tab]:string}={eq:'3-Band EQ',dynamics:'Dynamics',synth:'Synth FX'}

  return(
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-noir-silver/10 pb-3">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-1.5 border font-body text-[9px] tracking-[0.2em] uppercase transition-all ${tab===t?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/12 text-noir-silver/35 hover:border-t-accent/25'}`}>
            {TAB_LABEL[t]}
          </button>
        ))}
        <span className="ml-auto font-body text-[8px] text-noir-silver/20 self-center">Affects pad/slicer chain (EQ, Dynamics) · Piano/Roll chain (Synth FX)</span>
      </div>

      {tab==='eq'&&(
        <div className="space-y-6">
          <div className="flex items-start gap-8 flex-wrap">
            <div className="flex flex-col gap-4">
              <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Low Shelf · 100 Hz</p>
              <Knob label="Bass" value={bass} min={-12} max={12} step={0.5} unit=" dB" onChange={setBass}/>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Peaking</p>
                <div className="flex items-center gap-1.5">
                  <span className="font-body text-[8px] text-noir-silver/30">Freq</span>
                  <input type="range" min={200} max={8000} step={50} value={midFreq} onChange={e=>setMidFreq(Number(e.target.value))} className="w-24"
                    style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${(midFreq-200)/78}%,rgba(184,197,208,0.12) ${(midFreq-200)/78}%)`}}/>
                  <span className="font-body text-[8px] text-noir-ivory/40 tabular-nums w-16">{midFreq>=1000?`${(midFreq/1000).toFixed(1)}kHz`:`${midFreq}Hz`}</span>
                </div>
              </div>
              <Knob label="Mid" value={mid} min={-12} max={12} step={0.5} unit=" dB" onChange={setMid}/>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">High Shelf · 8 kHz</p>
              <Knob label="High" value={high} min={-12} max={12} step={0.5} unit=" dB" onChange={setHigh}/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>{setBass(0);setMid(0);setHigh(0)}}
              className="px-3 py-1 border border-noir-silver/12 text-noir-silver/30 font-body text-[8px] tracking-[0.15em] uppercase hover:border-red-400/30 hover:text-red-400/60 transition-all">
              ↺ Flat
            </button>
          </div>
          <div className="border-t border-noir-silver/8 pt-4">
            <p className="font-body text-[8px] text-noir-silver/20">EQ applies to: Pads, Slicer samples, Looper tracks · Piano/Roll have their own chain</p>
          </div>
        </div>
      )}

      {tab==='dynamics'&&(
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-3 border-b border-noir-silver/8">
            <button onClick={()=>setCompOn(v=>!v)}
              className={`px-3 py-1.5 border font-body text-[9px] tracking-[0.2em] uppercase transition-all ${compOn?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/15 text-noir-silver/35 hover:border-t-accent/25'}`}>
              {compOn?'◉ Compressor ON':'○ Compressor OFF'}
            </button>
            {compOn&&<span className="font-body text-[8px] text-noir-silver/30">(GR meter: manual — adjust threshold to hear effect)</span>}
          </div>
          <div className="flex items-start gap-8 flex-wrap">
            <Knob label="Threshold" value={threshold} min={-60} max={0} step={1} unit=" dB" onChange={setThreshold}/>
            <Knob label="Ratio" value={ratio} min={1} max={20} step={0.5} unit=":1" onChange={setRatio}/>
            <Knob label="Attack" value={attack} min={0} max={200} step={1} unit=" ms" onChange={setAttack}/>
            <Knob label="Release" value={release} min={10} max={1000} step={10} unit=" ms" onChange={setRelease}/>
          </div>
          {compOn&&(
            <div className="border border-noir-silver/10 p-3 font-body text-[9px] text-noir-silver/35 space-y-1">
              <div>Threshold: <span className="text-t-accent/70">{threshold} dBFS</span></div>
              <div>Ratio: <span className="text-t-accent/70">{ratio}:1</span></div>
              <div>Attack: <span className="text-t-accent/70">{attack}ms</span> · Release: <span className="text-t-accent/70">{release}ms</span></div>
            </div>
          )}
        </div>
      )}

      {tab==='synth'&&(
        <div className="space-y-6">
          <p className="font-body text-[8px] text-noir-silver/30">These effects apply to the Piano and Piano Roll. Wet=0 = bypass.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reverb */}
            <div className="border border-noir-silver/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/50">Reverb</span>
                <span className={`font-body text-[8px] ${revWet>0?'text-t-accent/70':'text-noir-silver/20'}`}>{revWet>0?'ACTIVE':'off'}</span>
              </div>
              <Knob label="Wet" value={Math.round(revWet*100)} min={0} max={100} step={1} unit="%" onChange={v=>setRevWet(v/100)}/>
              <Knob label="Decay" value={revDecay} min={0.1} max={10} step={0.1} unit="s" onChange={setRevDecay}/>
            </div>
            {/* Phaser */}
            <div className="border border-noir-silver/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/50">Phaser</span>
                <span className={`font-body text-[8px] ${phWet>0?'text-t-accent/70':'text-noir-silver/20'}`}>{phWet>0?'ACTIVE':'off'}</span>
              </div>
              <Knob label="Wet" value={Math.round(phWet*100)} min={0} max={100} step={1} unit="%" onChange={v=>setPhWet(v/100)}/>
              <Knob label="Rate" value={phRate} min={0.1} max={8} step={0.1} unit=" Hz" onChange={setPhRate}/>
            </div>
            {/* Distortion + Widener */}
            <div className="border border-noir-silver/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/50">Distortion</span>
                <span className={`font-body text-[8px] ${distWet>0?'text-t-accent/70':'text-noir-silver/20'}`}>{distWet>0?'ACTIVE':'off'}</span>
              </div>
              <Knob label="Drive" value={Math.round(distAmt*100)} min={0} max={100} step={1} unit="%" onChange={v=>setDistAmt(v/100)}/>
              <Knob label="Wet" value={Math.round(distWet*100)} min={0} max={100} step={1} unit="%" onChange={v=>setDistWet(v/100)}/>
              <div className="pt-2 border-t border-noir-silver/8">
                <Knob label="Width" value={Math.round(widener*100)} min={0} max={100} step={1} unit="%" onChange={v=>setWidener(v/100)}/>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
