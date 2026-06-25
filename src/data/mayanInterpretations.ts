/**
 * mayanInterpretations.ts — symbolic & poetic readings for the NoiraCiel Daily Glyph.
 *
 * This is an ARTISTIC interpretation layer, inspired by historical Maya calendar
 * traditions. It is not a scientific prediction, a claim about historical Maya
 * cosmology, nor a horoscope. The language is deliberately invitational
 * ("today invites…", "the symbolic pressure of the day is…") and never predictive
 * ("you will receive…", "love is coming…").
 *
 * Two datasets:
 *   • TZOLKIN_INTERPRETATIONS — the 20 day-signs (indexed by signIndex 0–19)
 *   • TONE_INTERPRETATIONS    — the 13 tones (indexed by tone 1–13)
 *
 * combineGlyph() weaves a tone + sign into a single daily guidance object that the
 * Speaker and the Daily Glyph panel both consume.
 */

import { getMayanDay, getWaveBounds, type MayanDay } from '@/lib/mayanCalendar'

export interface SignInterpretation {
  index: number
  name: string
  keywords: string[]
  emotional: string   // emotional meaning
  creative: string    // creative meaning
  shadow: string      // shadow side
  noiraciel: string   // NoiraCiel poetic interpretation
}

export interface ToneInterpretation {
  number: number
  name: string        // traditional-style coefficient name
  theme: string
  advice: string
  shadow: string
  creative: string    // creative instruction
}

export interface LordInterpretation {
  number: number      // 1–9
  glyph: string       // "G1"…"G9"
  theme: string       // the night's undercurrent (symbolic, not scholarly)
}

// ── The 20 day-signs ─────────────────────────────────────────────────────────
export const TZOLKIN_INTERPRETATIONS: SignInterpretation[] = [
  {
    index: 0,
    name: 'Imix',
    keywords: ['source', 'beginning', 'trust', 'the deep water'],
    emotional: 'A day that touches the very bottom — where feeling begins before it has a name.',
    creative: 'Good for the first mark on the empty page, before judgement arrives.',
    shadow: 'Drowning in what has not yet taken form; mistaking flood for depth.',
    noiraciel: 'NoiraCiel would call this an Atlantic day — everything still underwater, beautiful and unfinished.',
  },
  {
    index: 1,
    name: 'Ik',
    keywords: ['breath', 'wind', 'voice', 'spirit'],
    emotional: 'A day to let something move through you without holding it.',
    creative: 'Speak the line out loud before you write it. Let the breath decide the rhythm.',
    shadow: 'Words scattered to the wind; talking instead of saying.',
    noiraciel: 'This is the day of the held breath before a song begins — the silence that is already music.',
  },
  {
    index: 2,
    name: 'Akbal',
    keywords: ['night', 'the house', 'dreaming', 'the inner dark'],
    emotional: 'A day that asks you indoors, into the room with one candle left burning.',
    creative: 'Work by lamplight. The dark is not empty here; it is a place to keep things safe.',
    shadow: 'Hiding mistaken for resting; the door closed too long.',
    noiraciel: 'Pure NoiraCiel: the black sky that makes the small light visible. A day for the intimate, not the bright.',
  },
  {
    index: 3,
    name: 'Kan',
    keywords: ['seed', 'ripeness', 'potential', 'the held spark'],
    emotional: 'A day of quiet readiness — something in you wants to grow but is not in a hurry.',
    creative: 'Plant the idea. Do not dig it up to check whether it has taken.',
    shadow: 'Impatience; forcing open what is still gathering itself.',
    noiraciel: 'Good things grow slow. This day belongs to that lesson.',
  },
  {
    index: 4,
    name: 'Chicchan',
    keywords: ['serpent', 'vital force', 'instinct', 'the body'],
    emotional: 'A day when the body knows before the mind agrees. Listen to the spine.',
    creative: 'Trust the first instinct in the rhythm — the groove your body finds without counting.',
    shadow: 'Reaction without reflection; letting the nerve speak for the heart.',
    noiraciel: 'The body remembers the fire. Today it remembers louder than usual.',
  },
  {
    index: 5,
    name: 'Cimi',
    keywords: ['release', 'transition', 'surrender', 'the threshold'],
    emotional: 'A day to let something end well — not with violence, but with respect.',
    creative: 'Cut the verse that no longer serves the song. The silence it leaves is a gift.',
    shadow: 'Clinging; calling stagnation loyalty.',
    noiraciel: 'Grief with dignity. The empty chair given its proper place at the table.',
  },
  {
    index: 6,
    name: 'Manik',
    keywords: ['the hand', 'the deer', 'healing', 'grasp'],
    emotional: 'A day to take hold of one thing gently and completely.',
    creative: 'Make something with your hands. Let the gesture matter more than the result.',
    shadow: 'Grabbing; closing the hand around what should be left open.',
    noiraciel: 'The hand that leaves a light on. Small acts of care, done without being seen.',
  },
  {
    index: 7,
    name: 'Lamat',
    keywords: ['the star', 'Venus', 'abundance', 'harmony'],
    emotional: 'A day to notice what is already enough.',
    creative: 'Work toward beauty, not perfection. Let one thing be simply lovely.',
    shadow: 'Excess; mistaking more for better.',
    noiraciel: 'A star over the Atlantic — beauty that asks for nothing back. Still worth it.',
  },
  {
    index: 8,
    name: 'Muluc',
    keywords: ['water', 'offering', 'emotion', 'memory'],
    emotional: 'A day when feeling rises like a tide. Let it come; let it go.',
    creative: 'Pour memory into the work. The oldest ache often makes the truest line.',
    shadow: 'Being swept; sentiment standing in for truth.',
    noiraciel: 'Saudade itself — the ache of loving what is absent, turned into something you can hold.',
  },
  {
    index: 9,
    name: 'Oc',
    keywords: ['the dog', 'loyalty', 'guidance', 'the heart'],
    emotional: 'A day for the people who stay. Faithfulness, the quiet kind.',
    creative: 'Make something for one person, not for everyone. Devotion gives the work its spine.',
    shadow: 'Loyalty to what no longer deserves it; obedience mistaken for love.',
    noiraciel: 'Always in your corner. The love that walks beside you without needing to speak.',
  },
  {
    index: 10,
    name: 'Chuen',
    keywords: ['the monkey', 'the artisan', 'play', 'weaving'],
    emotional: 'A day to take yourself less seriously and your craft more.',
    creative: 'Play. Improvise. The mistake might be the door.',
    shadow: 'Cleverness without depth; performance instead of presence.',
    noiraciel: 'The sacred machine at play — art made for the joy of making, before anyone is watching.',
  },
  {
    index: 11,
    name: 'Eb',
    keywords: ['the road', 'the human', 'service', 'the journey'],
    emotional: 'A day to walk your ordinary path with full attention.',
    creative: 'Serve the song, not your ego. Ask what the work needs, not what you want from it.',
    shadow: 'Drifting; letting the road walk you.',
    noiraciel: 'Maybe the meaning is the road itself. Dignity in the ordinary day.',
  },
  {
    index: 12,
    name: 'Ben',
    keywords: ['the reed', 'the pillar', 'the spine', 'integrity'],
    emotional: 'A day to stand straight in what you believe, gently.',
    creative: 'Hold the structure. Let the form carry the feeling instead of fighting it.',
    shadow: 'Rigidity; principle hardened into pride.',
    noiraciel: 'Free men tell the truth. Today the spine is the instrument.',
  },
  {
    index: 13,
    name: 'Ix',
    keywords: ['the jaguar', 'the shaman', 'magic', 'the earth'],
    emotional: 'A day for the unseen — intuition, the thing you sense but cannot prove.',
    creative: 'Trust the strange choice. The work wants a little wildness today.',
    shadow: 'Secrecy; power kept in the dark for its own sake.',
    noiraciel: 'She walks through smoke. The feminine mystery, the grammar of what is withheld.',
  },
  {
    index: 14,
    name: 'Men',
    keywords: ['the eagle', 'vision', 'the higher view', 'distance'],
    emotional: 'A day to rise above the detail and see the shape of the whole.',
    creative: 'Step back from the canvas. Ask where this is all going.',
    shadow: 'Coldness; looking down instead of looking at.',
    noiraciel: 'Beyond the edge — the first to look past the known water and imagine more.',
  },
  {
    index: 15,
    name: 'Cib',
    keywords: ['the owl', 'the elder', 'wisdom', 'the inner voice'],
    emotional: 'A day to ask what those before you would say, and to listen.',
    creative: 'Let the old forms teach you. Tradition is not a cage; it is a riverbed.',
    shadow: 'Living in the past; mistaking memory for guidance.',
    noiraciel: 'The roots we cannot see — the invisible inheritance speaking quietly through you.',
  },
  {
    index: 16,
    name: 'Caban',
    keywords: ['the earth', 'movement', 'synchronicity', 'evolution'],
    emotional: 'A day that carries movement, but not every movement deserves obedience. Let the first impulse pass; the second may be the true one.',
    creative: 'Follow the coincidence. The world is rhyming today — write down the rhyme.',
    shadow: 'Restlessness; mistaking motion for progress.',
    noiraciel: 'The earth turning beneath the still ones. Move cleaner, not faster.',
  },
  {
    index: 17,
    name: 'Etznab',
    keywords: ['the mirror', 'the flint', 'clarity', 'the blade'],
    emotional: 'A day for honesty — with the gentleness that real honesty requires.',
    creative: 'Cut what is false. The edit is the art today.',
    shadow: 'Cruelty dressed as truth; the blade turned on the self.',
    noiraciel: 'If we can’t say the hard truths. The mirror that does not flatter, but does not wound.',
  },
  {
    index: 18,
    name: 'Cauac',
    keywords: ['the storm', 'transformation', 'renewal', 'the rain'],
    emotional: 'A day of weather inside — let the storm pass through and clear the air.',
    creative: 'Let the chaos in for a while. The flood waters a field before it floods a house.',
    shadow: 'Drama; summoning the storm to avoid the calm.',
    noiraciel: 'The interior fire meeting the Atlantic rain. Transformation that does not ask permission.',
  },
  {
    index: 19,
    name: 'Ahau',
    keywords: ['the sun', 'completion', 'illumination', 'the lord'],
    emotional: 'A day to honour what is whole, and to let yourself be seen.',
    creative: 'Finish something. Sign your name to it. Let it be enough.',
    shadow: 'Vanity; needing the light to fall only on you.',
    noiraciel: 'The dark sky that makes the light visible. Completion held with humility.',
  },
]

// ── The 13 tones (galactic numbers) ──────────────────────────────────────────
export const TONE_INTERPRETATIONS: ToneInterpretation[] = [
  {
    number: 1,
    name: 'Unity',
    theme: 'The single intention. Everything begins as one quiet decision.',
    advice: 'Today invites you to choose one thing and let the rest wait.',
    shadow: 'Scattering yourself across too many beginnings.',
    creative: 'Start. A single note, a single line. Do not orchestrate yet.',
  },
  {
    number: 2,
    name: 'Duality',
    theme: 'The tension of two. What you want and what you fear, in the same room.',
    advice: 'The symbolic pressure of the day is to hold both sides without rushing to resolve them.',
    shadow: 'Splitting the world into enemies; forcing a false either/or.',
    creative: 'Write the dialogue. Let the two voices in the song actually disagree.',
  },
  {
    number: 3,
    name: 'Movement',
    theme: 'The first real motion. The idea wants a body.',
    advice: 'A good day to notice where energy actually wants to go — and to follow it once.',
    shadow: 'Activity for its own sake; noise to cover uncertainty.',
    creative: 'Sketch fast and rough. Capture the gesture, not the finish.',
  },
  {
    number: 4,
    name: 'Form',
    theme: 'The four corners. Structure, measure, the shape that holds.',
    advice: 'Today invites you to build the frame before you decorate the house.',
    shadow: 'Over-planning; building walls before you know the door.',
    creative: 'Decide the structure — the verse/chorus, the chapter map. Let form free you.',
  },
  {
    number: 5,
    name: 'Radiance',
    theme: 'The centre that gives. What you have gathered begins to shine outward.',
    advice: 'A good day to give something away — attention, a kindness, a finished line.',
    shadow: 'Depleting yourself; performing generosity for praise.',
    creative: 'Share the work-in-progress with one trusted ear. Let it leave your hands a little.',
  },
  {
    number: 6,
    name: 'Flow',
    theme: 'Rhythm and balance. The organic pulse that needs no force.',
    advice: 'The day favours steadiness over intensity. Find the tempo you can keep.',
    shadow: 'Coasting; mistaking comfort for harmony.',
    creative: 'Lock the groove. Repeat until the repetition becomes a river.',
  },
  {
    number: 7,
    name: 'Reflection',
    theme: 'The still mirror at the centre. The day turns inward to see clearly.',
    advice: 'Today invites you to pause and ask whether this is still true.',
    shadow: 'Paralysis; over-thinking the living thing to death.',
    creative: 'Step back. Listen to the whole take once, doing nothing. Then decide.',
  },
  {
    number: 8,
    name: 'Integrity',
    theme: 'Harmonising the parts. Wholeness through honest alignment.',
    advice: 'A good day to make your actions match your words.',
    shadow: 'Rigid perfectionism; sacrificing life for symmetry.',
    creative: 'Reconcile the sections. Make the bridge belong to the same song as the verse.',
  },
  {
    number: 9,
    name: 'Intention',
    theme: 'The greater purpose. Patience pulled toward completion.',
    advice: 'Today invites a longer view — what is this in service of?',
    shadow: 'Grasping at the result; impatience disguised as ambition.',
    creative: 'Push through the difficult middle. The work asks for endurance now, not inspiration.',
  },
  {
    number: 10,
    name: 'Manifestation',
    theme: 'The idea becomes real, with all the weight reality carries.',
    advice: 'A good day to finish and let it exist imperfectly in the world.',
    shadow: 'Materialism; mistaking the object for the meaning.',
    creative: 'Render it. Export it. Let the thing become a thing you can touch.',
  },
  {
    number: 11,
    name: 'Release',
    theme: 'Dissolving the old to make space. Necessary disruption.',
    advice: 'The symbolic pressure of the day is to let go of what you have outgrown.',
    shadow: 'Tearing down for the thrill; change as avoidance.',
    creative: 'Break your own rule. Delete the safe choice and see what the gap reveals.',
  },
  {
    number: 12,
    name: 'Understanding',
    theme: 'Gathering the lessons. Complexity resolving into clarity.',
    advice: 'Today invites you to make sense of what you have lived, gently.',
    shadow: 'Over-explaining; flattening mystery into mere conclusions.',
    creative: 'Write the reflection, the liner note, the why. Name what the work taught you.',
  },
  {
    number: 13,
    name: 'Transcendence',
    theme: 'The full cycle. Completion that opens into the next beginning.',
    advice: 'A good day to honour an ending and trust what it makes room for.',
    shadow: 'Clinging to the summit; refusing to come back down and begin again.',
    creative: 'Release it fully, then let it go. The next thing is already breathing.',
  },
]

// ── The Nine Lords of the Night ──────────────────────────────────────────────
// A symbolic 9-day undercurrent. Themes are artistic, not scholarly claims.
export const LORD_INTERPRETATIONS: LordInterpretation[] = [
  { number: 1, glyph: 'G1', theme: 'a night of beginnings kept quiet — what stirs before it is named' },
  { number: 2, glyph: 'G2', theme: 'a night of two minds — the dark where decisions are weighed' },
  { number: 3, glyph: 'G3', theme: 'a night of water and depth — feeling moving underneath the day' },
  { number: 4, glyph: 'G4', theme: 'a night of the hearth — the small fire that keeps the house warm' },
  { number: 5, glyph: 'G5', theme: 'a night of the centre — gathering what was scattered' },
  { number: 6, glyph: 'G6', theme: 'a night of passage — thresholds crossed while the world sleeps' },
  { number: 7, glyph: 'G7', theme: 'a night of the jaguar — instinct awake in the dark' },
  { number: 8, glyph: 'G8', theme: 'a night of completion — what the day built, settling into place' },
  { number: 9, glyph: 'G9', theme: 'a night of the deep source — the oldest dark, where renewal begins' },
]

export interface DailyGlyph {
  mayan: MayanDay
  sign: SignInterpretation
  tone: ToneInterpretation
  lord: LordInterpretation
  /** A woven tone + sign reflection in the NoiraCiel voice (deterministic fallback). */
  guidance: string
  /** A single open question to sit with. */
  reflectionQuestion: string
}

// A small bank of reflective questions, chosen deterministically by the day so a
// given date always yields the same prompt.
const REFLECTION_QUESTIONS = [
  'What part of you is asking for noise because it is afraid of silence?',
  'What would you do today if you trusted that good things grow slow?',
  'What is the one true sentence you have been avoiding?',
  'Who are you trying to reach, and what are you really trying to say?',
  'What are you carrying that was never yours to hold?',
  'Where is your life asking for restraint instead of more?',
  'What would it look like to finish one thing today, and let it be enough?',
  'What light are you leaving on, and for whom?',
  'What feeling are you mistaking for the truth?',
  'What ending have you not yet let arrive with dignity?',
  'What would change if you moved cleaner instead of faster?',
  'What does the quiet part of you already know?',
  'What beautiful, aching thing are you refusing to make?',
]

/**
 * combineGlyph — weave a tone + sign into one daily reflection.
 * Pure and deterministic for a given date.
 */
export function combineGlyph(mayan: MayanDay): DailyGlyph {
  const sign = TZOLKIN_INTERPRETATIONS[mayan.tzolkin.signIndex]
  const tone = TONE_INTERPRETATIONS[mayan.tzolkin.tone - 1]
  const lord = LORD_INTERPRETATIONS[mayan.lordOfNight.number - 1]

  const guidance =
    `${tone.advice} ${sign.emotional} ` +
    `In the rhythm of ${tone.name.toLowerCase()} and the sign of ${sign.name}, ${sign.noiraciel}`

  // Deterministic question selection seeded by the Julian Day Number.
  const question = REFLECTION_QUESTIONS[mayan.julianDayNumber % REFLECTION_QUESTIONS.length]

  return { mayan, sign, tone, lord, guidance, reflectionQuestion: question }
}

/**
 * getDailyGlyph — convenience wrapper: compute the glyph for a date.
 * Defaults to today in NoiraCiel time (via getMayanDay). This is the single
 * function the page, API and recommendation engine call.
 */
export function getDailyGlyph(date?: Date): DailyGlyph {
  return combineGlyph(date ? getMayanDay(date) : getMayanDay())
}

// ─────────────────────────────────────────────────────────────────────────────
// THE 13-DAY WAVE (TRECENA)
//
// A day is never read alone. The daily Kin is the scene; the 13-day wave is the
// chapter. The wave is named by the sign of its Tone 1 (anchor) day, and it runs
// as a 13-stage emotional arc from seed to completion.
// ─────────────────────────────────────────────────────────────────────────────

export interface WavePosition {
  position: number   // 1–13
  title: string      // the stage's name
  /** What it means to sit at this point in the arc (symbolic, invitational). */
  arc: string
  creativePrompt: string
}

// The arc the user lives across the 13 days. Mapped to the tone structure but
// phrased as a single continuous story rather than isolated tones.
export const WAVE_POSITIONS: WavePosition[] = [
  { position: 1,  title: 'Seed',          arc: 'the opening pressure — an intention enters before it has form',         creativePrompt: 'Name the one thing this chapter is about. Write it in a single line.' },
  { position: 2,  title: 'Polarity',      arc: 'the first conflict — what you want meets what resists it',              creativePrompt: 'Let the two opposing voices speak. Do not resolve them yet.' },
  { position: 3,  title: 'Movement',      arc: 'the first action — the idea asks for a body',                           creativePrompt: 'Make one rough, fast move. Capture the gesture, not the finish.' },
  { position: 4,  title: 'Foundation',    arc: 'structure — the frame that will hold everything that follows',          creativePrompt: 'Decide the shape: the form, the map, the boundaries.' },
  { position: 5,  title: 'Resource',      arc: 'power — gathering what you actually have to work with',                 creativePrompt: 'Take inventory. Use only what is real and present.' },
  { position: 6,  title: 'Rhythm',        arc: 'flow — the steady pulse that needs no force',                          creativePrompt: 'Find the tempo you can keep. Repeat until it becomes a river.' },
  { position: 7,  title: 'Mirror',        arc: 'the midpoint and inner test — the wave stops being an idea and becomes a question about you', creativePrompt: 'Step back and tell yourself the truth about where this stands.' },
  { position: 8,  title: 'Refinement',    arc: 'integrity — aligning the parts so they belong to one whole',           creativePrompt: 'Cut what is false. Make the bridge belong to the same song.' },
  { position: 9,  title: 'Depth',         arc: 'patience and larger meaning — the longer view through the difficult middle', creativePrompt: 'Endure. Ask what this is in service of, and keep going.' },
  { position: 10, title: 'Manifestation', arc: 'visible form — the work becomes a thing that exists in the world',       creativePrompt: 'Finish a version. Let it be real and imperfect.' },
  { position: 11, title: 'Release',       arc: 'simplification — letting go of what the chapter has outgrown',          creativePrompt: 'Remove. Delete the safe choice and see what the gap reveals.' },
  { position: 12, title: 'Understanding', arc: 'integration — the lessons resolving into clarity',                      creativePrompt: 'Name what this chapter taught you. Write the liner note.' },
  { position: 13, title: 'Completion',    arc: 'ascension and transition — an ending that opens the next beginning',     creativePrompt: 'Release it fully, then let it go. The next wave is already breathing.' },
]

export interface WaveDay {
  position: number
  date: string
  tone: number
  signName: string
  kinDisplay: string
  shortMeaning: string
  noiracielPrompt: string
}

export interface WaveReading {
  currentDay: {
    gregorianDate: string
    kinDisplay: string
    tone: number
    signName: string
  }
  wave: {
    name: string
    anchorSign: string
    startDate: string
    endDate: string
    currentPosition: number
    theme: string
    shadow: string
    creativePurpose: string
    noiracielInterpretation: string
    days: WaveDay[]
  }
}

/**
 * getCurrentWave — the full 13-day wave reading for the day containing `date`.
 * The wave's character comes from its anchor sign (the Tone 1 day-sign), framed
 * as a 13-stage arc.
 */
export function getCurrentWave(date?: Date): WaveReading {
  const bounds = date ? getWaveBounds(date) : getWaveBounds()
  const anchor = TZOLKIN_INTERPRETATIONS[bounds.anchorSignIndex]
  const todayMayan = bounds.days[bounds.currentPosition - 1]

  const days: WaveDay[] = bounds.days.map((d, i) => {
    const sign = TZOLKIN_INTERPRETATIONS[d.tzolkin.signIndex]
    const pos = WAVE_POSITIONS[i]
    return {
      position: pos.position,
      date: d.gregorianDate,
      tone: d.tzolkin.tone,
      signName: d.tzolkin.signName,
      kinDisplay: d.tzolkin.display,
      shortMeaning: `${pos.title} · ${sign.keywords[0]}`,
      noiracielPrompt: pos.creativePrompt,
    }
  })

  return {
    currentDay: {
      gregorianDate: todayMayan.gregorianDate,
      kinDisplay: todayMayan.tzolkin.display,
      tone: todayMayan.tzolkin.tone,
      signName: todayMayan.tzolkin.signName,
    },
    wave: {
      name: `The ${anchor.name} Wave`,
      anchorSign: anchor.name,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      currentPosition: bounds.currentPosition,
      theme: `This wave is carried by ${anchor.name} — ${anchor.keywords.join(', ')}. ${anchor.emotional}`,
      shadow: anchor.shadow,
      creativePurpose: anchor.creative,
      noiracielInterpretation: `Inside NoiraCiel, this wave feels like ${anchor.noiraciel}`,
      days,
    },
  }
}

/**
 * getWaveInterpretation — a compact, voice-ready summary of a wave reading,
 * weaving the anchor's character with today's position in the arc. Deterministic
 * fallback text the Speaker (or UI) can use when no live model output is needed.
 */
export function getWaveInterpretation(wave: WaveReading): string {
  const pos = WAVE_POSITIONS[wave.wave.currentPosition - 1]
  return (
    `${wave.wave.name} — ${wave.wave.theme} ` +
    `Today sits at the point where ${pos.arc}. ` +
    `${wave.wave.noiracielInterpretation}`
  )
}
