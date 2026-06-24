# NoiraCiel Symbolic Visual System

The visual language for the NoiraCiel Speaker, the Daily Glyph, and the 13-Day
Wave. Premium, cinematic, restrained — *ancient-future*, never tourist-Maya,
never horoscope-app, never cartoon spirituality.

> **Honesty note (applies everywhere).** This is a *symbolic and artistic*
> system inspired by Mesoamerican calendrical traditions. It is not a
> reproduction of sacred/historical glyphs, not a prediction, not a scientific
> claim, and not a spiritual authority.

---

## 0. Status — what already ships

The system below is implemented as **code-drawn SVG** (zero asset cost, instant,
theme-aware) and is live on `/speaker`:

| Piece | File | Notes |
|---|---|---|
| 20 day-sign glyphs | `src/app/speaker/SignGlyph.tsx` | abstract marks, `currentColor` |
| Tone marks (1–13) | `src/app/speaker/SpeakerExperience.tsx` → `GlyphSigil` | dots around a ring: 1 = origin point, 13 = full ring |
| Kin card | `src/app/speaker/KinCard.tsx` | `full` + `mini` variants |
| 13-day wave timeline | `SpeakerExperience.tsx` → wave panel | today glows, tone 1/13 distinct |

KIE.AI image generation (Section 6) is **optional enrichment** — for share
cards, OG images, background textures, and a cinematic wave hero. It is wired as
a **dry-run-by-default** script so nothing is generated (or billed) without an
explicit `--live` flag.

---

## 1. Symbol design rules

These rules keep every mark coherent, whether drawn as SVG or generated as an image.

1. **Reduction over decoration.** Each day-sign is 2–4 strokes. If a fifth stroke
   doesn't add meaning, remove it.
2. **Idea, not artifact.** Evoke the *concept* (water, breath, seed, mirror, sun,
   serpent, jaguar, storm, road, night) — never copy a historical glyph.
3. **One accent only.** Marks render in `currentColor`, tinted by the active
   theme accent (muted gold by default). No multi-colour icons.
4. **Geometry with breath.** Prefer circles, single lines, gentle curves, and
   symmetry broken *slightly*. Avoid busy fills; negative space is part of the mark.
5. **Stone & mist palette.** Backgrounds: black stone `#04040A` / `#080810`,
   midnight blue `#0D1B2A`, violet shadow, muted gold `#C4953A`, Atlantic silver
   mist. Glow is subtle (low-opacity radial blur), never neon.
6. **Tone = rhythm.** Tones are expressed as *count and arrangement*, not new
   icons: tone 1 a single centred point (origin); rising tones add points around
   a ring; tone 13 completes the ring (transcendence).
7. **The wave is a line, not a wheel.** The 13-day wave reads left→right as a
   story (seed → mirror → completion), not as a circular zodiac.
8. **No clichés, ever.** No pyramids, no feathered headdresses, no neon, no
   cartoon, no stock "tribal" patterns, no zodiac wheels.

### Day-sign visual cues (the 20)
`Imix` deep water/ripples + drop · `Ik` two breath curves · `Akbal` house arch +
candle point · `Kan` seed + sprout · `Chicchan` single S-serpent · `Cimi`
horizon + closing crescent · `Manik` open grasping arc · `Lamat` four-point star
· `Muluc` drop + ripples · `Oc` heart from two arcs · `Chuen` interwoven loops ·
`Eb` rising path + steps · `Ben` reed/spine with rungs · `Ix` three jaguar spots
+ arc · `Men` eye within wings · `Cib` waning crescent + point · `Caban` spiral ·
`Etznab` split diamond/mirror · `Cauac` cloud + rain strokes · `Ahau` rayed sun.

---

## 2. Prompt template — one abstract glyph icon (per day-sign)

For generating a polished icon/sigil per sign (transparent or stone background).

```
A single abstract symbolic glyph representing "{SIGN_NAME}" — the idea of
{SIGN_CUE} (e.g. for Imix: the primordial deep water and the source).
Minimal sacred-geometry-inspired line mark, 2 to 4 strokes, centred, elegant,
mysterious. Muted gold ({HEX_GOLD #C4953A}) thin glowing lines on a near-black
stone background (#06060C) with faint Atlantic mist. Ancient-future feeling,
premium, restrained. Perfect symmetry softened by one deliberate imperfection.
NOT a historical Maya glyph, NOT a copy of any sacred symbol.
Negative: pyramids, headdresses, text, letters, neon, cartoon, tribal cliché,
busy detail, multiple colours, drop shadows, 3D, photoreal.
Aspect 1:1.
```

Token map: `{SIGN_NAME}`, `{SIGN_CUE}` (from §1 cues), `{HEX_GOLD}`.

---

## 3. Prompt template — a daily Kin card

For a shareable / OG image of a single Kin (matches `KinCard` "full").

```
A premium NoiraCiel "Kin card" for a Mayan-calendar-inspired daily glyph.
Vertical card, dark cinematic minimalism. Black stone background (#06060C) with
midnight-blue depth and a faint violet-gold glow behind the central symbol.
Centre: one abstract glyph for "{SIGN_NAME}" ({SIGN_CUE}) in thin muted-gold
glowing lines. Above it, small refined label "TONE {TONE}". Below, an elegant
serif title "{KIN_DISPLAY}" (e.g. "11 Ix"). Beneath, one short poetic line in
light italic serif: "{PHRASE}". Bottom: tiny uppercase tracking-wide caption
"{MOOD}" and the date "{DATE}". Atlantic mist, subtle film grain, ample negative
space, museum-grade restraint.
Negative: pyramids, tourist Maya, horoscope aesthetics, cartoon, neon, clutter,
watermark, stock-photo look, harsh contrast.
Aspect 4:5 (or 1200x630 for OG: aspect 1.91:1).
```

Token map: `{SIGN_NAME}`, `{SIGN_CUE}`, `{TONE}`, `{KIN_DISPLAY}`, `{PHRASE}`,
`{MOOD}`, `{DATE}`.

---

## 4. Prompt template — the 13-day wave

For one cinematic image representing the whole current wave.

```
Create a premium NoiraCiel 13-day wave visual for a Mayan-calendar-inspired
symbolic cycle. The wave is anchored by "{ANCHOR_SIGN}" and today is day
{POSITION} of 13. Compose 13 small glyph-stones in a gentle horizontal arc from
left (seed) to right (completion); the {POSITION}th stone glows softly as the
present; the first and last stones are visually distinct (origin and
transcendence). The anchor sign "{ANCHOR_SIGN}" appears as a larger central
symbol behind the line. Style: dark cinematic minimalism, black stone, midnight
blue, violet shadow, muted gold glyph lines, Atlantic mist, sacred-geometry
inspired but not historically copied, elegant, mysterious, premium.
Negative: pyramids, tourist Maya clichés, horoscope aesthetics, cartoon
spirituality, neon overload, text, zodiac wheel.
Aspect 16:9.
```

Token map: `{ANCHOR_SIGN}`, `{POSITION}`.

A **background texture** variant: drop the glyph-stones, keep "black stone with
faint gold sacred-geometry lines and Atlantic mist, very low contrast, seamless,
aspect 16:9" for use behind panels.

---

## 5. File / folder structure for generated assets

R2 is the media source of truth (see `next.config.ts` redirects). Mirror it locally
only as temp during generation.

```
public/images/glyphs/
  signs/            imix.jpg … ahau.jpg          (20 sign icons)
  tones/            tone-01.jpg … tone-13.jpg    (optional; SVG already covers)
  waves/            wave-{anchor}.jpg            (per-anchor wave hero, 20 max)
  kin/og/           {YYYY-MM-DD}.jpg             (daily OG/share cards, ephemeral)
  textures/         stone-mist-01.jpg …          (panel backgrounds)

# On R2 (canonical):
images/glyphs/signs/…  images/glyphs/waves/…  images/glyphs/textures/…
```

Naming: signs by lowercase sign name; waves by anchor sign; daily cards by ISO date.

---

## 6. Generation pipeline (KIE.AI) — optional, dry-run by default

Script: `scripts/generate-glyph-assets.js` (uses `scripts/lib/kie-client.js` +
`scripts/lib/r2-client.js`, matching the existing media pipeline).

```bash
# Print every prompt, generate nothing, spend nothing (default):
node scripts/generate-glyph-assets.js                 # or KIE_DRY_RUN=true
node scripts/generate-glyph-assets.js --only signs    # subset: signs|waves|texture
node scripts/generate-glyph-assets.js --kin 2026-06-24 # a single daily Kin card

# Actually generate + upload to R2 (costs KIE credits):
node scripts/generate-glyph-assets.js --live --only signs
```

Workflow per asset (live mode): build prompt → `submitImageJob` → `pollImageJob`
→ download → upload to R2 → record URL → delete temp. Always verify the R2 URL
before relying on it; never delete temp before upload confirms.

---

## 7. Connecting generated assets to the UI

The UI is **SVG-first with an optional image override**, so it works with or
without generated art:

1. Add a resolver, e.g. `signGlyphImage(sign)` →
   `https://<r2>/images/glyphs/signs/${slug}.jpg` (or `null`).
2. In `SignGlyph.tsx`, if an image URL exists, render `<Image>` and fall back to
   the inline SVG mark when it is `null` or fails to load. (Keep the SVG — it is
   the resilient default and the theme-aware one.)
3. `KinCard` (full): use the wave hero or a generated card image as an optional
   background layer behind the existing composition.
4. Daily OG image: a `/speaker/opengraph-image` route can either render the
   `KinCard` with `next/og` (no KIE needed) or serve the generated
   `images/glyphs/kin/og/{date}.jpg`.

Recommended order: ship SVG (done) → generate the 20 sign icons + per-anchor wave
heroes once (stable, finite, 40 images total) → add daily OG only if you want
share cards. Daily Kin card *images* are ephemeral and optional — the live
`KinCard` component already covers the on-site experience.
