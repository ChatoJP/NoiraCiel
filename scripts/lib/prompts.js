'use strict'
/**
 * prompts.js
 * All KIE.AI prompt builders for the NoiraCiel visual universe.
 *
 * NoiraCiel is a digital art project. Every prompt must honour the 10 pillars:
 * dark Atlantic emotion · memory · family · dignity · poetic realism
 * cinematic beauty · human imperfection · symbolic objects · silence
 * sea · roots · doors · roads · windows · light · time · childhood · legacy
 *
 * Never: generic AI fantasy, neon, plastic faces, stock-video clichés,
 *        fast cuts, glossy corporate look, cheap surrealism.
 */

// ─── Shared style signature ───────────────────────────────────────────────────
const NOIR_STYLE = `
Visual style: premium European art cinema, 16mm film grain, painterly textures,
slow atmospheric pacing, long tonal range from near-black to warm amber.
Palette: deep navy, pitch black, weathered bone white, warm gold, Atlantic grey.
Camera language: slow dolly, intimate close-up of hands and objects, overhead poetic tableaux.
Mood: emotional dignity without sentimentality — hope inside darkness, beauty inside struggle.
Atlantic world: coastline at dusk, aged stone walls, fog-lit roads, old wooden boats,
candlelight through aged windows, lace curtains, hands holding photographs, empty chairs,
children in doorways, a woman at a sea cliff, morning light through salt-stained glass.
NEVER: neon lights, fast cuts, CGI, glossy surfaces, text overlays, dancing silhouettes,
cartoonish shapes, generic AI aesthetics, plastic faces, stock-video look.
`.trim()

const NOIR_STYLE_SHORT = `16mm film grain, dark Atlantic palette (navy, black, amber gold), painterly, cinematic, no text, no faces, no neon.`

// ─── Song-specific visual chapters ───────────────────────────────────────────
// Each song is a chapter with its own emotional and visual identity.
const SONG_CHAPTERS = {
  1: {
    title: 'Why',
    emotion: 'The lifelong question — searching for meaning that was always already there.',
    scene:   'A solitary figure walking a coastal road at dusk, the ocean barely visible at the end. Hands reaching toward a disappearing horizon. An old book open in an attic window. The road itself is the answer.',
    symbols: 'road, horizon, open book, hands, dusk light',
    arc:     ['Setting out — a long empty road at golden hour', 'The searching — hands touching worn pages', 'The realisation — ocean light through fog'],
  },
  2: {
    title: 'Who Wins if I Win',
    emotion: 'The hollowness of achievement when it costs us the people we love.',
    scene:   'A trophy placed on a shelf gathering dust. A lone figure on a hilltop after a race, looking down at an empty valley. A reflection in still rain-water asking the question back.',
    symbols: 'trophy, hilltop, empty valley, still water, rain',
    arc:     ['The climb — steep coastal path, striving figure', 'The summit — cold and solitary, no one waiting', 'The reflection — trophy beside a family photograph'],
  },
  3: {
    title: 'The Roots We Cannot See',
    emotion: 'The invisible inheritance — what our ancestors planted in us without us knowing.',
    scene:   'Ancient tree roots breaking through stone pavement. An elderly woman tending a garden in silence. A child watching her grandmother from a doorway, not yet understanding what she is witnessing.',
    symbols: 'roots, stone, garden, doorway, grandmother, seeds',
    arc:     ['Underground — roots beneath soil, unseen', 'The tending — patient hands in dark earth', 'The inheritance — child at doorway, future visible'],
  },
  4: {
    title: "If We Can't Say The Hard Truths",
    emotion: 'The weight of words never spoken — how silence can be its own kind of violence.',
    scene:   'Two chairs at a kitchen table, both empty. Letters folded but never sent, scattered across a floor. A hand reaching across a table that is too wide to cross.',
    symbols: 'empty chairs, unsent letters, kitchen table, reaching hand, silence',
    arc:     ['The kitchen — two chairs, late afternoon, unspoken', 'The letters — scattered paper, ink that dried', 'The crossing — a hand reaching across impossible distance'],
  },
  5: {
    title: 'Still Worth It',
    emotion: 'Dignity in honest work — the beauty of a life lived through labour and love.',
    scene:   'A weathered fishing boat returning through rough Atlantic waves at dawn. Calloused hands still working after decades of wear. A woman waiting at a harbour wall, her face against the salt wind.',
    symbols: 'fishing boat, harbour, weathered hands, dawn, Atlantic waves',
    arc:     ['The going out — boat in rough dark water', 'The working — hands, nets, salt, endurance', 'The return — harbour wall, a woman waiting, dawn light'],
  },
  6: {
    title: 'Side By Side',
    emotion: 'The grace of companionship — walking the same road without needing to speak.',
    scene:   'Two elderly people walking slowly on a coastal path, their hands close but not quite touching. Long shadows stretching behind them in late afternoon Atlantic light. The same unhurried rhythm.',
    symbols: 'coastal path, long shadows, two figures, late light, unhurried steps',
    arc:     ['Starting out together — coastal path, morning mist', 'The long middle — decades passed, same pace', 'Late afternoon — long shadows, still walking'],
  },
  7: {
    title: "As Long as You're Okay",
    emotion: "A parent's silent vigil — the love that asks for nothing, only safety.",
    scene:   'A child sleeping peacefully while a parent watches from the doorway, silhouetted against low lamplight. A phone illuminating a worried face at 2am. The moment when the world is still and someone you love is safe.',
    symbols: 'doorway silhouette, sleeping child, lamp, phone glow, 2am',
    arc:     ['The doorway — parent watching, low lamp', 'The 2am — phone glow, waiting for news', 'The peace — stillness, safe, quiet exhale'],
  },
  8: {
    title: 'It Was Already There',
    emotion: 'Recognition — looking back and seeing the love that was always present, just unnamed.',
    scene:   'Light falling through dust in an attic room, illuminating a box of old photographs. A hand touching the frame of a mirror, recognising something that was always true. The past made suddenly visible.',
    symbols: 'attic light, dust motes, old photographs, mirror, recognition',
    arc:     ['The attic — dust and old light', 'The box of photographs — faces from the past', 'The mirror — recognition, something always there'],
  },
  9: {
    title: 'Always In Your Corner',
    emotion: 'The phone call that changes the quality of darkness — someone always present.',
    scene:   'A small room at night, rain on the window, a single lamp. A phone call received — the darkness shifts. Morning light arriving slowly through thin curtains as reassurance settles.',
    symbols: 'rain on window, single lamp, phone call, morning light, thin curtains',
    arc:     ['The dark room — alone, rain, lamp', 'The call — light changing', 'The morning — curtains, quiet reassurance'],
  },
  10: {
    title: "The House We Couldn't Leave",
    emotion: "The family home as a living thing — how spaces hold the memory of those who loved them.",
    scene:   'A family home photographed from outside across a field, its windows glowing golden in the dark. Objects left behind in quiet rooms. A hand closing a door for the last time, the house exhaling.',
    symbols: 'family home, glowing windows, dark field, left-behind objects, closing door',
    arc:     ['From outside — the glowing windows, night', 'Inside — objects, traces, absence', 'The leaving — hand on door, final light'],
  },
  11: {
    title: "I Never Knew Any Other Way",
    emotion: 'The tenderness of simplicity — a life lived without alternatives, full of its own kind of grace.',
    scene:   'Faded home footage quality images of a coastal village at dawn. A woman going about her familiar rituals — water, bread, cloth. Familiar streets, familiar faces, a life of unhurried completeness.',
    symbols: 'coastal village, dawn rituals, faded warmth, familiar streets, simple grace',
    arc:     ['Dawn — coastal village waking', 'The rituals — quiet, complete, unremarkable beauty', 'The village — faces, streets, sea always present'],
  },
  12: {
    title: 'Leave A Light On',
    emotion: "The lit window as love's most silent language — a mother's vigil made visible.",
    scene:   'A single window lit from inside, seen from the dark outside. A silhouette visible behind the glass, waiting. The moment a door opens from inside and warm light spills onto cold stone.',
    symbols: 'lit window, dark exterior, silhouette, waiting, warm light on cold stone',
    arc:     ['The exterior — dark, cold, one lit window', 'The silhouette — waiting, patient, faithful', 'The door opening — warm light flooding out'],
  },
  13: {
    title: 'The Empty Chair',
    emotion: 'Grief that has found its proper place — the presence of the absent, held with dignity.',
    scene:   'A family table fully set for Sunday dinner, one chair conspicuously empty. The afternoon light falling on it in a particular way that makes the absence feel sacred rather than painful.',
    symbols: 'empty chair, Sunday table, afternoon light, place setting, sacred absence',
    arc:     ['The table being set — hands, careful, Sunday ritual', 'The empty chair — light falls on it, deliberate', 'The gathering — family around it, the absent present'],
  },
  14: {
    title: 'Good Things Grow Slow',
    emotion: 'Patience as a radical act — the dignity of slow, deliberate growth over time.',
    scene:   'An old man tending a garden with patient, unhurried hands. A tree recorded across four seasons. Seeds pressed into dark earth. The slow accumulation of something that cannot be hurried.',
    symbols: 'garden, old hands, four seasons, seeds, earth, patience',
    arc:     ['The planting — seeds in dark earth, small hands', 'The waiting — seasons turning, nothing visible yet', 'The growing — old hands, fruit, patient time'],
  },
  15: {
    title: 'Maybe I Was Wrong',
    emotion: 'The courage of revision — the grace of returning to say what you should have said.',
    scene:   'Two people at the same kitchen table, years later. Morning coffee. The light is different but the room is the same. Something has shifted — an opening, a softening, a return.',
    symbols: 'kitchen table, morning coffee, same room years later, changed light, an opening',
    arc:     ['The same kitchen — years later, light changed', 'Morning coffee — no words yet, just presence', 'The opening — a face changing, something released'],
  },
  16: {
    title: 'Borrowed Time',
    emotion: 'Gratitude for the unearned gift of extra time — afternoons that feel like grace.',
    scene:   'An elderly pair of hands intertwined, warm afternoon light on weathered skin. An old clock on a mantelpiece. The specific quality of late light in borrowed afternoons, quiet and golden.',
    symbols: 'intertwined hands, afternoon light, old clock, weathered skin, borrowed grace',
    arc:     ['The hands — intertwined, afternoon gold', 'The clock — slow, present, borrowed', 'The light — fading, still warm, enough'],
  },
  17: {
    title: 'Free Men Tell the Truth',
    emotion: "Freedom as clarity — the liberation that comes from speaking truthfully, whatever the cost.",
    scene:   'A man standing quietly in an open public square, speaking. Others slowly stop and listen. The atmosphere changes. Not performance — conviction. Freedom as a quality of light in the air around him.',
    symbols: 'public square, speaking, listening, changed atmosphere, conviction, open sky',
    arc:     ['The square — ordinary, busy, no one listening', 'The speaking — quiet, steady, certain', 'The listening — others stopping, air changing'],
  },
}

// ─── Song Art (1:1 square, Flux Kontext) ─────────────────────────────────────
function buildSongArtPrompt(trackNumber, title) {
  const ch = SONG_CHAPTERS[trackNumber]
  if (!ch) {
    return `Cinematic still image. Dark Atlantic mood, emotional and poetic. Song titled "${title}". ${NOIR_STYLE_SHORT}`
  }
  return `Cinematic art photograph for the song "${ch.title}" by NoiraCiel.

Emotional core: ${ch.emotion}

Visual scene: ${ch.scene}

Symbolic objects: ${ch.symbols}

${NOIR_STYLE}

Square format (1:1). No text, no faces, no people — only objects, light, landscape, atmosphere.
This is an art object for a digital museum, not album cover clip art.`
}

// ─── Video clip prompts (arc-aware, 3 phases per song) ───────────────────────
function buildVideoClipPrompt(trackNumber, title, clipIndex, totalClips) {
  const ch = SONG_CHAPTERS[trackNumber]
  const arcIdx = Math.min(Math.floor((clipIndex / totalClips) * 3), 2)
  const arcLabel = ['Opening', 'Midpoint', 'Closing'][arcIdx]
  const arcScene = ch?.arc?.[arcIdx] ?? ch?.scene ?? `Atmospheric Atlantic scene for "${title}"`

  return `Cinematic music video clip — "${title}" by NoiraCiel. Clip ${clipIndex + 1}/${totalClips} (${arcLabel}).

Scene: ${arcScene}

${NOIR_STYLE}

10-second atmospheric shot. Slow movement. No dialogue, no text, no sudden cuts.`
}

// ─── Background images (16:9, for website sections) ──────────────────────────
const BACKGROUND_THEMES = {
  hero: {
    label: 'Hero — entering the world',
    prompt: `Vast Atlantic seascape at the exact moment before a storm breaks. A single road disappearing toward the horizon across dark coastal heathland. The quality of light is apocalyptic but hopeful — grey clouds with one gold tear in them. No figures, no text, complete solitude. This is the image someone sees when they enter a world, not a website.`,
  },
  biography: {
    label: 'Biography — a life lived',
    prompt: `Intimate interior. A warm lamp on an old wooden desk, a handwritten letter partially visible, a window showing dark Atlantic rain outside. The quality of warmth is earned, not decorative. Small personal objects: a photograph, a pen, a cup. The room of someone who has lived and thought deeply.`,
  },
  world: {
    label: 'The World — Atlantic Noir universe',
    prompt: `Fog rolling in over Atlantic cliffs at dusk. Ancient stone walls. A coastal road that leads somewhere important. The world feels mythological but completely real — this could be Portugal, Galicia, or the west of Ireland. Heavy with time, salt, and quiet significance.`,
  },
  featured: {
    label: 'Featured releases — art objects',
    prompt: `Dark studio interior with painterly light falling on three symbolic objects arranged on an old wooden surface — a photograph, a glass of water, a single candle. Gallery light. Museum stillness. Objects carry the weight of unspoken stories.`,
  },
  contact: {
    label: 'Contact — reaching through',
    prompt: `A single window in a stone wall, lit from inside, seen from outside in Atlantic rain. The light is warm, the exterior cold and dark. A threshold between inside and outside worlds. Invitation in the form of light.`,
  },
}

function buildBackgroundPrompt(variant) {
  const theme = BACKGROUND_THEMES[variant]
  if (!theme) throw new Error(`Unknown background variant: ${variant}. Valid: ${Object.keys(BACKGROUND_THEMES).join(', ')}`)
  return `${theme.prompt}

${NOIR_STYLE}

16:9 landscape format. For use as a full-bleed website background — dark and rich in texture, designed to have text placed over it.`
}

// ─── Social / lyric cards (9:16 portrait) ────────────────────────────────────
function buildSocialCardPrompt(trackNumber, title) {
  const ch = SONG_CHAPTERS[trackNumber]
  const scene = ch?.scene ?? `Dark atmospheric scene related to the song "${title}"`
  return `Vertical portrait format (9:16) background image for a lyric card from the song "${title}" by NoiraCiel.

${scene}

${NOIR_STYLE}

The image must be VERY DARK — deep shadows — to allow white lyric text to be readable when overlaid on top.
No text in the image. No faces. Portrait format. Painterly texture, emotional, poetic.
This will be used as a social media lyric card background.`
}

// ─── Merch / art object concepts (1:1, print-ready) ──────────────────────────
const MERCH_CONCEPTS = [
  {
    id: 'atlantic-noir-wordmark',
    label: 'Atlantic Noir — wordmark',
    prompt: `Minimal typographic print design for a premium t-shirt. Words "ATLANTIC NOIR" in an elegant serif typeface, slightly weathered letterpress texture, dark background with bone-white ink. Below in very small letters: "NoiraCiel". Old map compass rose integrated subtly. Print-ready, no color fill — just white/bone ink on dark background.`,
  },
  {
    id: 'the-road-itself',
    label: '"The Road Itself" — lyric fragment',
    prompt: `Premium art-print t-shirt design. Hand-written style, slightly imperfect lettering: "Maybe the meaning is the road itself." Centred composition. Small wave symbol beneath. Dark background, bone-white ink. Feels like a page from a poet's notebook. No ornamentation. Print-ready.`,
  },
  {
    id: 'leave-a-light-on',
    label: '"Leave A Light On" — symbolic',
    prompt: `Elegant t-shirt art design. A single lit window illustrated in a minimal hand-drawn style, dark sky around it. Below: "Leave A Light On" in fine serif type. NoiraCiel underneath in very small tracking. Dark ground, white ink. Feels like a woodcut illustration. Print-ready for garment.`,
  },
  {
    id: 'roots-we-cannot-see',
    label: 'Roots — symbolic art',
    prompt: `T-shirt art. A detailed hand-drawn illustration of tree roots visible above and below ground — the visible branches minimal, the underground roots vast and elaborate. Above: "The Roots We Cannot See" in small delicate serif. Dark ground, white and amber ink. Premium, artistic, no clip-art quality.`,
  },
  {
    id: 'free-men-tell-truth',
    label: '"Free Men Tell The Truth" — manifesto',
    prompt: `Bold typographic t-shirt design. "FREE MEN TELL THE TRUTH" in strong, wide-set capitals, slightly distressed, letterpress style. Below in small italic: "NoiraCiel". Atlantic waves rendered in a single abstract brushstroke beneath the text. High contrast, dark ground, white ink. Powerful and clean.`,
  },
  {
    id: 'noiraciel-crest',
    label: 'NoiraCiel crest — heritage',
    prompt: `Premium heritage crest design for t-shirt or embroidery. Oval or shield shape. Inside: stylised Atlantic waves and a single star or compass point. Text around the perimeter: "NoiraCiel · Atlantic Noir · Since 2024". Engraving style, fine lines, no fills — white on dark. Like a ship's seal or a family crest. Timeless.`,
  },
  {
    id: 'borrowed-time',
    label: '"Borrowed Time" — poetic',
    prompt: `Minimal t-shirt art. Two elderly hands intertwined, illustrated in a tender, slightly rough ink-drawing style. Below: "Borrowed Time" in an italic serif. NoiraCiel in small caps beneath. Dark ground, warm amber-white ink. Feels human, earned, quietly beautiful. No sentimentality — just dignity.`,
  },
  {
    id: 'life-lessons-cover',
    label: '"Life Lessons" album art for merch',
    prompt: `Art-print design based on the album "The Life Lessons I Hope You Learn". A symbolic image: a handwritten letter on old paper, half-folded, with an Atlantic coastal horizon visible through a window behind it. Below: "The Life Lessons I Hope You Learn · NoiraCiel" in fine serif. Like a book cover for a poem collection. Dark, warm, archival.`,
  },

  // ── New merchandise ──────────────────────────────────────────────────────────
  {
    id: 'mug-atlantic-dawn',
    label: 'Ceramic mug — Atlantic dawn',
    prompt: `Premium ceramic mug design, wrap-around artwork. Atlantic coastline at dawn rendered in a minimal ink-wash illustration style — dark cliffs, pale horizon, a lone lighthouse. One side: "NoiraCiel" in small elegant serif. Other side: a single lyric line in italic: "the road itself was always the answer." Warm bone-white illustration on dark navy/charcoal background. Feels like heritage pottery from a coastal artist.`,
  },
  {
    id: 'mug-empty-chair',
    label: 'Ceramic mug — The Empty Chair',
    prompt: `Mug design featuring an intimate ink illustration: a single empty chair beside a window, afternoon light through lace. Below: "The Empty Chair · NoiraCiel" in refined serif type. Simple, poetic, quiet. Dark ground, warm amber-white illustration. Suitable for wrap-around or single-side print. Feels like a piece of fine coastal ceramics.`,
  },
  {
    id: 'hoodie-sea-soul',
    label: 'Hoodie — Sea-Soul back print',
    prompt: `Large-format hoodie back graphic. Central illustration: a dramatic Atlantic ocean wave rendered in bold etching style, white on dark. Below the wave in wide-set capitals: "SEA-SOUL". Beneath that, in small tracking: "NoiraCiel · Atlantic Noir". The wave illustration should be striking from across a room — bold, graphic, powerful. No photographic elements. Premium screen-print style.`,
  },
  {
    id: 'hoodie-free-men',
    label: 'Hoodie — Free Men Tell The Truth',
    prompt: `Hoodie chest graphic. Minimal and powerful: "FREE MEN" stacked on two lines in bold distressed block capitals, with "TELL THE TRUTH" in smaller tracking beneath. A rough brushstroke horizontal line divides them. Bottom right: "NC" monogram. Dark ground, chalk-white ink. Feels like post-punk graphic design meets literary gravitas.`,
  },
  {
    id: 'tote-roots',
    label: 'Tote bag — Roots below, branches above',
    prompt: `Tote bag artwork, tall portrait format. A botanical illustration in fine engraving style: a tree shown in cross-section — minimal elegant branches above ground, vast intricate root system below, mirrored and beautiful. Above: "The Roots We Cannot See" in small serif. Below roots: "NoiraCiel" in very small tracking. Natural linen or dark canvas ground, white/bone illustration. Artistic, timeless.`,
  },
  {
    id: 'tote-borrowed-time',
    label: 'Tote bag — Borrowed Time',
    prompt: `Tote bag design with poetic minimalism. Centre: two aged hands illustrated in tender ink-drawing style. Above: "Borrowed Time" in italic serif. Below: a single fine horizontal line, then "NoiraCiel" in small caps. Dark navy background, warm ivory illustration. Feels like museum shop merchandise from a prestigious art institution. Beautiful simplicity.`,
  },
  {
    id: 'cap-nc-monogram',
    label: 'Cap — NC embroidery patch',
    prompt: `Cap embroidery patch design. "NC" monogram in an elegant interlocking serif style, surrounded by a thin oval with "NOIRACIEL · ATLANTIC NOIR" text around the perimeter. Below the oval: a small anchor or compass point. Fine engraving line style, designed for embroidery — single color, white on dark. Clean, heritage, timeless. Like a nautical club crest.`,
  },
  {
    id: 'cap-atlantic-noir',
    label: 'Cap — Atlantic Noir front panel',
    prompt: `Cap front panel embroidery design. "ATLANTIC NOIR" in two lines, uppercase serif font, slightly arch-shaped to fit cap panel. Below: a minimal wave motif in a single brushstroke. Simple, bold, no complex fills. White thread on dark background — navy, black, or charcoal. Structured 6-panel cap aesthetic. Like a premium indie label cap.`,
  },
  {
    id: 'poster-why',
    label: 'Poster — "Why" cinematic art',
    prompt: `Large-format art poster (portrait, tall ratio). Top section: a solitary coastal road disappearing toward an Atlantic horizon at golden dusk — cinematic, painterly, atmospheric. Bottom section: dark block with "WHY" in large, dramatic serif letterpress type. Below in smaller elegant italic: "Chapter One — The Life Lessons I Hope You Learn · NoiraCiel". Film noir aesthetic, gallery-quality print. Feels like a Criterion Collection film poster meets Atlantic poetry.`,
  },
  {
    id: 'poster-life-lessons',
    label: 'Poster — Album declaration',
    prompt: `Typographic declaration poster, large format portrait. Predominantly text-based with architectural precision. Bold centered composition: "THE LIFE LESSONS / I HOPE YOU LEARN" in large, elegant, widely-tracked serif capitals. Below: a thin gold rule, then "NoiraCiel" in matching large tracking. Below that, very small: "17 songs · Atlantic Noir · Sea-Soul". At bottom: a minimal Atlantic horizon illustration in fine lines. Dark ground, gold and bone-white typography. Reminiscent of luxury editorial design.`,
  },
  {
    id: 'phone-case-atlantic',
    label: 'Phone case — Atlantic landscape',
    prompt: `Phone case artwork, portrait format. Full bleed: a dark Atlantic seascape at midnight, minimal and atmospheric — just water, horizon, and a pale moon. In the lower quarter: "NoiraCiel" in small bone-white serif. The image is 80% ocean and dark sky, 20% text. Painterly, not photographic. Suitable for matte or glossy phone case printing. Premium minimal aesthetic.`,
  },
  {
    id: 'phone-case-roots',
    label: 'Phone case — Roots illustration',
    prompt: `Phone case artwork, portrait format. Full bleed botanical illustration: a single tree in fine engraving style, showing both the elegant sparse branches above and the elaborate root system below, all visible in one image. "The Roots We Cannot See · NoiraCiel" in very small type at the bottom. Dark background, bone-white fine-line illustration. Like a natural history illustration reimagined as dark art.`,
  },
  {
    id: 'sticker-diamond-mark',
    label: 'Sticker — NoiraCiel diamond mark',
    prompt: `Minimal die-cut sticker design. Central element: a geometric diamond (square rotated 45°) with thin lines radiating like a compass, a small circle at center, and "NC" in the center in elegant serif. Below: "NoiraCiel" in small tracking. White on transparent/dark. Clean vector-art aesthetic, suitable for die-cutting. Simple, refined, iconic like a luxury brand mark.`,
  },
  {
    id: 'vinyl-record-sleeve',
    label: 'Vinyl record sleeve — album art',
    prompt: `Premium vinyl record sleeve design, square format. Front cover: a dark Atlantic ocean at dusk, vast and atmospheric, 80% sky with dramatic clouds, a single boat visible on the horizon. Typography at bottom: "THE LIFE LESSONS I HOPE YOU LEARN" in elegant wide-tracked serif, then "NoiraCiel" beneath. The image has the quality of a vintage European art cinema poster — grainy, emotional, painterly. This should feel like an object you would hold reverently.`,
  },
]

function buildMerchPrompt(conceptId) {
  const concept = MERCH_CONCEPTS.find((c) => c.id === conceptId)
  if (!concept) throw new Error(`Unknown merch concept: ${conceptId}`)
  return `${concept.prompt}

${NOIR_STYLE_SHORT}

Square format (1:1). High contrast. Print-ready design. No photographs — illustration/typography only.
Design should feel like an art object, not a souvenir. Premium and intentional.`
}

// ─── Chapter banners (16:9, full-bleed header behind text) ───────────────────
function buildChapterBannerPrompt(trackNumber, title) {
  const ch = SONG_CHAPTERS[trackNumber]
  if (!ch) {
    return `Wide cinematic landscape for the song "${title}" by NoiraCiel. Dark Atlantic atmosphere, emotional, painterly. ${NOIR_STYLE_SHORT} 16:9. Very dark — designed to have white text overlaid.`
  }
  return `Wide cinematic header image for the song "${ch.title}" — chapter ${trackNumber} of NoiraCiel's album "The Life Lessons I Hope You Learn".

Emotional world: ${ch.emotion}

Visual environment: ${ch.arc[0]}. ${ch.arc[1]}. ${ch.arc[2]}.

Symbolic elements: ${ch.symbols}

${NOIR_STYLE}

16:9 wide landscape format. This image fills the entire top of a webpage — it must be very dark at the bottom (gradient will overlay text there) and rich with atmosphere at the top. Wide, spacious, cinematic. Not a portrait — an environmental establishing shot, like an opening frame of a film.
No text, no faces. Pure atmosphere, objects, light, landscape.`
}

// ─── Gallery art pieces (large-format, museum-quality) ────────────────────────
const GALLERY_PIECES = [
  {
    id: 'the-atlantic-at-night',
    label: 'The Atlantic at Night',
    aspectRatio: '16:9',
    prompt: `The North Atlantic ocean on a moonless night. Enormous dark swells rendered in painterly long-exposure style, silver foam catching the only light. The horizon barely distinguishable from sky. Vast, humbling, beautiful. Like a Turner painting translated to cinema. No boats, no people, no land visible.`,
  },
  {
    id: 'the-inheritance',
    label: 'The Inheritance',
    aspectRatio: '1:1',
    prompt: `Still life on a dark wooden table: a sealed envelope addressed in old handwriting, a black-and-white photograph face down, a pressed flower, an iron key. Warm lamplight from the right side. Deep shadows. The objects carry enormous weight without showing what it is. Museum still-life, Flemish chiaroscuro quality.`,
  },
  {
    id: 'coastal-road-at-dawn',
    label: 'Coastal Road at Dawn',
    aspectRatio: '16:9',
    prompt: `A single-track road along an Atlantic clifftop at the exact moment before full dawn. Mist in the valleys. The sea steel-grey far below. One beam of orange-gold light breaking through cloud over the water. The road disappears into the mist. Painted quality, impasto texture, emotional vastness.`,
  },
  {
    id: 'the-kitchen-table',
    label: 'The Kitchen Table',
    aspectRatio: '1:1',
    prompt: `An old kitchen table seen from above. Two cups of tea, both untouched and cooling. Morning light through a lace curtain. An open newspaper, unread. Two chairs pulled up but unoccupied. The entire weight of something unspoken in the stillness. Painterly, intimate, emotionally devastating in its ordinariness.`,
  },
  {
    id: 'memory-of-water',
    label: 'Memory of Water',
    aspectRatio: '16:9',
    prompt: `Abstract impressionist seascape. A bay or estuary at low tide, shallow water reflecting a pale sky. Wading birds in the far distance. Reeds and old stone at the foreground. The quality of memory — familiar, faded at the edges, more feeling than image. Painted in muted greys, warm ochres, Atlantic light.`,
  },
  {
    id: 'the-door-not-taken',
    label: 'The Door Not Taken',
    aspectRatio: '1:1',
    prompt: `An old wooden door in a stone wall, slightly ajar. Through the gap: warm amber light and the suggestion of a garden. The exterior of the wall is mossy, weathered, in blue-grey shadow. The choice implied but not decided. Metaphor as image. Rich dark tones, single light source through the crack.`,
  },
  {
    id: 'afternoon-light-through-lace',
    label: 'Afternoon Light Through Lace',
    aspectRatio: '1:1',
    prompt: `Strong afternoon sun casting the elaborate shadow of a lace curtain across an old plaster wall and wooden floorboards. A narrow table with a single glass of water, its shadow elongated. The room is otherwise empty. The image is about the quality of light itself — sacred, familiar, irretrievable. Portuguese or Galician interior feel.`,
  },
  {
    id: 'the-vigil',
    label: 'The Vigil',
    aspectRatio: '16:9',
    prompt: `A farmhouse seen from outside across a dark wet field at night. Every window dark except one — a single upstairs window, warm orange, a silhouette barely visible. Rain falling gently. The entire emotional weight of waiting, vigil, faithfulness. Painterly texture, deep dark foreground, warm distant light.`,
  },
  {
    id: 'time-in-hands',
    label: 'Time in Hands',
    aspectRatio: '1:1',
    prompt: `Extreme close-up of two pairs of hands — elderly and young — placed together on a dark wooden surface. The contrast of skin, the tenderness of proximity. Afternoon light from one side, deep shadow on the other. Hands as the record of a life. Photographically detailed but with painterly warmth.`,
  },
  {
    id: 'the-archive',
    label: 'The Archive',
    aspectRatio: '16:9',
    prompt: `A long dark room — a library or archive — with wooden shelves floor to ceiling holding old boxes, folders, and bound volumes. A single reading lamp pools light on a table covered in old photographs, letters, and documents. The rest of the room disappears into shadow. The visual language of memory, research, preservation. Rich and dark.`,
  },
  {
    id: 'the-fishermans-return',
    label: 'The Fisherman\'s Return',
    aspectRatio: '16:9',
    prompt: `A small wooden boat entering a harbour at dawn, engine off, drifting. The harbour walls ancient stone. One figure aboard, too far away for detail. The sky pearl-grey with a line of gold at the horizon. The Atlantic beyond the harbour mouth, still and silver. A scene of quiet heroism, labour, dignity.`,
  },
  {
    id: 'seeds-in-dark-earth',
    label: 'Seeds in Dark Earth',
    aspectRatio: '1:1',
    prompt: `Close-up of a weathered hand pressing seeds into dark, rich soil. Shallow depth of field — the earth close, the sky above softly blurred and grey. The act of planting as an act of faith. Patience made visible. Warm amber afternoon light at low angle, deep soil shadows, the lines of an old working hand.`,
  },
  // ─── Volume II ───────────────────────────────────────────────────────────────
  {
    id: 'the-storm-that-passed',
    label: 'The Storm That Passed',
    aspectRatio: '16:9',
    prompt: `An Atlantic shoreline immediately after a heavy storm. The sky is split — one side still dark and bruised with cloud, the other cracking open into raw silver light. Wet sand reflects both. A single figure walks at the water's edge, small and unhurried, facing away. The ocean is still moving but the violence is over. The quality of survival, of aftermath, of beginning again.`,
  },
  {
    id: 'the-lighthouse-at-three-am',
    label: 'The Lighthouse at Three AM',
    aspectRatio: '16:9',
    prompt: `A lighthouse on a black Atlantic headland, its white beam cutting slowly through thick sea mist. The rocks below slick and dark. The ocean invisible but audible in the image. No other light in the world. The quality of faithful, relentless watching — the vigil of stone and light over something that cannot watch for itself. Painterly, deeply dark, single source of moving light.`,
  },
  {
    id: 'the-last-photograph',
    label: 'The Last Photograph',
    aspectRatio: '1:1',
    prompt: `A faded colour photograph pinned to an old plaster wall with a single thumbtack. The photograph shows the blurred suggestion of a family gathered around a table, 1970s Atlantic light, faces unclear. Around the photograph — nothing. Just wall texture, age, shadow. The photograph is the only warmth in a cold frame. The weight of the last image of something that no longer exists.`,
  },
  {
    id: 'the-emigrant-at-dawn',
    label: 'The Emigrant at Dawn',
    aspectRatio: '16:9',
    prompt: `A figure standing alone on a stone quay at dawn, back turned, facing an open Atlantic horizon. A large ship in the middle distance, its lights still on in the grey morning. A single bag on the ground beside the figure. The departure that changes everything. The moment before. The quay is wet, the sky the colour of uncertainty — neither night nor day. Cinematic, vast, heartbreaking in its stillness.`,
  },
  {
    id: 'the-harvest-table',
    label: 'The Harvest Table',
    aspectRatio: '16:9',
    prompt: `A long old wooden table inside a stone barn or cellar, set for a harvest feast. Rough bread, earthen bowls, wine in ceramic pitchers, candles in iron holders. Late afternoon Atlantic light pouring through a wide open doorway at the far end, silhouetting the scene. Several chairs occupied only by shadow. The tradition of gathering, the abundance of simple things, the table as sacred space.`,
  },
  {
    id: 'the-winter-sea',
    label: 'The Winter Sea',
    aspectRatio: '16:9',
    prompt: `The North Atlantic in deep January. Grey-green swells, white foam dissolving. A lone fishing boat far out, small and deliberate against the immensity. The sky indistinguishable from the water at the horizon. No colour except the infinite range of grey. Beautiful and severe as a mathematical proof. The dignity of a life lived in defiance of comfort. Painterly, textured, honest.`,
  },
  {
    id: 'the-mothers-hands',
    label: "The Mother's Hands",
    aspectRatio: '1:1',
    prompt: `Extreme close study of an older woman's hands cradling a small ceramic cup of dark coffee. The hands are deeply lined, strong, unhurried — the record of a life. Steam rises from the cup. Behind, softly out of focus: a bright Atlantic morning window, white curtain, blue sky. Everything about the image says: she has been here a thousand mornings and will be here a thousand more. Tender, specific, eternal.`,
  },
  {
    id: 'the-road-at-dusk',
    label: 'The Road at Dusk',
    aspectRatio: '16:9',
    prompt: `A two-lane Atlantic coastal road at dusk, empty, curving away into the distance. On the left: the dark Atlantic, barely visible below cliffs. On the right: coastal scrub and stone walls. The sky above deep amber turning to violet, a single bright planet visible. In the far distance: a single pair of headlights approaching, still very small. The road between people. The road as longing. The road as the shape of time itself.`,
  },
]

function buildGalleryArtPrompt(pieceId) {
  const piece = GALLERY_PIECES.find((p) => p.id === pieceId)
  if (!piece) throw new Error(`Unknown gallery piece: ${pieceId}`)
  return `${piece.prompt}

${NOIR_STYLE}

This is a large-format gallery artwork for a digital museum — not a photograph, not a stock image. Painterly, with texture, grain, and emotional depth. The kind of image that holds attention alone on a white wall. No text. No logos.`
}

// ─── Artist identity images (abstract/symbolic, not portraits) ────────────────
const ARTIST_IDENTITY = [
  {
    id: 'noiraciel-identity-1',
    label: 'NoiraCiel Identity — The Horizon',
    aspectRatio: '16:9',
    prompt: `A lone figure — seen only from behind, face never visible — standing at the edge of an Atlantic cliff looking toward the horizon. The figure is small against the vast sky and sea. Wind-blown coat. The image of someone who carries something important and is deciding what to do with it. Late afternoon light, dramatic clouds.`,
  },
  {
    id: 'noiraciel-identity-2',
    label: 'NoiraCiel Identity — The Letter',
    aspectRatio: '1:1',
    prompt: `A pair of hands writing a letter at an old desk. The writing is not legible — only the act of writing, the texture of old paper, the quality of concentration. A window to the left showing grey Atlantic weather. The lamp casting warm gold on hands and page. The gesture of leaving something behind for someone who will come later.`,
  },
  {
    id: 'noiraciel-identity-3',
    label: 'NoiraCiel Identity — The Road',
    aspectRatio: '16:9',
    prompt: `A narrow road through Atlantic moorland, seen from windscreen-height as if from a slow-moving car. The road stretches ahead into fog and light. The moorland on either side dark green and grey. The moment of travelling somewhere that matters, the destination not yet visible. Cinematic quality, wide and contemplative.`,
  },
  {
    id: 'noiraciel-identity-4',
    label: 'NoiraCiel Identity — The Stage',
    aspectRatio: '16:9',
    prompt: `An intimate concert venue, dark, seen from behind the audience. A single performer on stage, silhouetted against warm amber back-light, microphone in hand. The audience in the dark foreground. The quality of shared listening, the sacred moment of a song being sung. No detail of faces — just atmosphere, light, and the fact of music.`,
  },
]

// ─── Lyric card backgrounds (ultra-dark, text-overlay ready, 1:1) ─────────────
// Designed for Instagram lyric cards — max 10% brightness average, 1 focal element,
// huge empty dark space for text. Nothing competes with the words.
const LYRIC_BACKGROUNDS = [
  {
    id: 'rain-on-dark-glass',
    label: 'Rain on Dark Glass',
    prompt: `Rain streaming in rivulets down a very dark window pane at night. A single amber street lamp visible through the glass, blurred and distorted by the water. Everything else absolute darkness. The image is 90% dark — only the lamp glow and water movement carry any light. Intimate, melancholic, made for words to live on top of.`,
  },
  {
    id: 'single-candle-in-dark',
    label: 'Single Candle in Dark',
    prompt: `One white wax candle burning in near-total darkness, its flame the only light source. The wax melting slowly, pooling. The surrounding darkness is rich and deep, not flat — textures of stone or old wood barely visible at the edge of the light radius. Entirely dark except for the 5% around the flame. Sacred, intimate, the original human light.`,
  },
  {
    id: 'dark-tide',
    label: 'Dark Tide',
    prompt: `The Atlantic shoreline at night, near-total darkness. Only the white foam of breaking waves barely visible in the blackness, each wave briefly illuminating its own edge. The sky barely darker than the ocean. No moon. The horizon a guess. 85% of the image is dark navy-black. The waves the only movement, the only light, the only voice.`,
  },
  {
    id: 'two-hands-dark-wood',
    label: 'Two Hands on Dark Wood',
    prompt: `Two hands resting on a dark, aged wooden table — one older, one younger. Seen from directly above. A single narrow beam of warm amber light catches the tops of the hands; everything else is in deep shadow. The hands slightly apart, as if about to or just having touched. 80% of the image is shadow. Intimate, tender, weighted.`,
  },
  {
    id: 'empty-road-one-light',
    label: 'Empty Road, One Light',
    prompt: `A narrow Atlantic road at night, almost entirely dark. Wet tarmac catching a single faraway headlight — one small bright point in the distance, its reflection a thin gold streak on the road surface. Everything else: the dark fields, the dark sky, the dark ocean sound implied but invisible. Minimal, vast, lonely, beautiful. Made for words.`,
  },
  {
    id: 'lit-window-in-darkness',
    label: 'Lit Window in Darkness',
    prompt: `The exterior of an old Atlantic stone house at night. A single upstairs window glowing warm amber — the only light in the entire frame. The rest of the house and landscape in deep, rich shadow. Wet cobblestones catching a faint reflection of the window light. The image of presence, vigil, someone still awake while the world sleeps. 88% dark. The one light is everything.`,
  },
]

function buildLyricBackgroundPrompt(bgId) {
  const bg = LYRIC_BACKGROUNDS.find((b) => b.id === bgId)
  if (!bg) throw new Error(`Unknown lyric background: ${bgId}`)
  return `${bg.prompt}

${NOIR_STYLE}

CRITICAL: This image will have text overlaid on top of it. It must be predominantly dark — at least 80% of the frame should be near-black or very deep shadow. The one or two light elements should be small and peripheral. Maximum darkness, maximum atmosphere. Square format. No text. No faces. No logos.`
}

function buildArtistIdentityPrompt(imageId) {
  const img = ARTIST_IDENTITY.find((i) => i.id === imageId)
  if (!img) throw new Error(`Unknown artist identity image: ${imageId}`)
  return `${img.prompt}

${NOIR_STYLE}

This represents the identity and world of NoiraCiel — Atlantic Noir music. No text. No branding. Just the image and its emotional weight.`
}

module.exports = {
  SONG_CHAPTERS,
  BACKGROUND_THEMES,
  MERCH_CONCEPTS,
  GALLERY_PIECES,
  ARTIST_IDENTITY,
  LYRIC_BACKGROUNDS,
  NOIR_STYLE,
  NOIR_STYLE_SHORT,
  buildSongArtPrompt,
  buildVideoClipPrompt,
  buildBackgroundPrompt,
  buildSocialCardPrompt,
  buildMerchPrompt,
  buildChapterBannerPrompt,
  buildGalleryArtPrompt,
  buildArtistIdentityPrompt,
  buildLyricBackgroundPrompt,
}
