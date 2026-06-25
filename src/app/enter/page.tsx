import type { Metadata } from 'next'
import OnboardingFlow from './OnboardingFlow'

export const metadata: Metadata = {
  title: 'Enter NoiraCiel — Find Your Path',
  description:
    'Before NoiraCiel speaks to you, it must know how you listen. Answer a few symbolic questions and NoiraCiel will open the room that belongs to your current state.',
  openGraph: {
    title: 'Enter NoiraCiel — Find Your Path',
    description:
      'Answer a few symbolic questions and NoiraCiel will open the room that belongs to your current state.',
  },
}

export default function EnterPage() {
  return <OnboardingFlow />
}
