'use client';

import { useEffect, useState } from 'react';
import { ArtworkConfig } from '../types';

interface ImageRevealProps {
  artwork: ArtworkConfig;
  totalZones: number;
  revealedZones: number[];
  className?: string;
}

export default function ImageReveal({ artwork, totalZones, revealedZones, className = '' }: ImageRevealProps) {
  const [flashActive, setFlashActive] = useState(false);
  const [prevRevealed, setPrevRevealed] = useState<number[]>([]);

  useEffect(() => {
    if (revealedZones.length > prevRevealed.length) {
      setFlashActive(true);
      const t = setTimeout(() => setFlashActive(false), 1200);
      return () => clearTimeout(t);
    }
    setPrevRevealed(revealedZones);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealedZones.length]);

  useEffect(() => {
    setPrevRevealed(revealedZones);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zonesClass = `zones-${totalZones}`;

  return (
    <div className={`ma-artwork-container ${className}`}>
      {/* Artwork background */}
      <div
        className="ma-artwork"
        style={{ background: artwork.gradient }}
        aria-label={artwork.description}
      />

      {/* Drifting fog overlay */}
      <div className="ma-fog-overlay" aria-hidden="true" />

      {/* Individual fog zones */}
      <div className={`ma-fog-zones ${zonesClass}`} aria-hidden="true">
        {Array.from({ length: totalZones }).map((_, i) => (
          <div
            key={i}
            className={`ma-fog-zone${revealedZones.includes(i) ? ' revealed' : ''}`}
          />
        ))}
      </div>

      {/* Golden flash on reveal */}
      <div
        className={`ma-reveal-flash${flashActive ? ' active' : ''}`}
        aria-hidden="true"
      />

      {/* Reveal counter dots */}
      <div className="ma-reveal-counter" aria-hidden="true">
        {Array.from({ length: totalZones }).map((_, i) => (
          <div
            key={i}
            className={`ma-reveal-dot${revealedZones.includes(i) ? ' revealed' : ''}`}
          />
        ))}
      </div>

      {/* Artwork description (visible as fog lifts) */}
      <div
        className="ma-artwork-description"
        style={{ opacity: revealedZones.length > 0 ? 1 : 0, transition: 'opacity 1.5s ease' }}
      >
        <p>{artwork.mood}</p>
      </div>
    </div>
  );
}
