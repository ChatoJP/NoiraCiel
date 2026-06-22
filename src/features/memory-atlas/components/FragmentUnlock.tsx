'use client';

import { UnlockedFragment } from '../types';

interface FragmentUnlockProps {
  fragments: UnlockedFragment[];
}

export default function FragmentUnlock({ fragments }: FragmentUnlockProps) {
  if (fragments.length === 0) {
    return (
      <div>
        <div className="ma-fragments-label">Unlocked Fragments</div>
        <p style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontStyle: 'italic',
          fontSize: '0.9rem',
          color: 'var(--ma-slate)',
          marginTop: '0.75rem',
          lineHeight: 1.6,
        }}>
          Solve a clue to unlock the first memory fragment.
        </p>
      </div>
    );
  }

  return (
    <div className="ma-fragments">
      <div className="ma-fragments-label">Unlocked Fragments</div>
      {fragments.map((uf) => (
        <div key={uf.clueId} className={`ma-fragment ${uf.fragment.type}`}>
          <div className="ma-fragment-type">{uf.fragment.type}</div>
          <p className="ma-fragment-text">&ldquo;{uf.fragment.text}&rdquo;</p>
          {uf.fragment.attribution && (
            <p className="ma-fragment-attribution">— {uf.fragment.attribution}</p>
          )}
          {uf.shardGranted && (
            <div className="ma-shard-award">
              <span aria-hidden="true">◆</span>
              <span>Memory Shard: {uf.shardGranted}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
