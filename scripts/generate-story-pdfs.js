#!/usr/bin/env node
/**
 * generate-story-pdfs.js
 * Generates a beautiful A5 soft-book PDF for each NoiraCiel story and
 * a combined anthology of all 17 chapters.
 *
 * Usage:
 *   node scripts/generate-story-pdfs.js               # all stories + anthology
 *   node scripts/generate-story-pdfs.js --slug why    # single story
 *   node scripts/generate-story-pdfs.js --anthology   # anthology only
 */

'use strict'

const fs      = require('fs')
const path    = require('path')
const puppeteer = require('puppeteer')

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT        = path.join(__dirname, '..')
const STORIES_DIR = path.join(ROOT, 'content', 'stories')
const ART_DIR     = path.join(ROOT, 'public', 'Images', 'song-art')
const OUT_DIR     = path.join(ROOT, 'public', 'Books', 'stories')

// ─── Track metadata ───────────────────────────────────────────────────────────
const TRACK_MAP = {
  'why':                            { num: 1,  title: 'Why' },
  'who-wins-if-i-win':              { num: 2,  title: 'Who Wins If I Win?' },
  'the-roots-we-cannot-see':        { num: 3,  title: 'The Roots We Cannot See' },
  'if-we-cant-say-the-hard-truths': { num: 4,  title: "If We Can't Say the Hard Truths" },
  'i-never-knew-any-other-way':     { num: 5,  title: 'I Never Knew Any Other Way' },
  'side-by-side':                   { num: 6,  title: 'Side by Side' },
  'always-in-your-corner':          { num: 7,  title: 'Always in Your Corner' },
  'it-was-already-there':           { num: 8,  title: 'It Was Already There' },
  'as-long-as-youre-okay':          { num: 9,  title: "As Long As You're Okay" },
  'the-house-we-couldnt-leave':     { num: 10, title: "The House We Couldn't Leave" },
  'still-worth-it':                 { num: 11, title: 'Still Worth It' },
  'leave-a-light-on':               { num: 12, title: 'Leave a Light On' },
  'the-empty-chair':                { num: 13, title: 'The Empty Chair' },
  'good-things-grow-slow':          { num: 14, title: 'Good Things Grow Slow' },
  'maybe-i-was-wrong':              { num: 15, title: 'Maybe I Was Wrong' },
  'borrowed-time':                  { num: 16, title: 'Borrowed Time' },
  'free-men-tell-the-truth':        { num: 17, title: 'Free Men Tell the Truth' },
}

const ORDERED_SLUGS = Object.entries(TRACK_MAP)
  .sort((a, b) => a[1].num - b[1].num)
  .map(([slug]) => slug)

// ─── Markdown parser ──────────────────────────────────────────────────────────
function parseStory(markdown) {
  const lines = markdown.split('\n')
  let title    = ''
  let tagline  = ''
  let lesson   = ''
  const paragraphs = []
  let afterDivider = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('# ')) {
      title = trimmed.slice(2)
      continue
    }
    if (trimmed === '---') {
      afterDivider = true
      continue
    }
    if (!trimmed) continue

    if (trimmed.startsWith('*') && trimmed.endsWith('*') && !afterDivider && !tagline) {
      tagline = trimmed.slice(1, -1)
      continue
    }
    if (afterDivider && trimmed.startsWith('*') && trimmed.endsWith('*')) {
      lesson = trimmed.slice(1, -1)
      continue
    }
    if (!afterDivider) {
      paragraphs.push(trimmed)
    }
  }

  return { title, tagline, lesson, paragraphs }
}

// ─── Image → base64 ───────────────────────────────────────────────────────────
function imageToBase64(filePath) {
  if (!fs.existsSync(filePath)) return null
  const data = fs.readFileSync(filePath)
  const ext  = path.extname(filePath).slice(1).toLowerCase()
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${data.toString('base64')}`
}

// ─── Shared CSS ───────────────────────────────────────────────────────────────
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=DM+Sans:ital,wght@0,300;0,400;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @page { size: 148mm 210mm; margin: 0; }

  body {
    font-family: 'Cormorant Garamond', Georgia, serif;
    background: #04040a;
    color: #F2EDE3;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Fixed-height pages ── */
  .page {
    width: 148mm;
    height: 210mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }

  /* ── Cover ── */
  .cover-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cover-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      #04040a 38%,
      rgba(4,4,10,0.55) 62%,
      rgba(4,4,10,0.2) 100%
    );
  }
  .cover-brand {
    position: absolute;
    top: 9mm;
    right: 9mm;
    font-family: 'DM Sans', sans-serif;
    font-size: 6.5pt;
    letter-spacing: 0.45em;
    text-transform: uppercase;
    color: #c4953a;
    opacity: 0.75;
  }
  .cover-ages {
    position: absolute;
    top: 9mm;
    left: 9mm;
    font-family: 'DM Sans', sans-serif;
    font-size: 6pt;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(242,237,227,0.35);
  }
  .cover-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 9mm 10mm 10mm;
  }
  .cover-chapter-ref {
    font-family: 'DM Sans', sans-serif;
    font-size: 6.5pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #c4953a;
    margin-bottom: 3.5mm;
  }
  .cover-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 27pt;
    font-style: italic;
    font-weight: 300;
    line-height: 1.08;
    color: #F2EDE3;
    margin-bottom: 3.5mm;
  }
  .cover-tagline {
    font-family: 'DM Sans', sans-serif;
    font-size: 7pt;
    color: rgba(242,237,227,0.45);
    letter-spacing: 0.1em;
    font-style: italic;
  }

  /* ── Content pages ── */
  .content-page {
    width: 148mm;
    min-height: 210mm;
    padding: 12mm 13mm 12mm;
    background: #04040a;
  }
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 3mm;
    border-bottom: 0.3pt solid rgba(242,237,227,0.08);
    margin-bottom: 7mm;
  }
  .page-header-brand {
    font-family: 'DM Sans', sans-serif;
    font-size: 5.5pt;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: #c4953a;
    opacity: 0.55;
  }
  .page-header-chapter {
    font-family: 'DM Sans', sans-serif;
    font-size: 5.5pt;
    letter-spacing: 0.15em;
    color: rgba(242,237,227,0.2);
    font-style: italic;
  }
  .story-title-inner {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20pt;
    font-style: italic;
    font-weight: 300;
    color: #F2EDE3;
    line-height: 1.1;
    margin-bottom: 2mm;
  }
  .story-tagline-inner {
    font-family: 'DM Sans', sans-serif;
    font-size: 7pt;
    color: #c4953a;
    letter-spacing: 0.12em;
    font-style: italic;
    margin-bottom: 7mm;
    opacity: 0.65;
    padding-bottom: 5mm;
    border-bottom: 0.3pt solid rgba(196,149,58,0.15);
  }
  .paragraph {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.72;
    color: rgba(242,237,227,0.82);
    margin-bottom: 4.5mm;
    font-weight: 400;
  }

  /* ── Closing page ── */
  .closing-page {
    width: 148mm;
    height: 210mm;
    background: #04040a;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 14mm;
    text-align: center;
    page-break-before: always;
    break-before: page;
  }
  .closing-ornament {
    font-family: 'Cormorant Garamond', serif;
    font-size: 12pt;
    color: #c4953a;
    opacity: 0.4;
    margin-bottom: 9mm;
    letter-spacing: 0.5em;
  }
  .closing-lesson {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 13pt;
    font-style: italic;
    font-weight: 300;
    color: #F2EDE3;
    line-height: 1.65;
    max-width: 108mm;
    margin-bottom: 12mm;
    opacity: 0.88;
  }
  .closing-rule {
    width: 18mm;
    height: 0.3pt;
    background: rgba(196,149,58,0.35);
    margin-bottom: 9mm;
  }
  .closing-brand {
    font-family: 'DM Sans', sans-serif;
    font-size: 7pt;
    letter-spacing: 0.45em;
    text-transform: uppercase;
    color: #c4953a;
    opacity: 0.6;
    margin-bottom: 2mm;
  }
  .closing-song-ref {
    font-family: 'Cormorant Garamond', serif;
    font-size: 9pt;
    font-style: italic;
    color: rgba(242,237,227,0.25);
    margin-bottom: 12mm;
  }
  .closing-scholarship {
    font-family: 'DM Sans', sans-serif;
    font-size: 6pt;
    line-height: 1.65;
    color: rgba(242,237,227,0.18);
    max-width: 100mm;
    text-align: center;
    margin-bottom: 5mm;
  }
  .closing-url {
    font-family: 'DM Sans', sans-serif;
    font-size: 5.5pt;
    letter-spacing: 0.25em;
    color: rgba(242,237,227,0.15);
    text-transform: uppercase;
  }

  /* ── Anthology extras ── */
  .anthology-cover-title {
    font-size: 22pt;
  }
  .toc-page {
    width: 148mm;
    height: 210mm;
    background: #04040a;
    padding: 14mm 13mm;
    page-break-after: always;
    break-after: page;
  }
  .toc-heading {
    font-family: 'DM Sans', sans-serif;
    font-size: 6.5pt;
    letter-spacing: 0.45em;
    text-transform: uppercase;
    color: #c4953a;
    opacity: 0.6;
    margin-bottom: 8mm;
  }
  .toc-entry {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 3mm;
    gap: 3mm;
  }
  .toc-num {
    font-family: 'DM Sans', sans-serif;
    font-size: 7pt;
    color: rgba(196,149,58,0.5);
    flex-shrink: 0;
    width: 6mm;
  }
  .toc-story-title {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 10.5pt;
    color: rgba(242,237,227,0.7);
    flex: 1;
    line-height: 1.3;
  }
  .toc-song {
    font-family: 'DM Sans', sans-serif;
    font-size: 6.5pt;
    color: rgba(242,237,227,0.2);
    flex-shrink: 0;
    text-align: right;
    max-width: 45mm;
    line-height: 1.3;
  }
  .chapter-divider {
    width: 148mm;
    height: 210mm;
    background: #04040a;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    page-break-after: always;
    break-after: page;
  }
  .chapter-num-large {
    font-family: 'Cormorant Garamond', serif;
    font-size: 72pt;
    font-weight: 300;
    color: rgba(196,149,58,0.08);
    line-height: 1;
    margin-bottom: 6mm;
  }
  .chapter-title-divider {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18pt;
    font-style: italic;
    font-weight: 300;
    color: rgba(242,237,227,0.7);
    text-align: center;
    max-width: 110mm;
    line-height: 1.2;
    margin-bottom: 4mm;
  }
  .chapter-song-divider {
    font-family: 'DM Sans', sans-serif;
    font-size: 6.5pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(196,149,58,0.4);
  }
`

// ─── Build single-story HTML ───────────────────────────────────────────────────
function buildStoryHTML(slug, story, artBase64) {
  const track  = TRACK_MAP[slug] ?? { num: '?', title: slug }
  const padded = String(track.num).padStart(2, '0')

  const paragraphsHTML = story.paragraphs
    .map((p) => `<p class="paragraph">${escapeHtml(p)}</p>`)
    .join('\n')

  const coverArt = artBase64
    ? `<img class="cover-art" src="${artBase64}" alt="" />`
    : `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#0d1525,#04040a);"></div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>${SHARED_CSS}</style>
</head>
<body>

  <!-- COVER -->
  <div class="page">
    ${coverArt}
    <div class="cover-gradient"></div>
    <div class="cover-brand">NoiraCiel</div>
    <div class="cover-ages">Ages 9 – 14</div>
    <div class="cover-content">
      <p class="cover-chapter-ref">Chapter ${padded} &middot; ${escapeHtml(track.title)}</p>
      <h1 class="cover-title">${escapeHtml(story.title)}</h1>
      ${story.tagline ? `<p class="cover-tagline">${escapeHtml(story.tagline)}</p>` : ''}
    </div>
  </div>

  <!-- STORY CONTENT -->
  <div class="content-page">
    <div class="page-header">
      <span class="page-header-brand">NoiraCiel</span>
      <span class="page-header-chapter">${escapeHtml(story.title)}</span>
    </div>
    <h2 class="story-title-inner">${escapeHtml(story.title)}</h2>
    ${story.tagline ? `<p class="story-tagline-inner">${escapeHtml(story.tagline)}</p>` : ''}
    ${paragraphsHTML}
  </div>

  <!-- CLOSING -->
  <div class="closing-page">
    <div class="closing-ornament">&mdash; &middot; &mdash;</div>
    ${story.lesson ? `<p class="closing-lesson">${escapeHtml(story.lesson)}</p>` : ''}
    <div class="closing-rule"></div>
    <p class="closing-brand">NoiraCiel</p>
    <p class="closing-song-ref">A companion to &ldquo;${escapeHtml(track.title)}&rdquo;</p>
    <p class="closing-scholarship">Contributions help fund The Invisible Roots Scholarship —<br>
    supporting students who carry invisible roots.</p>
    <p class="closing-url">noiraciel.com</p>
  </div>

</body>
</html>`
}

// ─── Build anthology HTML ──────────────────────────────────────────────────────
function buildAnthologyHTML(allStories) {
  const tocEntries = allStories
    .map(({ slug, story }) => {
      const track  = TRACK_MAP[slug]
      const padded = String(track.num).padStart(2, '0')
      return `
      <div class="toc-entry">
        <span class="toc-num">${padded}</span>
        <span class="toc-story-title">${escapeHtml(story.title)}</span>
        <span class="toc-song">${escapeHtml(track.title)}</span>
      </div>`
    })
    .join('\n')

  const chaptersHTML = allStories
    .map(({ slug, story, artBase64 }) => {
      const track  = TRACK_MAP[slug]
      const padded = String(track.num).padStart(2, '0')

      const coverArt = artBase64
        ? `<img class="cover-art" src="${artBase64}" alt="" />`
        : `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#0d1525,#04040a);"></div>`

      const paragraphsHTML = story.paragraphs
        .map((p) => `<p class="paragraph">${escapeHtml(p)}</p>`)
        .join('\n')

      return `
      <!-- CHAPTER ${padded} DIVIDER -->
      <div class="chapter-divider">
        <div class="chapter-num-large">${padded}</div>
        <h2 class="chapter-title-divider">${escapeHtml(story.title)}</h2>
        <p class="chapter-song-divider">${escapeHtml(track.title)}</p>
      </div>

      <!-- CHAPTER ${padded} COVER -->
      <div class="page">
        ${coverArt}
        <div class="cover-gradient"></div>
        <div class="cover-brand">NoiraCiel</div>
        <div class="cover-ages">Ages 9 – 14</div>
        <div class="cover-content">
          <p class="cover-chapter-ref">Chapter ${padded} &middot; ${escapeHtml(track.title)}</p>
          <h1 class="cover-title anthology-cover-title">${escapeHtml(story.title)}</h1>
          ${story.tagline ? `<p class="cover-tagline">${escapeHtml(story.tagline)}</p>` : ''}
        </div>
      </div>

      <!-- CHAPTER ${padded} CONTENT -->
      <div class="content-page">
        <div class="page-header">
          <span class="page-header-brand">NoiraCiel</span>
          <span class="page-header-chapter">Chapter ${padded}</span>
        </div>
        <h2 class="story-title-inner">${escapeHtml(story.title)}</h2>
        ${story.tagline ? `<p class="story-tagline-inner">${escapeHtml(story.tagline)}</p>` : ''}
        ${paragraphsHTML}
      </div>

      <!-- CHAPTER ${padded} CLOSING -->
      <div class="closing-page">
        <div class="closing-ornament">&mdash; &middot; &mdash;</div>
        ${story.lesson ? `<p class="closing-lesson">${escapeHtml(story.lesson)}</p>` : ''}
        <div class="closing-rule"></div>
        <p class="closing-brand">NoiraCiel</p>
        <p class="closing-song-ref">A companion to &ldquo;${escapeHtml(track.title)}&rdquo;</p>
      </div>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>${SHARED_CSS}</style>
</head>
<body>

  <!-- ANTHOLOGY COVER -->
  <div class="page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:#04040a;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(196,149,58,0.06) 0%,transparent 70%);"></div>
    <p style="font-family:'DM Sans',sans-serif;font-size:6.5pt;letter-spacing:0.45em;text-transform:uppercase;color:#c4953a;opacity:0.6;margin-bottom:8mm;position:relative;">NoiraCiel</p>
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30pt;font-style:italic;font-weight:300;color:#F2EDE3;text-align:center;line-height:1.1;max-width:110mm;margin-bottom:6mm;position:relative;">The Life Lessons<br>I Hope You Learn</h1>
    <p style="font-family:'DM Sans',sans-serif;font-size:8pt;color:rgba(242,237,227,0.35);letter-spacing:0.1em;margin-bottom:2mm;position:relative;">Story Collection</p>
    <p style="font-family:'DM Sans',sans-serif;font-size:7pt;color:rgba(242,237,227,0.2);letter-spacing:0.08em;font-style:italic;position:relative;">17 chapters · Ages 9 – 14</p>
    <div style="position:absolute;bottom:10mm;left:0;right:0;text-align:center;">
      <p style="font-family:'DM Sans',sans-serif;font-size:5.5pt;letter-spacing:0.25em;text-transform:uppercase;color:rgba(242,237,227,0.12);">noiraciel.com</p>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="toc-page">
    <p class="toc-heading">Contents</p>
    ${tocEntries}
    <div style="margin-top:8mm;padding-top:5mm;border-top:0.3pt solid rgba(242,237,227,0.08);">
      <p style="font-family:'DM Sans',sans-serif;font-size:6pt;color:rgba(242,237,227,0.18);line-height:1.6;">
        Each story is a companion to a chapter from the album<br>
        <em>The Life Lessons I Hope You Learn</em> by NoiraCiel.
      </p>
    </div>
  </div>

  ${chaptersHTML}

  <!-- FINAL PAGE -->
  <div class="closing-page">
    <div class="closing-ornament">&mdash; &middot; &mdash;</div>
    <p class="closing-lesson">Seventeen chapters. Seventeen lessons. One life, looked at carefully.</p>
    <div class="closing-rule"></div>
    <p class="closing-brand">NoiraCiel</p>
    <p class="closing-song-ref">Atlantic Noir · Sea-Soul</p>
    <p class="closing-scholarship">Contributions help fund The Invisible Roots Scholarship —<br>
    supporting students who carry invisible roots.<br>
    A percentage of NoiraCiel sales supports documented scholarship awards.</p>
    <p class="closing-url" style="margin-top:8mm;">noiraciel.com</p>
  </div>

</body>
</html>`
}

// ─── Escape HTML ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── Render PDF ───────────────────────────────────────────────────────────────
async function renderPDF(browser, html, outPath) {
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30_000 })
  await page.pdf({
    path: outPath,
    width:  '148mm',
    height: '210mm',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  })
  await page.close()
}

// ─── Main ─────────────────────────────────────────────────────────────────────
;(async () => {
  const args         = process.argv.slice(2)
  const slugFilter   = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null
  const anthologyOnly = args.includes('--anthology')

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const slugs = slugFilter
    ? [slugFilter]
    : ORDERED_SLUGS.filter((s) => fs.existsSync(path.join(STORIES_DIR, `${s}.md`)))

  if (slugs.length === 0) {
    console.error('No story files found.')
    process.exit(1)
  }

  console.log('🚀 Launching browser…')
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  // Load all stories + art
  const allStories = slugs.map((slug) => {
    const mdPath = path.join(STORIES_DIR, `${slug}.md`)
    const artPath = path.join(ART_DIR, `${slug}.jpg`)
    const story    = parseStory(fs.readFileSync(mdPath, 'utf-8'))
    const artBase64 = imageToBase64(artPath)
    return { slug, story, artBase64 }
  })

  if (!anthologyOnly) {
    for (const { slug, story, artBase64 } of allStories) {
      const track   = TRACK_MAP[slug]
      const outPath = path.join(OUT_DIR, `${slug}.pdf`)
      process.stdout.write(`  📄 ${String(track?.num ?? '?').padStart(2, '0')} ${story.title}…`)
      const html = buildStoryHTML(slug, story, artBase64)
      await renderPDF(browser, html, outPath)
      console.log(' ✓')
    }
  }

  // Anthology (all slugs or single slug skips it)
  if (!slugFilter) {
    const anthologyPath = path.join(OUT_DIR, 'anthology.pdf')
    process.stdout.write(`\n  📚 Building anthology (${allStories.length} chapters)…`)
    const html = buildAnthologyHTML(allStories)
    await renderPDF(browser, html, anthologyPath)
    console.log(' ✓')
  }

  await browser.close()

  console.log(`\n✅ Done — PDFs saved to public/Books/stories/`)
  console.log(`   Individual : ${slugs.length} files`)
  if (!slugFilter) console.log(`   Anthology  : anthology.pdf`)
})().catch((e) => { console.error(e); process.exit(1) })
