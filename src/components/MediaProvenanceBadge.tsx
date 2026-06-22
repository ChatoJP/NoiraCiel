// Small, consistent, honest label for how a piece of media was actually
// made — extends the "Veo3 → Looping Visual" caption fix from earlier this
// session into one reusable component instead of one-off inline strings.
export type Provenance = 'ai-video' | 'looping-visual' | 'algorithmic' | 'ai-image'

const LABELS: Record<Provenance, string> = {
  'ai-video':       'AI-Generated · Veo3',
  'looping-visual': 'Looping Visual',
  'algorithmic':    'Algorithmic Visualization',
  'ai-image':       'AI-Generated Art',
}

export default function MediaProvenanceBadge({ type, className = '' }: { type: Provenance; className?: string }) {
  return (
    <span className={`font-body text-[9px] tracking-[0.3em] uppercase text-t-accent/40 ${className}`}>
      {LABELS[type]}
    </span>
  )
}
