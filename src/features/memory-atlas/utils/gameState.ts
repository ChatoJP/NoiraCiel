'use client';

import { GameState, GameAction } from '../types';

const STORAGE_KEY = 'noiraciel-memory-atlas-v1';

export const initialGameState: GameState = {
  screen: 'intro',
  currentWorldId: null,
  currentLevelIndex: 0,
  solvedClues: [],
  completedLevels: [],
  collectedShards: [],
  unlockedFragments: [],
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GO_TO_INTRO':
      return { ...state, screen: 'intro' };

    case 'ENTER_WORLD':
      return {
        ...state,
        screen: 'level',
        currentWorldId: action.worldId,
        currentLevelIndex: 0,
        solvedClues: [],
      };

    case 'SOLVE_CLUE': {
      if (state.solvedClues.includes(action.clueId)) return state;
      const newShards = action.shardGranted
        ? [...state.collectedShards, action.shardGranted]
        : state.collectedShards;
      return {
        ...state,
        solvedClues: [...state.solvedClues, action.clueId],
        collectedShards: newShards,
        unlockedFragments: [
          ...state.unlockedFragments,
          {
            clueId: action.clueId,
            levelId: action.levelId,
            fragment: action.fragment,
            shardGranted: action.shardGranted,
          },
        ],
      };
    }

    case 'COMPLETE_LEVEL': {
      const alreadyDone = state.completedLevels.includes(action.levelId);
      return {
        ...state,
        completedLevels: alreadyDone
          ? state.completedLevels
          : [...state.completedLevels, action.levelId],
      };
    }

    case 'NEXT_LEVEL':
      return {
        ...state,
        screen: 'level',
        currentLevelIndex: state.currentLevelIndex + 1,
        solvedClues: [],
      };

    case 'WORLD_COMPLETE':
      return { ...state, screen: 'world-complete' };

    case 'RETURN_TO_ATLAS':
      return { ...state, screen: 'world-select', solvedClues: [] };

    case 'RESET_WORLD':
      return {
        ...initialGameState,
        screen: 'world-select',
        completedLevels: [],
        collectedShards: [],
        unlockedFragments: [],
      };

    case 'RESTORE':
      return action.state;

    default:
      return state;
  }
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}
