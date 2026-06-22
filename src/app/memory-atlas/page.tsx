import type { Metadata } from 'next';
import MemoryAtlas from '@/features/memory-atlas/MemoryAtlas';
import '@/features/memory-atlas/styles/memory-atlas.css';

export const metadata: Metadata = {
  title: 'The Memory Atlas',
  description: 'An interactive NoiraCiel experience. Solve poetic word puzzles to reveal hidden memories, unlock lyric fragments and explore the world of Still We Sail.',
  robots: { index: false, follow: false },
};

export default function MemoryAtlasPage() {
  return <MemoryAtlas />;
}
