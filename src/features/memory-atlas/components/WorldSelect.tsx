'use client';

import { useState, useEffect } from 'react';
import { WorldIndex, WorldData } from '../types';

interface WorldSelectProps {
  worlds: WorldIndex[];
  completedLevels: string[];
  collectedShards: string[];
  worldData: WorldData | null;
  onSelectWorld: (worldId: string) => void;
  onBackToIntro: () => void;
  onResetWorld: () => void;
}

export default function WorldSelect({
  worlds,
  completedLevels,
  collectedShards,
  worldData,
  onSelectWorld,
  onBackToIntro,
  onResetWorld,
}: WorldSelectProps) {
  const totalShards = worlds.reduce((acc, w) => acc + w.availableShards.length, 0);

  // G48: streak counter
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    const s = parseInt(localStorage.getItem('nr-ma-streak') || '0', 10);
    setStreak(s);
  }, []);

  // G52: leaderboard
  type LeaderEntry = { id: string; title: string; secs: number };
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  useEffect(() => {
    const lb = JSON.parse(localStorage.getItem('nr-ma-leaderboard') || '[]') as LeaderEntry[];
    setLeaderboard(lb);
  }, []);

  // G47: daily puzzle index (based on day-of-year)
  const todayStr = new Date().toDateString();
  const dailyDone = typeof window !== 'undefined' && !!localStorage.getItem(`nr-ma-daily-${todayStr}`);
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyWorldId = worlds.find(w => w.status === 'available')?.id;
  const dailyLevelCount = worldData?.levels?.length ?? 0;
  const dailyLevelIdx = dailyLevelCount > 0 ? dayOfYear % dailyLevelCount : 0;

  return (
    <div className="ma-world-select">
      <button className="ma-back-btn" onClick={onBackToIntro} aria-label="Back to intro">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 1L3 6L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>The Memory Atlas</span>
      </button>

      <div className="ma-world-select-header">
        <h1>Choose Your World</h1>
        <p>Each world is an album. Each memory is a door.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          {/* G48: streak */}
          {streak > 0 && (
            <span className="ma-streak">🔥 {streak}-day streak</span>
          )}
          {/* G47: daily puzzle */}
          {dailyWorldId && (
            <button
              className="ma-btn-secondary"
              style={{ fontSize: '0.72rem', opacity: dailyDone ? 0.5 : 1 }}
              onClick={() => !dailyDone && onSelectWorld(dailyWorldId)}
              disabled={dailyDone}
            >
              {dailyDone ? '✓ Today\'s Puzzle Done' : '◈ Today\'s Puzzle'}
            </button>
          )}
        </div>
      </div>

      <div className="ma-world-grid">
        {worlds.map((world, i) => {
          const isAvailable = world.status === 'available';
          const worldLevelData = worldData && worldData.id === world.id ? worldData : null;
          const completedInWorld = worldLevelData
            ? worldLevelData.levels.filter((l) => completedLevels.includes(l.id)).length
            : 0;
          const progressPercent = world.totalLevels > 0
            ? (completedInWorld / world.totalLevels) * 100
            : 0;

          return (
            <div
              key={world.id}
              className={`ma-world-card ${world.status}`}
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => isAvailable && onSelectWorld(world.id)}
              role={isAvailable ? 'button' : undefined}
              tabIndex={isAvailable ? 0 : undefined}
              aria-label={isAvailable ? `Enter ${world.title}` : `${world.title} — coming soon`}
              onKeyDown={(e) => {
                if (isAvailable && (e.key === 'Enter' || e.key === ' ')) {
                  onSelectWorld(world.id);
                }
              }}
            >
              <div className="ma-world-card-status">
                {world.status === 'available' ? '● Available' : '◌ Coming Soon'}
              </div>
              <h2>{world.title}</h2>
              <p>{world.tagline}</p>

              <div className="ma-world-card-meta">
                {world.status === 'available' && (
                  <>
                    <span>{world.totalLevels} Memories</span>
                    <span>·</span>
                    <span>{world.availableShards.length} Shards</span>
                    {completedInWorld > 0 && (
                      <>
                        <span>·</span>
                        <span>{completedInWorld}/{world.totalLevels} Unlocked</span>
                      </>
                    )}
                  </>
                )}
              </div>

              {world.status === 'available' && world.totalLevels > 0 && (
                <div className="ma-world-card-progress">
                  <div
                    className="ma-world-card-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Shard collection */}
      {collectedShards.length > 0 && (
        <div className="ma-shard-tray">
          <div className="ma-shard-tray-label">
            Memory Shards — {collectedShards.length} / {totalShards} Collected
          </div>
          <div className="ma-shard-dots">
            {worldData?.availableShards.map((shard) => (
              <div
                key={shard}
                className={`ma-shard-dot${collectedShards.includes(shard) ? ' collected' : ''}`}
              >
                <div className="ma-shard-gem" />
                <span className="ma-shard-name">{shard}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* G52: Leaderboard */}
      {leaderboard.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid rgba(196,149,58,0.12)', background: 'rgba(196,149,58,0.03)' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ma-gold)', opacity: 0.7, marginBottom: '0.75rem' }}>
            ◈ Best Times
          </div>
          {leaderboard.map((entry, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: 'var(--ma-silver)', marginBottom: '0.3rem' }}>
              <span style={{ opacity: 0.7, truncate: 'ellipsis', maxWidth: '70%', overflow: 'hidden', whiteSpace: 'nowrap' }}>{i + 1}. {entry.title}</span>
              <span style={{ color: 'var(--ma-gold)', opacity: 0.8, flexShrink: 0 }}>{Math.floor(entry.secs / 60)}:{String(entry.secs % 60).padStart(2,'0')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reset option */}
      {(completedLevels.length > 0 || collectedShards.length > 0) && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            className="ma-btn-secondary"
            onClick={onResetWorld}
            aria-label="Reset all progress"
            style={{ fontSize: '0.65rem' }}
          >
            <span>Reset Progress</span>
          </button>
        </div>
      )}
    </div>
  );
}
