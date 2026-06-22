#!/usr/bin/env node
/**
 * generate-jazz-backgrounds.js
 *
 * Generates 300 atmospheric jazz/noir background images for Jazz Sessions karaoke videos.
 * Style: late-night Atlantic coast, jazz clubs, rain on glass, candlelit interiors, noir city.
 *
 * USAGE
 *   node scripts/generate-jazz-backgrounds.js              # dry-run (show count)
 *   node scripts/generate-jazz-backgrounds.js --execute    # submit to Kie.ai Flux Kontext
 *   node scripts/generate-jazz-backgrounds.js --poll       # download completed
 *   node scripts/generate-jazz-backgrounds.js --list       # status
 *   node scripts/generate-jazz-backgrounds.js --reset      # clear state
 *   node scripts/generate-jazz-backgrounds.js --force      # re-submit failed/missing
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

const OUTPUT_DIR       = path.join(__dirname, '..', 'public', 'Images', 'video-backgrounds-jazz')
const PUBLIC_BASE      = '/images/video-backgrounds-jazz'
const POLL_INTERVAL_MS = 18_000
const POLL_TIMEOUT_MS  = 30 * 60 * 1000

const args       = process.argv.slice(2)
const DRY_RUN    = !args.some((a) => ['--execute','--poll','--list','--reset'].includes(a))
const EXEC_MODE  = args.includes('--execute')
const POLL_MODE  = args.includes('--poll')
const LIST_MODE  = args.includes('--list')
const RESET_MODE = args.includes('--reset')
const FORCE      = args.includes('--force')

// Style suffix for all prompts — jazz/noir Atlantic aesthetic
const STYLE = ', 16mm film grain, dark jazz atmosphere, Atlantic noir, candlelight and shadow, muted gold and deep blue, painterly cinematic film still, no text, no people, no logos, 16:9 widescreen'

const RAW = [
  // ── Jazz Club Interiors (1–40) ────────────────────────────────────────────────
  'empty jazz club interior at 3am, round tables with white cloths, single light above stage',
  'jazz club bar counter, bottles reflecting warm light, darkness beyond, smoke haze',
  'wooden stage in empty club, microphone stand in spotlight, chairs stacked behind',
  'jazz club booth, red leather worn, candle on table, dark room beyond',
  'upright bass leaning against brick wall, warm light from below, deep shadow above',
  'brass trumpet on velvet cloth, single source light, black background',
  'piano keys close-up, worn ivory, soft warm light, reflections in polished wood',
  'jazz club corridor, low ceiling, amber bulbs, framed photographs on brick wall',
  'drum kit on empty stage, spotlight from above, audience chairs empty in darkness',
  'saxophone on stand, club interior, dark green walls, single candle nearby',
  'bar stool at empty jazz bar, glass of amber liquid, warm light, loneliness',
  'upright piano in corner of dim room, bench empty, music stand bare',
  'jazz club stage from the back, looking out at empty tables, one lamp lit',
  'trumpet case open on dressing room table, club sounds barely audible outside',
  'old jazz club sign on brick wall, neon cold, night outside the window',
  'trombone bell catching gold light, rest of instrument in shadow, velvet background',
  'music stand with sheet music, warm light, rest of room in darkness',
  'jazz club cloak room, coats hanging, dim bulb, late hour emptiness',
  'wooden floor of jazz club stage, scuff marks, chalk marks, years of performances',
  'backstage corridor, cables on floor, door ajar to lit stage beyond',
  'cymbal close-up, reflected amber light, brushed metal, dark room around it',
  'club owner counting receipts at bar, only lamp, rest of club dark and empty',
  'jazz venue exterior, modest sign, puddles reflecting neon, 4am',
  'green room mirror, bare bulbs around it, cigarette smoke, reflection empty',
  'record covers on jazz club wall, decades of performers, warm light on them',
  'double bass bow on music stand, wood and horsehair, practise room, bare bulb',
  'jazz club bathroom, single bulb, cracked mirror, sounds of bass through the wall',
  'velvet curtain parted slightly, view to dark stage, single spotlight beyond',
  'empty bandstand in afternoon light, before the crowd, chairs and stands set up',
  'jazz piano stool, worn seat, pedal marks on floor, decades of nights',
  'trumpet mouthpiece close-up, warm light, brass worn to copper at the edges',
  'club ticket booth, window, lamp, rain outside, nobody there',
  'jazz club cellar stairs, brick walls, single bulb, sound coming up from below',
  'wooden chair against brick wall backstage, jacket hanging on it, one lamp',
  'speaker cabinet on stage, old fabric, jazz sound implied, dark room',
  'jazz club matchbook on table, candle, half-empty glass, night still going',
  'floor tom drum skin, worn, chalk marks, stage boards below it',
  'club spotlight from below, beam visible in smoke, pointed at empty mic',
  'jazz musician hat on piano lid, club empty now, night over',
  'bar counter reflection in mirror behind bottles, amber and dark, 2am',

  // ── Rain on Glass / Windows (41–80) ──────────────────────────────────────────
  'rain on café window at night, city lights blurred beyond, interior warm',
  'raindrops on glass, street lamp refraction, night city smeared beyond',
  'rain-streaked window, bar interior reflected faintly, city outside wet',
  'condensation on pub window, cold night beyond, warm light within',
  'rain on car windscreen parked at night, jazz club neon reflected in drops',
  'window glass with rain tracks, street lamp cone below, dark rooftops',
  'rain on large restaurant window, diners as blurred shapes, night outside',
  'single raindrop on glass in extreme close-up, city light refracted inside it',
  'rain on old window frame with paint peeling, courtyard puddles below',
  'window at night, rain making rivulets, darkness and smeared neon beyond',
  'fire escape through rainy window, black iron, wet brickwork, night',
  'rain on phone box glass, city lights behind, solitude of night',
  'rain on studio window, music stand inside, street wet outside',
  'bay window with rain, reading lamp on inside, night garden beyond wet',
  'rain on glass door, brass handle, street lamp, puddle outside reflecting',
  'hotel window with rain, city lights far below, high floor, alone',
  'rain on train window, night landscape beyond, interior reflection faint',
  'wet pavement reflected in low window, rain coming straight down, night',
  'bar window with rain, amber interior light, city black and wet beyond',
  'rain on conservatory glass roof, city sounds muffled, midnight',
  'lighthouse window with rain, sea beyond dark and loud, glass shaking',
  'rain on arched window of old building, courtyard below flooding slightly',
  'rain on music hall window, performers inside as blurred colour, night',
  'rain on glass and warm candlelight inside, two worlds at window',
  'rain coming horizontal on window, wind audible, night city behind',
  'rain on café window with condensation letters half visible, night outside',
  'rain on window ledge, plant there, drops falling in city below, night',
  'rain on glass with iron grille, courtyard beyond soaked, warm room inside',
  'rain rivulet on window, following cracked paint lead, night outside black',
  'rain on floor-to-ceiling window, city grid below wet and lit, solitude',
  'rain on old glass, slight warp in the pane, city blurred and swimming',
  'rain on studio door glass panel, corridor light, silence inside, rain outside',
  'rain on pub window, empty street beyond, lamp post reflection in puddle',
  'rain on glass and single candle inside reflected, dark outside smeared',
  'rain beginning on dry window, first drops spaced, night city dry still beyond',
  'rain on skylight glass from below, drops falling upward in perspective',
  'rain on glass partition in hotel lobby, city lights outside, empty lobby',
  'rain on market window, closed stalls beyond, night, after closing',
  'rain on window in stairwell, city below, landing light, nobody there',
  'rain on balcony door glass, interior lamp, city lights far below in rain',

  // ── Late Night Atlantic Coast (81–130) ────────────────────────────────────────
  'Atlantic coast at 3am, dark water, distant harbour lights, no sound',
  'harbour at night, fishing boats tied, water black and still, one lamp',
  'wet cobblestones near port at night, empty, lamp reflection in water on stone',
  'Atlantic night, waves not visible but felt, dark horizon, single star',
  'harbour wall at night, iron rings, water below invisible, cold air',
  'old port town, 2am, all windows dark except one, Atlantic nearby',
  'lighthouse on headland at night, beam sweeping, Atlantic below black',
  'coastal cliff at night, sea far below, sound implied, sky overcast',
  'fishing village at 4am, empty square, fishing nets drying, silent',
  'Atlantic coast road at night, no cars, road wet from earlier rain',
  'old pier at night, wooden planks, water below dark, end of pier in darkness',
  'harbour crane at night, silhouette, lights of town across water',
  'ship in harbour at night, one porthole lit, water moving slowly',
  'coastal town rooftops at night, Atlantic horizon beyond, lights off',
  'sea wall at night, spray trace on stone, dark water beyond, solitude',
  'fishing boat interior at night, coils of rope, lamp, quiet sea outside',
  'lighthouse keeper room at night, window to sea, lamp burning, chair empty',
  'Atlantic at dawn approaching, horizon barely lighter, sea still black',
  'coastal path at night, lamp posts, cliff to left, sea sound below right',
  'harbour master office at night, chart on wall, window to dark port',
  'rope coiled on dock at night, water below, lamp above, silence',
  'coastal town alley at night, narrow, cats possibly, Atlantic nearby',
  'old fish market closed at night, empty stalls, sea smell, lamplit',
  'dock crane shadow on water at night, harbour lights broken by ripples',
  'Atlantic horizon at midnight, no ships visible, overcast, dark',
  'coastal village church at night, clock face lit, sea wind, empty square',
  'harbour steps going into dark water, chain railing, night, silence',
  'fishing nets stacked on dock at night, smell implied, lamp above',
  'small boat engine room at night, dials, warm oil light, engine off',
  'coastal ridge at night, town below and behind, Atlantic ahead, wind',
  'tide pool at night, black water in rock hollow, sea sound near',
  'lighthouse beam sweeping through fog, Atlantic below implied',
  'port customs building at night, windows dark, lamp over door, rain earlier',
  'sea wall graffiti in lamp light at night, waves on other side silent',
  'coastal bar, last customers gone, chairs on tables, Atlantic view dark',
  'fish dock at 5am, workers not yet arrived, crates stacked, night ending',
  'Atlantic from hotel balcony at 2am, city below quiet, sea beyond dark',
  'harbour water at night, moored boat, reflection of lamp fractured by wave',
  'old lighthouse base, stone worn by waves, night, beam above sweeping',
  'coastal road bridge at night, river below meeting sea, lights distant',
  'sea mist over harbour at 3am, shapes of boats barely visible',
  'fish warehouse at night, closed, smells implied, lamp on corner',
  'Atlantic coast railway platform at night, empty, sea wind, no train',
  'harbour restaurant window from outside at night, empty tables inside',
  'coastal fort at night, old stone, sea beyond, no one for centuries',
  'dockside crane at night, water below, port lit distantly, silence',
  'Atlantic at high tide at night, water coming near the wall, dark',
  'coastal town main square at 3am, fountain off, all windows dark',
  'sea watch tower at night, stone, ladder going up, dark view from top',
  'harbour bell at night, no wind now, rope hanging, water still',

  // ── Candlelit Interiors (131–170) ────────────────────────────────────────────
  'single candle on wooden table, darkness around it, warm circle of light',
  'three candles burning on mantelpiece, room in darkness behind, wax dripping',
  'candle on piano, sheet music lit by it, rest of room black',
  'candle in glass jar, table, window to night rain beyond, intimate',
  'row of candles on altar in dark church, all others extinguished, these burning',
  'candle on bedside table, book nearby, late reading stopped, night',
  'candle stub almost finished, holder with wax tears, dark room, late',
  'candelabra with multiple candles, baroque, dark room, high shadows',
  'candle in wine bottle, wax rivers down side, jazz bar table',
  'candle guttering in draft, room otherwise still, window somewhere open',
  'dinner table with candles, meal long finished, candles alone still burning',
  'candle and pocket watch on table, time late, flame still steady',
  'candle in wall sconce, stone wall behind, old interior, night',
  'two candles and a letter on table, unread or re-read, night solitude',
  'candle light on old book open, gold on pages, dark beyond the circle',
  'birthday cake candles in darkness, no one there, moment just passed',
  'candle on windowsill looking out to night city, twin flame in glass',
  'church candles in bank of votive lights, dark space beyond, silence',
  'candle and wine glass, empty room, party over, city outside quiet',
  'single candle in storm, flame horizontal, glass protecting it, wind',
  'candle on writing desk, pen and paper, night outside, correspondence',
  'candle in lantern on table, camping style, indoor, late night',
  'candle reflected in dark window, flame doubled, night beyond',
  'chandelier with real candles, most burned out, two remain, dark room',
  'candle end burning on saucer, last minutes, reading chair nearby',
  'candle in rehearsal room, power out, music stand nearby, silence',
  'taper candle on table with old phone, 1950s, night, waiting',
  'candle and photograph on mantle, frame barely visible, flame nearby',
  'candle stub on bar counter, bar closed, single flame, last light',
  'floating candle in bowl of water, jazz club table, late evening',
  'candle and half-eaten croissant on café table, morning not yet, still dark',
  'candle on grand piano lid, recital over, hall empty, flame still',
  'memorial candles in window of dark house, night outside, remembrance',
  'candle in music studio window, night outside, sessions still running',
  'candles in old dining room, silver candlesticks, dinner long finished',
  'birthday candle single on cupcake, nobody blowing it out, room dark',
  'candle and compass on navigator table, ship at night, sea dark',
  'church candle in font side alcove, stone cold, flame warm, no one',
  'candle and glass of port wine on night table, reading discontinued',
  'candle in power cut, city outside also dark, unusual quiet',

  // ── Dark City Streets at Night (171–210) ─────────────────────────────────────
  'empty city street at 3am, lamp posts, wet pavement, nobody',
  'city alley at night, fire escapes above, lamp at far end, steam',
  'dark city street corner, traffic light on red, no cars, night',
  'city underpass at night, concrete, lamp inside, rain entering from ends',
  'dark city side street, jazz club sign lit in distance, wet pavement',
  'city park at night, lamp posts in fog, empty benches, trees',
  'elevated city view at 4am, grid of streets below, few lights on',
  'city parking garage at night, empty level, lamp buzzing, concrete',
  'dark city bridge over river at night, city lights in water below',
  'city square at 3am, fountain off, surrounding buildings dark, one light',
  'city rooftop at night, chimneys, water towers, lights of city below',
  'dark city street with one phone box lit, no one using it, rain',
  'city bus stop at night, nobody, timetable lit from within, street dark',
  'dark city canal bank at night, water, reflections, iron footbridge',
  'city street after rain, every surface reflecting lamp light, 2am',
  'dark city fire escape zigzag on brick wall, night, lamp casting shadow',
  'city hotel entrance at night, revolving door still, lamp above, quiet',
  'dark city pedestrian tunnel at night, lamp every few metres, empty',
  'city flower market closed at night, empty stalls, water on pavement',
  'dark city block, one lit window high up, all others dark, night',
  'city traffic light reflection in wet road at night, no traffic',
  'dark city newsstand closed, shutters down, headlines faded, rain',
  'city steps going up between buildings at night, lamp at top, nobody',
  'dark city courtyard, single lamp, surrounded by tall buildings, silence',
  'city railway bridge at night, iron above, street below, train gone',
  'dark city corner with jazz bar sign, street otherwise empty, 2am',
  'city rooftop door open, stairs going up, city beyond, night',
  'dark city market hall empty at night, iron roof, closed stalls, echo',
  'city lamp post with broken glass, light within still on, night',
  'dark city school at night, playground, lights off, empty, weekend',
  'city construction site at night, hoarding, lamp, crane above, silence',
  'dark city theatre stage door, lamp, alley, puddle, night',
  'city bus terminal at 4am, empty bays, lamp above office, silence',
  'dark city industrial area, pipe steam, lamp, wet road, empty',
  'city graveyard at night, lamp at gate, stones beyond in darkness',
  'dark city post office, shutters down, lamp above, no letters tonight',
  'city street with torn poster on hoarding, rain, lamp, night',
  'dark city port entrance, gate, lamp, docks beyond, Atlantic nearby',
  'city tower with clock, 3am face lit, streets below empty, fog',
  'dark city park fountain, off for winter, lamp nearby, night, cold',

  // ── Reflections in Dark Water (211–250) ──────────────────────────────────────
  'city lights reflected in still river at night, no wind, perfect inversion',
  'puddle on cobblestones reflecting lamp, city street, 3am',
  'harbour water at night, reflections of boats, no movement, dark',
  'rain puddle reflecting jazz club neon, pavement, night, nobody',
  'canal at night, lamp reflections stretched, dark water, no boats',
  'river at night, bridge reflected perfectly, no current, silence',
  'shallow puddle on dock, harbour crane reflected, night, cold',
  'lake in city park at night, lamp reflections, no wind, mirror',
  'flooded street at night, entire city in the water below, reflection',
  'river bend at night, reflected lights of bridge, city sounds distant',
  'harbour oil slick at night, rainbow in black water, lamp above',
  'puddle between cobblestones, lit window reflected, city night',
  'canal lock at night, water still, lamp on bank reflected in surface',
  'dock puddle after rain, crane hook reflected, night, industry',
  'river surface at night, current visible only in disrupted reflection',
  'fountain pool at night, coins at bottom, lights from above reflected',
  'rooftop puddle at night, city below reflected upward in water there',
  'harbour between boats, dark water, sky reflected, lamp chain of lights',
  'river from bridge at night, reflections making twin city below',
  'puddle in jazz club alley reflecting sign, night, nobody around',
  'still pool in courtyard at night, single lamp reflected, wind none',
  'Atlantic harbour at night, lighthouse beam visible in water too',
  'river at dawn almost, reflections of bridges, city quiet, cold',
  'dock water at night, floating wood, oil, lamp above, dark',
  'puddle in market after rain, empty stall reflected, night, alone',
  'canal in fog at night, lights barely visible, reflections diffused',
  'river at night from high bank, lights of opposite shore in water',
  'flooded basement, one bulb, water reflecting swinging light',
  'tide pool with lighthouse reflection, night, sea nearby',
  'city square puddle at 3am, all the lamp posts reflected, nobody',

  // ── Atmospheric Noir Interiors (251–300) ──────────────────────────────────────
  'old hotel lobby at 4am, one lamp, desk empty, somewhere a clock',
  'library reading room at night, lamp circles on tables, books in shadow',
  'old recording studio control room, dials, warm light, glass to dark booth',
  'rehearsal room after session, chairs scattered, music stands, one lamp',
  'waiting room at night, chairs, lamp, window to dark outside, nobody',
  'old cinema interior, seats empty, screen dark, aisle light only',
  'vintage barbershop at night, mirror, chairs, combs in jar, closed',
  'tailor shop interior at night, dressmakers dummy, lamp, fabric, quiet',
  'old radio station studio at night, microphone, dials, on-air sign off',
  'bookshop interior at night, shelves in darkness, one reading lamp on',
  'old phone exchange, cables, switches, operator absent, lamp, night',
  'pharmacy at night, glass jars, prescription counter, lamp, closed',
  'watchmakers workbench at night, loupes, springs, lamp, work stopped',
  'old post room, pigeonholes, letters, lamp, sorting done, night',
  'private investigators office at night, desk, blind shadows, window',
  'vintage kitchen late at night, stove light on, dishes done, quiet',
  'music teacher room at night, piano, music stands, lamp, student gone',
  'old hotel bar after closing, bottles, glasses inverted, lamp, night',
  'train station waiting room at 4am, benches, lamp, departure board',
  'hospital corridor at night, trolley, lamp above, doors closed, quiet',
  'old courthouse corridor at night, dark wood panelling, lamp, empty',
  'pawnshop interior at night, items in cases, lamp, owner absent',
  'old radio repair shop, valves, wires, bench, lamp, night, quiet',
  'vintage photography darkroom, red light, trays, photographs hanging',
  'ship navigation bridge at night, instruments, window to dark sea',
  'old telegraph office, tapper, forms, lamp, operator gone, night',
  'funeral parlour interior at night, chairs, lamp, flowers, silence',
  'old music publishers office, manuscripts, lamp, piano silent',
  'lighthouse interior at night, clockwork for the beam, warm light',
  'harbour masters log room at night, charts, lamp, window to dark port',
  'old jazz magazine editorial office at night, photographs, typewriter, lamp',
  'vintage shoe repair shop interior, lasts, leather, thread, lamp, closed',
  'old travel agency interior at night, posters, desk, lamp, nobody',
  'antique music box shop at night, glass cases, lamp, all boxes silent',
  'vintage cinema projection room, reels, lamp, beam going to closed shutter',
  'old typewriter repair shop, machines, ribbon, lamp, night, quiet',
  'historic bank interior at night, teller cages, marble, lamp, empty',
  'old music hall dressing room, costumes, mirror, bulbs half-off, night',
  'vintage print shop, type cases, press, lamp, ink smell implied, night',
  'port authority waiting room at night, benches, lamp, window to dark dock',
  'old telegraphers quarters, bunk, tapper, lamp, night watches kept here',
  'historic theatre prop room, costumes, furniture, lamp, darkness',
  'vintage pharmacist laboratory, bottles, scales, lamp, formulas, night',
  'old seamens mission interior at night, chairs, lamp, harbour outside',
  'music conservatory practice corridor at night, doors, lamp, silence',
  'old newspaper morgue, filing cabinets, lamp, past editions, night',
  'vintage clock repair shop, movements, pendulums, lamp, ticking',
  'old music hall stage wings at night, ropes, curtains, lamp, dust',
  'harbour pilots station at night, window to port, charts, lamp, radio',
  'old hotel room at 4am, lamp, window to city, coat on chair, quiet',
]

// Build entries array
const ENTRIES = RAW.map((prompt, i) => ({
  id:    `jazz-bg-${String(i + 1).padStart(3, '0')}`,
  label: `jazz background ${String(i + 1).padStart(3, '0')}`,
  prompt: prompt + STYLE,
}))

// ─── Manifest ────────────────────────────────────────────────────────────────
function writeManifest(state) {
  const entries = Object.values(state).filter((e) => (e.status === 'complete' || e.status === 'done') && e.publicUrl)
  const manifest = Object.fromEntries(entries.map((e) => [e.id, e.publicUrl]))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  log(`Manifest updated: ${entries.length} jazz backgrounds.`)
}

// ─── List ────────────────────────────────────────────────────────────────────
function runList() {
  const state    = loadState(OUTPUT_DIR)
  const complete = Object.values(state).filter((e) => isComplete(e)).length
  const pending  = Object.values(state).filter((e) => isPending(e)).length
  const failed   = Object.values(state).filter((e) => e.status === 'failed').length
  const none     = ENTRIES.length - complete - pending - failed
  console.log(`\n🎷  Jazz backgrounds status (${ENTRIES.length} total):\n`)
  console.log(`   ✅  Complete:    ${complete}`)
  console.log(`   ⏳  Pending:     ${pending}`)
  console.log(`   ✗   Failed:      ${failed}`)
  console.log(`   ○   Not started: ${none}\n`)
}

// ─── Execute ─────────────────────────────────────────────────────────────────
async function runExecute() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const state = loadState(OUTPUT_DIR)

  const toSubmit = ENTRIES.filter((e) => {
    const entry = state[e.id]
    if (FORCE) return true
    return !entry || !isComplete(entry)
  })

  if (!toSubmit.length) { log('All jazz backgrounds already generated.'); return }

  log(`Submitting ${toSubmit.length} background job(s)…`)
  log('Press Ctrl+C to pause — progress is saved and resumable.\n')

  let submitted = 0
  for (const bg of toSubmit) {
    process.stdout.write(`  🎷  [${bg.id}] submitting… `)
    try {
      const taskId = await submitImageJob(bg.prompt, { aspectRatio: '16:9' })
      state[bg.id] = { ...blankEntry(bg.id, bg.label), taskId, status: 'pending' }
      saveState(OUTPUT_DIR, state)
      console.log(`✓ taskId: ${taskId}`)
      submitted++
      await sleep(RATE_LIMIT_MS)
    } catch (e) {
      console.log(`✗ ${e.message}`)
      state[bg.id] = { ...blankEntry(bg.id, bg.label), status: 'failed', error: e.message }
      saveState(OUTPUT_DIR, state)
    }
  }

  log(`\n✓ Submitted ${submitted} jobs. Run --poll to download.`)
}

// ─── Poll ────────────────────────────────────────────────────────────────────
async function runPoll() {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  log(`Polling jazz backgrounds — up to ${POLL_TIMEOUT_MS / 60_000} min. Ctrl+C to pause.`)

  while (Date.now() < deadline) {
    const state   = loadState(OUTPUT_DIR)
    const pending = Object.values(state).filter((e) => isPending(e))
    if (!pending.length) { log('Nothing pending.'); break }

    let downloaded = 0
    for (const entry of pending) {
      try {
        const data = await pollImageJob(entry.taskId)
        if (!data) continue
        if (data.done && !data.failed && data.url) {
          const url  = data.url
          const ext  = url.match(/\.(jpe?g|png)/i)?.[0] ?? '.jpg'
          const localPath = path.join(OUTPUT_DIR, `${entry.id}${ext}`)
          process.stdout.write(`  ⬇  ${entry.id}… `)
          await downloadFile(url, localPath)
          entry.status    = 'complete'
          entry.publicUrl = `${PUBLIC_BASE}/${entry.id}${ext}`
          entry.localPath = localPath
          saveState(OUTPUT_DIR, state)
          console.log('✓')
          downloaded++
        } else if (data.done && data.failed) {
          warn(`  Failed: ${entry.id}`)
          entry.status = 'failed'
          saveState(OUTPUT_DIR, state)
        }
      } catch (e) {
        warn(`  Poll error for ${entry.id}: ${e.message}`)
      }
      await sleep(500)
    }

    const remaining = Object.values(loadState(OUTPUT_DIR)).filter((e) => isPending(e)).length
    if (!remaining) { writeManifest(loadState(OUTPUT_DIR)); log('All done.'); break }
    log(`  ${remaining} still pending — waiting ${POLL_INTERVAL_MS / 1000}s…`)
    await sleep(POLL_INTERVAL_MS)
  }
}

// ─── Reset ───────────────────────────────────────────────────────────────────
function runReset() {
  saveState(OUTPUT_DIR, {})
  log('State cleared.')
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) {
    console.log(`\n🎷  Jazz backgrounds — dry-run`)
    console.log(`   Total prompts: ${ENTRIES.length}`)
    console.log(`   Output: ${OUTPUT_DIR}`)
    console.log(`   Aspect ratio: 16:9 (widescreen, for karaoke backgrounds)\n`)
    console.log(`   Run --execute to submit · --poll to download · --list for status\n`)
    return
  }
  if (RESET_MODE)  { runReset(); return }
  if (LIST_MODE)   { runList(); return }
  if (EXEC_MODE)   { await runExecute(); return }
  if (POLL_MODE)   { await runPoll(); return }
}

main().catch((e) => { err(e.message ?? e); process.exit(1) })
