#!/usr/bin/env bash
# render-album-locally.sh — run on your local dev machine (not the VPS).
# Does the full per-track heavy-render pipeline for one already-generated
# concept album: pull audio -> transcribe -> karaoke video -> film ->
# cinemagraph -> score -> upload scores to R2.
#
# Each step already uploads its own result to R2 and cleans up its own temp
# files (karaoke/film/cinemagraph via r2.migrateFile in their scripts) except
# the score step, which has no R2 upload built in — handled at the end here.
#
# A failed step for one track is logged and skipped rather than aborting the
# whole album; re-running this script later is safe (every step already
# skips work it detects as done).
#
# Usage:
#   ./scripts/render-album-locally.sh salt-cathedral

set -uo pipefail
cd "$(dirname "$0")/.."

ALBUM="${1:-}"
if [ -z "$ALBUM" ]; then
  echo "Usage: $0 <album-slug>   e.g. $0 salt-cathedral"
  exit 1
fi

CONCEPT="data/concept-albums/$ALBUM/concept.json"
if [ ! -f "$CONCEPT" ]; then
  echo "✗ No concept.json at $CONCEPT — is '$ALBUM' a valid album slug?"
  exit 1
fi

DIRNAME=$(node -e "console.log(require('./$CONCEPT').dirName)")
AUDIO_DIR="Music/$DIRNAME/audio"

echo "════════════════════════════════════════════════════════════"
echo " $ALBUM  →  $AUDIO_DIR"
echo "════════════════════════════════════════════════════════════"

echo ""
echo "── 1/5  Pulling finished audio from R2 ──────────────────────"
node scripts/pull-concept-album-audio.js --album "$ALBUM"

echo ""
echo "── 2/5  Transcribing (word-level timestamps for karaoke) ─────"
python3 scripts/transcribe-songs.py --dir "$AUDIO_DIR"

if [ ! -d "$AUDIO_DIR" ]; then
  echo "✗ $AUDIO_DIR doesn't exist — nothing was pulled (no tracks finished yet?). Stopping."
  exit 1
fi

echo ""
echo "── 3/5  Karaoke / lyric videos ────────────────────────────────"
for f in "$AUDIO_DIR"/*.mp3; do
  [ -e "$f" ] || continue
  base=$(basename "$f" .mp3)
  slug=$(echo "$base" | sed -E 's/^[0-9]+_//; s/_v[0-9]+$//')
  echo "  → $slug"
  node scripts/render-karaoke-generic.js --slug "$slug" || echo "    (skipped/failed — continuing)"
done

echo ""
echo "── 4/5  Film + cinemagraph ────────────────────────────────────"
for f in "$AUDIO_DIR"/*.mp3; do
  [ -e "$f" ] || continue
  base=$(basename "$f" .mp3)
  slug=$(echo "$base" | sed -E 's/^[0-9]+_//; s/_v[0-9]+$//')
  echo "  → $slug (film)"
  node scripts/generate-slideshow-video.js --slug "$slug" --type film || echo "    (skipped/failed — continuing)"
  echo "  → $slug (cinemagraph)"
  node scripts/generate-slideshow-video.js --slug "$slug" --type cinemagraph || echo "    (skipped/failed — continuing)"
done

echo ""
echo "── 5/5  Musical scores (no built-in R2 upload — uploading after) ─"
for f in "$AUDIO_DIR"/*.mp3; do
  [ -e "$f" ] || continue
  base=$(basename "$f" .mp3)
  slug=$(echo "$base" | sed -E 's/^[0-9]+_//; s/_v[0-9]+$//')
  echo "  → $slug"
  python3 scripts/generate_scores.py "$f" --slug "$slug" || echo "    (skipped/failed — continuing)"
done

echo ""
echo "── Uploading generated scores to R2 ───────────────────────────"
node scripts/migrate-media-to-r2.js --category books --delete

echo ""
echo "════════════════════════════════════════════════════════════"
echo " Done with $ALBUM."
echo " Local audio copy still at $AUDIO_DIR — safe to delete, the"
echo " canonical copy is on R2 (rm -rf \"$AUDIO_DIR\")."
echo "════════════════════════════════════════════════════════════"
