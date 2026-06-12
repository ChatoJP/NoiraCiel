import React from 'react'
import { Composition } from 'remotion'
import { LyricVideo, type LyricVideoProps } from './LyricVideo'
import { KaraokeVideo, type KaraokeVideoProps } from './KaraokeVideo'

// Default props for LyricVideo Studio preview
const LYRIC_DEFAULT: LyricVideoProps = {
  trackTitle: 'Why',
  trackNumber: 1,
  albumTitle: 'The Life Lessons I Hope You Learn',
  lyrics: `When I was younger, I thought wisdom was an answer
A destination hidden somewhere beyond the next horizon

But every door I opened led to another hallway
And every truth I found gave birth to another question

Why, why do we love, knowing one day we'll have to let go
Why, why do we build when nothing in this world can stay

Maybe the meaning isn't hidden at the end of the road
Maybe the meaning is the road itself`,
  songArtPath: 'images/song-art/why.jpg',
  chapterEmotion: 'The lifelong question — searching for meaning that was always already there.',
  audioUrl: null,
}

// Default props for KaraokeVideo Studio preview
const KARAOKE_DEFAULT: KaraokeVideoProps = {
  trackTitle: 'Why',
  trackNumber: 1,
  albumTitle: 'The Life Lessons I Hope You Learn',
  audioUrl: null,
  songArtPath: 'images/song-art/why.jpg',
  chapterBannerPath: 'images/chapter-banners/why.jpg',
  chapterEmotion: 'The lifelong question — searching for meaning that was always already there.',
  lines: [
    { words: [
      { word: 'When', start: 5.0, end: 5.3 },
      { word: 'I', start: 5.3, end: 5.5 },
      { word: 'was', start: 5.5, end: 5.7 },
      { word: 'younger', start: 5.7, end: 6.2 },
    ]},
    { words: [
      { word: 'I', start: 6.8, end: 7.0 },
      { word: 'thought', start: 7.0, end: 7.4 },
      { word: 'wisdom', start: 7.4, end: 7.9 },
      { word: 'was', start: 7.9, end: 8.1 },
      { word: 'an', start: 8.1, end: 8.2 },
      { word: 'answer', start: 8.2, end: 8.8 },
    ]},
  ],
  bgImages: ['images/chapter-banners/why.jpg'],
}

export function Root() {
  return (
    <>
      <Composition
        id="KaraokeVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={KaraokeVideo as any}
        durationInFrames={7200}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={KARAOKE_DEFAULT}
      />
      <Composition
        id="LyricVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={LyricVideo as any}
        durationInFrames={7200}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={LYRIC_DEFAULT}
      />
    </>
  )
}
