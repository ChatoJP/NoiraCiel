#!/usr/bin/env node
/**
 * generate-product-images.js
 *
 * Generates lifestyle product mockup images for the NoiraCiel shop
 * via Kie.ai Flux Kontext. Every image is a cinematic Atlantic Noir
 * product photograph — no text, no faces, no generic stock clichés.
 *
 * USAGE
 *   node scripts/generate-product-images.js --list
 *   node scripts/generate-product-images.js --execute
 *   node scripts/generate-product-images.js --poll
 *   node scripts/generate-product-images.js --execute --category music
 *   node scripts/generate-product-images.js --execute --id vinyl-record
 *   node scripts/generate-product-images.js --force --execute
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const {
  loadEnv, log, warn, err, sleep,
  downloadFile, submitImageJob, pollImageJob, RATE_LIMIT_MS,
} = require('./lib/kie-client')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

const OUTPUT_DIR       = path.join(__dirname, '..', 'public', 'Images', 'products')
const POLL_INTERVAL_MS = 18_000
const POLL_TIMEOUT_MS  = 25 * 60 * 1000

// ─── Shared style ─────────────────────────────────────────────────────────────
const S = `Product lifestyle photography: dark Atlantic aesthetic, premium tactile surfaces,
16mm film grain, painterly shadows, warm amber and candlelight accents, deep navy and black palette.
Shot on medium format film. No text visible. No faces. No neon. No plastic surfaces.
Textures: aged wood, stone, linen, wax, ceramic, dark cloth, raw paper.
Background: stone walls, wooden tables, windowsills with fog, candlelit shelves, aged desks.`

// ─── Product catalogue ────────────────────────────────────────────────────────
const PRODUCTS = [

  // ─── Music ──────────────────────────────────────────────────────────────────
  {
    id: 'vinyl-record', category: 'music', label: 'Vinyl Record',
    aspect: '1:1',
    prompt: `A 12-inch vinyl record partially emerging from a matte black sleeve, placed on aged oak wood beside a lit candle. The record grooves catch amber candlelight. An old ceramic mug of coffee nearby. Evening atmosphere, intimate, collector's quality. ${S}`,
  },
  {
    id: 'vinyl-gatefold-open', category: 'music', label: 'Vinyl Gatefold (Open)',
    aspect: '16:9',
    prompt: `A gatefold vinyl record sleeve opened flat on a dark wooden table, showing interior artwork — an atmospheric coastal photograph on the left, lyrics printed in small serif type on the right. Candlelight from off-camera. Tactile, premium, literary. ${S}`,
  },
  {
    id: 'cassette-tape', category: 'music', label: 'Cassette Tape',
    aspect: '1:1',
    prompt: `A cassette tape with dark minimal label resting on a rain-streaked windowsill. Old paperback books stacked behind it. Amber reading lamp glow. The tape shell is charcoal black, label in cream. Nostalgic, intimate, analogue warmth. ${S}`,
  },
  {
    id: 'cd-album', category: 'music', label: 'CD Album',
    aspect: '1:1',
    prompt: `A jewel case CD album lying open on a linen cloth, the disc catching soft window light with a subtle rainbow reflection. The booklet is visible beneath it — dark cover, fine serif typography. Morning window light, quiet bedroom atmosphere. ${S}`,
  },
  {
    id: 'vinyl-on-player', category: 'music', label: 'Vinyl on Turntable',
    aspect: '16:9',
    prompt: `A vinyl record spinning on a vintage turntable, tonearm resting on the grooves. Warm amber backlighting. Shelves of books and other records blurred softly behind. The turntable is on a dark wooden console near a window showing coastal fog. ${S}`,
  },

  // ─── Books ───────────────────────────────────────────────────────────────────
  {
    id: 'hardcover-novel', category: 'books', label: 'Hardcover Novel',
    aspect: '9:16',
    prompt: `A premium hardcover book with dark navy cloth binding and gold foil lettering on the spine, standing upright on an aged wooden shelf between other books. Afternoon light falling across the spines. Dust motes in the air. Literary, timeless quality. ${S}`,
  },
  {
    id: 'hardcover-novel-open', category: 'books', label: 'Hardcover Novel (Open)',
    aspect: '1:1',
    prompt: `A hardcover novel lying open on a dark stone desk, pages splayed naturally, fine serif typography visible. A brass pen rests across the page. Candlelight from beside it. The book's cloth cover is visible — deep navy, textured. A reader's book. ${S}`,
  },
  {
    id: 'paperback-novel', category: 'books', label: 'Paperback Novel',
    aspect: '9:16',
    prompt: `A paperback novel held loosely in a hand, seen from behind — just the hands and the book, outdoors at a coastal stone wall, ocean visible below in soft focus. Afternoon light. The cover is dark with minimal gold type. A reading life. ${S}`,
  },
  {
    id: 'art-book', category: 'books', label: 'Art Book (Coffee Table)',
    aspect: '16:9',
    prompt: `A large format coffee table art book open on a stone floor, showing a full-bleed dark atmospheric photograph of an Atlantic coastline at dusk. The book is substantial and beautiful — thick pages, premium printing. Afternoon light falls across it. ${S}`,
  },
  {
    id: 'painting-book', category: 'books', label: 'Painting Book',
    aspect: '1:1',
    prompt: `An open painting book showing detailed pencil line illustrations of Atlantic scenes — a doorway, an old tree, a coastal road — waiting to be painted. Watercolour paints and brushes arranged artfully beside it on a wooden table. Natural window light. ${S}`,
  },
  {
    id: 'painting-book-in-progress', category: 'books', label: 'Painting Book (In Use)',
    aspect: '1:1',
    prompt: `A painting book with one illustration partially coloured in soft watercolour washes — deep blues and amber. A hand holding a fine brush is mid-stroke. A glass of water with faint colour nearby. Afternoon light. Creative, intimate, slow living. ${S}`,
  },
  {
    id: 'lyric-booklet', category: 'books', label: 'Lyric Booklet',
    aspect: '1:1',
    prompt: `A premium lyric booklet — saddle stitched, dark cover — lying open to show verses printed in elegant serif type on cream paper with generous margins. A dried flower pressed between the pages. On a wooden surface in window light. ${S}`,
  },
  {
    id: 'postcard-set', category: 'books', label: 'Postcard Set',
    aspect: '1:1',
    prompt: `A set of postcards spread in a fan on a dark wooden table — each showing a different atmospheric Atlantic scene. Dark, cinematic photography printed on heavy matte card. A few cards turned over to show minimal text on the reverse. ${S}`,
  },
  {
    id: 'quote-cards', category: 'books', label: 'Quote Cards',
    aspect: '1:1',
    prompt: `A set of letterpress quote cards with gold foil typography on deep charcoal paper, spread artfully on a stone surface beside a burning candle. The cards are thick, tactile, precious. Some face up showing lyric phrases, some face down. ${S}`,
  },

  // ─── Art & Prints ─────────────────────────────────────────────────────────
  {
    id: 'chapter-map-poster', category: 'print', label: 'Chapter Map Poster',
    aspect: '9:16',
    prompt: `A large format poster partially unrolled on a dark wooden floor, showing a constellation map of seventeen stars on deep navy paper with gold ink. The design is minimal, celestial, precise. The paper is thick and beautiful. Some stars connected by delicate gold lines. ${S}`,
  },
  {
    id: 'chapter-art-print-framed', category: 'print', label: 'Chapter Art Print (Framed)',
    aspect: '9:16',
    prompt: `A framed fine art print hanging on a whitewashed stone wall — a moody Atlantic coastal scene at dusk, silver and navy tones. The frame is thin dark wood. Afternoon light falls across it casting a gentle shadow. Below it, an old wooden chair. ${S}`,
  },
  {
    id: 'art-print-set', category: 'print', label: 'Art Print Series (17)',
    aspect: '16:9',
    prompt: `Seventeen small framed photographs arranged in a grid on a white stone wall — each showing a different dark cinematic scene. Different sizes but cohesive. A hallway gallery in a beautiful old stone house. Evening light. Quiet and contemplative. ${S}`,
  },
  {
    id: 'canvas-print', category: 'print', label: 'Canvas Print',
    aspect: '1:1',
    prompt: `A large canvas print leaning against a stone wall on a wooden floor — showing a sweeping Atlantic coastline at night, silver moonlight on water, deep navy and charcoal tones. The canvas texture is visible. Gallery wrap, no frame. ${S}`,
  },
  {
    id: 'signed-limited-print', category: 'print', label: 'Signed Limited Print',
    aspect: '9:16',
    prompt: `A fine art print lying flat on a dark surface, a pencil signature in the lower right corner, a small edition number handwritten. Certificate of authenticity beside it on cream paper. The print shows an intimate coastal scene. Premium presentation. ${S}`,
  },

  // ─── Candles & Lifestyle ──────────────────────────────────────────────────
  {
    id: 'candle-atlantic-night', category: 'home', label: 'Atlantic Night Candle',
    aspect: '1:1',
    prompt: `A single dark cylindrical soy candle burning on a stone windowsill, flame reflected in rain-streaked glass, coastal fog visible outside. The vessel is matte charcoal ceramic with a minimal cream label. Deep shadows. Intimate, meditative. ${S}`,
  },
  {
    id: 'candle-set-three', category: 'home', label: 'Candle Set of Three',
    aspect: '1:1',
    prompt: `Three dark soy candles of different heights clustered on an aged wooden surface, all burning. Warm amber light pools around their bases. Behind them, an old stone wall and a fogged window. Each candle vessel is charcoal ceramic with minimal gold labelling. ${S}`,
  },
  {
    id: 'candle-borrowed-time', category: 'home', label: 'Borrowed Time Candle',
    aspect: '1:1',
    prompt: `A single elegant candle beside an open book and a glass of amber liquid on a dark wood table. Late evening atmosphere. The candle is nearly halfway burned — a beautiful memento mori. Shadows long and soft. Time passing, beautifully. ${S}`,
  },
  {
    id: 'matchbox', category: 'home', label: 'Branded Matchbox',
    aspect: '1:1',
    prompt: `A small matchbox with a dark printed label resting beside a lit candle. A few matches scattered around it on aged wood. Macro-close detail of the matchbox surface — texture of the striker strip, warm amber light. Simple, tactile, beautiful. ${S}`,
  },
  {
    id: 'reed-diffuser', category: 'home', label: 'Reed Diffuser',
    aspect: '1:1',
    prompt: `A dark glass reed diffuser with thin rattan reeds, standing on a stone bathroom shelf beside a folded dark linen towel. Morning fog outside the frosted glass window. Minimal, spa-quality, Atlantic Noir. ${S}`,
  },
  {
    id: 'throw-blanket', category: 'home', label: 'Atlantic Noir Throw',
    aspect: '16:9',
    prompt: `A dark charcoal wool throw blanket draped over a worn leather armchair near a window showing coastal fog. A book lies face-down on the arm of the chair. A cold cup of tea on the stone floor. The blanket has a subtle woven pattern. ${S}`,
  },
  {
    id: 'mug-noir', category: 'home', label: 'Atlantic Mug',
    aspect: '1:1',
    prompt: `A dark matte ceramic mug filled with black coffee steaming gently, held in two hands near a window. Outside: coastal fog, grey morning light. The mug is handmade-looking, minimal. The warmth of it against the cold of everything else. ${S}`,
  },
  {
    id: 'coaster-set', category: 'home', label: 'Stone Coaster Set',
    aspect: '1:1',
    prompt: `A set of four slate coasters stacked with slight offset on a dark wooden table. Each has a subtle etched design. One coaster has a mug resting on it. Afternoon light. Heavy, natural, beautiful materials. ${S}`,
  },
  {
    id: 'cushion', category: 'home', label: 'Linen Cushion',
    aspect: '1:1',
    prompt: `A dark linen cushion on a worn leather sofa near a window, embroidered with a minimal constellation pattern in gold thread. Afternoon light. Texture of the linen visible. The kind of cushion in a slow, beautiful home. ${S}`,
  },

  // ─── Stationery ───────────────────────────────────────────────────────────
  {
    id: 'journal', category: 'stationery', label: 'Atlantic Journal',
    aspect: '9:16',
    prompt: `A dark navy cloth-bound journal closed on a wooden desk, beside a brass fountain pen and a burning candle. The cover has gold foil embossing — a small constellation mark. Evening light. The journal of a person who thinks deeply. ${S}`,
  },
  {
    id: 'journal-open', category: 'stationery', label: 'Journal (Open)',
    aspect: '1:1',
    prompt: `An open journal showing two cream pages with handwritten text in dark ink, a dried wildflower pressed flat between them. The journal lies on aged wood. A pen rests across the spine. Daylight from a nearby window. Intimate and private. ${S}`,
  },
  {
    id: 'notebook', category: 'stationery', label: 'Lyric Notebook',
    aspect: '9:16',
    prompt: `A smaller notebook with a soft dark cover lying on a stone surface, pencil beside it. Some pages slightly worn at the corners from use. The kind of notebook for quick thoughts, song fragments, late-night words. Tactile and honest. ${S}`,
  },
  {
    id: 'bookmark-set', category: 'stationery', label: 'Bookmark Set',
    aspect: '1:1',
    prompt: `Five bookmarks spread on a dark surface — each a different design in deep navy and gold. Thick card, minimal lettering. One is already inside an open book, marking the page. Elegant and purposeful objects for readers. ${S}`,
  },
  {
    id: 'gift-box', category: 'stationery', label: 'NoiraCiel Gift Box',
    aspect: '1:1',
    prompt: `A premium gift box in deep charcoal with a dark ribbon tied in a simple bow, resting on aged wood. The box is closed — anticipation. Beside it: a wax seal stamp, a sprig of dried lavender. The kind of gift that means something. ${S}`,
  },
  {
    id: 'writing-set', category: 'stationery', label: 'Writing Set',
    aspect: '16:9',
    prompt: `A writing desk flatlay: dark journal, brass fountain pen, a small inkwell, the postcard set, bookmark, and one burning candle. Arranged with care on dark wood. A complete set for a writer. Morning light. ${S}`,
  },

  // ─── Apparel ─────────────────────────────────────────────────────────────
  {
    id: 'tshirt-folded', category: 'apparel', label: 'T-Shirt (Folded)',
    aspect: '1:1',
    prompt: `A folded dark charcoal t-shirt on aged wood, minimal logo barely visible on the chest — a small constellation mark in faded cream. Natural light. The fabric looks high quality, substantial. Fashion for people who dress with intention. ${S}`,
  },
  {
    id: 'hoodie-worn', category: 'apparel', label: 'Hoodie',
    aspect: '1:1',
    prompt: `A dark navy hoodie hanging on an old iron hook on a stone wall, hood slightly forward. Afternoon light from a nearby window casting soft shadows. The fabric is heavyweight, premium. A small embroidered detail on the chest. ${S}`,
  },
  {
    id: 'cap', category: 'apparel', label: 'Cap',
    aspect: '1:1',
    prompt: `A dark structured cap resting on an old wooden shelf, tilted slightly to show both the crown and brim. A minimal embroidered mark on the front panel. Afternoon light. Simple and precise. ${S}`,
  },
  {
    id: 'tote-bag', category: 'accessories', label: 'Tote Bag',
    aspect: '1:1',
    prompt: `A natural canvas tote bag hanging on a dark iron hook against a stone wall, a book and the corner of a notebook visible inside it. The front has a minimal screen-printed dark design. Morning light. A daily companion. ${S}`,
  },

  // ─── Experiences (digital products / events) ─────────────────────────────
  {
    id: 'listening-session', category: 'experiences', label: 'Listening Session',
    aspect: '16:9',
    prompt: `An intimate candlelit room — maybe fifteen empty wooden chairs in a circle, facing each other. A single record player on a central table with a vinyl record. Warm amber light. Stone walls. The chairs wait. Quiet expectation before something begins. ${S}`,
  },
  {
    id: 'vinyl-bundle', category: 'music', label: 'Collector Bundle',
    aspect: '16:9',
    prompt: `A flatlay on dark wood: vinyl record partially out of sleeve, the hardcover book open beside it, three candles burning, the postcard set, a journal with pen. Everything from the NoiraCiel world arranged with care. A complete universe in objects. ${S}`,
  },
]

// ─── CLI args ──────────────────────────────────────────────────────────────────
const args         = process.argv.slice(2)
const DRY_RUN      = !args.some((a) => ['--execute', '--poll', '--list', '--reset'].includes(a))
const EXEC_MODE    = args.includes('--execute')
const POLL_MODE    = args.includes('--poll')
const LIST_MODE    = args.includes('--list')
const FORCE        = args.includes('--force')
const CATEGORY_ARG = (() => { const i = args.indexOf('--category'); return i !== -1 ? args[i + 1] : null })()
const ID_ARG       = (() => { const i = args.indexOf('--id');       return i !== -1 ? args[i + 1] : null })()

// ─── Filter ────────────────────────────────────────────────────────────────────
function getTargets() {
  if (ID_ARG)       return PRODUCTS.filter((p) => p.id === ID_ARG)
  if (CATEGORY_ARG) return PRODUCTS.filter((p) => p.category === CATEGORY_ARG)
  return PRODUCTS
}

// ─── List ──────────────────────────────────────────────────────────────────────
function runList() {
  const state    = loadState(OUTPUT_DIR)
  const targets  = getTargets()
  const bycat    = {}
  for (const p of targets) {
    if (!bycat[p.category]) bycat[p.category] = []
    bycat[p.category].push(p)
  }

  console.log('\n🛍️   NoiraCiel product image status:\n')
  for (const [cat, items] of Object.entries(bycat)) {
    console.log(`  ── ${cat.toUpperCase()} ──`)
    for (const p of items) {
      const e   = state[p.id]
      const sym = { none: '○', pending: '⏳', generating: '🔄', complete: '✅', failed: '✗' }[e?.status ?? 'none'] ?? '?'
      console.log(`    ${sym}  ${p.id.padEnd(32)} ${p.label}`)
    }
    console.log()
  }

  const done    = targets.filter((p) => isComplete(state[p.id])).length
  const pending = targets.filter((p) => isPending(state[p.id])).length
  console.log(`  ${done}/${targets.length} complete · ${pending} pending\n`)
}

// ─── Submit ────────────────────────────────────────────────────────────────────
async function runExecute() {
  const state   = loadState(OUTPUT_DIR)
  const targets = getTargets()
  const todo    = targets.filter((p) => FORCE || !isComplete(state[p.id]) && !isPending(state[p.id]))

  if (!todo.length) { log('Nothing to submit.'); return }

  log(`Submitting ${todo.length} image job(s)…`)
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  for (const p of todo) {
    try {
      const taskId = await submitImageJob(p.prompt, { aspectRatio: p.aspect ?? '1:1' })
      state[p.id] = { ...blankEntry(p.id, p.label), taskId, status: 'pending', submittedAt: new Date().toISOString() }
      saveState(OUTPUT_DIR, state)
      log(`✓ Submitted: ${p.id} (${taskId})`)
    } catch (e) {
      err(`✗ ${p.id}: ${e.message}`)
      state[p.id] = { ...blankEntry(p.id, p.label), status: 'failed', error: e.message }
      saveState(OUTPUT_DIR, state)
    }
    await sleep(RATE_LIMIT_MS)
  }

  log('All jobs submitted. Run --poll to download results.')
}

// ─── Poll ──────────────────────────────────────────────────────────────────────
async function runPoll() {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  log('Polling until all pending jobs complete…')

  while (Date.now() < deadline) {
    const state   = loadState(OUTPUT_DIR)
    const pending = Object.values(state).filter((e) => isPending(e))
    if (!pending.length) { log('All done.'); return }

    log(`${pending.length} pending…`)
    for (const entry of pending) {
      try {
        const result = await pollImageJob(entry.taskId)
        if (result.done && !result.failed && result.url) {
          const ext  = result.url.split('?')[0].split('.').pop() || 'jpg'
          const dest = path.join(OUTPUT_DIR, `${entry.id}.${ext}`)
          await downloadFile(result.url, dest)
          state[entry.id] = {
            ...entry,
            status:      'complete',
            remoteUrl:   result.url,
            localPath:   dest,
            publicUrl:   `/images/products/${entry.id}.${ext}`,
            completedAt: new Date().toISOString(),
          }
          saveState(OUTPUT_DIR, state)
          log(`✅  ${entry.id}`)
        } else if (result.done && result.failed) {
          state[entry.id] = { ...entry, status: 'failed', error: 'Generation failed' }
          saveState(OUTPUT_DIR, state)
          err(`✗  ${entry.id} failed`)
        }
      } catch (e) {
        warn(`Poll error for ${entry.id}: ${e.message}`)
      }
      await sleep(1200)
    }

    await sleep(POLL_INTERVAL_MS)
  }

  warn('Timeout reached. Run --poll again to continue.')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (LIST_MODE)    { runList(); return }
  if (EXEC_MODE)    { await runExecute(); return }
  if (POLL_MODE)    { await runPoll(); return }

  // dry-run
  const targets = getTargets()
  console.log(`\n🛍️   NoiraCiel product images — ${targets.length} products across ${[...new Set(targets.map(p => p.category))].length} categories\n`)
  console.log('  Categories:', [...new Set(PRODUCTS.map(p => p.category))].join(', '))
  console.log(`\n  Run with --execute to submit all to Kie.ai Flux Kontext`)
  console.log(`  Run with --execute --category music  to submit one category`)
  console.log(`  Run with --execute --id vinyl-record  to submit one product`)
  console.log(`  Run with --poll to download completed images\n`)
}

main().catch((e) => { err(e.message); process.exit(1) })
