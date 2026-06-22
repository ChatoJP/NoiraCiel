import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import roomsData from '@/features/rooms/data/rooms.json'
import type { Room } from '@/features/rooms/types'
import RoomPage from '@/features/rooms/components/RoomPage'
import '@/features/rooms/styles/rooms.css'

interface Props {
  params: Promise<{ roomId: string }>
}

export async function generateStaticParams() {
  return (roomsData as Room[])
    .filter((r) => !r.isPremium && !r.isPrivate)
    .map((r) => ({ roomId: r.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params
  const room = (roomsData as Room[]).find((r) => r.id === roomId)
  if (!room) return { title: 'Room not found' }

  return {
    title: room.name,
    description: room.description,
    alternates: { canonical: `https://noiraciel.com/rooms/${room.id}` },
    openGraph: {
      title: `${room.name} — NoiraCiel Rooms`,
      description: room.tagline,
      url: `https://noiraciel.com/rooms/${room.id}`,
    },
  }
}

export default async function RoomRoute({ params }: Props) {
  const { roomId } = await params
  const room = (roomsData as Room[]).find((r) => r.id === roomId)

  if (!room || room.isPrivate) notFound()

  return <RoomPage room={room} />
}
