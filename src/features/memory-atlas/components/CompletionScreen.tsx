'use client';

import { MemoryLevelData, UnlockedFragment } from '../types';

interface CompletionScreenProps {
  level: MemoryLevelData;
  isLastLevel: boolean;
  collectedShards: string[];
  levelFragments: UnlockedFragment[];
  onNext: () => void;
  onReturnToAtlas: () => void;
}

export default function CompletionScreen({
  level,
  isLastLevel,
  collectedShards,
  levelFragments,
  onNext,
  onReturnToAtlas,
}: CompletionScreenProps) {
  const levelShards = levelFragments
    .filter((f) => f.shardGranted)
    .map((f) => f.shardGranted as string);

  return (
    <div className="ma-completion">
      <div className="ma-completion-eyebrow">
        ◆ Memory Unlocked ◆
      </div>

      <h2 className="ma-completion-title">{level.title}</h2>
      <p className="ma-completion-subtitle">{level.subtitle}</p>

      <div className="ma-completion-divider" />

      {/* Full artwork revealed */}
      <div className="ma-completion-artwork">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: level.artwork.gradient,
          }}
          aria-label={level.artwork.description}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E\")",
          backgroundSize: '180px 180px',
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          right: '1rem',
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontStyle: 'italic',
          fontSize: '0.75rem',
          color: 'var(--ma-mist)',
          opacity: 0.8,
        }}>
          {level.artwork.mood}
        </div>
      </div>

      {/* Completion fragment */}
      <div className="ma-completion-fragment">
        <blockquote>{level.completionFragment.text}</blockquote>
      </div>

      {/* Shards collected this level */}
      {levelShards.length > 0 && (
        <div className="ma-completion-shards">
          <div className="ma-completion-shards-label">Memory Shards Collected</div>
          <div className="ma-completion-shard-list">
            {levelShards.map((shard, i) => (
              <div key={i} className="ma-completion-shard-tag" style={{ animationDelay: `${i * 0.1}s` }}>
                <span aria-hidden="true">◆</span>
                <span>{shard}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total shard count */}
      <p style={{
        fontSize: '0.7rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--ma-fog)',
        marginBottom: '2rem',
      }}>
        Atlas Total: {collectedShards.length} shard{collectedShards.length !== 1 ? 's' : ''} collected
      </p>

      <div className="ma-completion-actions">
        {!isLastLevel ? (
          <button className="ma-btn-primary" onClick={onNext}>
            <span>Next Memory</span>
          </button>
        ) : (
          <button className="ma-btn-primary" onClick={onReturnToAtlas}>
            <span>Return to The Atlas</span>
          </button>
        )}
        <button className="ma-btn-secondary" onClick={onReturnToAtlas}>
          <span>Return to Atlas</span>
        </button>
      </div>
    </div>
  );
}
