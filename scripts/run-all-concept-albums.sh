#!/usr/bin/env bash
# Sequential batch runner across all 5 new concept albums.
# Stops on first failure (the underlying CLI already exits non-zero on any
# upload/verification/API failure) — does not silently skip past errors.
set -e
cd "$(dirname "$0")/.."

ALBUMS=(salt-cathedral neon-saints glass-animal black-sun-gospel the-memory-atlas)
TASKS=(music song-art chapter-banner)

for album in "${ALBUMS[@]}"; do
  for task in "${TASKS[@]}"; do
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo " $album — $task"
    echo "════════════════════════════════════════════════════════════"
    node scripts/generate-concept-album.js --album "$album" --task "$task" --run
  done
done

echo ""
echo "ALL ALBUMS COMPLETE"
