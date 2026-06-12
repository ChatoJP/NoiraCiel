#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
transcribe-songs.py — Word-level audio transcription using faster-whisper.
Outputs public/Lyrics/timestamps/{slug}.json for each song.

USAGE
  python scripts/transcribe-songs.py             # all songs
  python scripts/transcribe-songs.py why         # single track by slug
  python scripts/transcribe-songs.py --list      # show status
  python scripts/transcribe-songs.py why --force # re-transcribe
"""

import os, sys, re, json
from pathlib import Path

MUSIC_DIR  = Path(__file__).parent.parent / "Music"
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "Lyrics" / "timestamps"
SUPPORTED  = re.compile(r'\.(wav|mp3|flac|aiff?|m4a|ogg)$', re.IGNORECASE)

def slugify(text):
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

def parse_filename(filename):
    stem = Path(filename).stem
    m = re.match(r'^([a-z]+)_(\d+)\s*[-\s]+(.+)$', stem, re.IGNORECASE)
    if m:
        return int(m.group(2)), m.group(3).strip()
    return None, stem.strip()

def load_model():
    from faster_whisper import WhisperModel
    print("Loading Whisper model (base.en — downloads once ~150MB)…")
    return WhisperModel("base.en", device="cpu", compute_type="int8")

def transcribe(model, audio_path, slug):
    print(f"  Transcribing… (this takes a minute per song)")
    segments, info = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        language="en",
        beam_size=5,
        no_speech_threshold=0.3,     # lower = capture more (default 0.6 misses singing)
        log_prob_threshold=-1.5,     # allow lower confidence segments
        condition_on_previous_text=True,
        initial_prompt="Lyrics:",    # hint that this is song lyrics
    )

    words = []
    for seg in segments:
        if seg.words is None:
            continue
        for w in seg.words:
            word_text = w.word.strip()
            if not word_text:
                continue
            words.append({
                "word":  word_text,
                "start": round(w.start, 3),
                "end":   round(w.end,   3),
            })

    return words, info.duration

def run_list():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(f for f in MUSIC_DIR.iterdir() if SUPPORTED.search(f.name))
    print(f"\n{'#':>3}  {'Title':<40}  Status")
    print("─" * 60)
    for f in files:
        track_num, title = parse_filename(f.name)
        slug = slugify(title)
        out = OUTPUT_DIR / f"{slug}.json"
        status = "✅ done" if out.exists() else "○  pending"
        print(f"  {str(track_num or '?'):>3}  {title:<40}  {status}")
    print()

def main():
    args = sys.argv[1:]
    target_slug = next((a for a in args if not a.startswith("--")), None)
    force       = "--force" in args
    list_mode   = "--list" in args

    if list_mode:
        run_list()
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    audio_files = sorted(
        f for f in MUSIC_DIR.iterdir() if SUPPORTED.search(f.name)
    )

    targets = []
    for f in audio_files:
        track_num, title = parse_filename(f.name)
        slug = slugify(title)
        if target_slug and slug != target_slug:
            continue
        out = OUTPUT_DIR / f"{slug}.json"
        if out.exists() and not force:
            print(f"⏭  {title} — already transcribed (use --force to redo)")
            continue
        targets.append((f, track_num, title, slug, out))

    if not targets:
        print("Nothing to transcribe.")
        return

    model = load_model()

    for audio_path, track_num, title, slug, out_path in targets:
        print(f"\n🎤  [{track_num or '?'}] {title}")
        try:
            words, duration = transcribe(model, audio_path, slug)
            result = {
                "title":       title,
                "slug":        slug,
                "trackNumber": track_num,
                "duration":    round(duration, 3),
                "words":       words,
            }
            with open(out_path, "w", encoding="utf-8") as fp:
                json.dump(result, fp, indent=2, ensure_ascii=False)
            print(f"  ✓ {len(words)} words · {round(duration)}s → {out_path.name}")
        except Exception as e:
            print(f"  ✗ Failed: {e}")

    print("\n✅  Done.")

if __name__ == "__main__":
    main()
