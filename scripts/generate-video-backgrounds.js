#!/usr/bin/env node
/**
 * generate-video-backgrounds.js
 *
 * Generates 500 atmospheric background images for karaoke lyric videos.
 * Atlantic Noir palette: sea, roads, windows, stone, forests, hands, fog, interiors, cliffs, light.
 *
 * USAGE
 *   node scripts/generate-video-backgrounds.js         # dry-run (show count)
 *   node scripts/generate-video-backgrounds.js --execute   # submit to Kie.ai
 *   node scripts/generate-video-backgrounds.js --poll      # download completed
 *   node scripts/generate-video-backgrounds.js --list      # status
 *   node scripts/generate-video-backgrounds.js --force     # re-submit failed
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

const OUTPUT_DIR       = path.join(__dirname, '..', 'public', 'Images', 'video-backgrounds')
const PUBLIC_BASE      = '/images/video-backgrounds'
const POLL_INTERVAL_MS = 18_000
const POLL_TIMEOUT_MS  = 25 * 60 * 1000

const args      = process.argv.slice(2)
const DRY_RUN   = !args.some((a) => ['--execute','--poll','--list','--reset'].includes(a))
const EXEC_MODE = args.includes('--execute')
const POLL_MODE = args.includes('--poll')
const LIST_MODE = args.includes('--list')
const FORCE     = args.includes('--force')

// ─── Style suffix appended to all prompts ────────────────────────────────────
const STYLE = ', cinematic, dark atmospheric, muted desaturated tones, 16:9 widescreen, film still, noir aesthetic, soft bokeh, photorealistic, no people, no text'

// ─── 500 Atmospheric prompts ─────────────────────────────────────────────────
const RAW = [
  // ── Seascapes (1–60) ─────────────────────────────────────────────────────
  'dark Atlantic ocean at night, moonlight on massive waves, dramatic storm clouds overhead',
  'Portuguese coastline at dusk, orange sky over charcoal sea, silhouette of cliff edge',
  'ocean surface at dawn, first pale light spreading across dark water, distant fog bank',
  'rocky sea cliff, waves breaking at base, old lighthouse in distance, approaching storm',
  'calm harbor at night, boat lights reflecting on still black water, rising mist',
  'storm waves hitting ancient sea wall, white spray and foam, grey Atlantic sky',
  'low tide beach at dawn, wet sand reflecting pale sky, empty horizon, no one',
  'waves retreating from dark volcanic sand, foam patterns, overcast morning',
  'Atlantic sea cave interior, waves entering, shafts of cold light through crevices',
  'ocean horizon at midnight, stars dimly through clouds, dark endless water below',
  'Portuguese fishing village harbor, old stone pier, evening mist, boats at rest',
  'ocean cliff top at golden hour, orange and deep grey sky, waves far below',
  'sea grass bending in coastal wind, dunes behind, ocean horizon in distance',
  'breaking wave frozen, dark green water, white foam, heavy overcast sky',
  'tidal pool in rocks, sky reflected perfectly, grey morning light, seaweed',
  'ancient sea wall, barnacles and old rope, tide marks, Atlantic horizon beyond',
  'coastal fog bank rolling in over dark ocean, last amber light fading',
  'lighthouse beam crossing dark sea, sweeping through fog, isolation',
  'wave curling before breaking, deep green water translucent, dark sky above',
  'sea horizon at 4am, darkest hour before dawn, stars and black water meeting',
  'coastal road ending at sea overlook, wet asphalt, dark ocean spreading beyond',
  'old wooden dock extending into dark harbor, morning mist, rope and planks detail',
  'open Atlantic, no land visible, dark water and cloudy sky, only horizon',
  'Atlantic coast in deep winter, bare cliffs, slate-grey sea, cold white light',
  'sea foam on dark beach, slow wave retreating, overcast sky perfectly reflected',
  'estuary at dawn, mudflats and distant sea, wading birds in pale sky',
  'old beached fishing boat on shore, rusted hull weathered, grey sea behind',
  'coastal headland at night, lighthouse on cliff, dark sea hundreds of feet below',
  'shore break, small perfect waves, dark wet sand, empty beach, dawn',
  'deep ocean surface, endless blues and greens, no coast visible, just sea',
  'cliff face descending to ocean, layers of dark rock, wave spray at base',
  'sea mist on calm morning water, pink light above, ghostly still surface',
  'Portuguese fishing harbor, boats muted in morning fog, old stone walls',
  'sea breaking over submerged rock, explosion of white water, dark surrounds',
  'empty beach at winter solstice, pale cold light, grey-green sea, silence',
  'Atlantic storm from shoreline, black sky, white waves breaking, nobody',
  'old stone slipway descending into dark water, green algae, morning mist',
  'night fishing boat lights on black Atlantic, distant shore lights fading',
  'sea horizon exactly halfway, dark water below, dark cloud sky above, still',
  'coastal cliff walk, sea visible far below, rough grass both sides, wind',
  'abandoned sea bathing house, faded paint, wave-washed walls, evening',
  'rock formations at low tide, dark shapes in mist, cold morning light',
  'Atlantic swell from below, surface seen from underwater, grey light above',
  'old granite pier end, sea on three sides, wind, profound isolation',
  'kelp forest waving in current, light filtering down from surface, deep',
  'sea at equinox, dramatic but silent, tide marks on ancient stone',
  'storm petrel silhouette over dark waves, grey-silver sky, ocean scale',
  'submerged rocks visible through clear dark water, depth and clarity',
  'old sea fort walls, cannon embrasures, Atlantic horizon beyond, history',
  'wet pebble beach, each stone unique, grey tide, nobody walking, morning',
  'tide coming in over flat rocks, thin sheet of dark water advancing',
  'sea at twilight, color gone from water, sky still faintly orange, ending',
  'distant ship on Atlantic horizon, small against sea and sky, solitude',
  'coastal rock arch, sea framed within, light and dark, natural window',
  'sea stack, isolated pillar of rock, waves surrounding, birds circling',
  'beach fire remains, cold ash, sea nearby, morning after, gone',
  'atlantic sea wrack on dark sand, patterns of foam and seaweed',
  'underwater light playing on rocky seabed, dappled and shifting',
  'old fishing nets on quayside, geometric shadow, morning light, harbor',
  'sea from airplane window, dark and infinite, clouds below, scale',
  'coastal island, no structures, windswept grass, sea all around, alone',

  // ── Coastal Roads (61–110) ────────────────────────────────────────────────
  'winding coastal road at night, headlights on wet asphalt, cliffs dropping to sea',
  'empty country road at dawn, morning mist through pine trees, pale light',
  'old stone road descending toward fishing village, evening light, smoke rising',
  'road at the edge of cliff, nothing beyond but grey sea and sky',
  'deserted village road at midday, puddles reflecting sky, shuttered windows',
  'mountain pass road in cloud, visibility fading, cold white diffused light',
  'straight road across flat estuary, horizon meeting at infinity, dusk light',
  'road becoming path becoming grass, asphalt ending, continuation unknown',
  'tunnel of ancient trees over old sunken road, light at far end, dark entrance',
  'country lane at night, single distant streetlight, bare winter trees',
  'coastal cliff road, sea visible below, rusted guardrail, last light',
  'old cobblestone street in rain, yellow reflections in puddles, nobody out',
  'road through eucalyptus forest, silver-peeling trunks, shadow and light',
  'empty highway at blue hour, city lights starting in distance, dusk',
  'dirt track leading to sea, final stretch, grass on both sides, horizon',
  'mountain road switchbacks from above, car tiny on curve below, fog',
  'gravel coastal path, sea on left, cliff on right, path ending nowhere',
  'night road, long exposure, light trails only, nobody in frame, speed',
  'village entrance road, old stone arch, morning fog, arrival or departure',
  'road to lighthouse, visible from far off, car approaching slowly, evening',
  'abandoned road, cracked asphalt, weeds growing through, forest reclaiming',
  'road through salt marsh, flat grey light, distant sea, afternoon silence',
  'uphill road disappearing into morning fog, pale promise of light above',
  'old stone bridge over river, road continuing beyond, evening light',
  'cliffside road carved into rock face, sea hundreds of feet below, vertigo',
  'town road at 5am, shops shuttered, wet street, single light, silence',
  'coastal path, stone wall on both sides, sea glimpsed through gaps',
  'road in autumn light, falling chestnut leaves, gold and long shadow',
  'empty car park at cliff edge, viewpoint, nobody, sea below, wind',
  'long straight road in valley, mountains both sides, low cloud ceiling',
  'road ending at old stone pier, water beyond, nowhere else to go',
  'rain on road surface, each drop rippling, car lights approaching behind',
  'sunset reflected in road puddle, sky orange, ground dark, perfect mirror',
  'old road through wine country, stone walls, harvest long past, winter',
  'mountain road in winter, snow on edges, single set of tyre tracks, silence',
  'road to harbor gate, water visible between old posts, morning',
  'coastal road with sea wall, spray reaching tarmac, grey morning',
  'road through ancient olive grove, twisted trunks, low sun, shadow gold',
  'track ending at field gate, sea behind, no way further, standing still',
  'road at golden hour, perfect cinematic light, long shadows, beauty',
  'night road in thick fog, ten meters visibility, yellow center line, no destination',
  'road home, night, familiar and strange, arriving or leaving',
  'old road marker stone, moss-covered, distance faded, solitude',
  'road past old stone walls, ivy-covered, autumn, memory of travel',
  'railway crossing on empty road, gates open, track going elsewhere',
  'road descending to sea, last curve before coast revealed, anticipation',
  'night road in rain, windshield view, wipers, grey world outside',
  'old Roman road, impossibly straight across dark landscape, time',
  'road junction in mist, two directions, neither visible far, choice',
  'coastal cliff path with rope handrail, sea far below, wind visible in grass',

  // ── Windows & Rain (111–170) ──────────────────────────────────────────────
  'rain on window glass, city lights blurred beyond, interior warmth, evening',
  'condensation on old window pane, garden shapes beyond, morning breath',
  'single raindrop running down glass, light refracting, slow and inevitable',
  'window at night, room dimly reflected in glass, rain and darkness outside',
  'white lace curtain in breeze, afternoon light through sheer fabric, calm',
  'frosted glass with finger-traced pattern faded, light from other side',
  'rain-streaked train window, landscape blurring, journey, motion, evening',
  'old window with wavy glass, garden distorted, morning light entering',
  'window seat in rain, closed book face down, tea growing cold, nobody',
  'multiple paned sash window, shadows falling on floor, light entering slowly',
  'window at dawn, first light barely visible through glass, darkness still present',
  'greenhouse glass in rain, green plants beyond, condensation, warmth inside',
  'porthole in old ship, dark sea visible beyond, thick wavy glass, history',
  'attic window, dust floating in light beam, nobody has been here years',
  'old church window, plain glass, morning light making patterns on floor',
  'glass door to garden in rain, footstep marks in condensation, waiting',
  'window blind partially open, stripes of light on wooden floor, afternoon',
  'old upstairs window at night, streetlight below, someone might be watching',
  'rain on skylight glass, lying below looking up, water patterns, sky',
  'window of empty house, dark room behind, overgrown garden beyond',
  'industrial window broken, factory ruin, light entering slant, decay',
  'bay window at stormy afternoon, curtains slightly moving, sky darkening',
  'bathroom window opaque with steam, heat and morning, ritual',
  'window ledge detail, old paint cracking, sea visible beyond, salt',
  'dormer window in rain, roof tiles below, valley, darkness coming',
  'kitchen window at dawn, garden beyond, empty coffee cup on sill',
  'library window, old books in foreground, street life outside blurred',
  'old hotel window, net curtain, courtyard below, forgotten afternoon',
  'empty corridor window, pale light on floor, presence about to arrive',
  'staircase window, light falling on steps, nobody on stairs now, quiet',
  'window with old photograph on sill, outside view blurred, memory frame',
  'horizontal rain hitting window, storm wind outside, stillness inside',
  'night window from outside looking in, warm light, figures not yet visible',
  'window high in old tower, sea visible miles away, nobody here in years',
  'rain drops on spider web in window frame, jeweled and fragile',
  'window of moving train at night, own transparent reflection watching',
  'morning, blinds not yet raised, light edging underneath, before day',
  'window seat with empty cushion, light on fabric, abandoned book nearby',
  'glass block wall, abstracted light and shadow, modernist and cold',
  'old factory skylight in rain, industrial light on empty concrete floor',
  'window with old calendar on wall inside, date visible, time fixed',
  'window closing slowly on autumn garden, last of the year light, ending',
  'round window, lighthouse or old house, dark beyond, frame perfect',
  'window with condensation cleared by hand, smeared view of foggy street',
  'iron-framed conservatory glass in rain, tropical plants within',
  'window at end of corridor, light at end, everything else in shadow',
  'winter window with frost crystals, garden barely visible, cold',
  'window with candle burning inside, flame reflected in dark glass',
  'narrow cell window, stripe of sky only, stone surrounding, limited light',
  'old sash window half-open, thin curtain moving out, summer evening',
  'window of locked building, interior dark, exterior light, barrier',
  'rain on car windscreen, world distorted, red lights ahead, night',
  'bathroom mirror with steam, face beginning to emerge as steam clears',
  'library window with reading lamp inside, darkness outside, work at night',
  'window with old stained glass section, color on floor, church or house',
  'window onto air shaft, small rectangle of grey sky above, enclosed',
  'hospital window, bare tree outside, grey sky, recovery or waiting',
  'window with rusted iron bars, overgrown garden, abandoned house',
  'cold glass door, breath visible as person approaches from outside',
  'window overlooking harbor at night, lights on water, warmth and distance',

  // ── Stone Architecture (171–230) ──────────────────────────────────────────
  'old stone harbor wall at low tide, seaweed and barnacles, cold dawn',
  'ancient stone arch framing sea horizon, golden hour light through arch',
  'cobblestone street in old port town, evening, wet surface, nobody walking',
  'worn stone steps descending to dark harbor water, old and polished smooth',
  'ruined stone chapel, roof open to sky, light entering, profound silence',
  'old stone quay, iron mooring rings, dark water, fishing nets, morning',
  'dry stone wall, lichen and grey-green moss, ancient, moorland behind',
  'old stone bridge over rushing winter river, arch reflected in dark water',
  'Roman stone foundation visible, centuries above, multiple layers of time',
  'isolated stone tower, sea on three sides, last light, built for watching',
  'old stone church porch, deeply carved doorway, worn threshold steps',
  'ancient milestone, distance faded, lichen, field and horizon beyond',
  'stone fireplace in empty room, cold ash, light entering through window',
  'vaulted stone cellar, old wine barrels on earth floor, single hanging bulb',
  'stone cottage ruin, roof long gone, walls standing, open sky within',
  'old stone well in courtyard, bucket and rope, midday shadow, heat',
  'carved stone face on old building facade, weathered watching, centuries',
  'stone quayside at night, harbor reflections, mist low on water',
  'old stone fortress wall, sea visible through embrasures, history silence',
  'granite sea cliff, enormous boulder in foreground, permanence and scale',
  'stone boundary wall, farm field one side, open moor other side, line',
  'ancient stone circle, dawn light, moorland mist, history and silence',
  'stone fishing village, boats drawn up at evening, nobody out, quiet',
  'old stone dovecote, birds long gone, silence, afternoon light on walls',
  'stone steps spiraling up lighthouse tower, small windows, filtered light',
  'old monastery courtyard, fountain dry, weeds growing through paving',
  'carved stone cross in churchyard, sea visible beyond wall, all the names',
  'old stone market arcade, shuttered stalls, morning empty, columns',
  'old stone house, shutters faded blue, dead roses, nobody home for years',
  'ancient stone quay crane, rusted iron, old wood, dark harbor water',
  'stone road paving detail, centuries of footsteps worn smooth, time',
  'old stone gatehouse arch, main house lane beyond, evening arrival',
  'ground level stone cellar window, street feet visible, basement looking up',
  'stone embankment holding back storm sea, waves breaking over top',
  'ancient stone dolmen on moorland, prehistoric, mystery, silence',
  'stone manor house, autumn ivy covering facade, all windows dark, evening',
  'carved stone ship figurehead in garden, removed from vessel, sea memory',
  'lighthouse keeper stone cottage, abandoned, wild garden reclaimed',
  'old stone grain store, small high windows, interior shadow, dark and cool',
  'stone village square, dry fountain, old trees, shuttered houses, summer',
  'ancient stone path through old woodland, overgrown edges, filtered light',
  'stone staircase on building exterior, rusted iron handrail, sea behind',
  'ruins of old stone mill, river still flowing past, waterwheel long gone',
  'old stone wall with wooden gate, lane beyond, morning fog',
  'stone coping on sea wall, salt bleached, yellow lichen, Atlantic',
  'old stone shop front, faded painted sign, shuttered long ago',
  'stone terrace overlooking valley, old iron chairs, view and memory',
  'ancient stone ford through clear river, stepping stones, late afternoon',
  'old stone harbor lighthouse base, waves marks, scale and endurance',
  'stone staircase descending to dark water, no railing, invitation or warning',
  'collapsed stone barn, walls remain, roof open to sky, agriculture memory',
  'stone village alley, walls close both sides, narrow light strip above',
  'old stone folly tower, fake ruin, real moss now, time absorbed',
  'carved stone gargoyle, building below, city behind, watching and waiting',
  'stone field wall fallen in gap, fields both sides, boundary dissolved',
  'old stone washhouse, communal, women gone, stone channel dry',
  'stone clock tower, hands stopped, village square empty, afternoon',
  'old stone prison wall, barred windows high, silence within, time',
  'stone arch in garden, rose dead, garden wild, structure remaining',
  'underwater stone anchor, barnacled, chain to surface, depth and weight',

  // ── Forest & Nature (231–290) ─────────────────────────────────────────────
  'ancient oak forest, morning mist through trunks, shafts of light, silence',
  'massive tree roots in dark earth, gnarled and deep, forest floor detail',
  'winter forest, bare trees, frost on ground, pale grey sky, no birds',
  'mossy woodland path disappearing into fog, ancient and quiet, alone',
  'single old oak in empty field, winter, lightning-split and still growing',
  'forest canopy from below, dappled gold and green light, looking up',
  'dark forest river, still black water, reflections perfect, silence',
  'old hollow tree, darkness within, light outside, threshold and mystery',
  'forest floor detail, fallen leaves, fungi on log, life from decay',
  'cork oak grove, stripped bark red and pale, evening light, Portugal',
  'eucalyptus forest in rain, silver-white trunks, ground litter, alone',
  'old vine on stone wall, bare in winter, architectural and sculptural',
  'root system exposed by cliff erosion, complex and beautiful, geological',
  'forest at blue hour, dark trunks, deep blue sky, transition moment',
  'marsh reed beds, morning mist on water surface, birds hidden, quiet',
  'ancient yew tree in churchyard, dark red-brown bark, centuries old',
  'forest stream, cold clear water over dark rocks, shade canopy above',
  'dead standing tree, bark stripped, silver wood, single bird perching',
  'autumn forest floor, single perfect red leaf, among brown decay',
  'pine forest road, long straight, light at far end, afternoon solitude',
  'fallen moss-covered tree across forest path, years of growth on it',
  'hedgerow in deep winter, bare blackthorn, red berries, frost',
  'river bank, overhanging willows, still dark water, evening gold',
  'woodland glade, last light of day, deer might be present, maybe not',
  'old orchard, gnarled apple trees in winter, no fruit, waiting',
  'forest in storm, trees bending, light changing quality, power',
  'lichen on tree bark close-up, grey-green world, tiny infinite scale',
  'bog landscape, dark water, white cotton grass, infinite sky above',
  'old woodland wall, tumbled stones, trees growing over and through',
  'beech forest in peak autumn, copper leaves on floor, golden light',
  'single tree on exposed moorland, wind-bent permanently, sea visible',
  'dark forest entrance, path disappearing within, unknown inside',
  'tree canopy moving in wind, sky glimpsed between moving branches',
  'river surface reflected in single fallen leaf floating slowly',
  'ancient pollarded willows, strange medieval shapes, water behind',
  'fern floor in old woodland, green filtered light, damp and alive',
  'regular tree shadow on path, afternoon light, rhythm of columns',
  'woodland burial ground, old stones, trees grown through walls over years',
  'old hazel coppice, multiple stems from single base, regeneration always',
  'forest pool, still dark water, single leaf floating, reflection sky',
  'dead bramble tangle in winter, sculptural bare form, waiting for spring',
  'field of dried grass seed heads, backlit by low sun, motion and light',
  'old hollow lane, sunken road, trees meeting above making tunnel',
  'abandoned orchard, wild grasses, unpicked fallen fruit, gone back to nature',
  'oak bark close-up, deep fissures, time made visible as texture',
  'wind-sculpted coastal tree, growing horizontal, sea behind it',
  'forest after rain, dripping, steam rising from warm ground, clean',
  'old woodland stream, small stone bridge, no clear path on other side',
  'trees reflected in flooded winter field, doubling the world',
  'dark conifer plantation, narrow path between black trunks, no light',
  'ancient twisted olive tree, gnarled hollow trunk, Mediterranean light',
  'birch grove in winter, white trunks against dark background, elegant',
  'forest clearing, circle of sky above, trees all around, sanctuary',
  'mountain stream, white water over dark rock, spray, sound felt',
  'tree canopy in snow, white weighted branches, absolute silence',
  'forest fire scar, black trunks, green regrowth starting, recovery',
  'old tree stump, rings visible, counting years, centuries ended',
  'woodland at equinox, perfect balance of light and shadow',
  'mangrove roots in still dark water, complex geometry, coastal forest',
  'pine cone on forest floor, detailed, perfect geometry, natural design',

  // ── Hands & Objects (291–340) ─────────────────────────────────────────────
  'weathered old hands holding yellowed photograph, unable to let go',
  'empty wooden chair at kitchen table, morning light, someone was here',
  'hands in dark soil, planting, care without witness, quiet gesture',
  'old letter being folded, hands in frame, word "father" barely visible',
  'cup of tea on window sill going cold, steam gone, watching sea',
  'old fishing net spread over dock, hands repairing in morning sun',
  'open notebook, pen resting on page, handwriting visible but blurred',
  'father large hand on small child hand, table surface, comfort',
  'house keys on old wooden table, familiar weight, daily ritual',
  'old clock on mantlepiece, stopped at particular time, light falling',
  'reading glasses on closed book, person has gone to sleep nearby',
  'old vinyl record playing, needle in groove, dust in light, music',
  'hands rinsing under running water, early morning, ordinary act',
  'wine glass half empty on stone terrace, sea view beyond, evening',
  'old rosary beads in hands, faith or habit, worn smooth by years',
  'worn child shoe held in adult hand, small and heavy with memory',
  'old telephone on table, not ringing, waiting, afternoon quiet',
  'pen writing in journal, close up, words beginning to blur at edge',
  'worn door handle on old painted door, texture of use and years',
  'bread on wooden board, knife alongside, everyday sacrament, morning',
  'hands holding fishing line in still water, patience, waiting, sun',
  'stack of old letters tied with faded string, found on attic floor',
  'light through old curtain fabric, pattern of weave visible, afternoon',
  'coffee cup ring marks on wooden table, years of mornings visible',
  'old compass in hand, needle still true, direction unknown, holding',
  'candle burned to end, wax pooled, nobody watching, late',
  'hands kneading bread dough, flour on dark counter, very early',
  'old photograph album open, page of faces, none of them labeled',
  'glasses case closed on bedside table, person has gone to sleep',
  'rope coiled on dock, perfect spiral, craft and attention, harbor',
  'old tool resting on bench, worn handle, work finished for day',
  'match being struck in darkness, first fraction of light, fire coming',
  'smooth stone being turned in hand, weight and texture, coastline',
  'old wedding ring on finger, thin now, worn smooth, years together',
  'two cups of tea, two chairs, only one person present, absence',
  'pencil stub, paper with notes, window with sea visible, afternoon',
  'old kitchen scales, brass and worn, empty pan, weighing nothing',
  'child drawing pinned to wall, adult hand smoothing corner',
  'empty bottle, label worn, light through glass, something important',
  'hands on piano keys in dim room, about to play or having just stopped',
  'old leather suitcase with worn corners, stickers faded, travel memory',
  'bowl of late autumn fruit, one apple too many, kitchen light',
  'wool being wound in hands, rich color, rhythmic task, patience',
  'old house key in lock, moment of opening or closing, threshold',
  'worn work boots beside door, story of walking in them, mud dried',
  'hand tracing route on paper map, finger on road not yet taken',
  'old radio in kitchen, dial, crackling imagined, afternoon light',
  'hands holding fabric to light, checking quality, craft knowledge',
  'cigarette burning down in ashtray, nobody smoking now, forgetting',
  'old toolbox open, tools organized, craftsman pride, workshop',

  // ── Night & Fog (341–390) ─────────────────────────────────────────────────
  'dense Atlantic fog rolling over coastal cliffs at midnight, invisible sea below',
  'single streetlight in thick fog, yellow circle of light, nobody nearby',
  'night fog filling harbor, boat lights diffused to glow, moisture and silence',
  'mountain fog seen from above, valley invisible, floating in cloud',
  'night rain on empty street, reflections in puddles, nobody out, 3am',
  'fog at forest edge, trees disappearing gradually, threshold and mystery',
  'village in deep fog, warm lights in windows, outside cold and grey',
  'star-field through momentary gap in clouds, brief clarity, then gone',
  'sea mist at dawn, sun trying to penetrate grey, gold appearing in grey',
  'night sky and rolling storm clouds, building power, wind starting',
  'fog horn lighthouse in cloud, rotating beam diffused to glow, alone',
  'old town at night in fog, cobblestones wet, no one walking anywhere',
  'foggy cliff top, sea below invisible, horizon completely gone, edge',
  'night forest, fog between dark trunks, nothing and something moved',
  'bedroom window at night, fog pressing white against glass',
  'harbor in thick morning fog, sound before sight, fishing boats emerging',
  'train station in fog, platform empty, station light in mist, waiting',
  'night air with visible breath, cold winter, clarity before snow',
  'fog bank advancing from sea, last of shore still visible, engulfing',
  'street lamp in heavy rain, vertical silver lines, halo and dark beyond',
  'night city lights seen through fog, diffused and dreamlike, memory',
  'fog in valley at night, village lights below, stars above cloud',
  'sea fog at night, ship navigation light fading into nothing',
  'empty country road at night in fog, markings gone, just yellow line',
  'forest at night, no moon, dark shapes of trees, wind in canopy',
  'estuary in morning fog, birds landing unseen, heard not seen, presence',
  'night cliff, fog below at sea, stars above, standing at absolute edge',
  'rain on black road at night, headlights approaching, no destination',
  'fog bank at horizon, last ship entering it, disappearing, gone',
  'dawn fog burning off very slowly, first shapes emerging, revealing',
  'night garden, fog making uncertain shapes of hedges, soft forms',
  'fog on lake at dawn, swans moving through, silent and ghostly',
  'coastal tower visible above valley mist, isolated, watching',
  'night town square in fog, fountain, all windows dark, deep night',
  'sea cliff at night, waves heard far below but not seen, sound only',
  'fog between old buildings in city, lanterns halos of gold, medieval',
  'night field, fog at knee height, half moon half-visible, walking',
  'rain hitting harbor water at night, each drop expanding, dark surface',
  'morning fog from high window, whole town below invisible, only rooftops',
  'night road in fog, yellow center line disappearing, no destination',
  'fog on high cliffs, sea spray mixing with mist, no horizon at all',
  'storm light, that particular yellow before hail, charged and old',
  'night pier, sea fog, boards wet underfoot, nobody out here at all',
  'rain on skylight glass at night, water patterns moving, looking up',
  'sea at night, no moon, just the sound and the foam and the darkness',
  'old town gateway arch in fog, darkness beyond, entry or exit',
  'mountain in cloud, summit invisible, just dark bulk below cloud line',
  'fog pressing against all windows, house wrapped and isolated',
  'night harbour in rain, reflections of mast lights, no wind now',
  'morning mist in valley, single church tower visible, land and heaven',

  // ── Interior Spaces (391–440) ─────────────────────────────────────────────
  'candlelit room, single flame, shadows moving on walls, someone absent',
  'empty rocking chair in corner, lamp on, book open, nobody sitting',
  'kitchen at dawn, nobody yet, coffee pot on stove, window light',
  'old library, shelves ceiling-high, wooden ladder, light through dust',
  'empty waiting room, chairs arranged in row, morning light, waiting',
  'fireplace with dying embers, last of fire cooling, late night quiet',
  'stone castle corridor with arrow slits, light entering slanted, history',
  'dining room, chairs slightly pulled out, table set, nobody arrived',
  'dark staircase at night, landing light on above, closed door, silence',
  'attic room, cobwebs in corners, forgotten furniture, years of dust',
  'church interior, light through plain glass, empty pews, absolute quiet',
  'old shop interior, shelves dusty, closed sign on door, business ended',
  'reading lamp by armchair, book open face down, reader has stepped away',
  'window seat with grey day beyond, curtains half-drawn, solitude',
  'old kitchen dresser, plates and cups arranged, domestic archaeology',
  'corridor with door slightly open at end, light from beyond, choice',
  'empty ballroom, chandelier dark, windows draped, floor dusty, silence',
  'old hotel room, bed made perfectly, nobody arrived yet, waiting',
  'study desk, papers and lamp, work in progress, person absent',
  'stone farmhouse kitchen, flagstone floor, range cold, early morning',
  'old theatre backstage, ropes and props, stage darkness beyond',
  'living room, fire dead, morning, family gone for day, order left',
  'old cellar, wine on racks, single hanging light, cool and dark',
  'old classroom, desks in rows, morning light angled in, nobody',
  'conservatory, plants overgrown, wicker chairs, rain on glass roof',
  'old workshop, tools hung on wall, workbench worn smooth, craftsmanship',
  'old printing room, type-setting trays, press, ink smell imagined',
  'nursery, crib empty, mobile hanging still, first light entering',
  'old pharmacy, glass dispensing jars, wooden counter, service ended',
  'kitchen with bread board, flour, rolling pin, bread just made, warm',
  'old pub interior, empty glasses on bar, morning light on brass',
  'music room, piano lid down, sheet music open, nobody playing now',
  'empty lighthouse keeper quarters, watch still on table, keeper gone',
  'bedroom at dawn, first light entering, person still asleep, soft',
  'landing window, light falling on staircase, morning coming slowly',
  'hallway with coat rack and shoes, family about to leave or just left',
  'sitting room before Christmas, unlit tree, evening before, expectation',
  'old waiting room, chairs, faded magazine, someone long expected',
  'cellar door open, darkness below, light from kitchen above, decision',
  'small chapel interior, candles burning, nobody inside, faith ongoing',
  'old kitchen summer afternoon, light and shadow, ordinary beauty',
  'school corridor between classes, lockers, silence, not yet started',
  'old greenhouse interior, plants growing over glass, still alive',
  'drawing room with sheets over furniture, house about to be sold',
  'old factory floor, machines still, light through high dirty windows',
  'stone kitchen, herbs hanging to dry, window onto courtyard',
  'old study, map on wall, desk, books piled thinking in progress',
  'long hospital corridor, lights regular, nobody walking, early',
  'vestry in old church, vestments hung, cross, service about to start',
  'old kitchen table, ring marks from cups, morning light, memory',

  // ── Open Landscapes (441–480) ─────────────────────────────────────────────
  'cliff top moorland, sea visible on three sides, wind in the grass',
  'empty Atlantic beach in winter, pale light, single set of footprints',
  'sand dunes at dusk, long shadows, dry grass, sea behind, nobody',
  'open heathland, low cloud, purple heather turning grey, vast sky',
  'farmland in heavy rain, dark turned soil, empty furrows, horizon',
  'coastal salt marsh, water channels and reed, grey morning, birds rising',
  'mountain plateau, clouds moving fast overhead, no shelter anywhere',
  'tidal flat at estuary, wading birds, glint of channel, afternoon',
  'open field, single hawthorn tree, horizon to horizon, sky dominant',
  'moorland at night, stars above, darkness between earth and sky',
  'valley from high ridge, farms small below, cloud shadow moving',
  'deserted small island, no structures, wind-bent grass, surrounding sea',
  'cliff edge, nothing between you and Atlantic horizon, scale and exposure',
  'wetland at dawn, mist on surface, reeds, first birds moving in grey',
  'high cliffs, sea far below, Atlantic to the west, geological scale',
  'moorland track fading into distance, nobody following, solitude',
  'open bay, beach curved, tide far out, empty, afternoon silence',
  'mountain tarn, dark still water, reflected sky, absolute silence',
  'winter wheat field, pale grey-green, overcast, cold light, waiting',
  'bog pool reflecting heavy sky, peat brown water, no horizon visible',
  'coastal dune slack, fresh water lake, dune grass, sea barely visible',
  'headland in winter storm, spray reaching grass cliff top, power',
  'open estuary at low tide, nothing much to see, everything to feel',
  'harvested summer meadow, stubble golden, sky huge, harvest past',
  'high moor, standing water in rushes, cloud low, emptiness absolute',
  'cliff path, view to sea, grass on both sides, walking alone',
  'sand bar at low tide, water on both sides, narrow ground, between',
  'open Atlantic from high cliff, nothing between here and Americas',
  'fallow field, old plough patterns visible, winter, birds feeding',
  'salt flat, thin sheet of water, flat ground, reflection sky',
  'hilltop, view of sea and village below, I have stood here before',
  'island causeway, tide rising, decision time, crossing or staying',
  'long beach in low winter sun, shadows very long, cold light',
  'upland stream, clear over dark peat rocks, moorland sound, alone',
  'coastal heath in autumn, purple going to brown, sea in distance',
  'empty cliff-top farm track, gate open, fields beyond, clouds',
  'dried summer river bed, stones, memory of water, heat',
  'causeway road, sea visible both sides, sky above, between worlds',
  'open field with old wooden gate, path beyond, invitation to walk',
  'coastal promontory, old lighthouse at very end, walking toward it',

  // ── Light & Shadow (481–500) ──────────────────────────────────────────────
  'long afternoon shadow on stone path, person absent, shadow present',
  'light through slatted shutters, parallel lines on floor, noon',
  'shaft of light in dusty empty room, floating particles, evidence',
  'shadow of tree moving on stone path, slight wind, afternoon quiet',
  'light at end of long tunnel, perspective drawing to point, arrival',
  'reflections in wet cobblestones at evening, inverted world beautiful',
  'single window light falling on floor, rest of room dark, focus',
  'silhouette of figure in doorway, bright light behind, arrival',
  'shadow play of bare branches on bedroom wall, night wind outside',
  'sunset light through old wavy glass, distorted and beautiful',
  'light pool on stone floor, darkness surrounding, island of warmth',
  'candle reflection in old dark mirror, doubled flame, time doubled',
  'light refracting through drinking glass, small rainbow on wall',
  'silhouette of buildings against evening sky, windows dark, cut-out',
  'shadow of tree roots on rock face, above and below meeting',
  'light on moving water surface, patterns changing, time made visible',
  'reflection of sky in puddle, foot not yet stepping in, possibility',
  'light on grain of old wood, texture fully revealed, beautiful detail',
  'long corridor, single light source, long shadows, walking toward light',
  'light fading from window, last minutes, the world darkening gently',
]

// Build final 500-entry array
const PROMPTS = RAW.map((raw, i) => ({
  id:     `vb-${String(i + 1).padStart(3, '0')}`,
  label:  raw.slice(0, 60),
  prompt: raw + STYLE,
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────
function writeManifest(state) {
  const entries = Object.values(state).filter((e) => e.status === 'complete' && e.publicUrl)
  const manifest = entries.map((e) => e.publicUrl)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  log(`Manifest: ${entries.length} background images.`)
}

// ─── Execute ─────────────────────────────────────────────────────────────────
async function runExecute(items) {
  if (!process.env.KIE_API_KEY) { err('KIE_API_KEY not set'); process.exit(1) }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const state = loadState(OUTPUT_DIR)
  let submitted = 0

  for (const item of items) {
    const existing = state[item.id]
    if (!FORCE && isComplete(existing)) { log(`⏭  ${item.id} — already complete`); continue }
    if (!FORCE && isPending(existing))  { log(`⏭  ${item.id} — already pending`);  continue }

    try {
      const taskId = await submitImageJob(item.prompt, { aspectRatio: '16:9' })
      state[item.id] = {
        ...blankEntry(item.id, item.label),
        taskId,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      }
      saveState(OUTPUT_DIR, state)
      log(`✓  ${item.id} submitted — taskId: ${taskId}`)
      submitted++
    } catch (e) {
      warn(`✗  ${item.id} failed: ${e.message}`)
      state[item.id] = { ...blankEntry(item.id, item.label), status: 'failed', error: e.message }
      saveState(OUTPUT_DIR, state)
    }

    if (submitted % 5 === 0) saveState(OUTPUT_DIR, state)
    await sleep(RATE_LIMIT_MS)
  }

  saveState(OUTPUT_DIR, state)
  log(`Submitted ${submitted} jobs. Run --poll to download.`)
}

// ─── Poll ─────────────────────────────────────────────────────────────────────
async function runPoll(items) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const deadline = Date.now() + POLL_TIMEOUT_MS
  let lastActivity = Date.now()

  while (Date.now() < deadline) {
    const state    = loadState(OUTPUT_DIR)
    const pending  = items.filter((i) => isPending(state[i.id]))
    const complete = items.filter((i) => isComplete(state[i.id])).length
    const total    = items.length

    log(`Poll: ${complete}/${total} complete · ${pending.length} pending`)

    if (pending.length === 0) {
      writeManifest(state)
      log('All done.')
      return
    }

    let changed = false
    for (const item of pending) {
      const entry = state[item.id]
      if (!entry?.taskId) continue

      try {
        const { done, failed, url } = await pollImageJob(entry.taskId)
        if (done && !failed && url) {
          const filename = `${item.id}.jpg`
          const destPath = path.join(OUTPUT_DIR, filename)
          await downloadFile(url, destPath)
          state[item.id] = {
            ...entry,
            status:      'complete',
            remoteUrl:   url,
            localPath:   destPath,
            publicUrl:   `${PUBLIC_BASE}/${filename}`,
            completedAt: new Date().toISOString(),
          }
          log(`  ✓ ${item.id} → ${filename}`)
          changed = true
        } else if (done && failed) {
          state[item.id] = { ...entry, status: 'failed', error: 'Generation failed' }
          warn(`  ✗ ${item.id} — failed`)
          changed = true
        }
      } catch (e) {
        warn(`  Poll error for ${item.id}: ${e.message}`)
      }
    }

    if (changed) { saveState(OUTPUT_DIR, state); lastActivity = Date.now() }
    if (Date.now() - lastActivity > 10 * 60 * 1000) {
      warn('No progress in 10 min — stopping poll.')
      break
    }
    await sleep(POLL_INTERVAL_MS)
  }

  writeManifest(loadState(OUTPUT_DIR))
  log('Poll timeout reached.')
}

// ─── List ─────────────────────────────────────────────────────────────────────
function runList(items) {
  const state = loadState(OUTPUT_DIR)
  const counts = { none: 0, pending: 0, complete: 0, failed: 0 }
  for (const item of items) {
    const s = state[item.id]?.status ?? 'none'
    counts[s] = (counts[s] ?? 0) + 1
  }
  console.log(`\nVideo background status:`)
  console.log(`  Total:    ${items.length}`)
  console.log(`  Complete: ${counts.complete}`)
  console.log(`  Pending:  ${counts.pending}`)
  console.log(`  Failed:   ${counts.failed}`)
  console.log(`  None:     ${counts.none}\n`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  log(`NoiraCiel · Video Backgrounds · ${PROMPTS.length} prompts`)

  if (DRY_RUN) {
    log(`DRY RUN — ${PROMPTS.length} prompts ready`)
    log('  --execute  submit all jobs to Kie.ai')
    log('  --poll     download completed images')
    log('  --list     show current status')
    return
  }
  if (LIST_MODE)  { runList(PROMPTS); return }
  if (EXEC_MODE)  { await runExecute(PROMPTS); return }
  if (POLL_MODE)  { await runPoll(PROMPTS); return }
}

main().catch((e) => { err(e.message); console.error(e); process.exit(1) })
