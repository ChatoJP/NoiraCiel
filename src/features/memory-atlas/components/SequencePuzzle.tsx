'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clue } from '../types';

interface SequencePuzzleProps {
  clue: Clue;
  clueIndex: number;
  totalClues: number;
  isSolved: boolean;
  onSolve: (clue: Clue) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function SequencePuzzle({
  clue,
  clueIndex,
  totalClues,
  isSolved,
  onSolve,
}: SequencePuzzleProps) {
  const words = clue.answer.split(' ');

  const [bank, setBank] = useState<string[]>(() => {
    const shuffled = shuffleArray(words);
    if (shuffled.join(' ') === words.join(' ') && words.length > 1) {
      shuffled.push(shuffled.shift()!);
    }
    return shuffled;
  });

  const [built, setBuilt] = useState<string[]>([]);
  const [hasError, setHasError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const shuffled = shuffleArray(words);
    if (shuffled.join(' ') === words.join(' ') && words.length > 1) {
      shuffled.push(shuffled.shift()!);
    }
    setBank(shuffled);
    setBuilt([]);
    setHasError(false);
    setAttempts(0);
    setShowHint(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clue.id]);

  const pickWord = useCallback((word: string, bankIndex: number) => {
    if (isSolved) return;
    setBank((prev) => prev.filter((_, i) => i !== bankIndex));
    setBuilt((prev) => [...prev, word]);
  }, [isSolved]);

  const removeWord = useCallback((word: string, builtIndex: number) => {
    if (isSolved) return;
    setBuilt((prev) => prev.filter((_, i) => i !== builtIndex));
    setBank((prev) => [...prev, word]);
  }, [isSolved]);

  const reset = useCallback(() => {
    setBank(words);
    setBuilt([]);
    setHasError(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clue.answer]);

  function handleSubmit() {
    if (isSolved || built.length === 0) return;
    const attempt = built.join(' ').toLowerCase().trim();
    const correct = clue.answer.toLowerCase().trim();
    if (attempt === correct) {
      onSolve(clue);
    } else {
      setHasError(true);
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 2 && clue.hint) setShowHint(true);
      setTimeout(() => setHasError(false), 600);
    }
  }

  return (
    <div className="ma-sequence">
      <div className="ma-puzzle-number">
        Clue {clueIndex + 1} of {totalClues}
      </div>

      <p className="ma-sequence-prompt">Arrange these words in order:</p>

      {!isSolved ? (
        <>
          <div className="ma-sequence-bank" aria-label="Word bank">
            {bank.map((word, i) => (
              <button
                key={`bank-${i}-${word}`}
                className="ma-sequence-chip"
                onClick={() => pickWord(word, i)}
                aria-label={`Add word: ${word}`}
              >
                {word}
              </button>
            ))}
            {bank.length === 0 && (
              <span className="ma-sequence-bank-empty">All words placed</span>
            )}
          </div>

          <div
            className={`ma-sequence-build${hasError ? ' error' : ''}`}
            aria-label="Your sequence"
          >
            {built.length === 0 ? (
              <span className="ma-sequence-build-placeholder">Click words above to arrange them…</span>
            ) : (
              built.map((word, i) => (
                <button
                  key={`built-${i}-${word}`}
                  className="ma-sequence-chip placed"
                  onClick={() => removeWord(word, i)}
                  aria-label={`Remove word: ${word}`}
                >
                  {word}
                </button>
              ))
            )}
          </div>

          <div className="ma-sequence-actions">
            <button
              className="ma-puzzle-submit"
              onClick={handleSubmit}
              disabled={built.length === 0}
            >
              <span>Check Order</span>
            </button>
            <button
              className="ma-sequence-reset"
              onClick={reset}
              aria-label="Reset sequence"
            >
              Reset
            </button>
          </div>

          {showHint && clue.hint && (
            <p className="ma-puzzle-hint" role="status">
              {clue.hint}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="ma-sequence-answer" aria-label="Correct answer">
            {clue.answer.split(' ').map((word, i) => (
              <span key={i} className="ma-sequence-chip solved">
                {word}
              </span>
            ))}
          </div>
          <div className="ma-puzzle-solved" role="status" aria-live="polite">
            <div className="ma-puzzle-solved-dot" />
            <span>Memory unlocked</span>
          </div>
        </>
      )}
    </div>
  );
}
