'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useStudio } from './StudioContext'
import * as Tone from 'tone'

const OCTAVES=2
const BASE_OCT=4
const NOTE_NAMES=['B','A#','A','G#','G','F#','F','E','D#','D','C#','C']
const NOTE_SEMITONES_MAP: Record<string,number> = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11}
const SCALES_DICT: Record<string,number[]> = {
  'Off':[],'Major':[0,2,4,5,7,9,11],'Natural Minor':[0,2,3,5,7,8,10],
  'Pentatonic Maj':[0,2,4,7,9],'Pentatonic Min':[0,3,5,7,10],
  'Blues':[0,3,5,6,7,10],'Dorian':[0,2,3,5,7,9,10],'Mixolydian':[0,2,4,5,7,9,10],
  'Harmonic Minor':[0,2,3,5,7,8,11],'Chromatic':[0,1,2,3,4,5,6,7,8,9,10,11],
}
const TOTAL_ROWS=OCTAVES*12

interface Cell { on: boolean; vel: number }
type Grid=Cell[][]

function emptyGrid(steps: number): Grid {
  return Array.from({length:TOTAL_ROWS},()=>Array.from({length:steps},()=>({on:false,vel:0.7})))
}

function rowToNote(row:number):string{
  const noteIdx=row%12; const oct=BASE_OCT+OCTAVES-1-Math.floor(row/12)
  return`${NOTE_NAMES[noteIdx]}${oct}`
}
function isBlackNote(row:number){return[1,3,5,8,10].includes(row%12)}

// Returns the note class (0=C..11=B) for a given row
function rowNoteClass(row: number): number {
  // Row 0 = B = 11, row 1 = A# = 10, ..., row 11 = C = 0, row 12 = B again
  return ((11 - (row % 12)) + 12) % 12
}

function rowToMIDI(row:number){return 83-row}
function varLen(val:number):number[]{
  const b:number[]=[]; b.unshift(val&0x7F); val>>=7
  while(val>0){b.unshift((val&0x7F)|0x80);val>>=7}; return b
}

function buildMIDI(grid:Grid,bpm:number,noteLenFactor:number):Blob{
  const TPB=480; const STEP=Math.round(TPB/4); const NOTEDUR=Math.round(STEP*noteLenFactor*4)
  type Ev={tick:number;type:'on'|'off';note:number;vel:number}
  const evs:Ev[]=[]
  grid.forEach((row,ri)=>{
    row.forEach((cell,si)=>{
      if(!cell.on) return
      const n=rowToMIDI(ri); const v=Math.round(cell.vel*127)
      evs.push({tick:si*STEP,type:'on',note:n,vel:v})
      evs.push({tick:si*STEP+NOTEDUR,type:'off',note:n,vel:0})
    })
  })
  evs.sort((a,b)=>a.tick-b.tick||(a.type==='off'?-1:1))
  const track:number[]=[]; let cur=0
  const µs=Math.round(60000000/bpm)
  track.push(0,0xFF,0x51,0x03,(µs>>16)&0xFF,(µs>>8)&0xFF,µs&0xFF)
  evs.forEach(ev=>{
    const dt=ev.tick-cur; cur=ev.tick
    track.push(...varLen(dt))
    track.push(ev.type==='on'?0x90:0x80,ev.note,ev.vel)
  })
  track.push(0,0xFF,0x2F,0x00)
  const td=new Uint8Array(track)
  const chunk=new Uint8Array(8+td.length); const cv=new DataView(chunk.buffer)
  ;[0x4D,0x54,0x72,0x6B].forEach((b,i)=>{chunk[i]=b})
  cv.setUint32(4,td.length,false); chunk.set(td,8)
  const hdr=new Uint8Array(14); const hv=new DataView(hdr.buffer)
  ;[0x4D,0x54,0x68,0x64].forEach((b,i)=>{hdr[i]=b})
  hv.setUint32(4,6,false);hv.setUint16(8,0,false);hv.setUint16(10,1,false);hv.setUint16(12,TPB,false)
  const out=new Uint8Array(hdr.length+chunk.length); out.set(hdr,0); out.set(chunk,hdr.length)
  return new Blob([out],{type:'audio/midi'})
}

const INST_PRESETS={
  Piano:{oscillator:{type:'triangle' as const},envelope:{attack:0.005,decay:0.4,sustain:0.25,release:1.2}},
  Synth:{oscillator:{type:'sawtooth' as const},envelope:{attack:0.01,decay:0.1,sustain:0.7,release:0.4}},
  Bells:{oscillator:{type:'sine' as const},envelope:{attack:0.001,decay:0.8,sustain:0,release:1.5}},
}

const NOTE_LEN_OPTIONS = [
  {label:'Whole',value:'1n'},{label:'Half',value:'2n'},{label:'Quarter',value:'4n'},
  {label:'8th',value:'8n'},{label:'16th',value:'16n'},
] as const
type NoteLen = typeof NOTE_LEN_OPTIONS[number]['value']

export default function PianoRoll(){
  const{bpm,toneGainRef,globalScale,globalScaleRoot}=useStudio()

  const[clipBars,setClipBars]=useState(1)
  const gridSteps=clipBars*16

  const[grid,setGrid]=useState<Grid>(()=>emptyGrid(16))
  const[isPlaying,setIsPlaying]=useState(false)
  const[curStep,setCurStep]=useState(-1)
  const[instrument,setInstrument]=useState<keyof typeof INST_PRESETS>('Piano')
  const[noteLen,setNoteLen]=useState<NoteLen>('8n')
  const[zoom,setZoom]=useState(1)
  const[history,setHistory]=useState<Grid[]>([])
  const[future,setFuture]=useState<Grid[]>([])
  const[snapSteps,setSnapSteps]=useState(1) // minimum note length in steps
  const[paintMode,setPaintMode]=useState(false) // always-fill drag mode

  // Velocity lane drag
  const velLaneDragRef=useRef<{step:number;laneEl:Element|null}|null>(null)
  const velLaneRefs=useRef<(HTMLDivElement|null)[]>([])

  const synthRef=useRef<Tone.PolySynth|null>(null)
  const seqRef=useRef<Tone.Sequence|null>(null)
  const gridRef=useRef(grid)
  const bpmRef=useRef(bpm)
  const gridStepsRef=useRef(gridSteps)
  const isDrawing=useRef(false)
  const drawMode=useRef(true)
  const isDraggingVel=useRef<{row:number;step:number;startY:number;startVel:number}|null>(null)

  useEffect(()=>{gridRef.current=grid},[grid])
  useEffect(()=>{bpmRef.current=bpm},[bpm])
  useEffect(()=>{gridStepsRef.current=gridSteps},[gridSteps])

  // Resize grid when clipBars changes
  useEffect(()=>{
    setGrid(prev=>{
      const steps=clipBars*16
      if(prev[0].length===steps) return prev
      return prev.map(row=>{
        if(steps>row.length) return[...row,...Array.from({length:steps-row.length},()=>({on:false,vel:0.7}))]
        return row.slice(0,steps)
      })
    })
  },[clipBars])

  useEffect(()=>{
    synthRef.current?.dispose()
    const p=new Tone.PolySynth(Tone.Synth,{...INST_PRESETS[instrument],volume:-8})
    p.connect(toneGainRef.current??Tone.getDestination())
    synthRef.current=p
    return()=>{p.dispose()}
  },[instrument,toneGainRef])

  const pushHistory=useCallback((g:Grid)=>{setHistory(h=>[...h.slice(-19),g.map(r=>[...r])]);setFuture([])},[])
  const undo=useCallback(()=>{setHistory(h=>{if(!h.length) return h;const prev=h[h.length-1];setFuture(f=>[...f,gridRef.current.map(r=>[...r])]);setGrid(prev);return h.slice(0,-1)});},[])
  const redo=useCallback(()=>{setFuture(f=>{if(!f.length) return f;const next=f[f.length-1];setHistory(h=>[...h,gridRef.current.map(r=>[...r])]);setGrid(next);return f.slice(0,-1)});},[])

  const stopPlayback=useCallback(()=>{
    seqRef.current?.stop();seqRef.current?.dispose();seqRef.current=null
    Tone.getTransport().stop();Tone.getTransport().cancel();setCurStep(-1);setIsPlaying(false)
  },[])

  const startPlayback=useCallback(()=>{
    seqRef.current?.dispose()
    Tone.getTransport().stop();Tone.getTransport().cancel()
    Tone.getTransport().bpm.value=bpmRef.current
    const gs=gridStepsRef.current
    let step=0
    seqRef.current=new Tone.Sequence((time)=>{
      const s=step++%gs; setCurStep(s)
      const col=gridRef.current.map(row=>row[s])
      const noteVels=col.map((c,ri)=>c.on?{note:rowToNote(ri),vel:c.vel}:null).filter(Boolean) as {note:string;vel:number}[]
      if(noteVels.length&&synthRef.current){
        const notes=noteVels.map(x=>x.note)
        const vel=noteVels.reduce((a,b)=>a+b.vel,0)/noteVels.length
        synthRef.current.triggerAttackRelease(notes,noteLen,time,vel)
      }
    },Array.from({length:gs},(_,i)=>i),'16n')
    Tone.getTransport().start(); seqRef.current.start(0); setIsPlaying(true)
  },[noteLen])

  useEffect(()=>{if(isPlaying)Tone.getTransport().bpm.value=bpm},[bpm,isPlaying])
  useEffect(()=>{return()=>stopPlayback()},[stopPlayback])

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key==='z'){e.preventDefault();undo()}
      if((e.metaKey||e.ctrlKey)&&e.key==='y'){e.preventDefault();redo()}
    }
    window.addEventListener('keydown',onKey); return()=>window.removeEventListener('keydown',onKey)
  },[undo,redo])

  // Scale checking for row highlight
  const isInScale=useCallback((row:number)=>{
    if(globalScale==='Off') return false
    const intervals=SCALES_DICT[globalScale]; if(!intervals?.length) return false
    const rootSemi=NOTE_SEMITONES_MAP[globalScaleRoot]??0
    const noteClass=rowNoteClass(row)
    return intervals.includes(((noteClass-rootSemi)+12)%12)
  },[globalScale,globalScaleRoot])

  const setCells=(row:number,step:number,on:boolean)=>{
    setGrid(prev=>{
      const next=prev.map(r=>r.map(c=>({...c})))
      for(let i=0;i<snapSteps;i++){
        const s=step+i
        if(s<gridStepsRef.current) next[row][s]={on,vel:next[row][s].vel}
      }
      return next
    })
  }

  const onCellDown=(row:number,step:number,e:React.MouseEvent)=>{
    if(e.button===2){e.preventDefault();return}
    if(e.altKey){
      isDraggingVel.current={row,step,startY:e.clientY,startVel:grid[row][step].vel};return
    }
    pushHistory(grid)
    if(paintMode){
      drawMode.current=true
    } else {
      drawMode.current=!grid[row][step].on
    }
    isDrawing.current=true
    setCells(row,step,drawMode.current)
  }
  const onCellEnter=(row:number,step:number)=>{
    if(isDrawing.current) setCells(row,step,drawMode.current)
  }

  // Velocity drag (per-note, Alt+drag)
  const onVelMove=useCallback((e:MouseEvent)=>{
    const d=isDraggingVel.current; if(!d) return
    const dy=d.startY-e.clientY
    setGrid(prev=>{
      const next=prev.map(r=>r.map(c=>({...c})))
      next[d.row][d.step].vel=Math.max(0.05,Math.min(1,d.startVel+dy*0.008))
      return next
    })
  },[])

  // Velocity lane: drag to set all notes in a step column
  const applyVelLane=useCallback((step:number,clientY:number)=>{
    const el=velLaneRefs.current[step]; if(!el) return
    const rect=el.getBoundingClientRect()
    const pct=Math.max(0.05,Math.min(1,1-(clientY-rect.top)/rect.height))
    setGrid(prev=>{
      const next=prev.map(r=>r.map(c=>({...c})))
      next.forEach((_,ri)=>{ if(next[ri][step].on) next[ri][step].vel=pct })
      return next
    })
  },[])

  const onVelLaneDown=useCallback((step:number,e:React.MouseEvent)=>{
    e.preventDefault()
    const el=velLaneRefs.current[step]
    velLaneDragRef.current={step,laneEl:el}
    applyVelLane(step,e.clientY)
  },[applyVelLane])

  useEffect(()=>{
    const onMove=(e:MouseEvent)=>{
      onVelMove(e)
      if(velLaneDragRef.current) applyVelLane(velLaneDragRef.current.step,e.clientY)
    }
    const onUp=()=>{
      isDrawing.current=false
      isDraggingVel.current=null
      velLaneDragRef.current=null
    }
    window.addEventListener('mousemove',onMove)
    window.addEventListener('mouseup',onUp)
    return()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)}
  },[onVelMove,applyVelLane])

  const quantize=()=>{
    pushHistory(grid)
    setGrid(prev=>prev.map(r=>r.map(c=>c.on?{...c,vel:0.7}:c)))
  }

  const fillRandom=()=>{
    const gs=gridSteps
    pushHistory(grid)
    const g=emptyGrid(gs)
    for(let s=0;s<gs;s++){const count=Math.floor(Math.random()*3)+1;for(let i=0;i<count;i++){const r=Math.floor(Math.random()*TOTAL_ROWS);g[r][s]={on:true,vel:0.5+Math.random()*0.5}}}
    setGrid(g)
  }

  const clearGrid=()=>{pushHistory(grid);stopPlayback();setGrid(emptyGrid(gridSteps))}

  const exportMIDI=()=>{
    const lenFactor:Record<NoteLen,number>={'1n':4,'2n':2,'4n':1,'8n':0.5,'16n':0.25}
    const b=buildMIDI(grid,bpm,lenFactor[noteLen])
    const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`noiraciel-roll-${Date.now()}.mid`;a.click();URL.revokeObjectURL(u)
  }

  const CELL_W=Math.round(36*zoom); const CELL_H=20
  const VEL_LANE_H=48

  // Max velocity per step (for velocity lane bar heights)
  const stepMaxVel=Array.from({length:gridSteps},(_,s)=>{
    let max=0; let hasNote=false
    grid.forEach(row=>{ if(row[s]?.on){ hasNote=true; max=Math.max(max,row[s].vel) } })
    return hasNote?max:0
  })

  return(
    <div className="space-y-4" onMouseLeave={()=>{isDrawing.current=false}}>
      {/* Controls row 1: transport + instrument + clip */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-noir-silver/8">
        <button onClick={isPlaying?stopPlayback:startPlayback}
          className={`w-9 h-9 flex items-center justify-center border transition-all ${isPlaying?'border-t-accent/70 bg-t-accent/15 text-t-accent':'border-noir-silver/25 text-noir-silver/50 hover:border-t-accent/40 hover:text-t-accent'}`}>
          {isPlaying
            ?<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            :<svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
        </button>

        <div className="flex gap-1">
          {(Object.keys(INST_PRESETS) as (keyof typeof INST_PRESETS)[]).map(k=>(
            <button key={k} onClick={()=>setInstrument(k)}
              className={`px-2.5 py-1 border font-body text-[8px] tracking-[0.15em] uppercase transition-all ${instrument===k?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/12 text-noir-silver/35 hover:border-t-accent/25'}`}>
              {k}
            </button>
          ))}
        </div>

        {/* Note length */}
        <select value={noteLen} onChange={e=>setNoteLen(e.target.value as NoteLen)}
          className="bg-noir-void border border-noir-silver/15 text-noir-ivory/70 font-body text-xs px-2 py-1 focus:outline-none focus:border-t-accent/40">
          {NOTE_LEN_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Clip length */}
        <div className="flex items-center gap-1">
          <span className="font-body text-[8px] uppercase text-noir-silver/30 tracking-[0.2em]">Bars</span>
          {[1,2,4,8].map(b=>(
            <button key={b} onClick={()=>setClipBars(b)}
              className={`w-7 h-6 border font-body text-[8px] transition-all ${clipBars===b?'border-t-accent/50 text-t-accent':'border-noir-silver/12 text-noir-silver/25 hover:border-t-accent/20'}`}>
              {b}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="font-body text-[8px] uppercase text-noir-silver/30 tracking-[0.2em]">Zoom</span>
          {[0.5,1,2].map(z=>(
            <button key={z} onClick={()=>setZoom(z)}
              className={`w-7 h-6 border font-body text-[8px] transition-all ${zoom===z?'border-t-accent/50 text-t-accent':'border-noir-silver/12 text-noir-silver/25 hover:border-t-accent/20'}`}>
              {z}×
            </button>
          ))}
        </div>
      </div>

      {/* Controls row 2: snap + paint + undo + actions */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-noir-silver/8">
        {/* Snap */}
        <div className="flex items-center gap-1">
          <span className="font-body text-[8px] uppercase text-noir-silver/30 tracking-[0.2em]">Snap</span>
          {[{l:'Off',v:1},{l:'1/8',v:2},{l:'1/4',v:4},{l:'1/2',v:8}].map(({l,v})=>(
            <button key={l} onClick={()=>setSnapSteps(v)}
              className={`px-2 h-6 border font-body text-[8px] transition-all ${snapSteps===v?'border-t-accent/50 text-t-accent':'border-noir-silver/12 text-noir-silver/25 hover:border-t-accent/20'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Paint mode */}
        <button onClick={()=>setPaintMode(v=>!v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 border font-body text-[8px] tracking-[0.15em] uppercase transition-all ${paintMode?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/12 text-noir-silver/35 hover:border-t-accent/25'}`}>
          {paintMode?'◉':'○'} Paint
        </button>

        {/* Scale indicator */}
        {globalScale!=='Off'&&(
          <span className="font-body text-[8px] text-t-accent/50 flex items-center gap-1">
            🔒 {globalScaleRoot} {globalScale}
          </span>
        )}

        <div className="flex gap-1 ml-auto">
          <button onClick={undo} disabled={!history.length} className="w-7 h-7 border border-noir-silver/12 text-noir-silver/30 font-body text-[10px] hover:border-t-accent/25 disabled:opacity-20 transition-all" title="Undo (Ctrl+Z)">↩</button>
          <button onClick={redo} disabled={!future.length} className="w-7 h-7 border border-noir-silver/12 text-noir-silver/30 font-body text-[10px] hover:border-t-accent/25 disabled:opacity-20 transition-all" title="Redo (Ctrl+Y)">↪</button>
          <button onClick={quantize} className="px-2 py-1 border border-noir-silver/12 text-noir-silver/30 font-body text-[8px] tracking-[0.1em] uppercase hover:border-t-accent/25 transition-all">Quantize</button>
          <button onClick={fillRandom} className="px-2 py-1 border border-noir-silver/12 text-noir-silver/30 font-body text-[8px] tracking-[0.1em] uppercase hover:border-t-accent/25 transition-all">⟳ Rnd</button>
          <button onClick={exportMIDI} className="px-2 py-1 border border-t-accent/25 text-t-accent/50 font-body text-[8px] tracking-[0.1em] uppercase hover:border-t-accent/50 hover:text-t-accent transition-all" title="Export MIDI">↓ MIDI</button>
          <button onClick={clearGrid} className="px-2 py-1 border border-noir-silver/10 text-noir-silver/25 font-body text-[8px] tracking-[0.1em] uppercase hover:border-red-400/30 hover:text-red-400/60 transition-all">✕ Clear</button>
        </div>
      </div>

      {/* Grid + Velocity Lane */}
      <div className="overflow-x-auto select-none" style={{maxHeight:580}}>
        <div style={{userSelect:'none'}}>
          {/* Labels + cells row */}
          <div className="flex">
            {/* Note labels */}
            <div className="flex-shrink-0 flex flex-col" style={{width:44}}>
              <div style={{height:20}}/>
              {Array.from({length:TOTAL_ROWS},(_,row)=>{
                const noteIdx=row%12; const oct=BASE_OCT+OCTAVES-1-Math.floor(row/12)
                const isBlack=isBlackNote(row); const isC=NOTE_NAMES[noteIdx]==='C'
                const inScale=isInScale(row)
                return(
                  <div key={row} className="flex items-center justify-end pr-1 flex-shrink-0"
                    style={{height:CELL_H,background:isBlack?'rgba(0,0,0,0.3)':'transparent'}}>
                    {inScale&&<div className="w-1 h-1 rounded-full mr-1 flex-shrink-0" style={{background:'rgb(var(--t-accent-rgb)/0.5)'}}/>}
                    <span className="font-body text-[7px] tabular-nums"
                      style={{color:isC?'rgb(var(--t-accent-rgb))':inScale?'rgba(var(--t-accent-rgb),0.6)':isBlack?'rgba(184,197,208,0.25)':'rgba(184,197,208,0.4)'}}>
                      {NOTE_NAMES[noteIdx]}{oct}
                    </span>
                  </div>
                )
              })}
              {/* Velocity lane label */}
              <div style={{height:VEL_LANE_H}} className="flex items-center justify-end pr-2 border-t border-noir-silver/8 mt-1">
                <span className="font-body text-[6px] tracking-[0.15em] uppercase text-noir-silver/25"
                  style={{writingMode:'vertical-rl',transform:'rotate(180deg)'}}>VEL</span>
              </div>
            </div>

            {/* Main grid column */}
            <div className="flex-shrink-0" style={{width:gridSteps*(CELL_W+1)}}>
              {/* Step numbers */}
              <div className="flex" style={{height:20}}>
                {Array.from({length:gridSteps},(_,s)=>(
                  <div key={s} className="flex items-center justify-center flex-shrink-0"
                    style={{width:CELL_W,marginRight:1}}>
                    <span className={`font-body text-[7px] tabular-nums ${curStep===s?'text-t-accent':'text-noir-silver/20'}`}>
                      {s%4===0?s+1:''}
                    </span>
                  </div>
                ))}
              </div>

              {/* Note cells */}
              {Array.from({length:TOTAL_ROWS},(_,row)=>{
                const isBlack=isBlackNote(row)
                const inScale=isInScale(row)
                return(
                  <div key={row} className="flex" style={{height:CELL_H,marginBottom:1}}>
                    {Array.from({length:gridSteps},(_,s)=>{
                      const cell=grid[row]?.[s]??{on:false,vel:0.7}; const isCur=curStep===s
                      return(
                        <div key={s}
                          onMouseDown={e=>onCellDown(row,s,e)}
                          onMouseEnter={()=>onCellEnter(row,s)}
                          className="flex-shrink-0 cursor-pointer transition-all duration-75"
                          style={{
                            width:CELL_W,height:CELL_H-1,marginRight:1,
                            background:cell.on
                              ?(isCur?'rgb(var(--t-accent-rgb))':(`rgba(var(--t-accent-rgb),${0.3+cell.vel*0.6})`))
                              :isCur?'rgba(184,197,208,0.12)'
                              :inScale?'rgba(var(--t-accent-rgb),0.05)'
                              :isBlack?'rgba(0,0,0,0.25)':'rgba(184,197,208,0.03)',
                            border:cell.on?'1px solid rgb(var(--t-accent-rgb)/0.9)':`1px solid ${s%4===0?'rgba(184,197,208,0.1)':'rgba(184,197,208,0.04)'}`,
                            boxShadow:cell.on&&isCur?'0 0 6px rgb(var(--t-accent-rgb)/0.6)':'none',
                          }}/>
                      )
                    })}
                  </div>
                )
              })}

              {/* Velocity Lane */}
              <div className="flex border-t border-noir-silver/8 mt-1" style={{height:VEL_LANE_H}}>
                {Array.from({length:gridSteps},(_,s)=>{
                  const vel=stepMaxVel[s]
                  const isCur=curStep===s
                  return(
                    <div
                      key={s}
                      ref={el=>{velLaneRefs.current[s]=el}}
                      className="flex-shrink-0 flex items-end cursor-ns-resize"
                      style={{width:CELL_W,marginRight:1,height:VEL_LANE_H}}
                      onMouseDown={e=>onVelLaneDown(s,e)}>
                      <div style={{
                        width:'100%',
                        height:vel>0?`${vel*100}%`:'2px',
                        background:vel>0
                          ?isCur?'rgb(var(--t-accent-rgb))':(`rgba(var(--t-accent-rgb),${0.35+vel*0.5})`)
                          :'rgba(184,197,208,0.06)',
                        transition:'height 0.06s',
                        borderTop:vel>0?'1px solid rgb(var(--t-accent-rgb)/0.6)':'none',
                      }}/>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="font-body text-[8px] text-noir-silver/18">
        Click = draw · Alt+drag note = velocity · Drag vel lane = step velocity · Paint mode = always fill · Ctrl+Z/Y = undo/redo
      </p>
    </div>
  )
}
