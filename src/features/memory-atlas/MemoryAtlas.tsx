'use client';

import { useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { Clue, UnlockedFragment } from './types';
import { gameReducer, initialGameState, saveGameState, loadGameState } from './utils/gameState';
import IntroScreen from './components/IntroScreen';
import WorldSelect from './components/WorldSelect';
import MemoryLevel from './components/MemoryLevel';
import CompletionScreen from './components/CompletionScreen';
import WorldCompleteScreen from './components/WorldCompleteScreen';

import worldsIndex from './data/worlds.json';
import stillWeSailData from './data/still-we-sail.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WORLD_DATA_MAP: Record<string, any> = {
  'still-we-sail': stillWeSailData,
};

type LevelScreenMode = 'playing' | 'level-complete';

export default function MemoryAtlas() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [hydrated, setHydrated] = useState(false);
  const [levelMode, setLevelMode] = useState<LevelScreenMode>('playing');
  const levelStartRef = useRef<number>(Date.now());

  // Restore saved state after hydration
  useEffect(() => {
    const saved = loadGameState();
    if (saved) {
      dispatch({ type: 'RESTORE', state: { ...saved, screen: saved.screen === 'level' ? 'world-select' : saved.screen } });
    }
    setHydrated(true);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (hydrated) saveGameState(state);
  }, [state, hydrated]);

  // Reset level mode when entering a new level
  useEffect(() => {
    if (state.screen === 'level') {
      setLevelMode('playing');
      levelStartRef.current = Date.now(); // G52: start timer
    }
  }, [state.screen, state.currentLevelIndex]);

  const currentWorldData = state.currentWorldId ? WORLD_DATA_MAP[state.currentWorldId] : null;
  const currentLevel = currentWorldData?.levels?.[state.currentLevelIndex] ?? null;

  const handleSolveClue = useCallback((clue: Clue) => {
    if (!currentLevel) return;
    dispatch({
      type: 'SOLVE_CLUE',
      clueId: clue.id,
      levelId: currentLevel.id,
      fragment: clue.fragment,
      shardGranted: clue.shardGranted,
    });
  }, [currentLevel]);

  const handleCompleteLevel = useCallback(() => {
    if (!currentLevel) return;
    dispatch({ type: 'COMPLETE_LEVEL', levelId: currentLevel.id });
    setLevelMode('level-complete');
    // G52: record completion time for leaderboard
    const elapsed = Math.floor((Date.now() - levelStartRef.current) / 1000)
    const key = 'nr-ma-leaderboard'
    const existing: { id: string; title: string; secs: number }[] = JSON.parse(localStorage.getItem(key) || '[]')
    const updated = [...existing, { id: currentLevel.id, title: currentLevel.title, secs: elapsed }]
      .sort((a, b) => a.secs - b.secs)
      .slice(0, 5)
    localStorage.setItem(key, JSON.stringify(updated))
    // G47: mark daily puzzle done
    const todayStr = new Date().toDateString()
    localStorage.setItem(`nr-ma-daily-${todayStr}`, '1')
    // G48: update streak
    const lastDate = localStorage.getItem('nr-ma-streak-date')
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const current = parseInt(localStorage.getItem('nr-ma-streak') || '0', 10)
    if (lastDate === yesterday) {
      localStorage.setItem('nr-ma-streak', String(current + 1))
    } else if (lastDate !== todayStr) {
      localStorage.setItem('nr-ma-streak', '1')
    }
    localStorage.setItem('nr-ma-streak-date', todayStr)
  }, [currentLevel]);

  const handleNextLevel = useCallback(() => {
    if (!currentWorldData) return;
    const nextIndex = state.currentLevelIndex + 1;
    if (nextIndex >= currentWorldData.levels.length) {
      dispatch({ type: 'WORLD_COMPLETE' });
    } else {
      dispatch({ type: 'NEXT_LEVEL' });
    }
    setLevelMode('playing');
  }, [currentWorldData, state.currentLevelIndex]);

  const handleResetWorld = useCallback(() => {
    if (!window.confirm('Reset all Memory Atlas progress? This cannot be undone.')) return;
    dispatch({ type: 'RESET_WORLD' });
  }, []);

  if (!hydrated) {
    return (
      <div className="memory-atlas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', color: 'var(--ma-fog)', fontSize: '1rem' }}>
          Opening the atlas…
        </div>
      </div>
    );
  }

  const levelFragmentsForCompletion: UnlockedFragment[] = currentLevel
    ? state.unlockedFragments.filter((f) => f.levelId === currentLevel.id)
    : [];

  return (
    <div className="memory-atlas">
      {/* Intro screen */}
      {state.screen === 'intro' && (
        <IntroScreen onEnter={() => dispatch({ type: 'RETURN_TO_ATLAS' })} />
      )}

      {/* World selection */}
      {state.screen === 'world-select' && (
        <WorldSelect
          worlds={worldsIndex.worlds as Parameters<typeof WorldSelect>[0]['worlds']}
          completedLevels={state.completedLevels}
          collectedShards={state.collectedShards}
          worldData={currentWorldData}
          onSelectWorld={(worldId) => {
            dispatch({ type: 'ENTER_WORLD', worldId });
            setLevelMode('playing');
          }}
          onBackToIntro={() => dispatch({ type: 'GO_TO_INTRO' })}
          onResetWorld={handleResetWorld}
        />
      )}

      {/* Level playing */}
      {state.screen === 'level' && currentLevel && levelMode === 'playing' && (
        <MemoryLevel
          key={`${state.currentWorldId}-${state.currentLevelIndex}`}
          level={currentLevel}
          levelIndex={state.currentLevelIndex}
          totalLevels={currentWorldData?.levels?.length ?? 1}
          gameState={state}
          onSolveClue={handleSolveClue}
          onCompleteLevel={handleCompleteLevel}
          onReturnToAtlas={() => dispatch({ type: 'RETURN_TO_ATLAS' })}
        />
      )}

      {/* Level completion */}
      {state.screen === 'level' && currentLevel && levelMode === 'level-complete' && (
        <CompletionScreen
          level={currentLevel}
          isLastLevel={
            currentWorldData
              ? state.currentLevelIndex >= currentWorldData.levels.length - 1
              : true
          }
          collectedShards={state.collectedShards}
          levelFragments={levelFragmentsForCompletion}
          onNext={handleNextLevel}
          onReturnToAtlas={() => dispatch({ type: 'RETURN_TO_ATLAS' })}
        />
      )}

      {/* World complete */}
      {state.screen === 'world-complete' && currentWorldData && (
        <WorldCompleteScreen
          world={currentWorldData}
          collectedShards={state.collectedShards}
          onReturnToAtlas={() => dispatch({ type: 'RETURN_TO_ATLAS' })}
        />
      )}
    </div>
  );
}
