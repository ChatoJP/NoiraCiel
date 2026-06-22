'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clue } from '../types';

// G50: Web Audio tones for match/fail
function playMatchTone(success: boolean) {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    o.type = success ? 'sine' : 'square'
    o.frequency.setValueAtTime(success ? 880 : 200, ctx.currentTime)
    if (success) o.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.15)
    g.gain.setValueAtTime(0.2, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.25 : 0.18))
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.3)
  } catch {}
}

interface MatchPuzzleProps {
  clue: Clue;
  clueIndex: number;
  totalClues: number;
  isSolved: boolean;
  onSolve: (clue: Clue) => void;
}

export default function MatchPuzzle({
  clue,
  clueIndex,
  totalClues,
  isSolved,
  onSolve,
}: MatchPuzzleProps) {
  const [wrongOption, setWrongOption] = useState<string | null>(null);
  const [flippedOption, setFlippedOption] = useState<string | null>(null); // G49
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setWrongOption(null);
    setAttempts(0);
    setShowHint(false);
  }, [clue.id]);

  function handlePick(option: string) {
    if (isSolved) return;

    // G49: trigger flip animation
    setFlippedOption(option);
    setTimeout(() => setFlippedOption(null), 400);

    const correct = clue.answer.toLowerCase().trim();
    const picked = option.toLowerCase().trim();

    if (picked === correct) {
      playMatchTone(true); // G50
      onSolve(clue);
    } else {
      playMatchTone(false); // G50
      setWrongOption(option);
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 2 && clue.hint) setShowHint(true);
      setTimeout(() => setWrongOption(null), 600);
    }
  }

  const options = clue.options ?? [];

  return (
    <div className="ma-match">
      <div className="ma-puzzle-number">
        Clue {clueIndex + 1} of {totalClues}
      </div>

      <blockquote className="ma-match-quote">
        {clue.sentence}
      </blockquote>

      <div className="ma-match-options" role="group" aria-label="Answer choices">
        {options.map((option) => {
          const isWrong = wrongOption === option;
          const isCorrect = isSolved && option.toLowerCase().trim() === clue.answer.toLowerCase().trim();
          return (
            <button
              key={option}
              className={`ma-match-option${isWrong ? ' error' : ''}${isCorrect ? ' correct' : ''}${flippedOption === option ? ' ma-flip' : ''}`}
              onClick={() => handlePick(option)}
              disabled={isSolved}
              aria-pressed={isCorrect}
            >
              <span className="ma-match-option-marker" aria-hidden="true" />
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {showHint && clue.hint && !isSolved && (
        <p className="ma-puzzle-hint" role="status">
          {clue.hint}
        </p>
      )}

      {isSolved && (
        <div className="ma-puzzle-solved" role="status" aria-live="polite">
          <div className="ma-puzzle-solved-dot" />
          <span>Memory unlocked</span>
        </div>
      )}
    </div>
  );
}
