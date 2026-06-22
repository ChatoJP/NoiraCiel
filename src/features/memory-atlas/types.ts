export type FragmentType = 'lyric' | 'story' | 'lore';

export interface Fragment {
  id: string;
  type: FragmentType;
  text: string;
  attribution?: string;
}

export interface Clue {
  id: string;
  puzzleType?: 'word' | 'sequence' | 'match';
  sentence: string; // contains ____ as the blank (word puzzle), or descriptive prompt (sequence/match)
  answer: string;
  altAnswers?: string[];
  options?: string[]; // for match puzzle
  hint?: string;
  fragment: Fragment;
  shardGranted?: string;
  revealZone: number; // 0-indexed zone of artwork to reveal
}

export interface ArtworkConfig {
  gradient: string;
  accentColor: string;
  description: string;
  mood: string;
}

export interface MemoryLevelData {
  id: string;
  title: string;
  subtitle: string;
  number: number;
  artwork: ArtworkConfig;
  clues: Clue[];
  completionFragment: Fragment;
}

export interface WorldData {
  id: string;
  title: string;
  tagline: string;
  mood: string;
  aesthetic: string;
  status: 'available' | 'locked' | 'coming-soon';
  levels: MemoryLevelData[];
  availableShards: string[];
}

export interface WorldIndex {
  id: string;
  title: string;
  tagline: string;
  mood: string;
  status: 'available' | 'locked' | 'coming-soon';
  totalLevels: number;
  availableShards: string[];
}

export type GameScreen = 'intro' | 'world-select' | 'level' | 'world-complete';

export interface UnlockedFragment {
  clueId: string;
  levelId: string;
  fragment: Fragment;
  shardGranted?: string;
}

export interface GameState {
  screen: GameScreen;
  currentWorldId: string | null;
  currentLevelIndex: number;
  solvedClues: string[];
  completedLevels: string[];
  collectedShards: string[];
  unlockedFragments: UnlockedFragment[];
}

export type GameAction =
  | { type: 'ENTER_WORLD'; worldId: string }
  | { type: 'SOLVE_CLUE'; clueId: string; levelId: string; fragment: Fragment; shardGranted?: string }
  | { type: 'COMPLETE_LEVEL'; levelId: string }
  | { type: 'NEXT_LEVEL' }
  | { type: 'WORLD_COMPLETE' }
  | { type: 'RETURN_TO_ATLAS' }
  | { type: 'RESET_WORLD' }
  | { type: 'GO_TO_INTRO' }
  | { type: 'RESTORE'; state: GameState };
