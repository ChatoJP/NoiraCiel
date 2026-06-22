'use client';

import { useState, useRef, useEffect } from 'react';
import { Clue } from '../types';
import { validateAnswer } from '../utils/validation';

interface WordPuzzleProps {
  clue: Clue;
  clueIndex: number;
  totalClues: number;
  isSolved: boolean;
  onSolve: (clue: Clue) => void;
}

function renderSentence(sentence: string, answer: string, isSolved: boolean) {
  const parts = sentence.split('____');
  if (parts.length !== 2) return <span>{sentence}</span>;
  return (
    <>
      {parts[0]}
      <span className={`ma-puzzle-blank${isSolved ? ' solved' : ''}`}>
        {isSolved ? answer : '____'}
      </span>
      {parts[1]}
    </>
  );
}

export default function WordPuzzle({ clue, clueIndex, totalClues, isSolved, onSolve }: WordPuzzleProps) {
  const [input, setValue] = useState('');
  const [hasError, setHasError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue('');
    setHasError(false);
    setAttempts(0);
    setShowHint(false);
    if (!isSolved) inputRef.current?.focus();
  }, [clue.id, isSolved]);

  function handleSubmit() {
    if (isSolved || !input.trim()) return;
    if (validateAnswer(input, clue.answer, clue.altAnswers)) {
      onSolve(clue);
      setValue('');
    } else {
      setHasError(true);
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 2 && clue.hint) setShowHint(true);
      setTimeout(() => setHasError(false), 600);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="ma-puzzle">
      <div className="ma-puzzle-number">
        Clue {clueIndex + 1} of {totalClues}
      </div>

      <p className="ma-puzzle-sentence">
        {renderSentence(clue.sentence, clue.answer, isSolved)}
      </p>

      {!isSolved ? (
        <>
          <div className="ma-puzzle-input-row">
            <input
              ref={inputRef}
              type="text"
              className={`ma-puzzle-input${hasError ? ' error' : ''}`}
              value={input}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type your answer…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label={`Answer for clue ${clueIndex + 1}`}
            />
            <button
              className="ma-puzzle-submit"
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
              <span>Reveal</span>
            </button>
          </div>

          {showHint && clue.hint && (
            <p className="ma-puzzle-hint" role="status">
              {clue.hint}
            </p>
          )}
        </>
      ) : (
        <div className="ma-puzzle-solved" role="status" aria-live="polite">
          <div className="ma-puzzle-solved-dot" />
          <span>Memory unlocked</span>
        </div>
      )}
    </div>
  );
}
