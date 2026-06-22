#!/usr/bin/env node
'use strict'
/**
 * generate-product-prompts.js
 * Builds GPT Image 2 + Kling image-to-video prompts for books, vinyl, merch, objects.
 *
 * Scans:
 *   public/images/merch/manifest.json
 *   public/Books/stories/ (infers book products)
 *   Manual product list below
 *
 * Output: public/generated/kie/objects/{slug}.json (one per product)
 *
 * Usage: node scripts/kie/generate-product-prompts.js
 */

const fs   = require('fs')
const path = require('path')

const ROOT     = path.join(__dirname, '..', '..')
const OBJ_DIR  = path.join(ROOT, 'public', 'generated', 'kie', 'objects')
const FORCE    = process.argv.includes('--force')

// ─── Manual product catalogue ─────────────────────────────────────────────────
// Extend this as new products are added to the site.
const PRODUCTS = [
  {
    slug:        'anthology-book',
    title:       'The Anthology — NoiraCiel',
    type:        'book',
    description: 'Collected lyrics, short stories, and photographs from the NoiraCiel universe. Hardcover.',
    material:    'dark linen cover, gold foil title, heavy cream pages',
    animation:   'book slowly opens to reveal the first page, single candle light from above, dramatic',
  },
  {
    slug:        'the-life-lessons-book',
    title:       'The Life Lessons I Hope You Learn — Book',
    type:        'book',
    description: 'The companion book to the album. Short stories and lyrics.',
    material:    'matte black soft-cover, ivory text block, hand-sewn binding visible at spine',
    animation:   'book lies closed, light slowly reveals the title on the cover, then it lifts open gently',
  },
  {
    slug:        'vinyl-limited',
    title:       'NoiraCiel Vinyl — Collector Edition',
    type:        'vinyl',
    description: 'Limited edition 180g audiophile vinyl. Heavy sleeve, inner booklet, hand-numbered.',
    material:    '180g black vinyl, heavy matte sleeve, gold foil spine label, inner tissue sleeve',
    animation:   'vinyl record spins slowly under dramatic single-source directional light, reflections trace grooves',
  },
  {
    slug:        'hoodie-noir',
    title:       'NoiraCiel Oversized Hoodie',
    type:        'apparel',
    description: 'Premium heavyweight cotton. Minimal branding. Dark colourway.',
    material:    'heavyweight 400gsm organic cotton, washed black, minimal chest mark',
    animation:   'hoodie lays flat on dark stone surface, fabric breathes slightly in an unseen slow wind',
  },
  {
    slug:        'art-print-why',
    title:       '"Why" — Signed Art Print',
    type:        'print',
    description: 'Archival fine-art print from the song "Why". 50×70cm.',
    material:    'archival Hahnemühle paper, matte coating, deckled edges',
    animation:   'print rests against dark stone wall, a single light source sweeps slowly across revealing detail',
  },
  {
    slug:        'score-booklet',
    title:       'Musical Scores — Collector Booklet',
    type:        'book',
    description: 'Hand-engraved sheet music scores from the album. Limited print run.',
    material:    'ivory paper, typeset musical notation, cloth-bound collector edition',
    animation:   'score pages turn slowly one by one, music notation revealed, candlelight from left',
  },
]

// ─── Photography prompt builder ───────────────────────────────────────────────

const NOIR_PRODUCT_STYLE = `
Hyper-photorealistic product photography. Studio environment.
Single dramatic light source from above-left at 45 degrees, casting deep shadow.
Dark slate or matte black surface. Background: deep shadow, nearly black.
No reflectors, no fill lights — intentionally dramatic, theatrical, premium.
Deep navy and warm amber palette. 16mm film grain texture.
No text visible in image. No labels facing camera unless they are part of the aesthetic.
Shot on large-format digital medium, Hasselblad aesthetic.
Luxury editorial quality. NOT e-commerce white background. NOT stock photography.
`.trim()

const ANIMATION_STYLES = {
  book:    'book slowly opens 30 degrees, pages breathe open, warm light spills from within, 6-second loop',
  vinyl:   'vinyl record rotates slowly at 33rpm, single light traces the groove spiral, 8-second loop',
  apparel: 'fabric breathes slowly as if worn, a single thread catches light, 5-second loop',
  print:   'a slow light sweep left-to-right reveals the image detail, 6-second loop',
}

function buildProductManifest(product) {
  const photoPrompt = [
    `${NOIR_PRODUCT_STYLE}`,
    ``,
    `Product: ${product.title}.`,
    `Type: ${product.type}.`,
    `Description: ${product.description}.`,
    `Material and appearance: ${product.material}.`,
    ``,
    `Shot: single hero product, centered, no props, no hands.`,
    `Angle: 3/4 view from slightly above for books and prints. Side-on for vinyl. Front-facing for apparel.`,
    `Atmosphere: collector-edition premium. The object looks rare and earned.`,
  ].join('\n')

  const animationPrompt = [
    `Subtle product animation loop from still image.`,
    `Product: ${product.title}.`,
    `Motion: ${product.animation ?? ANIMATION_STYLES[product.type] ?? 'product breathes with a slow atmospheric light shift, 5-second loop'}.`,
    `Camera: locked off, no movement. Product and light move only.`,
    `Loop: seamless. No sudden changes. No zoom.`,
    `Mood: luxury, dark, cinematic, premium collector edition.`,
    `16mm grain. No text. Deep shadow. Warm amber light.`,
  ].join(' ')

  const gptImagePayload = {
    model: 'gpt-image-2',
    prompt: photoPrompt,
    quality: 'high',
    size: '1024x1024',
  }

  const klingAnimatePayload = {
    model: 'kling-2.6',
    mode: 'image_to_video',
    duration: '6',
    cfg_scale: 0.5,
    prompt: animationPrompt,
  }

  return {
    slug:        product.slug,
    title:       product.title,
    type:        product.type,
    description: product.description,
    material:    product.material,

    generatedAssets: {
      productPhoto: {
        status:        'prompt_ready',
        prompt:        photoPrompt,
        gptPayload:    gptImagePayload,
        photoPath:     `public/generated/kie/objects/${product.slug}/photo.jpg`,
        publicUrl:     `/generated/kie/objects/${product.slug}/photo.jpg`,
        taskId:        null,
        submittedAt:   null,
        completedAt:   null,
        error:         null,
      },
      animatedLoop: {
        status:        'prompt_ready',
        prompt:        animationPrompt,
        klingPayload:  klingAnimatePayload,
        videoPath:     `public/generated/kie/objects/${product.slug}/loop.mp4`,
        publicUrl:     `/generated/kie/objects/${product.slug}/loop.mp4`,
        taskId:        null,
        submittedAt:   null,
        completedAt:   null,
        error:         null,
      },
    },

    approvals: {
      productPhoto: false,
      animatedLoop: false,
    },

    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  fs.mkdirSync(OBJ_DIR, { recursive: true })

  console.log(`\n── Product Cinematic Prompt Generator ──────────────────────`)
  console.log(`   Products in catalogue: ${PRODUCTS.length}\n`)

  let written = 0, skipped = 0

  for (const product of PRODUCTS) {
    const outFile = path.join(OBJ_DIR, `${product.slug}.json`)

    if (!FORCE && fs.existsSync(outFile)) {
      console.log(`  skip (exists): ${product.slug}`)
      skipped++
      continue
    }

    // Create output subdir for assets
    fs.mkdirSync(path.join(OBJ_DIR, product.slug), { recursive: true })

    const manifest = buildProductManifest(product)
    fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), 'utf-8')
    console.log(`  ✓ ${product.slug.padEnd(35)} [${product.type}]`)
    written++
  }

  console.log(`\n── Summary ────────────────────────────────────────────────`)
  console.log(`   Products written: ${written}`)
  console.log(`   Skipped:          ${skipped}`)
  console.log(`\nNext: node scripts/kie/validate-kie-assets.js\n`)
}

main()
