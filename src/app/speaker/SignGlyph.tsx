import type { ReactNode } from 'react'

/**
 * SignGlyph — minimal, abstract marks for the 20 Tzolk'in day-signs.
 *
 * These are NOT reproductions of historical Maya glyphs (which would risk both
 * cliché and inaccuracy). They are original, restrained sigils — a few strokes
 * each — evoking the *idea* of each sign, in the NoiraCiel visual language.
 * Strokes use currentColor so the parent controls the accent.
 */

const S = {
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
}

const MARKS: Record<string, ReactNode> = {
  // Imix — the deep water / source
  Imix: (
    <>
      <path {...S} d="M12 40c5-5 9-5 14 0s9 5 14 0 9-5 12 0" />
      <path {...S} d="M14 48c5-5 9-5 14 0s9 5 14 0" opacity={0.6} />
      <circle cx={32} cy={22} r={3.5} {...S} />
    </>
  ),
  // Ik — wind, breath
  Ik: (
    <>
      <path {...S} d="M18 24c10-6 18 2 8 8s-2 14 8 8" />
      <path {...S} d="M40 22c-10 6-4 12 4 8" opacity={0.6} />
    </>
  ),
  // Akbal — night, the house, the candle
  Akbal: (
    <>
      <path {...S} d="M16 44V30l16-12 16 12v14" />
      <circle cx={32} cy={40} r={2.4} fill="currentColor" stroke="none" />
    </>
  ),
  // Kan — the seed, sprouting
  Kan: (
    <>
      <path {...S} d="M32 46c-7 0-11-6-11-12s4-12 11-12 11 6 11 12-4 12-11 12z" opacity={0.5} />
      <path {...S} d="M32 40V26M32 30c-3-3-7-3-9-1M32 30c3-3 7-3 9-1" />
    </>
  ),
  // Chicchan — the serpent
  Chicchan: (
    <>
      <path {...S} d="M18 22c8 0 8 8 0 8s-8 8 0 8 8 6 14 2" />
      <circle cx={44} cy={24} r={2} fill="currentColor" stroke="none" />
    </>
  ),
  // Cimi — death, the threshold
  Cimi: (
    <>
      <line {...S} x1={14} y1={34} x2={50} y2={34} />
      <path {...S} d="M22 34a10 10 0 0 1 20 0" opacity={0.6} />
      <path {...S} d="M26 42h12" opacity={0.5} />
    </>
  ),
  // Manik — the hand / the deer, grasp
  Manik: (
    <>
      <path {...S} d="M40 18a16 16 0 1 0 0 28" />
      <circle cx={32} cy={32} r={2.4} fill="currentColor" stroke="none" />
    </>
  ),
  // Lamat — the star, Venus
  Lamat: (
    <>
      <path {...S} d="M32 14l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" />
    </>
  ),
  // Muluc — water, offering, the drop
  Muluc: (
    <>
      <path {...S} d="M32 18c6 8 9 12 9 17a9 9 0 0 1-18 0c0-5 3-9 9-17z" />
      <path {...S} d="M14 46c5-4 9-4 14 0M36 46c5-4 9-4 14 0" opacity={0.5} />
    </>
  ),
  // Oc — the dog, the heart, loyalty
  Oc: (
    <>
      <path {...S} d="M32 44C20 36 18 28 24 24c4-3 8 0 8 4 0-4 4-7 8-4 6 4 4 12-8 20z" />
    </>
  ),
  // Chuen — the artisan, weaving, play
  Chuen: (
    <>
      <path {...S} d="M24 24c8 0 8 16 0 16s-8-16 0-16M40 24c-8 0-8 16 0 16s8-16 0-16" />
    </>
  ),
  // Eb — the road, the journey
  Eb: (
    <>
      <path {...S} d="M20 46L32 18l12 28" opacity={0.7} />
      <circle cx={28} cy={40} r={1.8} fill="currentColor" stroke="none" />
      <circle cx={36} cy={40} r={1.8} fill="currentColor" stroke="none" />
      <circle cx={32} cy={30} r={1.8} fill="currentColor" stroke="none" />
    </>
  ),
  // Ben — the reed, the pillar, the spine
  Ben: (
    <>
      <line {...S} x1={32} y1={14} x2={32} y2={50} />
      <line {...S} x1={24} y1={22} x2={40} y2={22} />
      <line {...S} x1={24} y1={32} x2={40} y2={32} />
      <line {...S} x1={24} y1={42} x2={40} y2={42} />
    </>
  ),
  // Ix — the jaguar, the earth, the spots
  Ix: (
    <>
      <path {...S} d="M16 40a16 16 0 0 1 32 0" opacity={0.5} />
      <circle cx={26} cy={28} r={2.2} fill="currentColor" stroke="none" />
      <circle cx={38} cy={28} r={2.2} fill="currentColor" stroke="none" />
      <circle cx={32} cy={38} r={2.2} fill="currentColor" stroke="none" />
    </>
  ),
  // Men — the eagle, vision, the eye
  Men: (
    <>
      <path {...S} d="M14 32c6-9 30-9 36 0-6 9-30 9-36 0z" />
      <circle cx={32} cy={32} r={4} {...S} />
      <circle cx={32} cy={32} r={1.4} fill="currentColor" stroke="none" />
    </>
  ),
  // Cib — the owl, the elder, the waning moon
  Cib: (
    <>
      <path {...S} d="M40 16a18 18 0 1 0 0 32 14 14 0 0 1 0-32z" />
      <circle cx={34} cy={32} r={2} fill="currentColor" stroke="none" />
    </>
  ),
  // Caban — the earth, movement, the spiral
  Caban: (
    <>
      <path {...S} d="M32 32m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M28 32a6 6 0 1 1 8 5M22 32a12 12 0 1 1 16 11" />
    </>
  ),
  // Etznab — the mirror, the flint, clarity
  Etznab: (
    <>
      <path {...S} d="M32 14l16 18-16 18-16-18z" />
      <line {...S} x1={32} y1={14} x2={32} y2={50} opacity={0.6} />
    </>
  ),
  // Cauac — the storm, the rain, renewal
  Cauac: (
    <>
      <path {...S} d="M20 32a8 8 0 0 1 1-15 11 11 0 0 1 21 1 7 7 0 0 1 1 14z" />
      <line {...S} x1={24} y1={40} x2={21} y2={48} opacity={0.6} />
      <line {...S} x1={32} y1={40} x2={29} y2={48} opacity={0.6} />
      <line {...S} x1={40} y1={40} x2={37} y2={48} opacity={0.6} />
    </>
  ),
  // Ahau — the sun, completion, illumination
  Ahau: (
    <>
      <circle cx={32} cy={32} r={9} {...S} />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <line
            key={i}
            {...S}
            opacity={0.7}
            x1={32 + Math.cos(a) * 14}
            y1={32 + Math.sin(a) * 14}
            x2={32 + Math.cos(a) * 19}
            y2={32 + Math.sin(a) * 19}
          />
        )
      })}
    </>
  ),
}

export default function SignGlyph({
  sign,
  size = 40,
  className = '',
}: {
  sign: string
  size?: number
  className?: string
}) {
  const mark = MARKS[sign]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {mark ?? <circle cx={32} cy={32} r={9} {...S} />}
    </svg>
  )
}
