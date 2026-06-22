'use client';

interface MemoryShardCounterProps {
  total: number;
  collected: number;
  shardNames?: string[];
  collectedNames?: string[];
  compact?: boolean;
}

export default function MemoryShardCounter({
  total,
  collected,
  compact = false,
}: MemoryShardCounterProps) {
  if (compact) {
    return (
      <div className="ma-shards-header">
        <div className="ma-shards-mini">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`ma-shard-mini${i < collected ? ' collected' : ''}`}
            />
          ))}
        </div>
        <span className="ma-shards-count" style={{ fontSize: '0.75rem', fontFamily: 'DM Sans, system-ui, sans-serif', color: 'var(--ma-fog)' }}>
          {collected}/{total}
        </span>
      </div>
    );
  }

  return (
    <div className="ma-shards-header">
      <div className="ma-label">Memory Shards</div>
      <div className="ma-shards-mini">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`ma-shard-mini${i < collected ? ' collected' : ''}`}
          />
        ))}
      </div>
      <span className="ma-shards-count">{collected}</span>
    </div>
  );
}
