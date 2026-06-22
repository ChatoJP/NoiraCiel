'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import * as Tone from 'tone'
import { useStudio } from './StudioContext'

type Tool='tuner'|'chords'|'scale'|'circle'|'dictionary'|'noise'|'bpm'|'rnanalyser'|'chordchart'

// ── Helpers ──────────────────────────────────────────────────────────────────
const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FIFTHS_MAJOR=['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']
const FIFTHS_MINOR=['Am','Em','Bm','F#m','C#m','G#m','D#m','Bbm','Fm','Cm','Gm','Dm']

function noteToSemi(n:string){return NOTE_NAMES.indexOf(n.replace('b',n.includes('b')&&n!=='B'?'#':'b'))||NOTE_NAMES.indexOf(n)}
function enharmonic(n:string){const map:Record<string,string>={'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};return map[n]??n}

function autoCorrelate(buf:Float32Array,sr:number):number{
  let rms=0; for(let i=0;i<buf.length;i++) rms+=buf[i]*buf[i]; rms=Math.sqrt(rms/buf.length)
  if(rms<0.01) return -1
  let r1=0,r2=buf.length-1; const th=0.2
  for(let i=0;i<buf.length/2;i++){if(Math.abs(buf[i])<th){r1=i;break}}
  for(let i=1;i<buf.length/2;i++){if(Math.abs(buf[buf.length-i])<th){r2=buf.length-i;break}}
  const trim=buf.slice(r1,r2); const L=trim.length
  const c=new Float32Array(L*2)
  for(let i=0;i<L;i++) for(let j=0;j<L;j++) c[i+j]+=trim[i]*trim[j]
  let mx=-1,mp=-1
  for(let i=1;i<L;i++) if(c[i]>mx){mx=c[i];mp=i}
  if(mp<1) return -1
  const x1=c[mp-1],x2=c[mp],x3=c[mp+1]; const a=(x1+x3-2*x2)/2,b=(x3-x1)/2
  return sr/(a?mp-b/(2*a):mp)
}
function freqToNote(freq:number):{note:string;octave:number;cents:number}{
  const nm=12*(Math.log2(freq/440))+69; const rnd=Math.round(nm)
  return{note:NOTE_NAMES[((rnd%12)+12)%12],octave:Math.floor(rnd/12)-1,cents:Math.round((nm-rnd)*100)}
}

const CHORD_DICT:{[k:string]:number[]}={
  'Major':[0,4,7],'Minor':[0,3,7],'Dim':[0,3,6],'Aug':[0,4,8],
  'Sus2':[0,2,7],'Sus4':[0,5,7],'Dom7':[0,4,7,10],'Maj7':[0,4,7,11],
  'Min7':[0,3,7,10],'Min/Maj7':[0,3,7,11],'Dim7':[0,3,6,9],'HalfDim':[0,3,6,10],
  'Aug7':[0,4,8,10],'Dom9':[0,4,7,10,14],'Maj9':[0,4,7,11,14],'Add9':[0,4,7,14],
  '6th':[0,4,7,9],'Min6':[0,3,7,9],'11th':[0,4,7,10,17],'13th':[0,4,7,10,14,21],
}

const SCALES_DICT:{[k:string]:number[]}={
  'Major':[0,2,4,5,7,9,11],'Natural Minor':[0,2,3,5,7,8,10],
  'Harmonic Minor':[0,2,3,5,7,8,11],'Melodic Minor':[0,2,3,5,7,9,11],
  'Pentatonic Major':[0,2,4,7,9],'Pentatonic Minor':[0,3,5,7,10],
  'Blues':[0,3,5,6,7,10],'Dorian':[0,2,3,5,7,9,10],'Phrygian':[0,1,3,5,7,8,10],
  'Lydian':[0,2,4,6,7,9,11],'Mixolydian':[0,2,4,5,7,9,10],'Locrian':[0,1,3,5,6,8,10],
  'Whole Tone':[0,2,4,6,8,10],'Diminished':[0,2,3,5,6,8,9,11],'Chromatic':[0,1,2,3,4,5,6,7,8,9,10,11],
}

const PROG_TEMPLATES:{[k:string]:number[][]}={
  'I–IV–V–I':[[0,4,7],[5,9,0],[7,11,2],[0,4,7]],
  'I–V–vi–IV':[[0,4,7],[7,11,2],[9,0,4],[5,9,0]],
  'ii–V–I':[[2,5,9],[7,11,2],[0,4,7]],
  '12-Bar Blues':[[0,4,7],[0,4,7],[0,4,7],[0,4,7],[5,9,0],[5,9,0],[0,4,7],[0,4,7],[7,11,2],[5,9,0],[0,4,7],[7,11,2]],
  'I–vi–IV–V':[[0,4,7],[9,0,4],[5,9,0],[7,11,2]],
  'vi–IV–I–V':[[9,0,4],[5,9,0],[0,4,7],[7,11,2]],
}

// ── Tuner ────────────────────────────────────────────────────────────────────
function Tuner(){
  const[active,setActive]=useState(false)
  const[det,setDet]=useState<{note:string;octave:number;cents:number;freq:number}|null>(null)
  const rafRef=useRef(0); const streamRef=useRef<MediaStream|null>(null)
  const analyserRef=useRef<AnalyserNode|null>(null)

  const stop=useCallback(()=>{
    cancelAnimationFrame(rafRef.current); streamRef.current?.getTracks().forEach(t=>t.stop())
    streamRef.current=null; analyserRef.current=null; setActive(false); setDet(null)
  },[])

  const start=useCallback(async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true})
      streamRef.current=stream
      const ctx=new AudioContext()
      const src=ctx.createMediaStreamSource(stream)
      const an=ctx.createAnalyser(); an.fftSize=4096; analyserRef.current=an
      src.connect(an); setActive(true)
      const buf=new Float32Array(an.fftSize)
      const tick=()=>{
        an.getFloatTimeDomainData(buf)
        const freq=autoCorrelate(buf,ctx.sampleRate)
        if(freq>60&&freq<1200){const r=freqToNote(freq);setDet({...r,freq:Math.round(freq*10)/10})}
        rafRef.current=requestAnimationFrame(tick)
      }
      tick()
    }catch(e){console.warn('Tuner mic error',e)}
  },[])

  useEffect(()=>()=>{stop()},[stop])

  const centsColor=det?det.cents===0?'text-green-400':Math.abs(det.cents)<10?'text-yellow-400':'text-red-400':'text-noir-silver/30'

  return(
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={active?stop:start}
          className={`px-4 py-2 border font-body text-[9px] tracking-[0.3em] uppercase transition-all ${active?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/20 text-noir-silver/40 hover:border-t-accent/30 hover:text-t-accent/70'}`}>
          {active?'◉ Listening':'Start Tuner'}
        </button>
        {active&&<span className="font-body text-[8px] text-noir-silver/30 animate-pulse">Mic active</span>}
      </div>

      <div className="border border-noir-silver/10 p-8 flex flex-col items-center gap-4">
        {det?(
          <>
            <div className="font-heading italic text-7xl tracking-wide" style={{color:'rgb(var(--t-accent-rgb))'}}>
              {det.note}<span className="text-4xl">{det.octave}</span>
            </div>
            <div className={`font-body text-2xl tabular-nums ${centsColor}`}>
              {det.cents>0?`+${det.cents}`:det.cents} ¢
            </div>
            <div className="w-64 h-2 bg-noir-silver/10 relative">
              <div className="absolute top-0 h-full w-0.5 bg-green-400/40 left-1/2"/>
              <div className="absolute top-0 h-full w-1 rounded"
                style={{left:`calc(50% + ${det.cents * 1.2}px)`,background:'rgb(var(--t-accent-rgb))',transition:'left 0.1s'}}/>
            </div>
            <div className="font-body text-[10px] text-noir-silver/35 tabular-nums">{det.freq} Hz</div>
          </>
        ):(
          <span className="font-body text-[9px] tracking-[0.35em] uppercase text-noir-silver/20">
            {active?'Play a note…':'Activate tuner'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Chord Progression Builder ─────────────────────────────────────────────────
function ChordBuilder(){
  const{toneGainRef}=useStudio()
  const[root,setRoot]=useState('C')
  const[mode,setMode]=useState<'major'|'minor'>('major')
  const[template,setTemplate]=useState('I–V–vi–IV')
  const[playing,setPlaying]=useState(false)
  const synthRef=useRef<Tone.PolySynth|null>(null)
  const seqRef=useRef<Tone.Sequence|null>(null)
  const[idx,setIdx]=useState(-1)

  const rootSemi=NOTE_NAMES.indexOf(enharmonic(root))
  const scale=mode==='major'?SCALES_DICT['Major']:SCALES_DICT['Natural Minor']
  const chords=PROG_TEMPLATES[template]??[]

  const chordNotes=(intervals:number[])=>intervals.map(i=>{const s=(rootSemi+i)%12; return`${NOTE_NAMES[s]}4`})

  const stop=useCallback(()=>{
    seqRef.current?.stop(); seqRef.current?.dispose(); seqRef.current=null
    Tone.getTransport().stop(); Tone.getTransport().cancel()
    synthRef.current?.releaseAll(); setPlaying(false); setIdx(-1)
  },[])

  const play=useCallback(()=>{
    if(!synthRef.current){const p=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:0.05,decay:0.3,sustain:0.7,release:1.5},volume:-8});p.connect(toneGainRef.current??Tone.getDestination());synthRef.current=p}
    seqRef.current?.dispose()
    Tone.getTransport().bpm.value=72
    let ci=0
    seqRef.current=new Tone.Sequence((time)=>{
      const c=chords[ci%chords.length]; setIdx(ci%chords.length)
      synthRef.current?.releaseAll()
      synthRef.current?.triggerAttack(chordNotes(c),time)
      ci++
    },Array.from({length:chords.length},(_,i)=>i),'2n')
    Tone.getTransport().start(); seqRef.current.start(0); setPlaying(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[chords,toneGainRef])

  useEffect(()=>()=>{stop();synthRef.current?.dispose()},[stop])

  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select value={root} onChange={e=>setRoot(e.target.value)}
          className="bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-xs px-2 py-1.5 focus:outline-none focus:border-t-accent/40">
          {NOTE_NAMES.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={()=>setMode(m=>m==='major'?'minor':'major')}
          className={`px-3 py-1.5 border font-body text-[9px] tracking-[0.2em] uppercase transition-all ${mode==='major'?'border-t-accent/50 text-t-accent':'border-violet-500/40 text-violet-400'}`}>
          {mode==='major'?'Major':'Minor'}
        </button>
        <select value={template} onChange={e=>setTemplate(e.target.value)}
          className="bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-xs px-2 py-1.5 focus:outline-none focus:border-t-accent/40 flex-1 min-w-0">
          {Object.keys(PROG_TEMPLATES).map(k=><option key={k} value={k}>{k}</option>)}
        </select>
        <button onClick={playing?stop:play}
          className={`px-4 py-1.5 border font-body text-[9px] tracking-[0.25em] uppercase transition-all ${playing?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/20 text-noir-silver/40 hover:border-t-accent/30'}`}>
          {playing?'■ Stop':'▶ Play'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {chords.map((c,i)=>(
          <div key={i} className={`border px-4 py-3 font-body text-center transition-all ${idx===i?'border-t-accent/70 bg-t-accent/10':playing&&i===((idx+1)%chords.length)?'border-noir-silver/30':'border-noir-silver/12'}`}>
            <div className="text-[8px] tracking-[0.2em] uppercase text-noir-silver/35 mb-1">Chord {i+1}</div>
            <div className={`text-sm font-heading italic ${idx===i?'text-t-accent':'text-noir-ivory/60'}`}>
              {chordNotes(c).map(n=>n.slice(0,-1)).join(' ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Scale Finder ─────────────────────────────────────────────────────────────
function ScaleFinder(){
  const[selected,setSelected]=useState<Set<number>>(new Set())

  const toggle=(i:number)=>setSelected(s=>{const n=new Set(s);n.has(i)?n.delete(i):n.add(i);return n})

  const matchedScales=Object.entries(SCALES_DICT).map(([name,intervals])=>{
    if(selected.size===0) return null
    const hits=[...selected].filter(s=>intervals.includes(s%12))
    if(hits.length===0) return null
    const pct=Math.round(hits.length/selected.size*100)
    return{name,pct,intervals}
  }).filter(Boolean).sort((a,b)=>(b!.pct)-(a!.pct)) as {name:string;pct:number;intervals:number[]}[]

  return(
    <div className="space-y-5">
      <div className="grid grid-cols-12 gap-1">
        {NOTE_NAMES.map((n,i)=>{
          const isBlack=[1,3,6,8,10].includes(i)
          return(
            <button key={i} onClick={()=>toggle(i)}
              className={`py-3 border font-body text-[8px] transition-all ${selected.has(i)?'border-t-accent/70 bg-t-accent/15 text-t-accent':isBlack?'border-noir-silver/10 bg-noir-silver/5 text-noir-silver/40 hover:border-t-accent/25':'border-noir-silver/15 text-noir-silver/50 hover:border-t-accent/25'}`}>
              {n}
            </button>
          )
        })}
      </div>

      {selected.size>0&&(
        <div className="space-y-2">
          <p className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/35">{selected.size} note{selected.size!==1?'s':''} selected</p>
          {matchedScales.length===0?<p className="font-body text-[9px] text-noir-silver/25">No matching scales</p>:
            matchedScales.slice(0,8).map(sc=>(
              <div key={sc.name} className="flex items-center gap-3 border border-noir-silver/8 px-3 py-2">
                <div className="flex-1">
                  <span className="font-body text-[9px] tracking-[0.15em] uppercase text-noir-ivory/60">{sc.name}</span>
                  <span className="font-body text-[8px] text-noir-silver/30 ml-2">
                    {sc.intervals.map(i=>NOTE_NAMES[i]).join(' ')}
                  </span>
                </div>
                <div className="w-20 h-1.5 bg-noir-silver/10">
                  <div className="h-full bg-t-accent/60" style={{width:`${sc.pct}%`}}/>
                </div>
                <span className="font-body text-[8px] tabular-nums text-t-accent/60 w-8">{sc.pct}%</span>
              </div>
            ))
          }
        </div>
      )}
      {selected.size===0&&<p className="font-body text-[9px] text-noir-silver/20">Click notes to find matching scales</p>}
      {selected.size>0&&<button onClick={()=>setSelected(new Set())}
        className="px-3 py-1 border border-noir-silver/10 text-noir-silver/25 font-body text-[8px] hover:border-red-400/25 hover:text-red-400/50 transition-all">Clear</button>}
    </div>
  )
}

// ── Circle of Fifths ──────────────────────────────────────────────────────────
function CircleOfFifths(){
  const[hovered,setHovered]=useState<string|null>(null)
  const[selected,setSelected]=useState<string|null>(null)
  const CX=160,CY=160,R_OUT=140,R_MID=95,R_IN=58

  function slice(i:number,r1:number,r2:number,gap=4){
    const a1=(i*30-90)*Math.PI/180; const a2=((i+1)*30-90)*Math.PI/180
    const ag=gap*Math.PI/180
    const p=(r:number,a:number)=>[CX+r*Math.cos(a),CY+r*Math.sin(a)]
    const[x1,y1]=p(r1,a1+ag/r1); const[x2,y2]=p(r2,a1+ag/r2)
    const[x3,y3]=p(r2,a2-ag/r2); const[x4,y4]=p(r1,a2-ag/r1)
    return`M${x1},${y1}L${x2},${y2}A${r2},${r2},0,0,1,${x3},${y3}L${x4},${y4}A${r1},${r1},0,0,0,${x1},${y1}Z`
  }
  function labelPos(i:number,r:number){
    const a=(i*30-75)*Math.PI/180; return[CX+r*Math.cos(a),CY+r*Math.sin(a)]
  }

  return(
    <div className="flex flex-col items-center gap-4">
      <svg width={320} height={320} viewBox="0 0 320 320">
        {FIFTHS_MAJOR.map((key,i)=>{
          const isHov=hovered===key; const isSel=selected===key
          return(
            <g key={key} className="cursor-pointer"
              onMouseEnter={()=>setHovered(key)} onMouseLeave={()=>setHovered(null)}
              onClick={()=>setSelected(s=>s===key?null:key)}>
              <path d={slice(i,R_MID,R_OUT)}
                fill={isSel?'rgb(var(--t-accent-rgb)/0.4)':isHov?'rgba(184,197,208,0.12)':'rgba(184,197,208,0.04)'}
                stroke={isSel?'rgb(var(--t-accent-rgb))':'rgba(184,197,208,0.15)'} strokeWidth={isSel?1.5:1}/>
              <text x={labelPos(i,(R_MID+R_OUT)/2)[0]} y={labelPos(i,(R_MID+R_OUT)/2)[1]+4}
                textAnchor="middle" className="font-body" style={{fontSize:11,fill:isSel?'rgb(var(--t-accent-rgb))':'rgba(242,237,227,0.65)',fontFamily:'inherit'}}>
                {key}
              </text>
            </g>
          )
        })}
        {FIFTHS_MINOR.map((key,i)=>{
          const isHov=hovered===key; const isSel=selected===key
          return(
            <g key={key} className="cursor-pointer"
              onMouseEnter={()=>setHovered(key)} onMouseLeave={()=>setHovered(null)}
              onClick={()=>setSelected(s=>s===key?null:key)}>
              <path d={slice(i,R_IN,R_MID)}
                fill={isSel?'rgba(148,128,196,0.35)':isHov?'rgba(184,197,208,0.08)':'rgba(184,197,208,0.02)'}
                stroke={isSel?'rgba(148,128,196,0.8)':'rgba(184,197,208,0.10)'} strokeWidth={1}/>
              <text x={labelPos(i,(R_IN+R_MID)/2)[0]} y={labelPos(i,(R_IN+R_MID)/2)[1]+3}
                textAnchor="middle" style={{fontSize:9,fill:isSel?'rgb(148,128,196)':'rgba(184,197,208,0.45)',fontFamily:'inherit'}}>
                {key}
              </text>
            </g>
          )
        })}
        <circle cx={CX} cy={CY} r={R_IN-4} fill="rgba(0,0,0,0.3)" stroke="rgba(184,197,208,0.08)" strokeWidth={1}/>
        <text x={CX} y={CY+5} textAnchor="middle" style={{fontSize:10,fill:'rgba(184,197,208,0.25)',fontFamily:'inherit'}}>5ths</text>
      </svg>
      {selected&&<p className="font-body text-[9px] tracking-[0.25em] uppercase text-t-accent/60">Selected: {selected}</p>}
      <p className="font-body text-[8px] text-noir-silver/20">Outer: major keys · Inner: relative minors</p>
    </div>
  )
}

// ── Chord Dictionary ──────────────────────────────────────────────────────────
function ChordDictionary(){
  const{toneGainRef}=useStudio()
  const[root,setRoot]=useState('C')
  const[filter,setFilter]=useState('')
  const synthRef=useRef<Tone.PolySynth|null>(null)
  const rootSemi=NOTE_NAMES.indexOf(root)

  const playChord=(intervals:number[])=>{
    if(!synthRef.current){const p=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:0.01,decay:0.5,sustain:0.3,release:1.5},volume:-8});p.connect(toneGainRef.current??Tone.getDestination());synthRef.current=p}
    Tone.start()
    synthRef.current.releaseAll()
    const notes=intervals.map(i=>`${NOTE_NAMES[(rootSemi+i)%12]}4`)
    synthRef.current.triggerAttackRelease(notes,'2n',Tone.now())
  }
  useEffect(()=>()=>{synthRef.current?.dispose()},[])

  const filtered=Object.entries(CHORD_DICT).filter(([name])=>name.toLowerCase().includes(filter.toLowerCase()))

  return(
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <select value={root} onChange={e=>setRoot(e.target.value)}
          className="bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-xs px-2 py-1.5 focus:outline-none focus:border-t-accent/40">
          {NOTE_NAMES.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter chords…"
          className="flex-1 bg-noir-void border border-noir-silver/12 text-noir-ivory/70 font-body text-xs px-3 py-1.5 focus:outline-none focus:border-t-accent/35 placeholder:text-noir-silver/20"/>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {filtered.map(([name,intervals])=>{
          const notes=intervals.map(i=>NOTE_NAMES[(rootSemi+i)%12])
          return(
            <button key={name} onClick={()=>playChord(intervals)}
              className="border border-noir-silver/10 hover:border-t-accent/40 p-3 text-left group transition-all">
              <div className="font-body text-[9px] tracking-[0.15em] uppercase text-noir-ivory/60 group-hover:text-t-accent/80">{root} {name}</div>
              <div className="font-body text-[8px] text-noir-silver/30 mt-1">{notes.join(' · ')}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Noise Generator ───────────────────────────────────────────────────────────
function NoiseGen(){
  const{audioCtxRef,masterGainRef}=useStudio()
  const[type,setType]=useState<'white'|'pink'|'brown'>('white')
  const[vol,setVol]=useState(0.3)
  const[playing,setPlaying]=useState(false)
  const sourceRef=useRef<AudioBufferSourceNode|null>(null)
  const gainRef=useRef<GainNode|null>(null)

  const stop=useCallback(()=>{
    sourceRef.current?.stop(); sourceRef.current=null; setPlaying(false)
  },[])

  const play=useCallback((t:'white'|'pink'|'brown')=>{
    stop()
    const ctx=audioCtxRef.current??new AudioContext()
    if(!audioCtxRef.current) audioCtxRef.current=ctx
    if(ctx.state==='suspended') ctx.resume()
    const frames=ctx.sampleRate*2
    const buf=ctx.createBuffer(1,frames,ctx.sampleRate)
    const data=buf.getChannelData(0)
    if(t==='white'){for(let i=0;i<frames;i++) data[i]=Math.random()*2-1}
    else if(t==='pink'){
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
      for(let i=0;i<frames;i++){
        const w=Math.random()*2-1
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759
        b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856
        b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980
        data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)/7; b6=w*0.115926
      }
    }else{
      let last=0
      for(let i=0;i<frames;i++){const w=Math.random()*2-1;last=(last+0.02*w)/1.02;data[i]=last*3.5}
    }
    const src=ctx.createBufferSource(); src.buffer=buf; src.loop=true
    const g=ctx.createGain(); g.gain.value=vol
    src.connect(g); g.connect(masterGainRef.current??ctx.destination)
    src.start(); sourceRef.current=src; gainRef.current=g; setPlaying(true)
  },[stop,audioCtxRef,masterGainRef,vol])

  useEffect(()=>{if(gainRef.current) gainRef.current.gain.value=vol},[vol])
  useEffect(()=>()=>{stop()},[stop])

  return(
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['white','pink','brown'] as const).map(t=>(
          <button key={t} onClick={()=>{setType(t);if(playing)play(t)}}
            className={`px-3 py-1.5 border font-body text-[9px] tracking-[0.2em] uppercase capitalize transition-all ${type===t?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/15 text-noir-silver/35 hover:border-t-accent/25'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/35">Volume</span>
        <input type="range" min={0} max={1} step={0.01} value={vol} onChange={e=>setVol(Number(e.target.value))} className="w-32"
          style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${vol*100}%,rgba(184,197,208,0.12) ${vol*100}%)`}}/>
        <span className="font-body text-[9px] tabular-nums text-noir-silver/30">{Math.round(vol*100)}%</span>
      </div>
      <button onClick={()=>playing?stop():play(type)}
        className={`px-6 py-2 border font-body text-[9px] tracking-[0.25em] uppercase transition-all ${playing?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/20 text-noir-silver/40 hover:border-t-accent/30'}`}>
        {playing?`■ Stop ${type} noise`:`▶ Play ${type} noise`}
      </button>
      {playing&&(
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-t-accent/70 animate-pulse"/>
          <span className="font-body text-[8px] text-noir-silver/30 capitalize">{type} noise playing</span>
        </div>
      )}
    </div>
  )
}

// ── BPM Calculator ────────────────────────────────────────────────────────────
function BPMCalc(){
  const{bpm,setBpm}=useStudio()
  const[bars,setBars]=useState(8)
  const[minutes,setMinutes]=useState(0)
  const[seconds,setSeconds]=useState(16)
  const[calcBpm,setCalcBpm]=useState<number|null>(null)
  // Reverse: BPM + bars → duration
  const[sBars,setSBars]=useState(32)

  const calculate=()=>{
    const totalSec=minutes*60+seconds
    if(totalSec>0&&bars>0){const b=Math.round((bars*4)/(totalSec/60)*10)/10; setCalcBpm(b)}
  }
  const duration=()=>{const totalBeats=sBars*4;const secs=totalBeats/(bpm/60);const m=Math.floor(secs/60);const s=Math.round(secs%60);return`${m}:${s.toString().padStart(2,'0')}`}

  return(
    <div className="space-y-6">
      <div className="border border-noir-silver/10 p-5 space-y-4">
        <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Duration → BPM</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <input type="number" min={1} value={bars} onChange={e=>setBars(Number(e.target.value))}
              className="w-14 bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-sm px-2 py-1 focus:outline-none focus:border-t-accent/35 text-center tabular-nums"/>
            <span className="font-body text-[9px] text-noir-silver/35">bars</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input type="number" min={0} max={59} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}
              className="w-12 bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-sm px-2 py-1 focus:outline-none focus:border-t-accent/35 text-center tabular-nums"/>
            <span className="font-body text-[9px] text-noir-silver/35">min</span>
            <input type="number" min={0} max={59} value={seconds} onChange={e=>setSeconds(Number(e.target.value))}
              className="w-12 bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-sm px-2 py-1 focus:outline-none focus:border-t-accent/35 text-center tabular-nums"/>
            <span className="font-body text-[9px] text-noir-silver/35">sec</span>
          </div>
          <button onClick={calculate}
            className="px-4 py-1.5 border border-t-accent/30 text-t-accent/60 font-body text-[9px] tracking-[0.2em] uppercase hover:border-t-accent/60 hover:text-t-accent transition-all">
            Calculate
          </button>
        </div>
        {calcBpm&&(
          <div className="flex items-center gap-4">
            <span className="font-heading text-4xl italic" style={{color:'rgb(var(--t-accent-rgb))'}}>
              {calcBpm}
            </span>
            <span className="font-body text-[9px] text-noir-silver/35">BPM</span>
            <button onClick={()=>setBpm(Math.round(calcBpm))}
              className="px-3 py-1 border border-t-accent/25 text-t-accent/50 font-body text-[8px] tracking-[0.2em] uppercase hover:border-t-accent/50 hover:text-t-accent transition-all ml-2">
              Apply to Transport
            </button>
          </div>
        )}
      </div>

      <div className="border border-noir-silver/10 p-5 space-y-4">
        <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">BPM → Duration (current: {bpm} bpm)</p>
        <div className="flex items-center gap-3">
          <input type="number" min={1} value={sBars} onChange={e=>setSBars(Number(e.target.value))}
            className="w-14 bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-sm px-2 py-1 focus:outline-none focus:border-t-accent/35 text-center tabular-nums"/>
          <span className="font-body text-[9px] text-noir-silver/35">bars</span>
          <span className="font-heading text-2xl italic text-t-accent/70 ml-2">{duration()}</span>
        </div>
      </div>
    </div>
  )
}

// ── Roman Numeral Analyser ────────────────────────────────────────────────────
const ROMAN=['I','II','III','IV','V','VI','VII']
const DIATONIC_QUALITIES_MAJOR=['Major','Minor','Minor','Major','Major','Minor','Dim']
const DIATONIC_QUALITIES_MINOR=['Minor','Dim','Major','Minor','Minor','Major','Major']

function chordToRoman(chordRoot:string,chordQuality:string,keyRoot:string,scale:number[]):string{
  const rootSemi=NOTE_NAMES.indexOf(enharmonic(chordRoot))
  const keySemi=NOTE_NAMES.indexOf(enharmonic(keyRoot))
  const deg=((rootSemi-keySemi+12)%12)
  const idx=scale.indexOf(deg); if(idx<0) return '?'
  const roman=ROMAN[idx]
  const isMinor=chordQuality==='Minor'||chordQuality==='Min7'||chordQuality==='Dim'||chordQuality==='HalfDim'
  const isDim=chordQuality==='Dim'||chordQuality==='Dim7'||chordQuality==='HalfDim'
  const has7=chordQuality.includes('7')||chordQuality.includes('9')
  let rn=isMinor?roman.toLowerCase():roman
  if(isDim) rn+='°'
  if(has7) rn+='7'
  return rn
}

function RNAnalyser(){
  const{setGlobalScale,setGlobalScaleRoot}=useStudio()
  const[keyRoot,setKeyRoot]=useState('C')
  const[keyMode,setKeyMode]=useState<'Major'|'Minor'>('Major')
  const[progression,setProgression]=useState<Array<{root:string;quality:string}>>([])
  const[selectedRoot,setSelectedRoot]=useState('C')
  const[selectedQuality,setSelectedQuality]=useState('Major')

  const scale=keyMode==='Major'?SCALES_DICT['Major']:SCALES_DICT['Natural Minor']
  const qualities=Object.keys(CHORD_DICT).slice(0,8)

  const addChord=()=>{
    setProgression(p=>[...p,{root:selectedRoot,quality:selectedQuality}])
  }

  const syncToGlobal=()=>{
    setGlobalScaleRoot(keyRoot)
    setGlobalScale(keyMode==='Major'?'Major':'Natural Minor')
  }

  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/35">Key</span>
        <select value={keyRoot} onChange={e=>setKeyRoot(e.target.value)}
          className="bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-xs px-2 py-1.5 focus:outline-none focus:border-t-accent/40">
          {NOTE_NAMES.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={()=>setKeyMode(m=>m==='Major'?'Minor':'Major')}
          className={`px-3 py-1.5 border font-body text-[9px] tracking-[0.2em] uppercase transition-all ${keyMode==='Major'?'border-t-accent/50 text-t-accent':'border-violet-500/40 text-violet-400'}`}>
          {keyMode}
        </button>
        <button onClick={syncToGlobal}
          className="px-3 py-1.5 border border-noir-silver/15 text-noir-silver/40 font-body text-[8px] tracking-[0.2em] uppercase hover:border-t-accent/35 hover:text-t-accent/70 transition-all">
          → Sync to Piano
        </button>
      </div>

      {/* Chord picker */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={selectedRoot} onChange={e=>setSelectedRoot(e.target.value)}
          className="bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-xs px-2 py-1.5 focus:outline-none focus:border-t-accent/40">
          {NOTE_NAMES.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <select value={selectedQuality} onChange={e=>setSelectedQuality(e.target.value)}
          className="bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-xs px-2 py-1.5 focus:outline-none focus:border-t-accent/40">
          {Object.keys(CHORD_DICT).map(k=><option key={k} value={k}>{k}</option>)}
        </select>
        <button onClick={addChord}
          className="px-3 py-1.5 border border-t-accent/30 text-t-accent/60 font-body text-[9px] tracking-[0.2em] uppercase hover:border-t-accent/60 hover:text-t-accent transition-all">
          + Add
        </button>
        {progression.length>0&&(
          <button onClick={()=>setProgression([])}
            className="px-2 py-1 border border-noir-silver/10 text-noir-silver/25 font-body text-[8px] hover:border-red-400/25 hover:text-red-400/50 transition-all">✕ Clear</button>
        )}
      </div>

      {/* Progression display */}
      {progression.length>0?(
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {progression.map((c,i)=>{
              const rn=chordToRoman(c.root,c.quality,keyRoot,scale)
              return(
                <div key={i} className={`border px-4 py-3 text-center ${rn==='?'?'border-red-400/25':'border-t-accent/25'}`}>
                  <div className="font-heading italic text-xl mb-1" style={{color:rn==='?'?'rgba(248,113,113,0.7)':'rgb(var(--t-accent-rgb))'}}>
                    {rn}
                  </div>
                  <div className="font-body text-[9px] text-noir-ivory/50">{c.root} {c.quality}</div>
                  <button onClick={()=>setProgression(p=>p.filter((_,j)=>j!==i))}
                    className="mt-1 font-body text-[7px] text-noir-silver/20 hover:text-red-400/50 transition-colors">✕</button>
                </div>
              )
            })}
          </div>
          {/* Text summary */}
          <div className="border border-noir-silver/8 px-4 py-2">
            <span className="font-body text-[8px] text-noir-silver/35">Progression: </span>
            <span className="font-heading italic text-base text-t-accent/70">
              {progression.map(c=>chordToRoman(c.root,c.quality,keyRoot,scale)).join(' – ')}
            </span>
            <span className="font-body text-[8px] text-noir-silver/30 ml-3">in {keyRoot} {keyMode}</span>
          </div>
        </div>
      ):(
        <p className="font-body text-[9px] text-noir-silver/20">Select a key · add chords → see Roman numeral analysis</p>
      )}

      {/* Diatonic chords in the key */}
      <div className="border-t border-noir-silver/8 pt-4 space-y-2">
        <p className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/35">Diatonic chords in {keyRoot} {keyMode}</p>
        <div className="flex flex-wrap gap-2">
          {scale.map((deg,i)=>{
            const root=NOTE_NAMES[(NOTE_NAMES.indexOf(enharmonic(keyRoot))+deg)%12]
            const quality=(keyMode==='Major'?DIATONIC_QUALITIES_MAJOR:DIATONIC_QUALITIES_MINOR)[i]
            const roman=keyMode==='Major'?(['I','II','III','IV','V','VI','VII'][i]):[['i','ii°','III','iv','v','VI','VII'][i]]
            return(
              <button key={i}
                onClick={()=>setProgression(p=>[...p,{root,quality}])}
                className="border border-noir-silver/12 px-3 py-2 text-center hover:border-t-accent/40 transition-all group">
                <div className="font-heading italic text-sm" style={{color:'rgb(var(--t-accent-rgb))'}}>{roman}</div>
                <div className="font-body text-[8px] text-noir-ivory/45 group-hover:text-noir-ivory/65">{root} {quality}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Transposable Chord Chart ──────────────────────────────────────────────────
const CHART_PROGRESSIONS:{[k:string]:string[]}={
  'I–IV–V–I':['I','IV','V','I'],
  'I–V–vi–IV':['I','V','vi','IV'],
  'ii–V–I':['ii','V','I'],
  'I–vi–IV–V':['I','vi','IV','V'],
  'vi–IV–I–V':['vi','IV','I','V'],
  'I–IV–vi–V':['I','IV','vi','V'],
  'iii–vi–ii–V–I':['iii','vi','ii','V','I'],
  '12-Bar Blues':['I','I','I','I','IV','IV','I','I','V','IV','I','V'],
}

const DEGREE_TO_SCALE_IDX:{[k:string]:number}={I:0,II:1,III:2,IV:3,V:4,VI:5,VII:6,i:0,ii:1,iii:2,iv:3,v:4,vi:5,vii:6}
const MAJOR_QUALITIES=['Major','Minor','Minor','Major','Major','Minor','Dim']
const MINOR_QUALITIES=['Minor','Dim','Major','Minor','Minor','Major','Major']

function degreeToChord(degree:string,keyRoot:string,mode:'Major'|'Minor'):string{
  const clean=degree.replace('°','').replace('7','')
  const idx=DEGREE_TO_SCALE_IDX[clean]; if(idx===undefined) return '?'
  const scale=mode==='Major'?SCALES_DICT['Major']:SCALES_DICT['Natural Minor']
  const keySemi=NOTE_NAMES.indexOf(enharmonic(keyRoot))
  const chordRoot=NOTE_NAMES[(keySemi+scale[idx])%12]
  const quality=(mode==='Major'?MAJOR_QUALITIES:MINOR_QUALITIES)[idx]
  const shortQ=quality==='Major'?'maj':quality==='Minor'?'m':quality==='Dim'?'°':quality
  return`${chordRoot}${shortQ==='maj'?'':shortQ}`
}

// Voice leading: min total semitone movement between two chord voicings
function voiceLeadScore(c1:number[],c2:number[]):number{
  let best=Infinity
  for(let rot=0;rot<c2.length;rot++){
    const rotated=c2.map((_,i)=>c2[(i+rot)%c2.length])
    let total=0
    for(let i=0;i<Math.min(c1.length,rotated.length);i++){
      total+=Math.abs(((rotated[i]-c1[i]+6)%12)-6)
    }
    if(total<best) best=total
  }
  return best
}

function ChordChart(){
  const{toneGainRef}=useStudio()
  const[keyRoot,setKeyRoot]=useState('C')
  const[mode,setMode]=useState<'Major'|'Minor'>('Major')
  const[progKey,setProgKey]=useState('I–V–vi–IV')
  const[playingIdx,setPlayingIdx]=useState(-1)
  const[showVoiceLeading,setShowVoiceLeading]=useState(false)
  const synthRef=useRef<Tone.PolySynth|null>(null)
  const seqRef=useRef<Tone.Sequence|null>(null)
  const[isPlaying,setIsPlaying]=useState(false)

  const degrees=CHART_PROGRESSIONS[progKey]??[]
  const chordNames=degrees.map(d=>degreeToChord(d,keyRoot,mode))
  const keySemi=NOTE_NAMES.indexOf(enharmonic(keyRoot))
  const scale=mode==='Major'?SCALES_DICT['Major']:SCALES_DICT['Natural Minor']

  // Build semitone arrays for voice leading
  const chordSemis=degrees.map(d=>{
    const clean=d.replace('°','').replace('7','')
    const idx=DEGREE_TO_SCALE_IDX[clean]??0
    const root=(keySemi+scale[idx])%12
    const q=(mode==='Major'?MAJOR_QUALITIES:MINOR_QUALITIES)[idx]
    const intervals=q==='Major'?[0,4,7]:q==='Minor'?[0,3,7]:[0,3,6]
    return intervals.map(i=>(root+i)%12)
  })

  const playChord=(chordNotes:number[])=>{
    if(!synthRef.current){const p=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:0.05,decay:0.4,sustain:0.6,release:1.5},volume:-8});p.connect(toneGainRef.current??Tone.getDestination());synthRef.current=p}
    Tone.start()
    synthRef.current.releaseAll()
    const notes=chordNotes.map(s=>`${NOTE_NAMES[s]}4`)
    synthRef.current.triggerAttackRelease(notes,'2n',Tone.now())
  }

  const stopSeq=useCallback(()=>{
    seqRef.current?.stop();seqRef.current?.dispose();seqRef.current=null
    Tone.getTransport().stop();Tone.getTransport().cancel()
    synthRef.current?.releaseAll();setIsPlaying(false);setPlayingIdx(-1)
  },[])

  const startSeq=useCallback(()=>{
    if(!synthRef.current){const p=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:0.05,decay:0.4,sustain:0.6,release:1.5},volume:-8});p.connect(toneGainRef.current??Tone.getDestination());synthRef.current=p}
    seqRef.current?.dispose()
    Tone.getTransport().bpm.value=80
    let ci=0
    seqRef.current=new Tone.Sequence((time)=>{
      const i=ci%chordSemis.length; setPlayingIdx(i)
      synthRef.current?.releaseAll()
      synthRef.current?.triggerAttack(chordSemis[i].map(s=>`${NOTE_NAMES[s]}4`),time)
      ci++
    },Array.from({length:chordSemis.length},(_,i)=>i),'2n')
    Tone.getTransport().start();seqRef.current.start(0);setIsPlaying(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[chordSemis,toneGainRef])

  useEffect(()=>()=>{stopSeq();synthRef.current?.dispose()},[stopSeq])

  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select value={keyRoot} onChange={e=>setKeyRoot(e.target.value)}
          className="bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-xs px-2 py-1.5 focus:outline-none focus:border-t-accent/40">
          {NOTE_NAMES.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={()=>setMode(m=>m==='Major'?'Minor':'Major')}
          className={`px-3 py-1.5 border font-body text-[9px] tracking-[0.2em] uppercase transition-all ${mode==='Major'?'border-t-accent/50 text-t-accent':'border-violet-500/40 text-violet-400'}`}>
          {mode}
        </button>
        <select value={progKey} onChange={e=>setProgKey(e.target.value)}
          className="bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-xs px-2 py-1.5 flex-1 min-w-0 focus:outline-none focus:border-t-accent/40">
          {Object.keys(CHART_PROGRESSIONS).map(k=><option key={k} value={k}>{k}</option>)}
        </select>
        <button onClick={isPlaying?stopSeq:startSeq}
          className={`px-4 py-1.5 border font-body text-[9px] tracking-[0.25em] uppercase transition-all ${isPlaying?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/20 text-noir-silver/40 hover:border-t-accent/30'}`}>
          {isPlaying?'■ Stop':'▶ Play'}
        </button>
        <button onClick={()=>setShowVoiceLeading(v=>!v)}
          className={`px-3 py-1.5 border font-body text-[8px] tracking-[0.15em] uppercase transition-all ${showVoiceLeading?'border-t-accent/50 text-t-accent':'border-noir-silver/12 text-noir-silver/30 hover:border-t-accent/25'}`}>
          Voice Lead
        </button>
      </div>

      {/* Chord chart */}
      <div className="flex flex-wrap gap-2">
        {degrees.map((deg,i)=>{
          const isActive=playingIdx===i&&isPlaying
          const vlScore=showVoiceLeading&&i>0?voiceLeadScore(chordSemis[i-1],chordSemis[i]):-1
          return(
            <div key={i} className="relative">
              {showVoiceLeading&&i>0&&(
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 font-body text-[7px] text-noir-silver/35 z-10">
                  <span style={{color:vlScore<=3?'rgb(var(--t-accent-rgb))':vlScore<=6?'rgba(184,197,208,0.5)':'rgba(184,113,113,0.6)'}}>
                    {vlScore}st
                  </span>
                </div>
              )}
              <button
                onClick={()=>playChord(chordSemis[i])}
                className={`border px-5 py-4 text-center min-w-[80px] transition-all hover:scale-105 ${isActive?'border-t-accent/70 bg-t-accent/12 scale-105':'border-noir-silver/12 hover:border-t-accent/35'}`}>
                <div className="font-body text-[8px] tracking-[0.2em] uppercase mb-1"
                  style={{color:isActive?'rgb(var(--t-accent-rgb))':'rgba(184,197,208,0.35)'}}>
                  {deg}
                </div>
                <div className="font-heading italic text-xl"
                  style={{color:isActive?'rgb(var(--t-accent-rgb))':'rgba(242,237,227,0.75)'}}>
                  {chordNames[i]}
                </div>
                <div className="font-body text-[7px] text-noir-silver/25 mt-1">
                  {chordSemis[i].map(s=>NOTE_NAMES[s]).join('-')}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {showVoiceLeading&&(
        <p className="font-body text-[8px] text-noir-silver/25">
          Numbers show semitone movement between chords — lower = smoother voice leading
          <span className="ml-2" style={{color:'rgb(var(--t-accent-rgb))'}}>≤3 smooth</span>
          <span className="ml-2 text-noir-silver/40">4–6 ok</span>
          <span className="ml-2" style={{color:'rgba(184,113,113,0.7)'}}>7+ wide</span>
        </p>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TheoryTools(){
  const[tool,setTool]=useState<Tool>('tuner')
  const TOOLS:[Tool,string][]=[
    ['tuner','Tuner'],['chords','Chords'],['scale','Scale Finder'],
    ['circle','Circle of 5ths'],['dictionary','Chord Dict'],['noise','Noise Gen'],['bpm','BPM Calc'],
    ['rnanalyser','RN Analyser'],['chordchart','Chord Chart'],
  ]
  return(
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 border-b border-noir-silver/10 pb-3">
        {TOOLS.map(([id,label])=>(
          <button key={id} onClick={()=>setTool(id)}
            className={`px-3 py-1.5 border font-body text-[8px] tracking-[0.2em] uppercase transition-all ${tool===id?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/12 text-noir-silver/35 hover:border-t-accent/25'}`}>
            {label}
          </button>
        ))}
      </div>
      {tool==='tuner'&&<Tuner/>}
      {tool==='chords'&&<ChordBuilder/>}
      {tool==='scale'&&<ScaleFinder/>}
      {tool==='circle'&&<CircleOfFifths/>}
      {tool==='dictionary'&&<ChordDictionary/>}
      {tool==='noise'&&<NoiseGen/>}
      {tool==='bpm'&&<BPMCalc/>}
      {tool==='rnanalyser'&&<RNAnalyser/>}
      {tool==='chordchart'&&<ChordChart/>}
    </div>
  )
}
