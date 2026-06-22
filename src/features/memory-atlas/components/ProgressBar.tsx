'use client';

interface ProgressBarProps {
  solved: number;
  total: number;
  levelIndex: number;
  totalLevels: number;
}

export default function ProgressBar({ solved, total, levelIndex, totalLevels }: ProgressBarProps) {
  const cluePercent = total > 0 ? (solved / total) * 100 : 0;

  return (
    <div className="ma-progress">
      <div className="ma-progress-bar" role="progressbar" aria-valuenow={solved} aria-valuemax={total} aria-label={`${solved} of ${total} clues solved`}>
        <div
          className="ma-progress-fill"
          style={{ width: `${cluePercent}%` }}
        />
      </div>
      <span className="ma-progress-text">
        Memory {levelIndex + 1}/{totalLevels} · Clue {solved}/{total}
      </span>
    </div>
  );
}
