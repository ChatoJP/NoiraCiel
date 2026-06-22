'use client';

import React from 'react';
import { WorldData } from '../types';

interface WorldCompleteScreenProps {
  world: WorldData;
  collectedShards: string[];
  onReturnToAtlas: () => void;
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 1,
  left: Math.random() * 100,
  bottom: Math.random() * 60,
  duration: Math.random() * 8 + 5,
  delay: Math.random() * 6,
  rise: Math.random() * 120 + 60,
  opacity: Math.random() * 0.5 + 0.15,
}));

export default function WorldCompleteScreen({ world, collectedShards, onReturnToAtlas }: WorldCompleteScreenProps) {
  return (
    <div className="ma-world-complete">
      {/* Gold particles */}
      <div className="ma-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="ma-particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              '--duration': `${p.duration}s`,
              '--delay': `${p.delay}s`,
              '--rise': `-${p.rise}px`,
              '--max-opacity': p.opacity,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="ma-completion-eyebrow" style={{ animationDelay: '0.2s' }}>
        ◆◆◆ World Complete ◆◆◆
      </div>

      <h1 className="ma-world-complete-title">
        <span className="ma-world-complete-gold">{world.title}</span>
      </h1>

      <div style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontStyle: 'italic',
        fontSize: '1.1rem',
        color: 'var(--ma-mist)',
        maxWidth: '480px',
        lineHeight: 1.7,
        marginBottom: '2.5rem',
        animation: 'ma-fade-up 0.8s 0.4s ease-out both',
      }}>
        All five memories unlocked. All fragments retrieved from the depths of the Atlantic atlas.
      </div>

      <div className="ma-completion-divider" style={{ marginBottom: '2.5rem', animation: 'ma-fade-in 0.6s 0.5s both' }} />

      {/* All shards */}
      <div className="ma-completion-shards" style={{ animation: 'ma-fade-up 0.8s 0.6s ease-out both' }}>
        <div className="ma-completion-shards-label">Memory Shards Collected</div>
        <div className="ma-completion-shard-list">
          {collectedShards.map((shard, i) => (
            <div
              key={shard}
              className="ma-completion-shard-tag"
              style={{ animationDelay: `${0.7 + i * 0.08}s` }}
            >
              <span aria-hidden="true">◆</span>
              <span>{shard}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        maxWidth: '520px',
        margin: '0 auto 3rem',
        padding: '1.5rem 2rem',
        border: '1px solid var(--ma-atlantic)',
        background: 'linear-gradient(135deg, #0d1625 0%, #080f1e 100%)',
        animation: 'ma-fade-up 0.8s 0.8s ease-out both',
      }}>
        <blockquote style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontStyle: 'italic',
          fontSize: '1rem',
          color: 'var(--ma-pearl)',
          lineHeight: 1.7,
        }}>
          &ldquo;The ones who kept moving were not always brave. Sometimes they were simply carrying love across water. Still they sailed.&rdquo;
        </blockquote>
        <p style={{
          marginTop: '0.75rem',
          fontSize: '0.62rem',
          letterSpacing: '0.12em',
          color: 'var(--ma-gold-dark)',
        }}>
          — Still We Sail · NoiraCiel
        </p>
      </div>

      <div className="ma-completion-actions" style={{ animation: 'ma-fade-up 0.8s 1s ease-out both' }}>
        <button className="ma-btn-primary" onClick={onReturnToAtlas}>
          <span>Return to The Atlas</span>
        </button>
      </div>
    </div>
  );
}
