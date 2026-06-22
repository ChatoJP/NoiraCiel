#!/usr/bin/env node
/**
 * generate-sacred-drift.js
 * Full pipeline: "The Sacred Drift" — Indie Pop · R&B · DnB · Trip-Pop · Psych · Mantras
 *
 * node scripts/generate-sacred-drift.js --submit
 * node scripts/generate-sacred-drift.js --poll
 * node scripts/generate-sacred-drift.js --status
 * node scripts/generate-sacred-drift.js --write-lyrics
 */
'use strict'

const fs   = require('fs')
const path = require('path')
const https = require('https')
const http  = require('http')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('='); if (eq === -1) continue
    const k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

const KIE_BASE   = 'https://api.kie.ai/api/v1'
const ROOT       = path.join(__dirname, '..')
const STATE_FILE = path.join(ROOT, '.score-work', 'sacred-drift-state.json')
const SLEEP_MS   = 4000

const ts    = () => new Date().toISOString().slice(11, 19)
const log   = (m) => console.log(`[${ts()}] ${m}`)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const slugify = (s) => s.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const ALBUM = {
  key:     'tsd',
  title:   'The Sacred Drift',
  dirName: 'The_Sacred_Drift',
  slug:    'the-sacred-drift',
  genre:   'Indie Pop · R&B · DnB · Trip-Pop · Psych · Mantras',
  tracks: [
    {
      num: 1, slug: 'so-hum', title: 'So Hum',
      style: 'psychedelic indie pop trip-hop mantra RnB atmospheric dreamy',
      lyrics: `[Mantra]
So hum / so hum / so hum / so hum
(I am that / I am that / I am that)

[Verse 1]
In the space between the breathing / in the gap between the thought
There is something always present / that was never sold or bought
Not the noise of who you're trying / not the armor that you wear
Just the witness / just the stillness / just the one who's always there

[Chorus]
So hum / I am that
So hum / I am that
Everything that rises / everything that falls
I am the one who watches / I am the one who calls
So hum / so hum / so hum

[Verse 2]
You have given yourself names now / you have built yourself in layers
You have worn the masks of seasons / you have said a thousand prayers
But beneath the whole construction / underneath the whole design
Is the frequency that hums you / is the light that is divine

[Chorus]
So hum / I am that
So hum / I am that
Everything that rises / everything that falls
I am the one who watches / I am the one who calls
So hum / so hum / so hum

[Bridge - Mantra build]
So hum / so hum / so hum / so hum
I am that which breathes / I am that which knows
I am that which stays / when everything else goes
So hum / so hum / so hum / so hum

[Outro - whispered mantra]
So hum / so hum / I am that`,
    },
    {
      num: 2, slug: 'the-frequency-knows', title: 'The Frequency Knows',
      style: 'fast DnB psychedelic RnB electronic psy trance mantra bass heavy',
      lyrics: `[Mantra intro]
Om / om / om / om
(the sound before the word / the word before the world)

[Verse 1]
There's a signal underneath it / there's a pulse beneath your skin
There's a frequency that carries / everything you've always been
You have tuned to static stations / you have searched on broken maps
But the signal never left you / it was singing through the gaps

[Chorus]
The frequency knows / the frequency knows
It was always there transmitting / through the highs and the lows
You don't have to find it / you just have to receive
The frequency knows / the frequency knows / believe

[Verse 2]
Every atom in your body / is vibrating with the code
Every breath a sacred download / every exhale a upload
You are both the antenna / and the signal and the source
You were built to be a vessel / and to ride the deeper course

[Chorus]
The frequency knows / the frequency knows
It was always there transmitting / through the highs and the lows
You don't have to find it / you just have to receive
The frequency knows / the frequency knows / believe

[Bridge - DnB mantra drop]
Om namah shivaya / om namah shivaya
The self salutes the self / the self dissolves to stay
Om namah shivaya / om namah shivaya
Drop into the signal / let the static fall away

[Outro]
The frequency knows / om / the frequency knows`,
    },
    {
      num: 3, slug: 'third-signal', title: 'Third Signal',
      style: 'psych indie pop trip-hop female vocal dreamy psy atmospheric reverb',
      lyrics: `[Verse 1]
Beyond the first thought / beyond the second doubt
There is a third signal / that is always broadcast out
It doesn't need reception / it doesn't need a line
It passes through your body / when you get out of the mind

[Pre-Chorus]
Let go / let go / let the third signal in
Let go / let go / where the deeper starts to begin

[Chorus]
Third signal / rising through the noise
Third signal / underneath your voice
Third signal / the one you feel not hear
Third signal / pulling you from fear to clear

[Verse 2]
They said the world was solid / they said it had a floor
But quantum fields are dancing / and there's always something more
You are mostly space and singing / you are light that learned to walk
You are the third signal / behind everything you talk

[Pre-Chorus]
Let go / let go / let the third signal in
Let go / let go / where the deeper starts to begin

[Chorus]
Third signal / rising through the noise
Third signal / underneath your voice
Third signal / the one you feel not hear
Third signal / pulling you from fear to clear

[Bridge - psy build]
Aham brahmasmi / I am the whole
Aham brahmasmi / I am the soul
Aham brahmasmi / everything I see
Aham brahmasmi / is also me

[Outro]
Third signal / third signal / third signal / here`,
    },
    {
      num: 4, slug: 'dissolve', title: 'Dissolve',
      style: 'indie pop R&B trip-pop slow build psychedelic emotional vocal',
      lyrics: `[Verse 1]
I have held myself so tightly / I have gripped the shape I am
But tonight I feel the edges / starting softer starting calm
What if letting go the structure / isn't falling isn't lost
What if the dissolving / is the crossing that it costs

[Chorus]
Dissolve / let me dissolve
Let the borders of me / open and resolve
Dissolve / let me dissolve
Into something wider / into what I was before the walls

[Verse 2]
Every mystic says the same thing / every teacher draws the same
That the self we build around us / is a story and a frame
And beyond the frame is something / that has never had a name
Something vast and warm and present / that was here before I came

[Chorus]
Dissolve / let me dissolve
Let the borders of me / open and resolve
Dissolve / let me dissolve
Into something wider / into what I was before the walls

[Bridge - mantra whisper build]
Tat tvam asi / thou art that
Tat tvam asi / thou art that
Not this body / not this name
Tat tvam asi / the eternal flame

[Outro]
Dissolve / dissolve / dissolve / into the light`,
    },
    {
      num: 5, slug: 'sat-nam', title: 'Sat Nam',
      style: 'Kundalini RnB indie pop psychedelic mantra groove bass',
      lyrics: `[Mantra]
Sat nam / sat nam / sat nam / sat nam
(truth is my identity / truth is my name)

[Verse 1]
I have lied to myself so long / the lie began to feel like home
I built a house of what they wanted / and lived inside it all alone
But underneath the whole construction / there's a name that can't be changed
Sat nam / sat nam / truth is calling / truth has always stayed

[Chorus]
Sat nam / who I am
Sat nam / truth is what I am
Sat nam / underneath the shame
Sat nam / truth is still my name
Sat nam / sat nam

[Verse 2]
When the mind runs its old stories / when the fear begins to speak
Sat nam drops beneath the chatter / to the signal I must seek
I am not the role I'm playing / I am not the mask I wear
Sat nam / I am truth itself / and truth is always there

[Chorus]
Sat nam / who I am
Sat nam / truth is what I am
Sat nam / underneath the shame
Sat nam / truth is still my name
Sat nam / sat nam

[Bridge - mantra drop RnB]
Sat nam / breathe it in / sat nam / breathe it out
Sat nam / past the noise / sat nam / past the doubt
Sat nam / in the marrow / sat nam / in the bone
Sat nam / I was always / sat nam / already home

[Outro]
Sat nam / sat nam / sat nam / sat nam / sat nam`,
    },
    {
      num: 6, slug: 'sacred-static', title: 'Sacred Static',
      style: 'fast DnB psychedelic electronic distorted bass psy trance noise indie',
      lyrics: `[Verse 1]
In between the stations / in the white noise of the dial
In the hiss before the signal / in the gap of every mile
There is something being broadcast / that no radio can catch
Sacred static / sacred static / human and dispatch

[Pre-Chorus]
Turn the noise up / let it wash you / let the static be the prayer
Everything you couldn't hear before / was always in the air

[Chorus]
Sacred static / sacred static / this is how the gods transmit
Sacred static / sacred static / in the noise is where it sits
Drop the search for clear reception / drop the need for perfect sound
Sacred static / sacred static / this is where the self is found

[Verse 2]
Every moment of confusion / every signal that gets crossed
Is the universe reminding / you were never truly lost
What you labeled interference / what you called the broken line
Was the sacred static speaking / in its non-linear design

[Chorus]
Sacred static / sacred static / this is how the gods transmit
Sacred static / sacred static / in the noise is where it sits
Drop the search for clear reception / drop the need for perfect sound
Sacred static / sacred static / this is where the self is found

[Bridge - mantra over DnB drop]
Nada brahma / the world is sound
Nada brahma / the self is sound
Nada brahma / the static sings
Nada brahma / through everything

[Outro - distorted mantra fade]
Sacred static / sacred static / nada brahma / nada brahma`,
    },
    {
      num: 7, slug: 'the-drift', title: 'The Drift',
      style: 'slow trip-hop R&B psychedelic dreamy feminine vocal reverb mantra',
      lyrics: `[Verse 1]
I stopped swimming against the current / I put down the oar
I let the water carry me / to what it knows me for
The drift is not surrender / the drift is trust in flow
The river knows the ocean / I am learning how to go

[Chorus]
The drift / let the drift take you
The drift / what the current makes you
The drift / not floating aimlessly
The drift / is where the sacred waits to be

[Verse 2]
I have spent so many seasons / building against the tide
Controlling every outcome / with nowhere left to hide
But the drift revealed a landscape / I could never force or plan
The drift gave me the sacred / that the fighting never can

[Chorus]
The drift / let the drift take you
The drift / what the current makes you
The drift / not floating aimlessly
The drift / is where the sacred waits to be

[Bridge - mantra whisper over synths]
Ishvara pranidhana / surrender to the source
Ishvara pranidhana / trust the deeper force
Let go / let god / let go / let god
The drift / the drift / the drift / the drift

[Outro]
Let the drift / take you home / let the drift / take you home`,
    },
    {
      num: 8, slug: 'all-is-one', title: 'All Is One',
      style: 'indie pop psychedelic mantra fast psy build electronic euphoric',
      lyrics: `[Mantra intro - building]
Om mani padme hum / om mani padme hum
(the jewel in the lotus / the divine within the ordinary)

[Verse 1]
You see borders where there are none / you see self where there is all
You see ceiling where there's cosmos / you see failure where there's call
Everything you think is separate / everything you think is you
Is the one thing looking at itself / in ten thousand different views

[Chorus]
All is one / all is one / everything you see
All is one / all is one / is also already me
The stone the star the silence / the broken and the whole
All is one / all is one / one consciousness one soul

[Verse 2]
When you love the stranger's child / you are loving what you are
When you weep at someone's music / you are hearing your own star
The compassion that arises / when you witness someone's pain
Is the one thing recognizing / what has always been the same

[Chorus]
All is one / all is one / everything you see
All is one / all is one / is also already me
The stone the star the silence / the broken and the whole
All is one / all is one / one consciousness one soul

[Bridge - mantra euphoric drop]
Om mani padme hum / the jewel in the lotus is you
Om mani padme hum / the divine you've sought is you
All is one / all is one / all is one / all is one
Drop into the knowing / it was always everyone

[Outro]
All is one / om mani padme hum / all is one`,
    },
    {
      num: 9, slug: 'shakti-rising', title: 'Shakti Rising',
      style: 'R&B DnB psychedelic feminine powerful bass tribal mantra electronic',
      lyrics: `[Mantra intro]
Jai ma / jai ma / jai ma / jai ma
(victory to the divine mother / hail the sacred feminine)

[Verse 1]
There is a fire at the base of everything / a coiled power waiting to be freed
It has been called a thousand sacred names / it is the Shakti / it is the seed
The masculine has named and shaped the world / the feminine has been the hidden source
Now the rising / now the claiming / now the sacred feminine takes its course

[Chorus]
Shakti rising / Shakti rising / in the body and the blood
Shakti rising / Shakti rising / from the ancient to the bud
Creative force and cosmic mother / wild and gentle both at once
Shakti rising / Shakti rising / the divine feminine has come

[Verse 2]
In the body / in the marrow / in the kundalini's climb
She has waited in the darkness / she has waited for this time
Not a metaphor not fiction / she's the force in every cell
Shakti rising / Shakti rising / breaking what has been a shell

[Chorus]
Shakti rising / Shakti rising / in the body and the blood
Shakti rising / Shakti rising / from the ancient to the bud
Creative force and cosmic mother / wild and gentle both at once
Shakti rising / Shakti rising / the divine feminine has come

[Bridge - tribal DnB mantra]
Jai ma / jai ma / om shakti / om shakti
Rise through the spine / rise through the crown
Jai ma / jai ma / om shakti / om shakti
She was never down / she was never down

[Outro]
Shakti rising / jai ma / Shakti rising / jai ma`,
    },
    {
      num: 10, slug: 'neti-neti', title: 'Neti Neti',
      style: 'trip-pop psychedelic indie electronic fast mantra meditative bass',
      lyrics: `[Mantra]
Neti neti / neti neti / neti neti / neti neti
(not this / not this — the path of negation to the self)

[Verse 1]
Are you the body / neti neti / not this
Are you the feeling / neti neti / not this
Are you the story / neti neti / not this
Are you the name they gave you / neti neti / not this

[Pre-Chorus]
Then who is doing the asking / who is watching the thought
Who is the witness observing / who cannot be bought

[Chorus]
Neti neti / strip away the layers
Neti neti / past the masks and mirrors
Neti neti / who is watching everything
Neti neti / that's the only thing
Neti neti

[Verse 2]
Are you the success / neti neti / not this
Are you the failure / neti neti / not this
Are you the past wounds / neti neti / not this
Are you the fear of the future / neti neti / not this

[Pre-Chorus]
Then what remains when you strip it / what cannot be removed
What is the ground of your being / what has nothing to prove

[Chorus]
Neti neti / strip away the layers
Neti neti / past the masks and mirrors
Neti neti / who is watching everything
Neti neti / that's the only thing
Neti neti

[Bridge - mantra build drop]
Not the thought / not the thinker / not the knower / not the known
Neti neti / what remains / neti neti / you alone
The pure awareness / the open sky / the witness without why
Neti neti / neti neti / here before you try

[Outro mantra]
Neti neti / neti neti / neti neti / neti neti`,
    },
    {
      num: 11, slug: 'between-the-worlds', title: 'Between the Worlds',
      style: 'psychedelic indie pop dreamy trip-hop mantra shamanic atmospheric',
      lyrics: `[Verse 1]
There is a place between the sleeping and the waking / that the mystics call the door
There is a liminal geography / where the ordinary dissolves to more
You have been there in the fever / you have been there in the grief
You have been between the worlds before / and found relief

[Chorus]
Between the worlds / between the worlds
Where the visible dissolves to light
Between the worlds / between the worlds
Where you know before you know you're right
Between the worlds / this is where the sacred lives
Between the worlds / this is what the mystery gives

[Verse 2]
In the second before sleeping / in the moment after cry
In the breath between the inhale and exhale / is the sky
You have grazed the space between things / you have touched what has no name
Between the worlds is not a destination / it's a flame

[Chorus]
Between the worlds / between the worlds
Where the visible dissolves to light
Between the worlds / between the worlds
Where you know before you know you're right
Between the worlds / this is where the sacred lives
Between the worlds / this is what the mystery gives

[Bridge - shamanic mantra build]
Ayahuasca visions / plant medicine dreams
Nothing is as solid / as the solid world seems
Between the worlds / the ancestors speak
Between the worlds / the ones we seek
Between the worlds / between the worlds

[Outro]
Between the worlds / I have been here before / between the worlds`,
    },
    {
      num: 12, slug: 'om-namah', title: 'Om Namah',
      style: 'fast DnB psychedelic electronic mantra bass tribal euphoric build',
      lyrics: `[Mantra - repeating under everything]
Om namah shivaya / om namah shivaya
(I bow to Shiva / I honor the divine consciousness within)

[Verse 1]
Shiva is the destroyer / of everything that's false
Every wall you built in fear / is waiting for his call
Not destruction as an ending / as a clearing of the stage
Om namah shivaya / the sacred burning of the cage

[Chorus]
Om namah / om namah / om namah shivaya
Let the fire take what's finished / let the new begin today
Om namah / om namah / om namah shivaya
The destroyer is the gift / the ending is the way
Om namah shivaya

[Verse 2]
What the caterpillar calls the end / the butterfly calls a door
What the ego calls the dying / is the self becoming more
Om namah shivaya / I release what I'm not
Om namah shivaya / I become what I've got

[Chorus]
Om namah / om namah / om namah shivaya
Let the fire take what's finished / let the new begin today
Om namah / om namah / om namah shivaya
The destroyer is the gift / the ending is the way
Om namah shivaya

[Bridge - DnB mantra drop climax]
Om namah shivaya / om namah shivaya
Om namah shivaya / om namah shivaya
BURN / RELEASE / DISSOLVE / BECOME
Om namah shivaya / om namah shivaya

[Outro - fading mantra]
Om namah shivaya / om namah shivaya / om`,
    },
    {
      num: 13, slug: 'the-return', title: 'The Return',
      style: 'R&B indie pop psychedelic emotional build mantra journey coming home',
      lyrics: `[Verse 1]
You have traveled very far now / you have wandered through the maps
You have searched in other faces / you have searched in other traps
But the thing you went out looking for / was sitting here in place
The return is not a failure / the return is the embrace

[Chorus]
The return / the return / to the self you always were
The return / the return / past the noise and the blur
Every road that led away from you / was leading back around
The return / the return / is where you're finally found

[Verse 2]
The prodigal is sacred / not for leaving but for back
For the dawning recognition / of what the journey lacked
Not the trophies not the conquering / not the names and not the fire
The return to the original / the self before desire

[Chorus]
The return / the return / to the self you always were
The return / the return / past the noise and the blur
Every road that led away from you / was leading back around
The return / the return / is where you're finally found

[Bridge - mantra build]
Aum / the primordial sound of coming home
Aum / the vibration of the throne
Aum / the sound that was before the word
Aum / the sound that waits to be heard

[Outro]
The return / the return / aum / the return / home`,
    },
    {
      num: 14, slug: 'open-eye', title: 'Open Eye',
      style: 'fast trip-pop psychedelic indie RnB visual third eye mantra bass synth',
      lyrics: `[Verse 1]
They said to look outside for it / they said it was out there
The car the house the body / the love that fills the air
But something kept returning / to the center of my head
The third eye was already open / it was just waiting to be read

[Pre-Chorus]
Ajna / ajna / the eye between the eyes
Ajna / ajna / where the inner and outer rise

[Chorus]
Open eye / open eye / see what's always been in view
Open eye / open eye / the whole world is inside of you
Open eye / every thing you seek outside
Open eye / open eye / it was only ever inside

[Verse 2]
The pineal gland is ancient / it was built to receive the light
DMT at birth and dying / it has guided us through night
The mystic and the scientist / are circling the same flame
The inner eye was always open / consciousness is its name

[Pre-Chorus]
Ajna / ajna / the eye between the eyes
Ajna / ajna / where the inner and outer rise

[Chorus]
Open eye / open eye / see what's always been in view
Open eye / open eye / the whole world is inside of you
Open eye / every thing you seek outside
Open eye / open eye / it was only ever inside

[Bridge - psychedelic mantra drop]
Om ajna namah / open the eye
Om ajna namah / the inner sky
Om ajna namah / purple and gold
Om ajna namah / the story untold
See / see / see / see / open / open / open

[Outro]
Open eye / open eye / already open / already wide`,
    },
    {
      num: 15, slug: 'the-sacred-drift', title: 'The Sacred Drift',
      style: 'epic psychedelic indie pop RnB DnB closing mantra journey full spectrum',
      lyrics: `[Verse 1]
At the end of all the searching / at the end of all the roads
At the end of every teaching / every sacred book bestowed
There is nothing left to conquer / there is nothing left to find
There is only the drifting / of the pure and open mind

[Chorus]
The sacred drift / the sacred drift
Everything is grace and everything's a gift
The sacred drift / the sacred drift
Where the ego finally lets itself be rifted
Into / something / larger / than / itself

[Verse 2]
This is what the mystics drifted toward / this is what the shamans found
This is what the meditators / heard beneath the sound
Not a destination not an answer / not a goal to be achieved
The sacred drift / the sacred drift / is only to be breathed

[Chorus]
The sacred drift / the sacred drift
Everything is grace and everything's a gift
The sacred drift / the sacred drift
Where the ego finally lets itself be rifted
Into / something / larger / than / itself

[Bridge - all mantras returning]
So hum / sat nam / om namah shivaya
Tat tvam asi / neti neti / aham brahmasmi
Om mani padme hum / nada brahma / jai ma
All the names / all the paths / lead here / to the same

The sacred drift / the sacred drift
I am that / I am that / I am that

[Outro - mantra fade into silence]
The sacred drift / om / the sacred drift / om
Om / om / om / om
...
(silence)`,
    },
  ],
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch {}
  return {}
}
function saveState(s) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
}

const API_KEY = process.env.KIE_API_KEY
if (!API_KEY) { console.error('[!] KIE_API_KEY not set'); process.exit(1) }

function kiePost(endpoint, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const opts = {
      hostname: 'api.kie.ai', port: 443, path: `/api/v1${endpoint}`, method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }
    const req = https.request(opts, res => {
      let data = ''; res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch { reject(new Error(data)) } })
    })
    req.on('error', reject); req.write(payload); req.end()
  })
}

function kieGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.kie.ai/api/v1${endpoint}`)
    const opts = {
      hostname: url.hostname, port: 443, path: url.pathname + url.search, method: 'GET',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    }
    const req = https.request(opts, res => {
      let data = ''; res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch { reject(new Error(data)) } })
    })
    req.on('error', reject); req.end()
  })
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    const file = fs.createWriteStream(destPath)
    const proto = url.startsWith('https') ? https : http
    proto.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); return resolve(downloadFile(res.headers.location, destPath))
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', e => { fs.unlink(destPath, () => {}); reject(e) })
  })
}

async function cmdWriteLyrics() {
  const lyricsDir = path.join(ROOT, 'Music', ALBUM.dirName, 'lyrics')
  fs.mkdirSync(lyricsDir, { recursive: true })
  for (const track of ALBUM.tracks) {
    const numStr = String(track.num).padStart(2, '0')
    const dest = path.join(lyricsDir, `${numStr}_${track.slug}_v1.md`)
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, `---\ntitle: ${track.title}\n---\n\n${track.lyrics.trim()}\n`)
      log(`✓  ${path.relative(ROOT, dest)}`)
    }
  }
  log('Lyrics written.')
}

async function cmdSubmit() {
  const state = loadState()
  let submitted = 0
  for (const track of ALBUM.tracks) {
    const key = `tsd:${track.slug}`
    if (state[key]?.taskId) { log(`⏭  ${track.title} — already submitted`); continue }
    try {
      const res = await kiePost('/generate', {
        model: 'V4', customMode: true,
        prompt: track.lyrics, style: track.style, title: track.title,
        instrumental: false, callBackUrl: 'https://noiraciel.com/api/noop',
      })
      if (res.code !== 200) throw new Error(res.msg)
      state[key] = { taskId: res.data.taskId, status: 'PENDING', slug: track.slug, title: track.title, num: track.num }
      log(`✓  ${track.title} → ${res.data.taskId}`)
      submitted++; saveState(state); await sleep(SLEEP_MS)
    } catch (e) { log(`✗  ${track.title}: ${e.message}`) }
  }
  log(`\nDone. ${submitted} jobs submitted.`)
}

async function cmdPoll() {
  const state = loadState()
  const audioDir  = path.join(ROOT, 'Music', ALBUM.dirName, 'audio')
  const lyricsDir = path.join(ROOT, 'Music', ALBUM.dirName, 'lyrics')
  fs.mkdirSync(audioDir, { recursive: true })
  fs.mkdirSync(lyricsDir, { recursive: true })
  let pending = 0, done = 0, failed = 0

  for (const [key, info] of Object.entries(state)) {
    if (info.status === 'DOWNLOADED') { done++; continue }
    const res = await kieGet(`/generate/record-info?taskId=${info.taskId}`)
    const data = res.data ?? {}
    const sunoData = data.response?.sunoData ?? []
    if (sunoData.length > 0) {
      const first = sunoData[0]
      const audioUrl = first.audioUrl ?? first.audio_url
      const numStr = String(info.num).padStart(2, '0')
      const mp3Dest = path.join(audioDir, `${numStr}_${info.slug}_v1.mp3`)
      const mdDest  = path.join(lyricsDir, `${numStr}_${info.slug}_v1.md`)
      if (audioUrl) { log(`↓  ${info.title}`); await downloadFile(audioUrl, mp3Dest); log(`   ✓  saved`) }
      if (first.lyrics && !fs.existsSync(mdDest)) {
        fs.writeFileSync(mdDest, `---\ntitle: ${info.title}\n---\n\n${first.lyrics}\n`)
      }
      state[key].status = 'DOWNLOADED'; saveState(state); done++
    } else if (data.status === 'FAILED') {
      log(`✗  ${info.title}`); state[key].status = 'FAILED'; saveState(state); failed++
    } else { log(`⏳ ${info.title} — ${data.status ?? 'PENDING'}`); pending++ }
    await sleep(400)
  }
  log(`\n${done} downloaded · ${pending} pending · ${failed} failed`)
}

function cmdStatus() {
  const state = loadState()
  for (const [, info] of Object.entries(state)) {
    const icon = info.status === 'DOWNLOADED' ? '✓' : info.status === 'FAILED' ? '✗' : '⏳'
    console.log(`${icon}  ${info.title} — ${info.status}`)
  }
  const done = Object.values(state).filter(s => s.status === 'DOWNLOADED').length
  console.log(`\n${done}/${Object.keys(state).length} downloaded`)
}

const args = process.argv.slice(2)
;(async () => {
  if (args.includes('--submit'))        await cmdSubmit()
  else if (args.includes('--poll'))     await cmdPoll()
  else if (args.includes('--status'))   cmdStatus()
  else if (args.includes('--write-lyrics')) await cmdWriteLyrics()
  else console.log('Usage: --submit | --poll | --status | --write-lyrics')
})()
