#!/usr/bin/env node
/**
 * generate-subalbum-art.js
 *
 * Generates one cinematic thumbnail per track for sub-albums (Jazz Sessions,
 * Blind Angel, and future albums). Images land in the same public/images/song-art/
 * folder as the main album art and are picked up by the same manifest.
 *
 * State is stored separately from the main album script to avoid conflicts:
 *   public/images/song-art/.state-subalbums.json
 *
 * USAGE
 *   node scripts/generate-subalbum-art.js                        # dry-run (see all prompts)
 *   node scripts/generate-subalbum-art.js --execute              # submit all jobs
 *   node scripts/generate-subalbum-art.js --execute --album jazz # jazz sessions only
 *   node scripts/generate-subalbum-art.js --poll                 # poll + download
 *   node scripts/generate-subalbum-art.js --list                 # status
 *   node scripts/generate-subalbum-art.js --reset                # clear sub-album state
 *   node scripts/generate-subalbum-art.js --force                # re-generate existing
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')

loadEnv()

// ─── Config ───────────────────────────────────────────────────────────────────
const OUTPUT_DIR       = path.join(__dirname, '..', 'public', 'Images', 'song-art')
const STATE_FILE       = path.join(OUTPUT_DIR, '.state-subalbums.json')
const MANIFEST_FILE    = path.join(OUTPUT_DIR, 'manifest.json')
const PUBLIC_BASE      = '/images/song-art'
const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS  = 20 * 60 * 1000

// ─── Args ─────────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2)
const DRY_RUN    = !args.some(a => ['--execute','--poll','--list','--reset','--rebuild-manifest'].includes(a))
const EXEC_MODE  = args.includes('--execute')
const POLL_MODE  = args.includes('--poll')
const LIST_MODE  = args.includes('--list')
const RESET_MODE = args.includes('--reset')
const REBUILD_MANIFEST_MODE = args.includes('--rebuild-manifest')
const FORCE      = args.includes('--force')
const ALBUM_FILTER = (() => {
  const i = args.indexOf('--album')
  return i !== -1 ? args[i + 1] : null
})()

// ─── Shared style base ────────────────────────────────────────────────────────
const JAZZ_STYLE = `
Visual style: 16mm film grain, deep navy and warm amber palette, painterly, European art cinema.
Jazz + Atlantic Noir: candlelit rooms, harbour-side at night, worn wood and brass, late-night intimacy.
No text. No human faces. No neon. No logos. Square composition.
`.trim()

const METAL_STYLE = `
Visual style: 16mm film grain, near-black shadows, cold pale silver and bone white, painterly.
Intimate Metal: ancient stone, chapel architecture, raw textures, single light sources, weight and stillness.
No text. No human faces. No neon. No logos. Square composition.
`.trim()

const REGGAE_STYLE = `
Visual style: 16mm film grain, warm earth tones — terracotta, deep ochre, forest green, aged gold.
Reggae + Atlantic Noir: sunlit coastal landscapes, hands in soil, community gatherings at dusk,
ancient trees, distant horizons, weathered objects that carry memory.
Cinematic composition, natural light, painterly textures, no artificial lighting.
No text. No human faces. No neon. No logos. Square composition.
`.trim()

// ─── Track definitions ────────────────────────────────────────────────────────
const ALBUMS = [
  {
    id:     'jazz-sessions',
    label:  'NoiraCiel Jazz Sessions',
    style:  JAZZ_STYLE,
    tracks: [
      {
        id:    'carry-you-home',
        title: 'Carry you Home',
        prompt: `
A pair of worn leather boots at a cottage doorstep, one candle burning in the window behind.
Rain streaks the glass. A coat hangs on an old peg beside the door.
Someone has just returned after a long journey — the threshold between outside and in.
Atlantic fog beyond the gate. Amber candlelight, deep navy night.
${JAZZ_STYLE}
        `.trim(),
      },
      {
        id:    'its-not-always-easy',
        title: "It's not always easy",
        prompt: `
A jazz musician's hands resting completely still on closed piano keys in a dim room.
The weight of years visible in the stillness of those hands.
A half-empty glass on the piano lid, a ring of moisture on the wood.
Rain audible through a half-open door at the far edge of frame.
One low lamp. The music has stopped but is still present.
${JAZZ_STYLE}
        `.trim(),
      },
      {
        id:    'keep-a-chair-for-you',
        title: 'Keep a Chair for you',
        prompt: `
An empty wooden chair pulled slightly away from a small café table, a coat draped over the back.
The table is set for two. One cup full, one cup empty and waiting.
A small wilted flower in a glass on the table. The empty side of the table holds presence.
Soft amber light, deep shadows. The chair is kept. Someone is always expected.
${JAZZ_STYLE}
        `.trim(),
      },
      {
        id:    'mercy-wears-a-black-coat',
        title: 'Mercy Wears a Black Coat',
        prompt: `
A long heavy black coat hanging on a single wooden peg on a worn stone wall.
Cold pale light falls on it from one side, casting a deep shadow.
The coat is presence — both shelter and weight. Beneath it, old cobblestones.
A harbour or alley barely visible in the misted background.
Near-black shadows, cold silver highlights, the coat is the only warmth.
${JAZZ_STYLE}
        `.trim(),
      },
      {
        id:    'the-heart-comes-home-at-night',
        title: 'The Heart Comes Home At Night',
        prompt: `
A lit amber window in a stone terrace house seen from a wet cobblestone street at 2am.
Fog surrounds and softens the light. Every other window is dark.
A shadow moves slowly behind the curtain — someone is there, someone came home.
The warmth of that single window against the cold deep navy night is the whole story.
${JAZZ_STYLE}
        `.trim(),
      },
      {
        id:    'the-river-knows-your-name',
        title: 'The River Knows your name',
        prompt: `
Looking directly down at a slow dark river at night from a stone bridge.
The water is near-black and nearly still, holding one reflection of a distant amber lamp.
Old mossy stonework at the water's edge. Absolute silence implied in the stillness.
The river has been here longer than anyone alive. It remembers everything.
Near-black water, one pale gold reflection, deep atmospheric mist.
${JAZZ_STYLE}
        `.trim(),
      },
      {
        id:    'the-truth-has-teeth',
        title: 'The Truth has teeth',
        prompt: `
A vintage ribbon microphone on a small jazz club stage, lit by one harsh overhead spotlight.
Everything beyond the light radius is total darkness — the audience invisible.
A battered notebook open on a stool beside the mic, handwriting too small to read.
The mic leans slightly forward, waiting. The truth is about to be spoken into the dark.
Stark chiaroscuro light, deep shadows, warm amber on metal and paper.
${JAZZ_STYLE}
        `.trim(),
      },
      {
        id:    'the-woman-beside-the-fire',
        title: 'The Woman Beside the Fire',
        prompt: `
Extreme close detail: amber firelight falling on worn wooden floorboards.
The hem of a long dark dress at the very edge of the frame. A pair of still feet at rest.
The arm of an old upholstered chair, a hand resting on it. The fire itself is not seen.
Only its warmth, its amber light across the room. Someone is present and at peace.
Deep amber, the feeling of being home, of not going anywhere tonight.
${JAZZ_STYLE}
        `.trim(),
      },
      {
        id:    'blood-on-the-hallelujah',
        title: 'Blood on the Hallelujah',
        prompt: `
A close view of an old church pew in a bare stone chapel, a single prayer book left open on it.
The book is well-worn, its pages soft. A candle stub burns nearby, wax pooled and still.
One narrow stained-glass window casts a single bar of cold amber-red light across the pew.
The chapel is empty. The prayer was said. Whatever was hoped for cost something real.
Deep amber and garnet, candlelight, cold stone, an intimate scale.
${JAZZ_STYLE}
        `.trim(),
      },
    ],
  },

  // ─── The Blind Angel — Intimate Metal Sessions ───────────────────────────────
  {
    id:     'blind-angel',
    label:  'The Blind Angel — Intimate Metal Sessions',
    style:  METAL_STYLE,
    tracks: [
      {
        id:    'noiraciel-angel-of-darkness',
        title: 'Noiraciel - Angel of Darkness',
        prompt: `
A stone angel in an ancient chapel alcove, completely submerged in shadow save for one cold streak
of light from a high window crossing its chest. The angel's posture is still, neither at peace
nor threatening — suspended between states. Ancient cracked stone, dust on every surface.
The darkness is not empty; it is inhabited. Near-black with cold silver light on stone.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-ashes-of-heaven',
        title: 'Noiraciel - Ashes of Heaven',
        prompt: `
A close detail of a stone floor strewn with large white feathers, some charred at the edges,
some disintegrating into pale ash. A single beam of cold white light from above falls on the
feathers and ash. The feathers were once enormous — belonging to something vast.
The ash is still drifting, settling. Cold, pale, quiet devastation.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-black-wings-rising',
        title: 'Noiraciel - Black Wings Rising',
        prompt: `
Looking upward through a ruined chapel arch at the dark sky. Against the opening, barely visible,
two vast black wings are half-open, feathers edged with cold silver moonlight.
The stone arch is ancient and broken. The wings fill the sky. No body, only wings.
Upward perspective, near-black, cold silver at the feather edges, sky deep charcoal.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-blind-halo',
        title: 'Noiraciel - Blind Halo',
        prompt: `
A tarnished halo lying face-down on cold stone flagstones, its glow faint and inverted,
illuminating the floor instead of a head. The light it casts is dim and directionless.
Around it, absolute darkness. The halo has fallen and no longer crowns anything.
Bone white metal on dark stone, dim radiating glow, cold and still.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-blood-on-the-halo',
        title: 'Noiraciel - Blood on the Halo',
        prompt: `
A close detail of a golden halo resting on ancient stone, one deep crimson stain across its
surface. The gold is worn, the stain recent. A single candle stub burns nearby, its flame
casting warm light that makes the crimson look brighter against the cold stone.
Warm gold and deep crimson against near-black stone. Intimate scale.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-broken-wings-burning-soul',
        title: 'Noiraciel - Broken Wings, Burning Soul',
        prompt: `
A single large wing, broken at the joint, lying on dark stone, its feathers splayed.
In the centre of frame, between the broken feathers, a small ember glows — not fire, just an ember,
persisting. The wing is massive and ruined. The ember is tiny and alive.
Near-black, the ember the only warm light, bone white feathers at the edges of the wing.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-crown-of-fire',
        title: 'Noiraciel - Crown of Fire',
        prompt: `
A crown of twisted iron sitting alone on a dark stone altar, wreathed in a ring of low cold fire —
the flames pale blue-white, barely visible, burning without fuel.
The crown is heavy and old. The fire does not warm; it marks. No one wears it.
Near-black stone, cold pale flame, iron with bone-white fire. Still and terrible.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-darkness-made-divine',
        title: 'Noiraciel - Darkness Made Divine',
        prompt: `
Looking up at a cathedral ceiling from the floor, the vast dark vault above completely dark
except for one tiny point of cold white light at the apex — distant and unreachable.
The stone ribs of the vault disappear into darkness. The floor is dark stone.
The single point of light is not warmth; it is the idea of light. Scale: vast above, nothing below.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-fallen-without-fear',
        title: 'Noiraciel - Fallen Without Fear',
        prompt: `
A long perspective down a stone staircase descending into absolute blackness.
On the steps, scattered feathers — large, white, some still falling in suspension.
The staircase continues beyond sight. There is no bottom visible. The fall is ongoing.
The feathers are not chaotic — they drift with strange calm. Descent without panic.
Near-black, cold stone steps, bone-white feathers suspended mid-fall.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-heaven-burns-tonight',
        title: 'Noiraciel - Heaven Burns Tonight',
        prompt: `
Looking up through a broken chapel window at a sky that is entirely deep amber and charcoal —
the sky itself seems to burn, dark fire clouds in motion. The window frame is ancient stone,
cracked, the glass long gone. The burning sky is framed by ruin. No flame visible, only the sky.
Near-black stone frame, amber-charcoal burning sky, cold stone interior.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-mercy-in-flames',
        title: 'Noiraciel - Mercy in flames',
        prompt: `
An outstretched stone hand — part of a broken statue — palm upward, cradling a small flame.
The flame is warm gold, genuine, small. The stone hand is ancient and cracked, the arm broken off
at the wrist, lying on dark stone. Mercy offered from a broken thing.
Warm amber flame against near-black stone. Intimate scale — the hand fills the frame.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-no-light-left',
        title: 'Noiraciel - No Light Left',
        prompt: `
A single candle on a stone ledge — its flame just extinguished. A thin thread of smoke rises
straight up in the stillness of the room. The smoke is the only movement. Everything else is dark.
The wax is warm and soft still. This was the last candle. The smoke says so.
Near-total darkness, only the smoke and the faintest warm glow from the just-dead wick.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-saint-of-the-damned',
        title: 'Noiraciel - Saint of the Damned',
        prompt: `
A stone saint statue in a ruined alcove, half its face eroded away, one hand raised in a gesture
of blessing that has worn almost to nothing. Around its base, old wax drips from candles long gone.
It has been prayed to by the forgotten. It remains. Cold stone, shadow, dignity in erosion.
Near-black, cold silver light on worn stone, deep shadow filling the alcove.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-sin-of-an-angel',
        title: 'Noiraciel - Sin of an Angel',
        prompt: `
A single white feather, large and perfect, lying across a dark stone threshold — half inside,
half outside a doorway. The feather is pristine; the stone around it is worn and ancient.
Something has crossed where it should not have. The feather is the evidence.
Bone white feather, near-black stone, the threshold line cutting through the centre of frame.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-the-devil-knows-my-name',
        title: 'Noiraciel - The Devil Knows My Name',
        prompt: `
A name scratched deeply into old stone — the letters just out of sharp focus, illegible,
but the scratching is deep and deliberate. Cold raking light from one side makes the cuts visible.
The stone is very old. The name was put there with something sharp, in urgency or ritual.
Near-black stone, cold side-light on the carved letters, nothing else visible.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-when-angels-go-to-war',
        title: 'Noiraciel - When Angels go to War',
        prompt: `
A stone gauntlet — part of an ancient suit of armour — lying on the floor of a chapel,
its fingers curled around nothing. Large white feathers are scattered around it, also on the floor.
The armour and the feathers together tell the story. Something that was both sacred and soldier.
Near-black stone floor, cold silver light on the armour, bone-white feathers around it.
${METAL_STYLE}
        `.trim(),
      },
      {
        id:    'noiraciel-the-last-prayer',
        title: 'Noiraciel -The Last Prayer',
        prompt: `
One small candle burning on the floor of an empty ruined chapel, surrounded by complete darkness.
Its circle of light barely reaches the cracked stone around it. Everything beyond is dark.
The candle is the last warmth in this space. Its flame is steady — no wind, no movement.
This is what remains. Tiny warm amber circle in near-total darkness, cold stone floor.
${METAL_STYLE}
        `.trim(),
      },
    ],
  },
]

  // ─── Reggae Sessions ──────────────────────────────────────────────────────────
  {
    id:     'reggae-sessions',
    label:  'Reggae Sessions',
    style:  REGGAE_STYLE,
    tracks: [
      {
        id:    'brighter-days-ahead',
        title: 'Brighter Days Ahead',
        prompt: `
A coastal cliff edge at the moment before sunrise — the sky a deep indigo with a thin gold line
breaking along the horizon. Waves far below, catching the first light. An old wooden signpost
leans at the cliff edge, weathered, pointing toward open sea.
The horizon glows with unmistakable promise. Dawn as a physical thing arriving.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'built-on-love',
        title: 'Built on Love',
        prompt: `
Two weathered hands clasped together over a worn wooden table, one older, one younger.
Between the hands, a small seedling in a clay pot, roots visible through the terracotta.
The table has marks of decades of meals. Morning light comes through a half-open door behind.
Love as foundation — the thing underneath everything that holds without show.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'chase-your-dreams',
        title: 'Chase Your Dreams',
        prompt: `
An empty coastal road stretching toward the horizon, slightly uphill, disappearing into golden light.
A pair of worn running shoes abandoned at the road's edge, their laces undone.
The road continues without them — someone went further than the shoes could go.
The horizon is close and open. Speed implied in stillness. No destination, only direction.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'cris-de-guerre',
        title: 'Cris de Guerre',
        prompt: `
A single torch burning in the dark at the centre of an empty stone square, its flame upright and tall.
The square is old cobblestone, the buildings around it ancient and shut. No one is there yet.
But the torch is lit — someone put it there, someone is coming. The flame is defiant and steady.
A cry before the gathering. Light as declaration.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'good-vibes-no-reason',
        title: 'Good Vibes No Reason',
        prompt: `
A hammock strung between two ancient trees on a sun-dappled hillside, empty but still swinging gently.
Below, a valley of green with a distant river catching afternoon light. A half-eaten mango on the ground.
The scene breathes contentment with no justification. Joy that requires no explanation.
Warm ochre and deep forest green. The afternoon as a gift.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'guardians-of-freedom',
        title: 'Guardians of Freedom',
        prompt: `
An ancient stone watchtower on a hilltop at dusk, its door slightly open, a faint amber glow inside.
Below the hill, a wide valley in soft evening light — the land the tower has watched over for centuries.
The tower is worn but standing. Whoever watches does so without recognition, without reward.
The weight of keeping something alive so others can live freely within it.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'hope-through-the-storm',
        title: 'Hope Through the Storm',
        prompt: `
A small boat on a grey churning sea, its single light still burning through heavy rain and mist.
The sea is rough but the light holds. The boat is barely visible, but the light is certain.
Rain streaks the foreground. Somewhere in the distance, a break in the clouds — a thin gold edge.
The storm is real. So is the light. Both at once.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'journey-of-patience',
        title: 'Journey of Patience',
        prompt: `
A long dirt road winding through farmland at golden hour, no one on it, no destination visible.
On the road's side, a very old tree, its roots surfacing through dry earth, its shadow long.
The road has been walked many times, the earth remembers. There is no hurry in this landscape.
Patience as a form of knowing. Time as terrain.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'love-at-first-sight',
        title: 'Love at First Sight',
        prompt: `
A single candle reflected in a rain-streaked window at night, the outside world blurred and dark.
The reflection creates two flames — one inside, one ghosted in the glass. The double image hangs.
A small table set for two, one chair slightly closer to the candle.
The moment before something irrevocable. Light doubled. Intimacy on the threshold.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'motherlands-cry',
        title: 'Motherlands Cry',
        prompt: `
Deep view across the Atlantic from a rocky cliff — the sea vast, the sky heavy with grey-gold cloud.
On the cliff edge, a cluster of wildflowers bent sideways in the wind. They hold.
The ocean below is not calm but not violent — it is permanent. It has heard everything.
Ancestral grief as landscape. The sea as memory. The flowers as survival.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'motherlands-cry-1',
        title: 'Motherlands Cry (Version II)',
        prompt: `
A traditional clay cooking pot resting on the remains of an outdoor fire, the ash still warm.
Around it, an overgrown garden, a fence half-fallen, a house barely visible behind trees.
Something was prepared here many times. The fire is out. The pot remains. The house is empty now.
Grief across distance — the specific sorrow of a home that no longer holds those who built it.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'rise-from-ashes',
        title: 'Rise from Ashes',
        prompt: `
A single green shoot emerging from a wide field of dry grey ash, its colour vivid against the grey.
The ash extends to the frame edges — whatever burned here was vast. The shoot is small and exact.
Morning light hits the shoot from an angle, casting a long shadow behind it.
Life returning where no one expected it. The first evidence. Renewal as quiet fact.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'rise-up-and-shine',
        title: 'Rise Up and Shine',
        prompt: `
A rooftop at sunrise — the golden disc of the sun just clearing the horizon, seen from above.
Below the rooftop, the street is still in shadow. Up here, the light has already arrived.
An old wooden chair faces the sun. A cup of something warm steams on the parapet.
Rising before the world does. Light as decision, not accident.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'stop-the-war',
        title: 'Stop the War',
        prompt: `
A single white cloth hanging on a washing line, backlit by afternoon sun, perfectly still.
Behind it, a stone wall with traces of something that was written and then covered.
The cloth is the only white thing in a landscape of grey stone and dry earth.
Surrender offered. Peace as object. The flag already raised, no one yet to receive it.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'sweet-melody-of-love',
        title: 'Sweet Melody of Love',
        prompt: `
Close detail of an acoustic guitar resting against a sun-warmed stone wall in afternoon light.
A hand of picked wildflowers tucked into the guitar strings — yellow and white against warm cedar.
The shadow of the flowers falls across the guitar body. Music and summer together.
Love as atmosphere — warm, unhurried, slightly impractical, exactly right.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'through-the-pain-and-the-strife',
        title: 'Through the Pain and the Strife',
        prompt: `
A figure's shadow (no body visible) stretched long across a cracked stone path at sunset.
The shadow is moving forward — the direction of movement visible in its lean.
The path is worn, cracked by years and heat. It continues past the frame.
Whatever came before is behind the frame. What remains is the continuing. The shadow keeps going.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'walk-with-kindness',
        title: 'Walk with Kindness',
        prompt: `
A narrow village lane, cobblestoned, in warm afternoon light. Two old wooden doors, side by side,
one slightly open with warm amber light inside. A small plant on each doorstep.
The lane is empty but lived-in — someone has recently been here, the light is on, the door is open.
Kindness as daily fact. The ordinary given with care.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'waves-of-resilience',
        title: 'Waves of Resilience',
        prompt: `
A long view along a dark sand beach at low tide, the retreating wave leaving a mirror of light.
A single weathered post driven into the sand at the water's edge, wrapped in rope.
The sea has pulled back but the post stands. The reflection on the wet sand doubles everything.
Resilience as physical fact — the thing that holds when the sea decides to return.
${REGGAE_STYLE}
        `.trim(),
      },
      {
        id:    'you-are-enough',
        title: 'You Are Enough',
        prompt: `
An old mirror in an outdoor stone alcove, its glass weathered and spotted, still reflecting sky.
The frame is carved stone, ornate, old, slightly overgrown with moss at the edges.
The mirror reflects a warm blue sky and one drifting cloud. Nothing else. The sky is enough.
Self as landscape. Sufficiency as reflection. The world simply as it is.
${REGGAE_STYLE}
        `.trim(),
      },
    ],
  },
]

// ─── State helpers ────────────────────────────────────────────────────────────
function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {}
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch { return {} }
}

function saveState(state) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
}

function isComplete(entry) {
  return entry?.status === 'complete' && entry?.localPath && fs.existsSync(entry.localPath)
}

function isPending(entry) {
  return entry?.status === 'pending' || entry?.status === 'generating'
}

// ─── Manifest rebuild (merges main album + sub-albums) ────────────────────────
function rebuildManifest() {
  const mainStatePath = path.join(OUTPUT_DIR, '.state.json')
  const mainState     = fs.existsSync(mainStatePath)
    ? JSON.parse(fs.readFileSync(mainStatePath, 'utf-8'))
    : {}
  const subState = loadState()

  const all = [...Object.values(mainState), ...Object.values(subState)]
    .filter(e => (e.status === 'complete' || e.status === 'done') && e.publicUrl)

  const manifest = Object.fromEntries(all.map(e => [e.id, e.publicUrl]))
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8')
  log(`Manifest rebuilt — ${all.length} total artworks (${Object.values(subState).filter(e => e.status === 'complete').length} sub-album).`)
}

// ─── Flatten active albums and tracks ────────────────────────────────────────
function getActiveTracks() {
  const albums = ALBUM_FILTER
    ? ALBUMS.filter(a => a.id.startsWith(ALBUM_FILTER))
    : ALBUMS
  return albums.flatMap(a => a.tracks.map(t => ({ ...t, albumLabel: a.label })))
}

// ─── --reset ──────────────────────────────────────────────────────────────────
function runReset() {
  if (!fs.existsSync(STATE_FILE)) { log('Nothing to reset.'); return }
  const count = Object.keys(JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))).length
  fs.writeFileSync(STATE_FILE, JSON.stringify({}, null, 2))
  log(`✓ Reset ${count} sub-album entries.`)
}

// ─── --list ───────────────────────────────────────────────────────────────────
function runList() {
  const state = loadState()
  console.log('\n🖼  Sub-album art status:\n')
  for (const album of ALBUMS) {
    if (ALBUM_FILTER && !album.id.startsWith(ALBUM_FILTER)) continue
    console.log(`  ── ${album.label} ──`)
    for (const t of album.tracks) {
      const e = state[t.id]
      const sym = { none:'○', pending:'⏳', generating:'🔄', complete:'✅', failed:'✗' }[e?.status ?? 'none'] ?? '?'
      const detail = e?.status === 'complete' ? `→ ${e.publicUrl}` : e?.taskId ? `taskId: ${e.taskId}` : ''
      console.log(`    ${sym}  ${t.title.padEnd(44)} [${(e?.status ?? 'none').padEnd(10)}]  ${detail}`)
    }
    console.log()
  }
}

// ─── --execute ────────────────────────────────────────────────────────────────
async function runExecute() {
  if (!process.env.KIE_API_KEY) { err('KIE_API_KEY not set — check .env.local'); process.exit(1) }

  const state  = loadState()
  const tracks = getActiveTracks()
  let submitted = 0

  for (const t of tracks) {
    const existing = state[t.id]
    if (!FORCE && isComplete(existing)) { log(`⏭  "${t.title}" — already complete`); continue }
    if (!FORCE && isPending(existing))  { log(`⏭  "${t.title}" — already pending (${existing.taskId})`); continue }

    process.stdout.write(`  🖼  "${t.title}" — submitting… `)
    try {
      const taskId = await submitImageJob(t.prompt, {
        aspectRatio:  '1:1',
        outputFormat: 'jpeg',
        model:        'flux-kontext-pro',
      })
      state[t.id] = {
        id:          t.id,
        label:       t.title,
        taskId,
        status:      'pending',
        remoteUrl:   null,
        localPath:   null,
        publicUrl:   null,
        submittedAt: new Date().toISOString(),
        completedAt: null,
        error:       null,
      }
      saveState(state)
      console.log(`✓ taskId: ${taskId}`)
      submitted++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      state[t.id] = { id: t.id, label: t.title, taskId: null, status: 'failed',
                      remoteUrl: null, localPath: null, publicUrl: null,
                      submittedAt: null, completedAt: null, error: e.message }
      saveState(state)
    }

    if (submitted < tracks.length) await sleep(RATE_LIMIT_MS)
  }

  log(`\n✅  Submitted ${submitted} job(s). Run --poll to download.`)
}

// ─── --poll ───────────────────────────────────────────────────────────────────
async function runPoll() {
  const state   = loadState()
  const pending = Object.values(state).filter(e => e.taskId && (e.status === 'pending' || e.status === 'generating'))

  if (pending.length === 0) { log('No pending jobs.'); return }
  log(`Polling ${pending.length} job(s)…`)

  const deadline  = Date.now() + POLL_TIMEOUT_MS
  const remaining = new Set(pending.map(e => e.id))

  while (remaining.size > 0 && Date.now() < deadline) {
    for (const id of Array.from(remaining)) {
      const entry = state[id]
      try {
        const result = await pollImageJob(entry.taskId)
        process.stdout.write(`  "${entry.label}" → `)

        if (result.done && !result.failed && result.url) {
          const filename  = `${id}.jpg`
          const localPath = path.join(OUTPUT_DIR, filename)
          process.stdout.write('downloading… ')
          await downloadFile(result.url, localPath)
          state[id] = {
            ...entry,
            status:      'complete',
            remoteUrl:   result.url,
            localPath,
            publicUrl:   `${PUBLIC_BASE}/${filename}`,
            completedAt: new Date().toISOString(),
          }
          saveState(state)
          console.log(`✓ ${PUBLIC_BASE}/${filename}`)
          remaining.delete(id)
          rebuildManifest()
        } else if (result.done && result.failed) {
          state[id] = { ...entry, status: 'failed', error: 'Kie.ai returned failed state' }
          saveState(state)
          console.log('✗ failed')
          remaining.delete(id)
        } else {
          if (entry.status === 'pending') {
            state[id] = { ...entry, status: 'generating' }
            saveState(state)
          }
          console.log('⏳')
        }
      } catch (e) {
        console.log(`⚠  ${e.message}`)
      }
      await sleep(500)
    }

    if (remaining.size > 0) {
      log(`  ${remaining.size} still generating — waiting ${POLL_INTERVAL_MS / 1000}s…`)
      await sleep(POLL_INTERVAL_MS)
    }
  }

  if (remaining.size > 0) warn(`Timed out. ${remaining.size} still pending — run --poll again.`)
  else log('All sub-album art complete!')
}

// ─── Dry run ──────────────────────────────────────────────────────────────────
function runDryRun() {
  const tracks = getActiveTracks()
  console.log(`\n🖼  DRY RUN — Sub-album art prompts  (${tracks.length} tracks)\n`)
  console.log('─'.repeat(80))
  for (const album of ALBUMS) {
    if (ALBUM_FILTER && !album.id.startsWith(ALBUM_FILTER)) continue
    console.log(`\n══  ${album.label}  ══\n`)
    for (const t of album.tracks) {
      console.log(`▶  "${t.title}"  (id: ${t.id})`)
      console.log(t.prompt.split('\n').map(l => `   ${l}`).join('\n'))
      console.log()
    }
    console.log('─'.repeat(80))
  }
  console.log(`\n📊  ${tracks.length} thumbnail(s) — use --execute to generate.\n`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (RESET_MODE)            { runReset(); return }
  if (LIST_MODE)             { runList();  return }
  if (REBUILD_MANIFEST_MODE) { rebuildManifest(); return }
  if (POLL_MODE)             { await runPoll();    return }
  if (EXEC_MODE)             { await runExecute(); return }
  runDryRun()
}

main().catch(e => { err(e.message); process.exit(1) })
