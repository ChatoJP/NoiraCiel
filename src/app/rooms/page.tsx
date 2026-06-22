import type { Metadata } from 'next'
import roomsData from '@/features/rooms/data/rooms.json'
import type { Room } from '@/features/rooms/types'
import RoomsLandingPage from '@/features/rooms/components/RoomsLandingPage'
import '@/features/rooms/styles/rooms.css'

export const metadata: Metadata = {
  title: 'NoiraCiel Rooms — meet people through the songs that find you',
  description: 'Enter a virtual music room. Hear the music. Find the ones who feel it too. Not dating. Resonance.',
  alternates: { canonical: 'https://noiraciel.com/rooms' },
  openGraph: {
    title: 'NoiraCiel Rooms',
    description: 'A virtual house for people who feel music deeply.',
    url: 'https://noiraciel.com/rooms',
  },
}

export default function RoomsPage() {
  return <RoomsLandingPage rooms={roomsData as Room[]} />
}
