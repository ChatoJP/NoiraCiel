'use client'

import { useState, useEffect } from 'react'

const QUOTES: { text: string; song: string }[] = [
  { text: "Maybe the meaning isn't hidden at the end of the road. Maybe the meaning is the road itself.", song: "Why" },
  { text: "Why do we love, knowing one day we'll have to let go?", song: "Why" },
  { text: "Why do we build when nothing in this world can stay?", song: "Why" },
  { text: "Why does a moment disappear while memory lasts forever?", song: "Why" },
  { text: "Why do we search for things that were already there?", song: "Why" },
  { text: "Why does life feel so fragile, and so magnificent at the same time?", song: "Why" },
  { text: "Maybe I was wrong. Maybe that's where wisdom starts.", song: "Maybe I Was Wrong" },
  { text: "The strongest part of any tree is hidden underground. Just like love.", song: "The Roots We Cannot See" },
  { text: "Somewhere out there, someone's carrying what they were never meant to carry alone.", song: "Still Worth It" },
  { text: "Kindness has a price. And I've paid it more than once.", song: "Still Worth It" },
  { text: "The cost was real. The lesson was real. And so was the reason I helped in the first place.", song: "Still Worth It" },
  { text: "You're the feeling of home. The chair is empty, but the love is not. Some things never leave.", song: "The Empty Chair" },
  { text: "I've made it hard to love me sometimes. And still you stayed.", song: "The House We Couldn't Leave" },
  { text: "One day you meet people who want you to feel small, because standing on others makes them feel taller.", song: "Side by Side" },
  { text: "Some lessons are spoken. Some lessons are lived. The best ones become part of you.", song: "I Never Knew Any Other Way" },
  { text: "The coffee went cold, the city woke up. And for the first time, neither of us looked away.", song: "If We Can't Say the Hard Truths" },
  { text: "One more song, one more laugh, one more memory before the night goes by.", song: "Borrowed Time" },
  { text: "I thought the years move slowly like clouds across the sky. Funny how they start to run, the older that you get.", song: "Borrowed Time" },
  { text: "Everybody's running somewhere. Everybody's chasing gold. Looking for a shortcut high.", song: "Good Things Grow Slow" },
  { text: "There's a secret we all keep. And maybe that's okay.", song: "As Long as You're Okay" },
  { text: "There were angels in the baseline. There were devils in the street.", song: "Blood on the Hallelujah" },
  { text: "I had nothing left to offer. So I opened up the truth.", song: "Blood on the Hallelujah" },
  { text: "Let the old light come unglued. I had nothing left to offer. So I offered up the truth.", song: "Blood on the Hallelujah" },
  { text: "When the world lets you go, I will carry you home.", song: "Carry You Home" },
  { text: "I won't count what went wrong. I'll just open my arms.", song: "Carry You Home" },
  { text: "If you can't say my name, I won't ask where you've been.", song: "Carry You Home" },
  { text: "I know a little table where the lamps forgive the rain, where the piano drinks the silence and gives it back again.", song: "Keep a Chair for You" },
  { text: "Not the sadness that destroys us, but the one that keeps us pure.", song: "Keep a Chair for You" },
  { text: "The bass walks through the room like an old friend coming home.", song: "Keep a Chair for You" },
  { text: "There is a whole life waiting in a chair beside you.", song: "Keep a Chair for You" },
  { text: "My body remembers what I tried to bury.", song: "A Body Made of Night" },
  { text: "I kissed the ground, it tasted like iron. I stood back up, already on fire.", song: "Fallen Without Fear" },
  { text: "I held what was left until it became not peace, not love. Just mercy in flames.", song: "Mercy in Flames" },
  { text: "I give my sins in a velvet room, dress them in gold, and call them truth.", song: "Sin of an Angel" },
  { text: "My wings were never made to leave this world untouched.", song: "Broken Wings, Burning Soul" },
  { text: "They broke against the stars. But they still carried fire.", song: "Broken Wings, Burning Soul" },
  { text: "The sky went still. Like it was listening. Then my shadows spread.", song: "Black Wings Rising" },
  { text: "She moved like rain on glass. A little off. A little ashore.", song: "She Dances Like a Memory" },
  { text: "I had carried all my silence like a country with no name.", song: "The Heart Comes Home at Night" },
  { text: "I had learned to call it courage. I had learned to hide the flame.", song: "The Heart Comes Home at Night" },
  { text: "There were songs in every doorway asking why I felt alone.", song: "The Heart Comes Home at Night" },
  { text: "The brave, the lost, the changed — all the same to the waves.", song: "The Sea Keeps Our Names" },
  { text: "I saw my face in a window. Two in the morning, blue light.", song: "The Truth Has Teeth" },
  { text: "City breathing like a monster. And I was still pretending I was fine.", song: "The Truth Has Teeth" },
  { text: "I left my name in ash on a door that would not stay.", song: "Still We Sail" },
  { text: "And all the miles did not erase the hands we lost, the rooms we prayed.", song: "Still We Sail" },
  { text: "My mother kept her first name like a key in the palm.", song: "The Future Has an Accent" },
  { text: "The future has an accent. And we wear it like a flame.", song: "The Future Has an Accent" },
  { text: "Leave a light on. The door is open. The fire is warm. Come home.", song: "Leave a Light On" },
  { text: "I was still alive when the dark got loud. I stayed in motion. I chose the open.", song: "I Chose the Open" },
]

export default function RotatingQuoteStrip() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length)
        setVisible(true)
      }, 600)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const { text, song } = QUOTES[index]

  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(var(--t-accent-rgb), 0.04) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 w-px"
        style={{ height: '3rem', background: 'linear-gradient(to bottom, transparent, rgb(var(--t-accent-rgb) / 0.35))' }}
      />

      <div className="relative mx-auto max-w-6xl text-center">
        <blockquote
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(2.4rem, 5.5vw, 5.2rem)',
            lineHeight: 1.15,
            color: 'rgba(242,237,227,0.95)',
            letterSpacing: '-0.01em',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          {text}
        </blockquote>
        <p
          style={{
            marginTop: '2rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.68rem',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgb(var(--t-accent-rgb))',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.6s ease 0.1s',
          }}
        >
          — {song}
        </p>
      </div>

      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2 w-px"
        style={{ height: '3rem', background: 'linear-gradient(to bottom, rgb(var(--t-accent-rgb) / 0.35), transparent)' }}
      />
    </section>
  )
}
