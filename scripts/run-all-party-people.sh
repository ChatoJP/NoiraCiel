#!/usr/bin/env bash
# Sequential batch runner across all 4 Party People albums.
# Stops on first failure — the underlying CLI already exits non-zero on any
# upload/verification/API failure.
set -e
cd "$(dirname "$0")/.."

ALBUMS=(ritual-voltage concrete-saints velvet-circuit drum-oracle)
TASKS=(music track-art banner)

for album in "${ALBUMS[@]}"; do
  for task in "${TASKS[@]}"; do
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo " $album — $task"
    echo "════════════════════════════════════════════════════════════"
    node scripts/generate-party-people-album.js --album "$album" --task "$task" --run
  done
done

echo ""
echo "ALL PARTY PEOPLE ALBUMS COMPLETE"
