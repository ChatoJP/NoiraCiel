'use client'

// GhostPerformanceEngine — the core orchestrator.
// Receives a Track's ghost performance metadata, resolves the visualizer type,
// and renders the correct Ghost visualizer component.

import dynamic from 'next/dynamic'
import { resolveVisualizer } from './ghostPerformanceTypes'
import type { GhostPerformanceMeta, GhostInstrument } from '@/lib/types'

// Lazy-load each visualizer to keep the initial bundle lean
const GhostEnergy   = dynamic(() => import('./GhostEnergy'),   { ssr: false })
const GhostPiano    = dynamic(() => import('./GhostPiano'),    { ssr: false })
const GhostDrums    = dynamic(() => import('./GhostDrums'),    { ssr: false })
const GhostGuitar   = dynamic(() => import('./GhostGuitar'),   { ssr: false })
const GhostBass     = dynamic(() => import('./GhostBass'),     { ssr: false })
const GhostStrings  = dynamic(() => import('./GhostStrings'),  { ssr: false })
const GhostSynth    = dynamic(() => import('./GhostSynth'),    { ssr: false })
const GhostChoir    = dynamic(() => import('./GhostChoir'),    { ssr: false })

interface Props {
  meta: GhostPerformanceMeta | undefined
}

const VISUALIZER_MAP: Record<GhostInstrument, React.ComponentType<{ meta?: GhostPerformanceMeta }>> = {
  piano:    GhostPiano,
  guitar:   GhostGuitar,
  drums:    GhostDrums,
  bass:     GhostBass,
  strings:  GhostStrings,
  orchestra: GhostStrings,  // Orchestra uses the Strings visualizer (enhanced in Phase 2)
  synth:    GhostSynth,
  choir:    GhostChoir,
  energy:   GhostEnergy,
}

import React from 'react'

export default function GhostPerformanceEngine({ meta }: Props) {
  const visualizer = resolveVisualizer(meta)
  const Visualizer = VISUALIZER_MAP[visualizer]

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: 320 }}>
      <Visualizer meta={meta} />
    </div>
  )
}
