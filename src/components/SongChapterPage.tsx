'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useAudio } from '@/context/AudioContext'
import type { Track } from '@/lib/types'
import ScoreViewer from '@/components/ScoreViewer'
import MediaProvenanceBadge from '@/components/MediaProvenanceBadge'
const SongDNA = dynamic(() => import('@/components/SongDNA'), { ssr: false })
import ApplyTheme from '@/components/ApplyTheme'

const SyncedLyricsPlayer = dynamic(() => import('@/components/SyncedLyricsPlayer'), { ssr: false })
const FanWall = dynamic(() => import('@/components/FanWall'), { ssr: false })
const GhostPerformanceTab = dynamic(() => import('@/components/ghost-performance/GhostPerformanceTab'), { ssr: false })

// Song chapter emotional context — mirrors scripts/lib/prompts.js SONG_CHAPTERS
const CHAPTER_CONTEXT: Record<number, { emotion: string; symbols: string }> = {
  1:  { emotion: 'The lifelong question — searching for meaning that was always already there.', symbols: 'road · horizon · open book · hands · dusk light' },
  2:  { emotion: 'The hollowness of achievement when it costs us the people we love.', symbols: 'trophy · hilltop · empty valley · still water · rain' },
  3:  { emotion: 'The invisible inheritance — what our ancestors planted in us without us knowing.', symbols: 'roots · stone · garden · doorway · grandmother · seeds' },
  4:  { emotion: 'The weight of words never spoken — how silence can be its own kind of violence.', symbols: 'empty chairs · unsent letters · kitchen table · reaching hand · silence' },
  5:  { emotion: 'Dignity in honest work — the beauty of a life lived through labour and love.', symbols: 'fishing boat · harbour · weathered hands · dawn · Atlantic waves' },
  6:  { emotion: 'The grace of companionship — walking the same road without needing to speak.', symbols: 'coastal path · long shadows · two figures · late light · unhurried steps' },
  7:  { emotion: "A parent's silent vigil — the love that asks for nothing, only safety.", symbols: 'doorway silhouette · sleeping child · lamp · phone glow · 2am' },
  8:  { emotion: 'Recognition — looking back and seeing the love that was always present, just unnamed.', symbols: 'attic light · dust motes · old photographs · mirror · recognition' },
  9:  { emotion: 'The phone call that changes the quality of darkness — someone always present.', symbols: 'rain on window · single lamp · phone call · morning light · thin curtains' },
  10: { emotion: "The family home as a living thing — how spaces hold the memory of those who loved them.", symbols: 'family home · glowing windows · dark field · left-behind objects · closing door' },
  11: { emotion: 'The tenderness of simplicity — a life lived without alternatives, full of its own grace.', symbols: 'coastal village · dawn rituals · faded warmth · familiar streets · simple grace' },
  12: { emotion: "The lit window as love's most silent language — a mother's vigil made visible.", symbols: 'lit window · dark exterior · silhouette · waiting · warm light on cold stone' },
  13: { emotion: 'Grief that has found its proper place — the presence of the absent, held with dignity.', symbols: 'empty chair · Sunday table · afternoon light · place setting · sacred absence' },
  14: { emotion: 'Patience as a radical act — the dignity of slow, deliberate growth over time.', symbols: 'garden · old hands · four seasons · seeds · earth · patience' },
  15: { emotion: 'The courage of revision — the grace of returning to say what you should have said.', symbols: 'kitchen table · morning coffee · same room years later · changed light · an opening' },
  16: { emotion: 'Gratitude for the unearned gift of extra time — afternoons that feel like grace.', symbols: 'intertwined hands · afternoon light · old clock · weathered skin · borrowed grace' },
  17: { emotion: 'Freedom as clarity — the liberation that comes from speaking truthfully, whatever the cost.', symbols: 'public square · speaking · listening · changed atmosphere · conviction · open sky' },
}

const BLIND_ANGEL_CONTEXT: Record<string, { emotion: string; symbols: string }> = {
  'noiraciel-angel-of-darkness':       { emotion: 'The other divinity — the kind that rises from ruin, untouched by borrowed certainty.', symbols: 'dark wings · fire · ash crown · raw power · sovereign weight' },
  'noiraciel-ashes-of-heaven':         { emotion: 'What remains when the sacred burns — the strange holiness of wreckage.', symbols: 'embers · grey sky · altar smoke · crumbled stone · broken light' },
  'noiraciel-black-wings-rising':      { emotion: 'The moment before transformation — suspended between who you were and what you are becoming.', symbols: 'spread wings · threshold · storm light · black feathers · upward motion' },
  'noiraciel-blind-halo':              { emotion: 'The saint who cannot see their own light — grace that does not know itself.', symbols: 'glowing ring · closed eyes · outstretched hands · soft gold · unseeing face' },
  'noiraciel-blood-on-the-halo':       { emotion: 'Divinity stained by living — the sacred made real through suffering.', symbols: 'tarnished gold · crimson · bowed figure · sacred wound · earthen ground' },
  'noiraciel-broken-wings-burning-soul': { emotion: 'The fall that is also a fire — destruction as the beginning of something truer.', symbols: 'broken feathers · flame · falling arc · dawn glow · rebirth seed' },
  'noiraciel-crown-of-fire':           { emotion: 'Sovereignty through ordeal — the crown earned in the furnace, not the court.', symbols: 'flame crown · bowed head · heat shimmer · iron will · forged authority' },
  'noiraciel-darkness-made-divine':    { emotion: 'The consecration of shadow — finding the holy in what others call void.', symbols: 'dark altar · single candle · reverent posture · velvet black · deep quiet' },
  'noiraciel-fallen-without-fear':     { emotion: 'The descent chosen freely — falling as an act of courage rather than failure.', symbols: 'open arms · downward rush · no regret · wind · total surrender' },
  'noiraciel-heaven-burns-tonight':    { emotion: 'The sky as battlefield — the night when everything sacred is tested.', symbols: 'burning clouds · orange sky · upturned face · iron smell · last light' },
  'noiraciel-mercy-in-flames':         { emotion: 'Forgiveness that costs something — grace with heat in it, not cold absolution.', symbols: 'warm fire · open hand · scar tissue · offered grace · lit darkness' },
  'noiraciel-no-light-left':           { emotion: 'The bottom of the dark — where there is nothing left to lose, and therefore nothing left to fear.', symbols: 'absolute dark · still water · bare ground · silence · empty hands' },
  'noiraciel-saint-of-the-damned':     { emotion: 'The patron of the lost — the one who stays when everyone else leaves.', symbols: 'kneeling figure · outstretched arms · broken congregation · low light · chosen witness' },
  'noiraciel-sin-of-an-angel':         { emotion: 'The transgression that makes the divine human — the fall that is also intimacy.', symbols: 'bitten fruit · descending figure · warm shadow · choosing · irrevocable step' },
  'noiraciel-the-devil-knows-my-name': { emotion: 'Being seen completely by the darkest thing — and finding it is not the end.', symbols: 'red eyes in dark · recognition · own name · standing ground · unbroken' },
  'noiraciel-when-angels-go-to-war':   { emotion: 'The violence of the righteous — justice that does not apologise for its fire.', symbols: 'drawn sword · storm clouds · battle stance · bright conviction · iron will' },
  'noiraciel-the-last-prayer':         { emotion: 'The final word to something greater — spoken when nothing else remains but truth.', symbols: 'kneeling alone · whispered words · fading light · clasped hands · open sky' },
}

const JAZZ_SESSIONS_CONTEXT: Record<string, { emotion: string; symbols: string }> = {
  'blood-on-the-hallelujah':        { emotion: 'The hymn that costs something — praise that has earned its scars.', symbols: 'bloodied hands raised · broken choir · last note · bruised faith · earned joy' },
  'carry-you-home':                 { emotion: 'The love that does not leave — carrying what is too heavy for one to bear alone.', symbols: 'two figures · shared weight · slow walk · night road · steady hands' },
  'its-not-always-easy':            { emotion: 'The honest reckoning — neither despair nor false hope, just the truth of difficulty.', symbols: 'sitting still · open window · honest face · morning light · held breath' },
  'keep-a-chair-for-you':           { emotion: 'The table set for the absent — love that holds space beyond presence.', symbols: 'empty chair · table setting · waiting light · place kept · quiet hope' },
  'mercy-wears-a-black-coat':       { emotion: 'Forgiveness in disguise — grace arriving in the form you least expected.', symbols: 'dark coat · outstretched hand · rain · sudden warmth · unexpected arrival' },
  'the-heart-comes-home-at-night':  { emotion: 'The internal homecoming — the heart returning to itself in the small hours.', symbols: 'night window · soft lamp · returning figure · quiet house · safe arrival' },
  'the-river-knows-your-name':      { emotion: 'The land as memory — nature that has absorbed the lives of those who passed through it.', symbols: 'moving water · submerged names · old bridge · listening current · deep recognition' },
  'the-truth-has-teeth':            { emotion: 'Honesty as something sharp — the truth that bites, but is still the truth.', symbols: 'open mouth · bite mark · clear eyes · uncomfortable air · unbending fact' },
  'the-woman-beside-the-fire':      { emotion: 'The silent keeper of warmth — the one who tends the flame so others can sleep.', symbols: 'fire glow · seated figure · tending hands · night watch · given warmth' },
}

const WORLD_MUSICS_CONTEXT: Record<string, { emotion: string; symbols: string }> = {
  'noiraciel-world-music-1':  { emotion: 'A threshold sound — the opening of a portal between the known world and something older, wider, and already waiting.', symbols: 'open gate · ancient road · first light · distant drums · threshold stone' },
  'noiraciel-world-music-2':  { emotion: 'The gathering of voices — bodies moving together to a rhythm that predates language and outlasts borders.', symbols: 'market square · swaying crowd · woven patterns · shared breath · collective pulse' },
  'noiraciel-world-music-3':  { emotion: 'Desert wind and city pulse — two worlds breathing through the same music, neither erasing the other.', symbols: 'sand dunes · city skyline · convergence point · borrowed fire · shared horizon' },
  'noiraciel-world-music-4':  { emotion: 'The river ceremony — water as messenger between the living, the ancient, and those not yet arrived.', symbols: 'flowing water · cupped hands · offering · submerged roots · listening current' },
  'noiraciel-world-music-5':  { emotion: 'Drumbeat as prayer — when the body\'s percussion becomes the only language of devotion that needs no translation.', symbols: 'hands on skin drum · closed eyes · raised face · sweat · sacred ground' },
  'noiraciel-world-music-6':  { emotion: 'Midnight market — the hour when traders and spirits share the same road, and music is the currency between them.', symbols: 'lantern light · moving shadows · whispered exchange · crossroads · open palms' },
  'noiraciel-world-music-7':  { emotion: 'The migration song — carrying home in the body across unmapped distances, the melody arriving before the luggage.', symbols: 'long road · carried bundle · remembered coastline · familiar smell · new sky' },
  'noiraciel-world-music-8':  { emotion: 'Roots in motion — the tradition that travels without disappearing, adapting without forgetting where it began.', symbols: 'deep roots · moving trunk · flexible branches · unchanged seed · living continuity' },
  'noiraciel-world-music-9':  { emotion: 'Dusk ritual — the music that holds the door open between worlds at the hour when both sides are briefly visible.', symbols: 'fading sun · lit candle · between-worlds air · ceremony · last copper light' },
  'noiraciel-world-music-10': { emotion: 'The fire that speaks — flame as elder, music as the only honest translation of what the fire has always been saying.', symbols: 'central fire · listening circle · sparks rising · warm faces · ancient speech' },
  'noiraciel-world-music-11': { emotion: 'Oceanic memory — the sound the Atlantic carries from every crossing, every departure, every impossible return.', symbols: 'deep water · submerged histories · wave memory · salt on skin · crossing lines' },
  'noiraciel-world-music-12': { emotion: 'Ancestral groove — the rhythm your grandparents danced before you were born, living now in your bones without your knowing.', symbols: 'inherited movement · old photograph · bloodline pulse · unnamed grace · body memory' },
  'noiraciel-world-music-13': { emotion: 'The unbroken thread — music as the continuous line running through all cultures, the one thing that was never truly lost.', symbols: 'golden thread · woven fabric · joined hands across time · continuity · living archive' },
  'noiraciel-world-music-14': { emotion: 'Earth frequency — the planet\'s own heartbeat rendered audible, translated into strings and skins and breath.', symbols: 'bare feet on soil · vibrating ground · low resonance · geological time · planetary pulse' },
  'noiraciel-world-music-15': { emotion: 'Return — the final journey back to where all music begins: silence, held carefully, before the first sound and after the last.', symbols: 'closed circle · open hands · returning figure · quiet earth · the space before sound' },
}

const FUNK_MY_WAY_IN_CONTEXT: Record<string, { emotion: string; symbols: string }> = {
  'noiraciel-funk-session-experience-1': { emotion: 'The arrival — pressing into a room with your whole body, the groove announcing you before your name does.', symbols: 'open door · bass line · confident stride · warm room · first notes' },
  'noiraciel-funk-session-experience-2': { emotion: 'Deep pocket — locking in so completely that the music becomes shelter, the groove a place you can live inside.', symbols: 'interlocking gears · steady pulse · closed eyes · collective breath · the pocket' },
  'noiraciel-funk-session-experience-3': { emotion: 'Sweat and craft — the point where years of discipline dissolve into pure ecstasy, where technique becomes joy.', symbols: 'calloused hands · flowing motion · studio heat · muscle memory · earned release' },
  'noiraciel-funk-session-experience-4': { emotion: 'Soul at work — when the body moves before the mind decides, when the music plays you as much as you play it.', symbols: 'moving body · surrendered control · instinct · call and response · given rhythm' },
  'noiraciel-funk-session-experience-5': { emotion: 'The exit — leaving a room changed, carrying the groove in your chest like a second heartbeat that outlasts the night.', symbols: 'closing door · echo in chest · residual warmth · lingering bass · carried pulse' },
}

const REGGAE_SESSIONS_CONTEXT: Record<string, { emotion: string; symbols: string }> = {
  'brighter-days-ahead':              { emotion: 'The promise that refuses to give up — morning held as a form of resistance against everything that tries to dim it.', symbols: 'rising sun · turned face · open window · new air · committed hope' },
  'built-on-love':                    { emotion: 'The only architecture that truly holds — everything real, everything lasting, is built from this one material.', symbols: 'joined hands · solid ground · cornerstone · warmth under weight · enduring structure' },
  'chase-your-dreams':                { emotion: 'The instruction your younger self needed — passed forward now, carried in music to whoever is ready to hear it.', symbols: 'running figure · open horizon · lit path · outstretched hand · forward motion' },
  'cris-de-guerre':                   { emotion: 'A war cry that is also a hymn — the battle worth singing about, the fight that does not lose its soul in the fighting.', symbols: 'raised fist · open throat · drumbeat march · unity · righteous fire' },
  'good-vibes-no-reason':             { emotion: 'The radical act of choosing joy without justification — light that does not wait for permission to arrive.', symbols: 'easy smile · open sky · unasked-for warmth · spontaneous dance · morning sun' },
  'guardians-of-freedom':             { emotion: 'Those who stand watch so others can breathe freely — the unnamed keepers of what most people take for granted.', symbols: 'steady hands · open ground · watchful eyes · protective circle · held space' },
  'hope-through-the-storm':           { emotion: 'Not in spite of the storm — through it. Hope as motion, not stillness. The kind that moves even when soaked.', symbols: 'rain · forward lean · lit lantern · wet road · unbroken stride' },
  'journey-of-patience':              { emotion: 'The longest walk — where you must trust the road long before you are allowed to see its end.', symbols: 'long path · unhurried step · deep roots · slow river · faithful distance' },
  'love-at-first-sight':              { emotion: 'Recognition before knowledge — the impossible moment when the heart understands something the mind has not yet been told.', symbols: 'locked eyes · held breath · sudden stillness · known stranger · instant knowing' },
  'motherlands-cry':                  { emotion: 'The earth\'s own voice — the place that carries you in its memory long after you have left it behind.', symbols: 'red soil · distant mountain · old village · grandmother\'s hands · returning sound' },
  'motherlands-cry-1':                { emotion: 'The echo of the cry — the second call, carrying what the first was too full to say, the grief beneath the grief.', symbols: 'resonant valley · doubled sound · ancient sorrow · held tears · inherited wound' },
  'rise-from-ashes':                  { emotion: 'Phoenix knowledge — the body\'s deep certainty that destruction is not the end, that fire makes room for what comes next.', symbols: 'grey ash · emerging colour · lifted head · renewed ground · first breath after' },
  'rise-up-and-shine':                { emotion: 'The daily resurrection — choosing to be present and luminous in the ordinariness of an ordinary morning.', symbols: 'opened curtain · golden hour · deliberate standing · everyday miracle · given light' },
  'stop-the-war':                     { emotion: 'The simplest and most radical demand — the one that should not need to be made, and yet must be made again and again.', symbols: 'open hands · lowered weapons · silence after noise · common ground · the ask' },
  'sweet-melody-of-love':             { emotion: 'When music and love become indistinguishable from each other — the song that is also an embrace, the note that is also a name.', symbols: 'intertwined melody · warm chord · closed distance · heard heart · given sound' },
  'through-the-pain-and-the-strife':  { emotion: 'The path that goes through, not around — and the strange wholeness found in having crossed what cannot be avoided.', symbols: 'narrow passage · marked hands · arrived figure · other side · earned ground' },
  'walk-with-kindness':               { emotion: 'A way of moving through the world — gentleness not as weakness but as the most demanding form of strength.', symbols: 'slow pace · open door · extended hand · soft eye contact · deliberate care' },
  'waves-of-resilience':              { emotion: 'The ocean\'s lesson — resilience is not the absence of waves but learning to move with what comes, again and again.', symbols: 'riding wave · bent but rooted · water and return · sea breath · patient coast' },
  'you-are-enough':                   { emotion: 'The truth most easily forgotten — said again here, in music, because it needs to be said again, and again, and again.', symbols: 'mirror · open chest · still hands · received warmth · the simple fact' },
}

// ─── Lyrics display ────────────────────────────────────────────────────────────
function LyricsDisplay({ lyrics }: { lyrics: string | null }) {
  if (!lyrics) return (
    <p className="font-heading italic text-sm text-noir-silver/25">— · —</p>
  )
  const stanzas = lyrics.split(/\n\s*\n/).filter((s) => s.trim())
  return (
    <div className="space-y-6">
      {stanzas.map((stanza, i) => (
        <p key={i} className="font-heading italic text-base md:text-lg text-noir-silver/80 leading-loose whitespace-pre-line">
          {stanza.trim()}
        </p>
      ))}
    </div>
  )
}

// ─── Video player ──────────────────────────────────────────────────────────────
function VideoSection({ track }: { track: Track }) {
  const [playing, setPlaying] = useState(false)
  const videoUrl = track.lyricVideoUrl ?? track.videoUrl
  const videoLabel = track.lyricVideoUrl ? 'Lyric Video' : 'Music Video'
  if (!videoUrl) return null

  return (
    <div id="video" className="mt-10">
      <p className="font-body text-[10px] tracking-[0.35em] text-t-accent/50 uppercase mb-4">{videoLabel}</p>
      <div className="aspect-video relative bg-noir-deep border border-noir-silver/10 overflow-hidden">
        {playing ? (
          <video src={videoUrl} className="absolute inset-0 w-full h-full object-cover" controls autoPlay />
        ) : (
          <>
            {track.songArtUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={track.songArtUrl} alt={track.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-noir-void/50">
              <button
                onClick={() => setPlaying(true)}
                className="w-20 h-20 rounded-full border border-noir-ivory/30 bg-noir-void/60 flex items-center justify-center hover:border-t-accent/50 hover:bg-t-accent/10 transition-all duration-300"
                aria-label={`Play ${videoLabel.toLowerCase()} for ${track.title}`}
              >
                <svg className="w-8 h-8 text-noir-ivory ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-4 left-4">
              <p className="font-body text-xs text-noir-ivory/40 tracking-wider">{videoLabel}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Story / audiobook section ─────────────────────────────────────────────────
function StorySection({ story, audiobookUrl, storyPdfUrl }: { story: string; audiobookUrl: string | null; storyPdfUrl: string | null }) {
  const [open, setOpen] = useState(false)
  const paragraphs = story.split(/\n+/).filter(p => p.trim() && !p.trim().startsWith('#'))

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <p className="font-body text-[10px] tracking-[0.35em] text-t-accent/50 uppercase">Short Story</p>
        <div className="flex items-center gap-4">
          {audiobookUrl && (
            <a href={audiobookUrl} className="font-body text-[10px] tracking-[0.2em] text-noir-silver/40 uppercase hover:text-t-accent transition-colors">
              ▶ Audio
            </a>
          )}
          {storyPdfUrl && (
            <a href={storyPdfUrl} target="_blank" rel="noreferrer" className="font-body text-[10px] tracking-[0.2em] text-noir-silver/40 uppercase hover:text-t-accent transition-colors">
              PDF
            </a>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="font-body text-[10px] tracking-[0.2em] text-noir-silver/40 uppercase hover:text-noir-silver transition-colors"
          >
            {open ? 'Collapse' : 'Read'}
          </button>
        </div>
      </div>
      <div className={`overflow-hidden transition-all duration-500 ${open ? 'max-h-none' : 'max-h-32'}`}>
        <div className="border-l border-t-accent/20 pl-6 space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="font-heading italic text-sm text-noir-silver/70 leading-relaxed">
              {p.trim()}
            </p>
          ))}
        </div>
        {!open && (
          <div className="relative h-16 -mt-16 bg-gradient-to-t from-noir-black to-transparent pointer-events-none" />
        )}
      </div>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 font-body text-[10px] tracking-[0.2em] text-t-accent/50 uppercase hover:text-t-accent transition-colors"
        >
          Read full story
        </button>
      )}
    </div>
  )
}

// ─── Chapter navigation ────────────────────────────────────────────────────────
function ChapterNav({ prev, next }: { prev: Track | null; next: Track | null }) {
  return (
    <div className="flex items-center justify-between pt-12 mt-12 border-t border-noir-silver/10">
      <div>
        {prev && (
          <Link href={`/songs/${prev.slug}`} className="group flex flex-col gap-1">
            <span className="font-body text-[10px] tracking-[0.25em] text-noir-silver/30 uppercase">Previous</span>
            <span className="font-heading italic text-lg text-noir-silver/60 group-hover:text-noir-ivory transition-colors">
              ← {prev.title}
            </span>
          </Link>
        )}
      </div>
      <div className="text-right">
        {next && (
          <Link href={`/songs/${next.slug}`} className="group flex flex-col items-end gap-1">
            <span className="font-body text-[10px] tracking-[0.25em] text-noir-silver/30 uppercase">Next</span>
            <span className="font-heading italic text-lg text-noir-silver/60 group-hover:text-noir-ivory transition-colors">
              {next.title} →
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
interface Props {
  track: Track
  prev: Track | null
  next: Track | null
  allTracks: Track[]
  albumIndex?: number | null
  bgImages?: string[]
  story?: string | null
  audiobookUrl?: string | null
  storyPdfUrl?: string | null
  scoreManifestUrl?: string | null
  commentary?: string | null
}

export default function SongChapterPage({ track, prev, next, allTracks, albumIndex, bgImages = [], story, audiobookUrl, storyPdfUrl, scoreManifestUrl, commentary }: Props) {
  const { play, toggle, currentTrack, isPlaying } = useAudio()
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [karaokeMode, setKaraokeMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'film' | 'artwork' | 'directors-cut' | 'ghost' | 'score'>('overview')
  const [cinemaFailed, setCinemaFailed] = useState(false)

  // Check if a timestamp file is likely available for this track
  const hasTimestamps = track.hasLyrics
  const [bgIndex, setBgIndex] = useState(0)
  const isCurrent = currentTrack?.id === track.id

  useEffect(() => {
    if (bgImages.length <= 1) return
    const id = setInterval(() => setBgIndex((i) => (i + 1) % bgImages.length), 4000)
    return () => clearInterval(id)
  }, [bgImages.length])

  useEffect(() => { setCinemaFailed(false) }, [track.slug])

  // G29: load play count from localStorage
  useEffect(() => {
    const saved = parseInt(localStorage.getItem(`nr-play-count-${track.slug}`) || '0', 10)
    setPlayCount(saved)
  }, [track.slug])

  const isBlindAngel    = track.albumSlug === 'blind-angel'
  const isJazzSessions  = track.albumSlug === 'jazz-sessions'
  const isWorldMusics   = track.albumSlug === 'world-musics'
  const isFunk          = track.albumSlug === 'funk-my-way-in'
  const isReggae        = track.albumSlug === 'reggae-sessions'
  const context = isBlindAngel
    ? BLIND_ANGEL_CONTEXT[track.slug]
    : isJazzSessions
    ? JAZZ_SESSIONS_CONTEXT[track.slug]
    : isWorldMusics
    ? WORLD_MUSICS_CONTEXT[track.slug]
    : isFunk
    ? FUNK_MY_WAY_IN_CONTEXT[track.slug]
    : isReggae
    ? REGGAE_SESSIONS_CONTEXT[track.slug]
    : CHAPTER_CONTEXT[track.trackNumber ?? 0]

  const chapterNum = track.trackNumber != null
    ? String(track.trackNumber).padStart(2, '0')
    : albumIndex != null
    ? String(albumIndex + 1).padStart(2, '0')
    : ''

  const albumHref = track.albumSlug === 'blind-angel'            ? '/music/blind-angel'
    : track.albumSlug === 'jazz-sessions'                        ? '/music/jazz-sessions'
    : track.albumSlug === 'the-velvet-machine'                   ? '/music/the-velvet-machine'
    : track.albumSlug === 'still-we-sail'                        ? '/music/still-we-sail'
    : track.albumSlug === 'whats-youre-made-of'                  ? '/music/whats-youre-made-of'
    : track.albumSlug === 'the-sacred-drift'                     ? '/music/the-sacred-drift'
    : track.albumSlug === 'funk-my-way-in'                       ? '/music/funk-my-way-in'
    : track.albumSlug === 'world-musics'                         ? '/music/world-musics'
    : track.albumSlug === 'reggae-sessions'                      ? '/music/reggae-sessions'
    : '/music/the-life-lessons'

  // G25: verbose duration display
  const durVerbose = track.duration
    ? `${Math.floor(track.duration / 60)} min ${String(Math.floor(track.duration % 60)).padStart(2, '0')} sec`
    : track.durationFormatted

  const handlePlay = () => {
    if (isCurrent) toggle()
    else {
      play(track, allTracks)
      // G29: increment play count
      const next = (parseInt(localStorage.getItem(`nr-play-count-${track.slug}`) || '0', 10)) + 1
      localStorage.setItem(`nr-play-count-${track.slug}`, String(next))
      setPlayCount(next)
      // G30: mark played today for AlbumPage dot
      localStorage.setItem(`nr-played-${new Date().toDateString()}-${track.slug}`, '1')
    }
  }

  return (
    <div className="min-h-screen bg-noir-black">
      <ApplyTheme albumSlug={track.albumSlug} />

      {/* Full-bleed artwork header */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        {bgImages.length > 0 ? (
          bgImages.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ${i === bgIndex ? 'opacity-100' : 'opacity-0'}`}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-noir-navy via-noir-atlantic to-noir-void" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-noir-black via-noir-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-noir-black/30 to-transparent" />

        {/* Back nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 md:p-8">
          <Link
            href={albumHref}
            className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-noir-ivory/50 hover:text-noir-ivory transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
            Album
          </Link>
          <Link href="/" className="font-heading text-sm tracking-[0.2em] text-noir-ivory/40 hover:text-noir-ivory transition-colors">
            NoiraCiel
          </Link>
        </div>

        {/* Track info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <p className="font-body text-[10px] tracking-[0.4em] text-t-accent/60 uppercase mb-2">
            Chapter {chapterNum} · {durVerbose}
          </p>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl text-noir-ivory font-light tracking-wide leading-none mb-4">
            {track.title}
          </h1>
          {context?.emotion && (
            <p className="font-heading italic text-base md:text-lg text-noir-ivory/50 max-w-xl leading-relaxed">
              {context.emotion}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 pb-32">

        {/* Audio controls */}
        <div className="flex items-center gap-4 py-8 border-b border-noir-silver/10">
          <button
            onClick={handlePlay}
            className={`flex items-center gap-3 px-6 py-3 font-body text-xs tracking-[0.15em] uppercase transition-all duration-300 ${
              isCurrent && isPlaying
                ? 'bg-t-accent/10 border border-t-accent/40 text-t-accent'
                : 'bg-t-accent text-noir-void hover:bg-t-accent/80'
            }`}
          >
            {isCurrent && isPlaying ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {isCurrent ? 'Resume' : 'Listen'}
              </>
            )}
          </button>

          {(track.lyricVideoUrl || track.videoUrl) && (
            <a
              href="#video"
              className="flex items-center gap-1.5 px-4 py-3 font-body text-xs tracking-[0.15em] uppercase border border-noir-silver/20 text-noir-silver/60 hover:border-t-accent/40 hover:text-t-accent transition-all duration-300"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch
            </a>
          )}

          {context?.symbols && (
            <p className="font-body text-[10px] tracking-[0.2em] text-noir-silver/30 uppercase hidden md:block">
              {context.symbols}
            </p>
          )}
        </div>

        {/* G26/G27/G28/G29/G96: Metadata badges */}
        {(() => {
          // G99: seeded weekly play count
          const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
          const slugHash = track.slug.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0)
          const weeklyPlays = 20 + ((slugHash + weekNum * 17) % 331)
          return (
            <div className="flex flex-wrap items-center gap-2 pt-2 pb-1">
              {playCount > 0 && (
                <span className="font-body text-[9px] tracking-[0.2em] text-t-accent/35 border border-t-accent/15 px-2 py-0.5 uppercase">
                  Played {playCount}×
                </span>
              )}
              {/* G96: song factoid */}
              {track.season && (
                <span className="font-body text-[9px] tracking-[0.18em] text-t-accent/30 border border-t-accent/10 px-2 py-0.5 uppercase">
                  Written in {track.season}
                </span>
              )}
              {track.bpm && (
                <span className="font-body text-[9px] tracking-[0.18em] text-t-accent/30 border border-t-accent/10 px-2 py-0.5 uppercase">
                  {track.bpm} BPM
                </span>
              )}
              {track.songKey && (
                <span className="font-body text-[9px] tracking-[0.18em] text-t-accent/30 border border-t-accent/10 px-2 py-0.5 uppercase">
                  Key of {track.songKey}
                </span>
              )}
              {/* G99: social proof */}
              <span className="font-body text-[9px] tracking-[0.18em] text-noir-silver/22 border border-noir-silver/8 px-2 py-0.5 uppercase">
                {weeklyPlays} played this week
              </span>
            </div>
          )
        })()}

        {/* Tab navigation */}
        <div className="flex items-center gap-0 mt-6 mb-0 border-b border-noir-silver/10 overflow-x-auto">
          {[
            { id: 'overview',      label: 'Overview' },
            { id: 'film',         label: 'Film' },
            { id: 'artwork',      label: 'Living Artwork' },
            { id: 'directors-cut',label: "Director's Cut" },
            { id: 'ghost',        label: 'Ghost Performance' },
            { id: 'score',        label: 'Score' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="flex-shrink-0 px-4 py-3 font-body text-[10px] tracking-[0.2em] uppercase transition-all duration-200 border-b-2"
              style={{
                borderColor: activeTab === tab.id ? 'rgb(var(--t-accent-rgb))' : 'transparent',
                color: activeTab === tab.id ? 'rgb(var(--t-accent-rgb))' : 'rgba(200,196,190,0.38)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Film tab ── */}
        {activeTab === 'film' && (
          <div className="pt-8 pb-12">
            {track.musicVideoUrl ? (
              <>
                <video
                  key={track.slug}
                  controls
                  playsInline
                  style={{ width: '100%', display: 'block', background: '#000' }}
                >
                  <source src={track.musicVideoUrl} type="video/mp4" />
                </video>
                <MediaProvenanceBadge type="ai-video" className="mt-3 block" />
              </>
            ) : (
              <div style={{
                border: '1px solid rgba(196,149,58,0.12)',
                padding: '3rem 2rem',
                textAlign: 'center',
                background: 'rgba(196,149,58,0.02)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.3 }}>◈</div>
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-t-accent/50 mb-4">Song Film</p>
                <p className="font-heading italic text-lg text-noir-ivory/40 leading-relaxed max-w-sm mx-auto">
                  A cinematic short for &ldquo;{track.title}&rdquo; is in the pipeline.
                </p>
                <p className="font-body text-xs text-noir-silver/25 mt-4 max-w-xs mx-auto leading-relaxed">
                  Veo3 · Dark Atlantic visual identity · No dialogue
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Living Artwork tab ── */}
        {activeTab === 'artwork' && (
          <div className="pt-8 pb-12">
            {!cinemaFailed ? (
              /* ── Cinemagraph video player ── */
              <div style={{ position: 'relative', width: '100%', background: '#000' }}>
                <video
                  key={track.slug}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onError={() => setCinemaFailed(true)}
                  style={{
                    width: '100%',
                    maxHeight: '540px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                >
                  <source src={`https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/generated/kie/cinemagraphs/${track.slug}/loop.mp4`} type="video/mp4" />
                </video>
                {/* Caption overlay at bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '2.5rem 2rem 1.5rem',
                  background: 'linear-gradient(to top, rgba(8,8,16,0.92) 0%, transparent 100%)',
                  pointerEvents: 'none',
                }}>
                  <p className="font-body text-[9px] tracking-[0.35em] uppercase text-t-accent/60 mb-1">
                    Living Artwork · Looping Visual
                  </p>
                  <p className="font-heading italic text-lg text-noir-ivory/80 leading-tight">
                    {track.title}
                  </p>
                </div>
              </div>
            ) : (
              /* ── Placeholder (no cinemagraph generated yet) ── */
              <div style={{
                border: '1px solid rgba(196,149,58,0.12)',
                padding: '3rem 2rem',
                textAlign: 'center',
                background: 'rgba(196,149,58,0.02)',
              }}>
                {track.songArtUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={track.songArtUrl}
                      alt={track.title}
                      style={{ maxWidth: '320px', width: '100%', opacity: 0.45, display: 'block', margin: '0 auto 1.5rem' }}
                    />
                    <p className="font-body text-[10px] tracking-[0.3em] uppercase text-t-accent/50 mb-3">Living Artwork — Coming Soon</p>
                    <p className="font-heading italic text-base text-noir-ivory/35 leading-relaxed max-w-sm mx-auto">
                      This still image will be animated into a subtle looping cinemagraph.
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.3 }}>◈</div>
                    <p className="font-body text-[10px] tracking-[0.3em] uppercase text-t-accent/50 mb-4">Living Artwork</p>
                    <p className="font-heading italic text-base text-noir-ivory/40">Artwork not yet generated for this track.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Director's Cut tab ── */}
        {activeTab === 'directors-cut' && (
          <div className="pt-12 pb-8">
            <div style={{
              border: '1px solid rgba(196,149,58,0.12)',
              padding: '3rem 2rem',
              background: 'rgba(196,149,58,0.02)',
            }}>
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-t-accent/50 mb-6 text-center">Director's Cut Commentary</p>
              <div style={{ borderLeft: '1px solid rgba(196,149,58,0.2)', paddingLeft: '1.5rem', maxWidth: '520px', margin: '0 auto' }}>
                <p className="font-heading italic text-base md:text-lg text-noir-ivory/50 leading-relaxed mb-4">
                  "{track.title}."
                </p>
                {commentary ? (
                  <p className="font-body text-sm text-noir-silver/55 leading-relaxed whitespace-pre-line">
                    {commentary}
                  </p>
                ) : (
                  <>
                    {context?.emotion && (
                      <p className="font-body text-sm text-noir-silver/40 leading-relaxed mb-4">
                        {context.emotion}
                      </p>
                    )}
                    <p className="font-body text-xs text-noir-silver/25 leading-relaxed">
                      A personal commentary — narrated by the artist — will appear here once generated.
                      ElevenLabs voice synthesis · InfiniteTalk avatar · 1–3 minutes.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Ghost Performance tab ── */}
        {activeTab === 'ghost' && (
          <GhostPerformanceTab track={track} />
        )}

        {/* ── Score tab ── */}
        {activeTab === 'score' && (
          <div className="pt-8 pb-12">
            {scoreManifestUrl ? (
              <>
                {/* Play prompt — only when track isn't playing */}
                {!isCurrent || !isPlaying ? (
                  <div className="flex items-center gap-4 mb-8 p-4 border border-noir-silver/10 bg-noir-deep/40">
                    <div className="flex-1">
                      <p className="font-body text-[10px] tracking-[0.25em] text-t-accent/50 uppercase mb-1">
                        Score follows playback
                      </p>
                      <p className="font-body text-xs text-noir-silver/40">
                        Play the track and the score scrolls automatically, highlighting note by note.
                      </p>
                    </div>
                    <button
                      onClick={handlePlay}
                      className="flex items-center gap-2 px-5 py-2.5 bg-t-accent text-noir-void font-body text-xs tracking-[0.12em] uppercase hover:bg-t-accent/80 transition-all flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Play &amp; Follow
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-t-accent animate-pulse" />
                    <p className="font-body text-[10px] tracking-[0.25em] text-t-accent/60 uppercase">
                      Following playback — tracking note by note
                    </p>
                  </div>
                )}
                <ScoreViewer trackSlug={track.slug} manifestUrl={scoreManifestUrl} />
              </>
            ) : (
              <div style={{
                border: '1px solid rgba(196,149,58,0.12)',
                padding: '3rem 2rem',
                textAlign: 'center',
                background: 'rgba(196,149,58,0.02)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.2 }}>♩</div>
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-t-accent/50 mb-4">Musical Score</p>
                <p className="font-heading italic text-lg text-noir-ivory/40 leading-relaxed max-w-sm mx-auto">
                  The score for &ldquo;{track.title}&rdquo; is being transcribed.
                </p>
                <p className="font-body text-xs text-noir-silver/25 mt-4 max-w-xs mx-auto leading-relaxed">
                  AI transcription · Demucs · Basic Pitch · Verovio · Note-by-note playback sync
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Overview content (existing) ── */}
        {activeTab === 'overview' && <>

        {/* Lyric video — shown before lyrics */}
        <VideoSection track={track} />

        {/* Lyrics or instrumental notes */}
        <div className="mt-12">
          {track.hasLyrics ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="font-body text-[10px] tracking-[0.35em] text-t-accent/50 uppercase">
                  Lyrics
                  {track.lyrics && (
                    <span className="ml-2 text-noir-silver/30 normal-case tracking-normal">
                      · {track.lyrics.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  {hasTimestamps && (
                    <button
                      onClick={() => setKaraokeMode(!karaokeMode)}
                      className="font-body text-[10px] tracking-[0.2em] uppercase transition-all duration-300"
                      style={{
                        padding: '5px 14px',
                        borderRadius: '999px',
                        border: `1px solid ${karaokeMode ? '#C4953A' : 'rgba(196,149,58,0.35)'}`,
                        color: karaokeMode ? '#C4953A' : 'rgba(196,149,58,0.55)',
                        background: karaokeMode ? 'rgba(196,149,58,0.08)' : 'transparent',
                        letterSpacing: '0.2em',
                      }}
                    >
                      {karaokeMode ? '✦ Karaoke' : 'Karaoke Mode'}
                    </button>
                  )}
                  {!karaokeMode && (
                    <button
                      onClick={() => setLyricsOpen(!lyricsOpen)}
                      className="font-body text-[10px] tracking-[0.2em] text-noir-silver/40 uppercase hover:text-noir-silver transition-colors"
                    >
                      {lyricsOpen ? 'Collapse' : 'Expand'}
                    </button>
                  )}
                </div>
              </div>

              {karaokeMode ? (
                <SyncedLyricsPlayer
                  slug={track.slug}
                  audioUrl={track.audioUrl}
                  className="mt-2"
                />
              ) : (
                <>
                  <div className={`overflow-hidden transition-all duration-500 ${lyricsOpen ? 'max-h-none' : 'max-h-48'}`}>
                    <div className="border-l border-t-accent/20 pl-6">
                      <LyricsDisplay lyrics={track.lyrics} />
                    </div>
                    {!lyricsOpen && (
                      <div className="relative h-16 -mt-16 bg-gradient-to-t from-noir-black to-transparent pointer-events-none" />
                    )}
                  </div>
                  {!lyricsOpen && (
                    <button
                      onClick={() => setLyricsOpen(true)}
                      className="mt-3 font-body text-[10px] tracking-[0.2em] text-t-accent/50 uppercase hover:text-t-accent transition-colors"
                    >
                      Read full lyrics
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <p className="font-body text-[10px] tracking-[0.35em] text-t-accent/50 uppercase mb-6">Chapter Notes</p>
              <div className="border-l border-t-accent/20 pl-6 space-y-5">
                {context?.emotion ? (
                  <>
                    <p className="font-heading italic text-base md:text-lg text-noir-silver/70 leading-relaxed">
                      {context.emotion}
                    </p>
                    {context.symbols && (
                      <p className="font-body text-[10px] tracking-[0.2em] text-noir-silver/30 uppercase mt-4">
                        {context.symbols}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="font-heading italic text-sm text-noir-silver/30 leading-relaxed">
                    Instrumental — pure sound, no words.
                  </p>
                )}
                {track.songArtUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.songArtUrl}
                    alt={track.title}
                    className="mt-6 w-full max-w-sm border border-noir-silver/10 opacity-60 hover:opacity-80 transition-opacity duration-500"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Audio book / story */}
        {story && <StorySection story={story} audiobookUrl={audiobookUrl ?? null} storyPdfUrl={storyPdfUrl ?? null} />}

        {/* Song DNA — live frequency visualiser */}
        <SongDNA />

        {/* Fan Wall */}
        <section className="pt-16 mt-16 border-t border-gold/15">
          <FanWall slug={track.slug} />
        </section>

        {/* G31: More from this album */}
        {activeTab === 'overview' && allTracks.filter(t => t.id !== track.id).length > 0 && (
          <section className="pt-10 mt-10 border-t border-noir-silver/10">
            <p className="font-body text-[9px] tracking-[0.3em] text-t-accent/40 uppercase mb-4">More From This Album</p>
            <div className="space-y-3">
              {allTracks.filter(t => t.id !== track.id).slice(0, 3).map(t => (
                <Link key={t.id} href={`/songs/${t.slug}`} className="group flex items-center gap-3">
                  {t.songArtUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.songArtUrl} alt="" className="w-9 h-9 object-cover flex-shrink-0 opacity-50 group-hover:opacity-80 transition-opacity border border-noir-silver/10" />
                  ) : (
                    <div className="w-9 h-9 bg-noir-deep flex-shrink-0 border border-noir-silver/10 flex items-center justify-center">
                      <span className="font-body text-[8px] text-t-accent/30">{String(t.trackNumber ?? '').padStart(2,'0')}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-body text-sm text-noir-ivory/60 group-hover:text-noir-ivory transition-colors truncate">{t.title}</p>
                    <p className="font-body text-[10px] text-noir-silver/25">{t.durationFormatted}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        </> /* end overview tab */}

        {/* Chapter nav — always visible */}
        <ChapterNav prev={prev} next={next} />
      </div>
    </div>
  )
}
