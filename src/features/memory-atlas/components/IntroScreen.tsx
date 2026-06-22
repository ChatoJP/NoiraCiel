'use client';

import React from 'react';

interface IntroScreenProps {
  onEnter: () => void;
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  left: Math.random() * 100,
  bottom: Math.random() * 40,
  duration: Math.random() * 6 + 6,
  delay: Math.random() * 8,
  rise: Math.random() * 100 + 60,
  opacity: Math.random() * 0.3 + 0.1,
}));

export default function IntroScreen({ onEnter }: IntroScreenProps) {
  return (
    <div className="ma-intro">
      {/* Particles */}
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

      {/* Horizon atmospheric line */}
      <div className="ma-intro-horizon" aria-hidden="true" />

      {/* Content */}
      <div className="ma-intro-eyebrow">
        NoiraCiel
      </div>

      <h1 className="ma-intro-title">
        The Memory Atlas
        <span>An Interactive Experience</span>
      </h1>

      <div className="ma-intro-divider" aria-hidden="true" />

      <p className="ma-intro-tagline">
        Each memory is a door. Each word, a key.<br />
        Enter the hidden archive. Unlock what was carried across water.
      </p>

      <div className="ma-intro-cta">
        <button className="ma-btn-primary" onClick={onEnter} aria-label="Enter the Memory Atlas">
          <span>Enter The Memory Atlas</span>
          <span aria-hidden="true" style={{ fontSize: '0.7rem', opacity: 0.7 }}>◈</span>
        </button>
      </div>

      <div className="ma-intro-footer">
        <p>Atlantic Noir · Still We Sail · Memory Edition</p>
      </div>
    </div>
  );
}
