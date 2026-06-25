/**
 * QuantumField — a quiet, dark-observatory backdrop for The NoiraCiel Field.
 *
 * Pure SVG (no canvas, no deps): faint interference waves, orbital ellipses, a
 * probability cloud of points, and thin gold vector lines. Deterministic so it
 * renders identically on server and client. Laboratory-meets-cathedral, not sci-fi.
 */

const POINTS = Array.from({ length: 46 }).map((_, i) => {
  // Deterministic pseudo-random scatter (no Math.random → no hydration drift).
  const a = (i * 2654435761) % 1000 / 1000
  const b = (i * 40503) % 1000 / 1000
  const r = 8 + a * 44 // cluster toward centre (probability cloud)
  const ang = b * Math.PI * 2
  return {
    x: 50 + Math.cos(ang) * r,
    y: 50 + Math.sin(ang) * r * 0.62,
    o: 0.12 + ((i * 7) % 10) / 28,
    s: 0.25 + ((i * 13) % 10) / 16,
  }
})

function wavePath(amp: number, phase: number, yMid: number) {
  let d = `M 0 ${yMid}`
  for (let x = 0; x <= 100; x += 2) {
    const y = yMid + Math.sin((x / 100) * Math.PI * 6 + phase) * amp
    d += ` L ${x} ${y.toFixed(2)}`
  }
  return d
}

export default function QuantumField({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="qf-glow" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="rgb(var(--t-accent-rgb))" stopOpacity="0.10" />
          <stop offset="60%" stopColor="rgb(var(--t-bg-tint-rgb))" stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill="url(#qf-glow)" />

      {/* Orbital ellipses */}
      {[14, 26, 38].map((rx, i) => (
        <ellipse
          key={i}
          cx="50"
          cy="46"
          rx={rx}
          ry={rx * 0.5}
          fill="none"
          stroke="rgb(var(--t-accent-rgb))"
          strokeWidth="0.2"
          opacity={0.18 - i * 0.03}
          transform={`rotate(${i * 30} 50 46)`}
        />
      ))}

      {/* Two interfering waves */}
      <path d={wavePath(5, 0, 72)} fill="none" stroke="rgb(var(--t-accent-rgb))" strokeWidth="0.25" opacity="0.22" />
      <path d={wavePath(5, Math.PI / 1.5, 72)} fill="none" stroke="rgb(var(--t-accent-rgb))" strokeWidth="0.25" opacity="0.14" />

      {/* Probability cloud */}
      {POINTS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.s} fill="rgb(var(--t-accent-rgb))" opacity={p.o} />
      ))}
    </svg>
  )
}
