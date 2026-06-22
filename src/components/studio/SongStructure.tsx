'use client'

import { useState, useRef, useCallback } from 'react'
import { useStudio } from './StudioContext'

interface Block{id:string;type:string;color:string;label:string}

const BLOCK_TYPES=[
  {type:'Intro',color:'#6B9EBE'},{type:'Verse',color:'#C4953A'},{type:'Pre-Chorus',color:'#B09B3A'},
  {type:'Chorus',color:'#B0586C'},{type:'Post-Chorus',color:'#C48534'},{type:'Bridge',color:'#9480C4'},
  {type:'Outro',color:'#52946F'},{type:'Solo',color:'#6380C4'},{type:'Break',color:'#808080'},
  {type:'Interlude',color:'#5080A0'},{type:'Drop',color:'#C04060'},{type:'Build',color:'#60A080'},
]

function mkId(){return Math.random().toString(36).slice(2)}

export default function SongStructure(){
  const{isPlaying,currentStep,patternBank,savePatternToBank,loadPatternFromBank}=useStudio()
  const[arrangement,setArrangement]=useState<Block[]>([])
  const[customName,setCustomName]=useState('')
  const[activeIdx,setActiveIdx]=useState(-1)
  const[dragId,setDragId]=useState<string|null>(null)
  const[dragOverId,setDragOverId]=useState<string|null>(null)
  const[barsPerBlock,setBarsPerBlock]=useState(8) // how many bars per arrangement block
  const[autoAdvance,setAutoAdvance]=useState(false)
  const stepCountRef=useRef(0)

  // Auto-advance when sequencer plays
  const stepsPerBar=16; const stepsPerBlock=barsPerBlock*stepsPerBar

  // Track step changes for auto-advance
  const lastStepRef=useRef(-1)
  if(autoAdvance&&isPlaying&&arrangement.length>0){
    if(currentStep!==lastStepRef.current&&currentStep>=0){
      lastStepRef.current=currentStep
      stepCountRef.current++
      if(stepCountRef.current%stepsPerBlock===0){
        setActiveIdx(prev=>(prev+1)%arrangement.length)
      }
    }
  }

  const addBlock=(type:string,color:string,label?:string)=>{
    setArrangement(prev=>[...prev,{id:mkId(),type,color,label:label??type}])
  }

  const removeBlock=(id:string)=>setArrangement(prev=>prev.filter(b=>b.id!==id))

  const onDragStart=(id:string)=>setDragId(id)
  const onDragOver=(e:React.DragEvent,id:string)=>{e.preventDefault();setDragOverId(id)}
  const onDrop=(e:React.DragEvent,targetId:string)=>{
    e.preventDefault()
    if(!dragId||dragId===targetId) return
    setArrangement(prev=>{
      const arr=[...prev]
      const fromIdx=arr.findIndex(b=>b.id===dragId)
      const toIdx=arr.findIndex(b=>b.id===targetId)
      if(fromIdx<0||toIdx<0) return arr
      const[moved]=arr.splice(fromIdx,1); arr.splice(toIdx,0,moved)
      return arr
    })
    setDragId(null); setDragOverId(null)
  }

  const clearArrangement=()=>{setArrangement([]);setActiveIdx(-1);stepCountRef.current=0}

  // Bank save/load labels
  const BANK_LABELS=['A','B','C','D']

  return(
    <div className="space-y-5">
      {/* Block palette */}
      <div className="space-y-3">
        <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Block Palette</p>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map(b=>(
            <button key={b.type} onClick={()=>addBlock(b.type,b.color)}
              className="px-3 py-1.5 border font-body text-[9px] tracking-[0.15em] uppercase hover:scale-105 transition-all"
              style={{borderColor:`${b.color}50`,color:`${b.color}cc`,background:`${b.color}10`}}>
              + {b.type}
            </button>
          ))}
          <div className="flex gap-1.5 items-center">
            <input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="Custom name…"
              className="w-28 bg-noir-void border border-noir-silver/12 text-noir-ivory/70 font-body text-xs px-2 py-1 focus:outline-none focus:border-t-accent/35 placeholder:text-noir-silver/18"/>
            <button onClick={()=>{if(customName.trim()){addBlock(customName.trim(),'#808080',customName.trim());setCustomName('')}}}
              disabled={!customName.trim()}
              className="px-2.5 py-1 border border-noir-silver/15 text-noir-silver/40 font-body text-[8px] uppercase hover:border-t-accent/30 hover:text-t-accent/60 disabled:opacity-20 transition-all">
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Pattern bank */}
      <div className="border-t border-noir-silver/8 pt-4 space-y-3">
        <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Pattern Bank (save Sequencer patterns here)</p>
        <div className="flex gap-2 flex-wrap">
          {BANK_LABELS.map((label,i)=>(
            <div key={i} className={`border p-3 flex flex-col items-center gap-1.5 min-w-[72px] ${patternBank[i]?'border-t-accent/25':'border-noir-silver/10'}`}>
              <span className="font-heading italic text-xl" style={{color:patternBank[i]?'rgb(var(--t-accent-rgb))':'rgba(184,197,208,0.2)'}}>{label}</span>
              <span className="font-body text-[7px] text-noir-silver/25">{patternBank[i]?'saved':'empty'}</span>
            </div>
          ))}
          <p className="font-body text-[8px] text-noir-silver/20 self-center">← Save/Load from Sequencer tab Bank section</p>
        </div>
      </div>

      {/* Arrangement timeline */}
      <div className="border-t border-noir-silver/8 pt-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Arrangement</p>
          <div className="flex items-center gap-1.5">
            <span className="font-body text-[8px] text-noir-silver/30">Bars/block</span>
            {[2,4,8,16].map(n=>(
              <button key={n} onClick={()=>setBarsPerBlock(n)}
                className={`w-7 h-6 border font-body text-[8px] transition-all ${barsPerBlock===n?'border-t-accent/50 text-t-accent':'border-noir-silver/12 text-noir-silver/25 hover:border-t-accent/20'}`}>
                {n}
              </button>
            ))}
          </div>
          <button onClick={()=>{setAutoAdvance(v=>!v);setActiveIdx(-1);stepCountRef.current=0}}
            className={`px-2.5 py-1 border font-body text-[8px] tracking-[0.15em] uppercase transition-all ${autoAdvance?'border-t-accent/50 text-t-accent bg-t-accent/8':'border-noir-silver/12 text-noir-silver/30 hover:border-t-accent/25'}`}>
            {autoAdvance?'◉ Auto-Advance':'○ Auto-Advance'}
          </button>
          {arrangement.length>0&&(
            <button onClick={clearArrangement}
              className="px-2.5 py-1 border border-noir-silver/10 text-noir-silver/25 font-body text-[8px] uppercase hover:border-red-400/30 hover:text-red-400/50 transition-all ml-auto">
              ✕ Clear All
            </button>
          )}
        </div>

        {arrangement.length===0?(
          <div className="border border-dashed border-noir-silver/12 p-8 text-center">
            <p className="font-body text-[9px] text-noir-silver/20 tracking-[0.2em]">Click blocks above to build your arrangement</p>
          </div>
        ):(
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-1.5 min-w-max">
              {arrangement.map((block,i)=>(
                <div key={block.id}
                  draggable
                  onDragStart={()=>onDragStart(block.id)}
                  onDragOver={e=>onDragOver(e,block.id)}
                  onDrop={e=>onDrop(e,block.id)}
                  onDragEnd={()=>{setDragId(null);setDragOverId(null)}}
                  className={`relative flex-shrink-0 border p-3 cursor-grab active:cursor-grabbing transition-all ${activeIdx===i?'scale-105':''}${dragOverId===block.id?' -translate-y-1':''}`}
                  style={{
                    borderColor:activeIdx===i?block.color:`${block.color}40`,
                    background:activeIdx===i?`${block.color}25`:`${block.color}10`,
                    minWidth:80,
                  }}>
                  <div className="font-body text-[8px] tracking-[0.15em] uppercase mb-1"
                    style={{color:activeIdx===i?block.color:`${block.color}99`}}>
                    {i+1}
                  </div>
                  <div className="font-body text-[10px]"
                    style={{color:activeIdx===i?'rgba(242,237,227,0.9)':'rgba(242,237,227,0.55)'}}>
                    {block.label}
                  </div>
                  <div className="font-body text-[7px] text-noir-silver/25 mt-1">{barsPerBlock} bars</div>
                  <button onClick={()=>removeBlock(block.id)}
                    className="absolute top-1 right-1 w-4 h-4 text-[8px] text-noir-silver/20 hover:text-red-400/60 transition-colors">✕</button>
                  {activeIdx===i&&isPlaying&&(
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 animate-pulse"
                      style={{background:block.color}}/>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {arrangement.length>0&&(
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-body text-[8px] text-noir-silver/25">
              {arrangement.length} blocks · ~{(arrangement.length*barsPerBlock*4)} bars total
            </span>
            {activeIdx>=0&&<span className="font-body text-[8px] text-t-accent/60">Now: {arrangement[activeIdx]?.label}</span>}
          </div>
        )}
      </div>

      <p className="font-body text-[8px] text-noir-silver/18">Drag to reorder · Auto-Advance switches blocks in sync with the sequencer</p>
    </div>
  )
}
