'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useStudio } from './StudioContext'

interface LoopTrack {
  id: number; blob: Blob|null; url: string|null; audioEl: HTMLAudioElement|null
  duration: number; isPlaying: boolean; volume: number; speed: number
  label: string; fadeIn: number; fadeOut: number
  trimStart: number; trimEnd: number // 0..1 fraction
}

const MAX_TRACKS=4

function mkTrack(id:number):LoopTrack{
  return{id,blob:null,url:null,audioEl:null,duration:0,isPlaying:false,volume:0.8,speed:1,
    label:`Loop ${id+1}`,fadeIn:0,fadeOut:0,trimStart:0,trimEnd:1}
}

function audioBufferToWAV(buffer:AudioBuffer):Blob{
  const numCh=buffer.numberOfChannels,numSamples=buffer.length,sr=buffer.sampleRate,bps=2
  const dataSize=numSamples*numCh*bps; const wav=new ArrayBuffer(44+dataSize); const v=new DataView(wav)
  const ws=(o:number,s:string)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))}
  ws(0,'RIFF');v.setUint32(4,36+dataSize,true);ws(8,'WAVE');ws(12,'fmt ')
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,numCh,true)
  v.setUint32(24,sr,true);v.setUint32(28,sr*numCh*bps,true);v.setUint16(32,numCh*bps,true);v.setUint16(34,16,true)
  ws(36,'data');v.setUint32(40,dataSize,true)
  let off=44
  for(let i=0;i<numSamples;i++) for(let ch=0;ch<numCh;ch++){
    const s=Math.max(-1,Math.min(1,buffer.getChannelData(ch)[i]))
    v.setInt16(off,s<0?s*0x8000:s*0x7FFF,true);off+=2
  }
  return new Blob([wav],{type:'audio/wav'})
}

export default function Looper(){
  const{audioCtxRef,masterGainRef}=useStudio()
  const[tracks,setTracks]=useState<LoopTrack[]>(Array.from({length:MAX_TRACKS},(_,i)=>mkTrack(i)))
  const[recording,setRecording]=useState(false)
  const[recTarget,setRecTarget]=useState<number|null>(null)
  const[recSeconds,setRecSeconds]=useState(0)
  const[inputSource,setInputSource]=useState<'mic'|'system'>('mic')
  const[expandedTrack,setExpandedTrack]=useState<number|null>(null)
  const[exporting,setExporting]=useState(false)

  const mediaRecRef=useRef<MediaRecorder|null>(null)
  const chunksRef=useRef<Blob[]>([])
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null)
  const streamRef=useRef<MediaStream|null>(null)

  useEffect(()=>()=>{
    if(timerRef.current) clearInterval(timerRef.current)
    mediaRecRef.current?.stop()
    streamRef.current?.getTracks().forEach(t=>t.stop())
    tracks.forEach(t=>{t.audioEl?.pause();if(t.url)URL.revokeObjectURL(t.url)})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const startRecording=useCallback(async(slot:number)=>{
    if(recording) return
    try{
      const stream=inputSource==='mic'
        ?await navigator.mediaDevices.getUserMedia({audio:true})
        :await navigator.mediaDevices.getDisplayMedia({audio:true,video:false} as DisplayMediaStreamOptions)
      streamRef.current=stream; chunksRef.current=[]
      const mr=new MediaRecorder(stream)
      mr.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data)}
      mr.onstop=()=>{
        const blob=new Blob(chunksRef.current,{type:'audio/webm'})
        const url=URL.createObjectURL(blob)
        const audio=new Audio(url); audio.loop=true
        setTracks(prev=>prev.map((t,i)=>i===slot?{...t,blob,url,audioEl:audio,duration:0}:t))
        audio.onloadedmetadata=()=>setTracks(prev=>prev.map((t,i)=>i===slot?{...t,duration:audio.duration,trimEnd:1}:t))
        streamRef.current?.getTracks().forEach(t=>t.stop())
        if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}
        setRecording(false);setRecTarget(null);setRecSeconds(0)
      }
      mr.start(); mediaRecRef.current=mr; setRecording(true); setRecTarget(slot); setRecSeconds(0)
      timerRef.current=setInterval(()=>setRecSeconds(s=>s+1),1000)
    }catch(e){console.warn('Looper rec error',e)}
  },[recording,inputSource])

  const stopRecording=useCallback(()=>{
    mediaRecRef.current?.stop()
    if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}
  },[])

  const overdub=useCallback(async(slot:number)=>{
    const track=tracks[slot]; if(!track.blob||recording) return
    // Start recording into a new chunk alongside existing
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true})
      const chunks:Blob[]=[]; const mr=new MediaRecorder(stream)
      mr.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data)}
      mr.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop())
        // Mix new recording with existing
        const newBlob=new Blob(chunks,{type:'audio/webm'})
        const ctx=new AudioContext()
        const[existArr,newArr]=await Promise.all([track.blob!.arrayBuffer(),newBlob.arrayBuffer()])
        const[existBuf,newBuf]=await Promise.all([ctx.decodeAudioData(existArr),ctx.decodeAudioData(newArr)])
        const maxLen=Math.max(existBuf.length,newBuf.length)
        const mixed=ctx.createBuffer(2,maxLen,ctx.sampleRate)
        for(let ch=0;ch<2;ch++){
          const out=mixed.getChannelData(ch)
          const ex=existBuf.getChannelData(Math.min(ch,existBuf.numberOfChannels-1))
          const nw=newBuf.getChannelData(Math.min(ch,newBuf.numberOfChannels-1))
          for(let i=0;i<maxLen;i++) out[i]=(ex[i]??0)+(nw[i]??0)
        }
        await ctx.close()
        const wavBlob=audioBufferToWAV(mixed)
        const url=URL.createObjectURL(wavBlob)
        if(track.url) URL.revokeObjectURL(track.url)
        const audio=new Audio(url); audio.loop=true
        setTracks(prev=>prev.map((t,i)=>i===slot?{...t,blob:wavBlob,url,audioEl:audio,duration:mixed.duration}:t))
        setRecording(false); setRecTarget(null)
      }
      mr.start(); mediaRecRef.current=mr; setRecording(true); setRecTarget(slot)
      setTimeout(()=>mr.stop(),30000) // max 30s overdub
    }catch(e){console.warn('Overdub error',e)}
  },[tracks,recording])

  const togglePlay=useCallback((slot:number)=>{
    setTracks(prev=>prev.map((t,i)=>{
      if(i!==slot||!t.audioEl) return t
      if(t.isPlaying){t.audioEl.pause();t.audioEl.currentTime=0;return{...t,isPlaying:false}}
      t.audioEl.volume=t.volume; t.audioEl.playbackRate=t.speed
      // Apply trim
      if(t.trimStart>0) t.audioEl.currentTime=t.trimStart*(t.duration||0)
      t.audioEl.play().catch(()=>{})
      return{...t,isPlaying:true}
    }))
  },[])

  const updateTrack=useCallback((slot:number,update:Partial<LoopTrack>)=>{
    setTracks(prev=>prev.map((t,i)=>{
      if(i!==slot) return t
      const next={...t,...update}
      if(next.audioEl){
        if('volume' in update) next.audioEl.volume=next.volume
        if('speed' in update) next.audioEl.playbackRate=next.speed
      }
      return next
    }))
  },[])

  const clearTrack=useCallback((slot:number)=>{
    setTracks(prev=>prev.map((t,i)=>{
      if(i!==slot) return t
      t.audioEl?.pause(); if(t.url) URL.revokeObjectURL(t.url)
      return mkTrack(i)
    }))
  },[])

  const exportMix=useCallback(async()=>{
    const loaded=tracks.filter(t=>t.blob)
    if(!loaded.length) return
    setExporting(true)
    try{
      const ctx=new AudioContext()
      const bufs=await Promise.all(loaded.map(t=>t.blob!.arrayBuffer().then(ab=>ctx.decodeAudioData(ab))))
      const maxLen=Math.max(...bufs.map(b=>b.length))
      const mixed=ctx.createBuffer(2,maxLen,ctx.sampleRate)
      bufs.forEach((buf,idx)=>{
        const track=loaded[idx]; const vol=track.volume
        const start=Math.floor(track.trimStart*buf.length)
        const end=Math.floor(track.trimEnd*buf.length)
        for(let ch=0;ch<2;ch++){
          const out=mixed.getChannelData(ch)
          const src=buf.getChannelData(Math.min(ch,buf.numberOfChannels-1))
          for(let i=start;i<end;i++) out[i-start]=(out[i-start]||0)+src[i]*vol
        }
      })
      await ctx.close()
      const wav=audioBufferToWAV(mixed)
      const url=URL.createObjectURL(wav)
      const a=document.createElement('a'); a.href=url; a.download=`noiraciel-mix-${Date.now()}.wav`; a.click()
      URL.revokeObjectURL(url)
    }catch(e){console.warn('Export mix error',e)}
    setExporting(false)
  },[tracks])

  const stopAll=()=>setTracks(prev=>prev.map(t=>{if(t.audioEl){t.audioEl.pause();t.audioEl.currentTime=0};return{...t,isPlaying:false}}))
  const playAll=()=>setTracks(prev=>prev.map(t=>{if(!t.audioEl||!t.blob) return t;t.audioEl.volume=t.volume;t.audioEl.playbackRate=t.speed;t.audioEl.play().catch(()=>{});return{...t,isPlaying:true}}))

  return(
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-noir-silver/8">
        <span className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-silver/35">Looper</span>
        <div className="flex gap-1">
          {(['mic','system'] as const).map(s=>(
            <button key={s} onClick={()=>setInputSource(s)}
              className={`px-2.5 py-1 border font-body text-[8px] tracking-[0.15em] uppercase transition-all ${inputSource===s?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/12 text-noir-silver/35 hover:border-t-accent/25'}`}>
              {s==='mic'?'🎙 Mic':'⊕ System'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          <button onClick={playAll} className="px-2.5 py-1 border border-noir-silver/15 text-noir-silver/40 font-body text-[8px] tracking-[0.2em] uppercase hover:border-t-accent/30 hover:text-t-accent/60 transition-all">▶ All</button>
          <button onClick={stopAll} className="px-2.5 py-1 border border-noir-silver/15 text-noir-silver/40 font-body text-[8px] tracking-[0.2em] uppercase hover:border-t-accent/30 hover:text-t-accent/60 transition-all">■ All</button>
          <button onClick={exportMix} disabled={exporting||!tracks.some(t=>t.blob)}
            className="px-2.5 py-1 border border-t-accent/25 text-t-accent/50 font-body text-[8px] tracking-[0.2em] uppercase hover:border-t-accent/50 hover:text-t-accent transition-all disabled:opacity-25">
            {exporting?'Exporting…':'↓ Mix WAV'}
          </button>
        </div>
      </div>

      {recording&&(
        <div className="flex items-center gap-3 px-3 py-2 border border-red-500/30 bg-red-500/5">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/>
          <span className="font-body text-[9px] tracking-[0.3em] uppercase text-red-400">Recording Loop {(recTarget??0)+1} · {recSeconds}s</span>
          <button onClick={stopRecording} className="ml-auto px-2.5 py-1 border border-red-500/40 text-red-400 font-body text-[8px] tracking-[0.2em] uppercase hover:bg-red-500/10 transition-all">Stop</button>
        </div>
      )}

      {/* Tracks */}
      <div className="space-y-2">
        {tracks.map((track,i)=>(
          <div key={i} className={`border transition-all ${track.isPlaying?'border-t-accent/30 bg-t-accent/4':track.blob?'border-noir-silver/12':'border-noir-silver/6'}`}>
            {/* Main row */}
            <div className="flex items-center gap-2 p-3">
              <span className={`font-heading italic text-lg w-6 flex-shrink-0 ${track.isPlaying?'text-t-accent':'text-noir-silver/20'}`}>{i+1}</span>
              <div className="flex-1 min-w-0">
                {track.blob?(
                  <div className="flex items-center gap-2">
                    <span className="font-body text-[9px] text-noir-ivory/50">{track.label}</span>
                    {track.duration>0&&<span className="font-body text-[8px] text-noir-silver/30 tabular-nums">{track.duration.toFixed(1)}s</span>}
                    {track.isPlaying&&<span className="font-body text-[7px] tracking-[0.3em] uppercase text-t-accent/60 animate-pulse">● looping</span>}
                  </div>
                ):(
                  <span className="font-body text-[8px] text-noir-silver/18">{recTarget===i?'● recording…':'empty'}</span>
                )}
              </div>

              {track.blob&&<input type="range" min={0} max={1} step={0.01} value={track.volume} onChange={e=>updateTrack(i,{volume:Number(e.target.value)})} className="w-14 flex-shrink-0" style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${track.volume*100}%,rgba(184,197,208,0.12) ${track.volume*100}%)`}}/>}

              {track.blob&&(
                <select value={track.speed} onChange={e=>updateTrack(i,{speed:Number(e.target.value)})}
                  className="bg-noir-void border border-noir-silver/10 text-noir-silver/50 font-body text-[8px] px-1 py-0.5 focus:outline-none flex-shrink-0">
                  <option value={0.5}>0.5×</option>
                  <option value={1}>1×</option>
                  <option value={2}>2×</option>
                </select>
              )}

              {track.blob&&<button onClick={()=>togglePlay(i)} className={`w-8 h-8 flex items-center justify-center border flex-shrink-0 transition-all ${track.isPlaying?'border-t-accent/60 bg-t-accent/12 text-t-accent':'border-noir-silver/20 text-noir-silver/40 hover:border-t-accent/40 hover:text-t-accent'}`}>{track.isPlaying?'■':'▶'}</button>}

              <button onClick={()=>recording&&recTarget===i?stopRecording():startRecording(i)} disabled={recording&&recTarget!==i}
                className={`w-8 h-8 flex items-center justify-center border flex-shrink-0 transition-all ${recording&&recTarget===i?'border-red-500/60 bg-red-500/15 text-red-400 animate-pulse':'border-noir-silver/15 text-noir-silver/30 hover:border-red-400/40 hover:text-red-400 disabled:opacity-20'}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-current"/>
              </button>

              {track.blob&&<button onClick={()=>overdub(i)} disabled={recording} className="w-8 h-8 flex items-center justify-center border border-violet-500/20 text-violet-400/40 hover:border-violet-500/40 hover:text-violet-400 flex-shrink-0 transition-all disabled:opacity-20 text-xs" title="Overdub">⊕</button>}

              {track.blob&&<button onClick={()=>setExpandedTrack(expandedTrack===i?null:i)} className="w-8 h-8 flex items-center justify-center border border-noir-silver/10 text-noir-silver/20 hover:border-t-accent/20 hover:text-t-accent/40 flex-shrink-0 transition-all text-xs">{expandedTrack===i?'▲':'▼'}</button>}

              {track.blob&&<button onClick={()=>clearTrack(i)} className="w-8 h-8 flex items-center justify-center border border-noir-silver/10 text-noir-silver/20 hover:border-red-400/30 hover:text-red-400/60 flex-shrink-0 transition-all text-xs">✕</button>}
            </div>

            {/* Expanded: trim + fade */}
            {expandedTrack===i&&track.blob&&(
              <div className="border-t border-noir-silver/8 px-3 pb-3 space-y-3">
                <p className="font-body text-[8px] tracking-[0.25em] uppercase text-noir-silver/30 pt-3">Trim &amp; Fade</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-body text-[8px] text-noir-silver/35">Trim Start</span>
                  <input type="range" min={0} max={0.99} step={0.01} value={track.trimStart} onChange={e=>updateTrack(i,{trimStart:Number(e.target.value)})} className="w-28"
                    style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${track.trimStart*100}%,rgba(184,197,208,0.12) ${track.trimStart*100}%)`}}/>
                  <span className="font-body text-[8px] tabular-nums text-noir-silver/30">{Math.round(track.trimStart*100)}%</span>
                  <span className="font-body text-[8px] text-noir-silver/35 ml-2">End</span>
                  <input type="range" min={0.01} max={1} step={0.01} value={track.trimEnd} onChange={e=>updateTrack(i,{trimEnd:Number(e.target.value)})} className="w-28"
                    style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${track.trimEnd*100}%,rgba(184,197,208,0.12) ${track.trimEnd*100}%)`}}/>
                  <span className="font-body text-[8px] tabular-nums text-noir-silver/30">{Math.round(track.trimEnd*100)}%</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-body text-[8px] text-noir-silver/35">Fade In</span>
                  <input type="range" min={0} max={5} step={0.1} value={track.fadeIn} onChange={e=>updateTrack(i,{fadeIn:Number(e.target.value)})} className="w-20"
                    style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${track.fadeIn/5*100}%,rgba(184,197,208,0.12) ${track.fadeIn/5*100}%)`}}/>
                  <span className="font-body text-[8px] text-noir-silver/30 tabular-nums">{track.fadeIn.toFixed(1)}s</span>
                  <span className="font-body text-[8px] text-noir-silver/35 ml-2">Fade Out</span>
                  <input type="range" min={0} max={5} step={0.1} value={track.fadeOut} onChange={e=>updateTrack(i,{fadeOut:Number(e.target.value)})} className="w-20"
                    style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${track.fadeOut/5*100}%,rgba(184,197,208,0.12) ${track.fadeOut/5*100}%)`}}/>
                  <span className="font-body text-[8px] text-noir-silver/30 tabular-nums">{track.fadeOut.toFixed(1)}s</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="font-body text-[8px] text-noir-silver/18">Mic: record from microphone · ⊕ = overdub (mix on top) · ↓ Mix WAV = bounce all tracks</p>
    </div>
  )
}
