'use client';

import { useState, useEffect } from 'react';
import { MemoryLevelData, Clue, UnlockedFragment, GameState } from '../types';
import ImageReveal from './ImageReveal';
import WordPuzzle from './WordPuzzle';
import SequencePuzzle from './SequencePuzzle';
import MatchPuzzle from './MatchPuzzle';
import FragmentUnlock from './FragmentUnlock';
import ProgressBar from './ProgressBar';
import MemoryShardCounter from './MemoryShardCounter';

interface MemoryLevelProps {
  level: MemoryLevelData;
  levelIndex: number;
  totalLevels: number;
  gameState: GameState;
  onSolveClue: (clue: Clue) => void;
  onCompleteLevel: () => void;
  onReturnToAtlas: () => void;
}

export default function MemoryLevel({
  level,
  levelIndex,
  totalLevels,
  gameState,
  onSolveClue,
  onCompleteLevel,
  onReturnToAtlas,
}: MemoryLevelProps) {
  const solvedClueIds = gameState.solvedClues;
  const solvedCount = level.clues.filter((c) => solvedClueIds.includes(c.id)).length;
  const allSolved = solvedCount === level.clues.length;

  // Active clue: first unsolved, or last if all solved
  const activeClueIndex = allSolved
    ? level.clues.length - 1
    : level.clues.findIndex((c) => !solvedClueIds.includes(c.id));

  const [displayClueIndex, setDisplayClueIndex] = useState(activeClueIndex >= 0 ? activeClueIndex : 0);

  useEffect(() => {
    const nextUnsolved = level.clues.findIndex((c) => !solvedClueIds.includes(c.id));
    if (nextUnsolved >= 0) setDisplayClueIndex(nextUnsolved);
  }, [solvedClueIds, level.clues]);

  const levelFragments: UnlockedFragment[] = gameState.unlockedFragments.filter(
    (f) => f.levelId === level.id
  );

  const revealedZones = level.clues
    .map((c, i) => (solvedClueIds.includes(c.id) ? c.revealZone : -1))
    .filter((z) => z >= 0);

  const displayClue = level.clues[displayClueIndex];

  return (
    <div className="ma-level">
      {/* Header */}
      <header className="ma-level-header">
        <div className="ma-level-header-left">
          <div className="ma-level-header-subtitle">{level.subtitle}</div>
          <div className="ma-level-header-title">{level.title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <MemoryShardCounter
            total={gameState.collectedShards.length + (10 - gameState.collectedShards.length)}
            collected={gameState.collectedShards.length}
            compact
          />
          <button
            className="ma-back-btn"
            onClick={onReturnToAtlas}
            style={{ margin: 0 }}
            aria-label="Return to Atlas"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M8 1L3 6L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Atlas</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="ma-level-body">
        {/* Left: Artwork */}
        <div className="ma-level-left">
          <ImageReveal
            artwork={level.artwork}
            totalZones={level.clues.length}
            revealedZones={revealedZones}
            className=""
          />
        </div>

        {/* Right: Puzzle + Fragments */}
        <div className="ma-level-right">
          {/* Clue navigation dots */}
          {level.clues.length > 1 && (
            <div className="ma-clue-nav">
              <div className="ma-clue-dots">
                {level.clues.map((clue, i) => (
                  <button
                    key={clue.id}
                    className={`ma-clue-dot${i === displayClueIndex ? ' active' : ''}${solvedClueIds.includes(clue.id) ? ' solved' : ''}`}
                    onClick={() => setDisplayClueIndex(i)}
                    aria-label={`Clue ${i + 1}${solvedClueIds.includes(clue.id) ? ' (solved)' : ''}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Puzzle — type determined by clue.puzzleType */}
          {displayClue && (
            displayClue.puzzleType === 'sequence'
              ? <SequencePuzzle
                  key={displayClue.id}
                  clue={displayClue}
                  clueIndex={displayClueIndex}
                  totalClues={level.clues.length}
                  isSolved={solvedClueIds.includes(displayClue.id)}
                  onSolve={onSolveClue}
                />
              : displayClue.puzzleType === 'match'
              ? <MatchPuzzle
                  key={displayClue.id}
                  clue={displayClue}
                  clueIndex={displayClueIndex}
                  totalClues={level.clues.length}
                  isSolved={solvedClueIds.includes(displayClue.id)}
                  onSolve={onSolveClue}
                />
              : <WordPuzzle
                  key={displayClue.id}
                  clue={displayClue}
                  clueIndex={displayClueIndex}
                  totalClues={level.clues.length}
                  isSolved={solvedClueIds.includes(displayClue.id)}
                  onSolve={onSolveClue}
                />
          )}

          {/* Unlocked fragments */}
          <FragmentUnlock fragments={levelFragments} />

          {/* Complete level button */}
          {allSolved && (
            <div style={{ paddingTop: '1rem' }}>
              <button
                className="ma-btn-primary"
                onClick={onCompleteLevel}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>
                  {levelIndex < totalLevels - 1 ? 'Reveal This Memory' : 'Complete The Atlas'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer: progress */}
      <footer className="ma-level-footer">
        <ProgressBar
          solved={solvedCount}
          total={level.clues.length}
          levelIndex={levelIndex}
          totalLevels={totalLevels}
        />
      </footer>
    </div>
  );
}
