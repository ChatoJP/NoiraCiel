#!/usr/bin/env python3
"""
generate_scores.py
Full AI score pipeline — no external notation software required.

  WAV/MP3
    → Demucs htdemucs  (stem separation)
    → Basic Pitch      (audio → MIDI, on melodic stems)
    → music21          (MIDI → MusicXML with quantisation + key/tempo)
    → verovio          (MusicXML → SVG pages)
    → cairosvg + reportlab  (SVG pages → styled PDF)
    → ZIP archive      (stems + MIDI + MusicXML + PDF)

Usage:
  python scripts/generate_scores.py "Music/hd_1 - Why.wav"
  python scripts/generate_scores.py "Music/hd_1 - Why.wav" --slug why
  python scripts/generate_scores.py --album main
  python scripts/generate_scores.py --album jazz
  python scripts/generate_scores.py --album metal
  python scripts/generate_scores.py --all
"""

import sys, os, re, io, json, shutil, zipfile, subprocess, argparse, textwrap
from pathlib import Path

# ── Lazy imports (checked at runtime for clearer errors) ──────────────────────
def _require(name, pip_name=None):
    import importlib
    try:
        return importlib.import_module(name)
    except ImportError:
        pkg = pip_name or name
        print(f"[!] Missing: {name}  →  pip install {pkg}")
        sys.exit(1)

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT       = Path(__file__).parent.parent
MUSIC_DIR  = ROOT / "Music"
OUT_BASE   = ROOT / "public" / "Books" / "scores"
STEMS_WORK = ROOT / ".score-work" / "stems"
MIDI_WORK  = ROOT / ".score-work" / "midi"
XML_WORK   = ROOT / ".score-work" / "xml"

# ── Track metadata ─────────────────────────────────────────────────────────────
MAIN_TRACKS = {
    1:  ("why",                            "Why"),
    2:  ("who-wins-if-i-win",              "Who Wins If I Win?"),
    3:  ("the-roots-we-cannot-see",        "The Roots We Cannot See"),
    4:  ("if-we-cant-say-the-hard-truths", "If We Can't Say the Hard Truths"),
    5:  ("i-never-knew-any-other-way",     "I Never Knew Any Other Way"),
    6:  ("side-by-side",                   "Side by Side"),
    7:  ("always-in-your-corner",          "Always in Your Corner"),
    8:  ("it-was-already-there",           "It Was Already There"),
    9:  ("as-long-as-youre-okay",          "As Long As You're Okay"),
    10: ("the-house-we-couldnt-leave",     "The House We Couldn't Leave"),
    11: ("i-never-knew-any-other-way",     "I Never Knew Any Other Way"),
    12: ("leave-a-light-on",               "Leave a Light On"),
    13: ("the-empty-chair",                "The Empty Chair"),
    14: ("good-things-grow-slow",          "Good Things Grow Slow"),
    15: ("maybe-i-was-wrong",              "Maybe I Was Wrong"),
    16: ("borrowed-time",                  "Borrowed Time"),
    17: ("free-men-tell-the-truth",        "Free Men Tell the Truth"),
}

ALBUM_META = {
    "main":   ("The Life Lessons I Hope You Learn", "Atlantic Noir"),
    "jazz":   ("NoiraCiel Jazz Sessions",            "Jazz · Atlantic Noir"),
    "metal":  ("The Blind Angel — Intimate Metal Sessions", "Intimate Metal"),
    "velvet": ("The Velvet Machine",                 "Electronic · Fado · Atlantic Noir"),
    "sail":   ("Still We Sail",                      "Atlantic Noir · Fado · Sea-Soul"),
    "wymo":   ("What You're Made Of",               "Hip-Hop · DnB · Soul · Trap"),
    "basb":   ("Bare and Still Breathing",           "Unplugged · Acoustic · Guitar & Voice"),
    "tsd":    ("The Sacred Drift",                   "Indie Pop · R&B · DnB · Trip-Pop · Psych"),
}

# ── File discovery ─────────────────────────────────────────────────────────────
def find_audio_files(album: str):
    """Return list of (audio_path, slug, title, track_num, album_label, genre)."""
    entries = []
    if album == "main":
        for wav in sorted(MUSIC_DIR.glob("hd_*.wav")):
            m = re.match(r"hd_(\d+)\s*-\s*(.+)\.wav$", wav.name, re.I)
            if not m:
                continue
            num = int(m.group(1))
            info = MAIN_TRACKS.get(num)
            slug, title = info if info else (slugify(m.group(2)), m.group(2).strip())
            label, genre = ALBUM_META["main"]
            entries.append((wav, slug, title, num, label, genre))

    elif album == "jazz":
        jazz_dir = MUSIC_DIR / "NoiraCiel Jazz Sessions"
        for i, f in enumerate(sorted(jazz_dir.glob("*.mp3")) + sorted(jazz_dir.glob("*.wav")), 1):
            slug  = slugify(f.stem)
            title = f.stem.strip()
            label, genre = ALBUM_META["jazz"]
            entries.append((f, slug, title, i, label, genre))

    elif album == "metal":
        metal_dir = MUSIC_DIR / "The  Blind Angel - Intimate Metal Sessions"
        for i, f in enumerate(sorted(metal_dir.glob("*.wav")) + sorted(metal_dir.glob("*.mp3")), 1):
            slug  = slugify(f.stem)
            title = re.sub(r"^Noiraciel\s*-\s*", "", f.stem, flags=re.I).strip()
            label, genre = ALBUM_META["metal"]
            entries.append((f, slug, title, i, label, genre))

    elif album == "velvet":
        audio_dir = MUSIC_DIR / "The_Velvet_Machine" / "audio"
        for i, f in enumerate(sorted(audio_dir.glob("*.mp3")) + sorted(audio_dir.glob("*.wav")), 1):
            # strip track prefix (01_) and version suffix (_v2)
            stem = re.sub(r"^\d+_", "", f.stem)
            stem = re.sub(r"_v\d+$", "", stem, flags=re.I)
            title = stem.replace("_", " ").strip().title()
            slug  = slugify(stem)
            label, genre = ALBUM_META["velvet"]
            entries.append((f, slug, title, i, label, genre))

    elif album == "sail":
        audio_dir = MUSIC_DIR / "Still_We_Sail" / "audio"
        for i, f in enumerate(sorted(audio_dir.glob("*.mp3")) + sorted(audio_dir.glob("*.wav")), 1):
            stem = re.sub(r"^\d+_", "", f.stem)
            stem = re.sub(r"_v\d+$", "", stem, flags=re.I)
            title = stem.replace("_", " ").strip().title()
            slug  = slugify(stem)
            label, genre = ALBUM_META["sail"]
            entries.append((f, slug, title, i, label, genre))

    elif album == "wymo":
        audio_dir = MUSIC_DIR / "What_Youre_Made_Of" / "audio"
        for i, f in enumerate(sorted(audio_dir.glob("*.mp3")) + sorted(audio_dir.glob("*.wav")), 1):
            stem = re.sub(r"^\d+_", "", f.stem)
            stem = re.sub(r"_v\d+$", "", stem, flags=re.I)
            title = stem.replace("-", " ").replace("_", " ").strip().title()
            slug  = slugify(stem)
            label, genre = ALBUM_META["wymo"]
            entries.append((f, slug, title, i, label, genre))

    elif album == "basb":
        audio_dir = MUSIC_DIR / "Bare_And_Still_Breathing" / "audio"
        for i, f in enumerate(sorted(audio_dir.glob("*.mp3")) + sorted(audio_dir.glob("*.wav")), 1):
            stem = re.sub(r"^\d+_", "", f.stem)
            stem = re.sub(r"_v\d+$", "", stem, flags=re.I)
            title = stem.replace("-", " ").replace("_", " ").strip().title()
            slug  = slugify(stem)
            label, genre = ALBUM_META["basb"]
            entries.append((f, slug, title, i, label, genre))

    elif album == "tsd":
        audio_dir = MUSIC_DIR / "The_Sacred_Drift" / "audio"
        for i, f in enumerate(sorted(audio_dir.glob("*.mp3")) + sorted(audio_dir.glob("*.wav")), 1):
            stem = re.sub(r"^\d+_", "", f.stem)
            stem = re.sub(r"_v\d+$", "", stem, flags=re.I)
            title = stem.replace("-", " ").replace("_", " ").strip().title()
            slug  = slugify(stem)
            label, genre = ALBUM_META["tsd"]
            entries.append((f, slug, title, i, label, genre))

    return entries

def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"['’]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

# ── Step 1: Demucs stem separation ────────────────────────────────────────────
def run_demucs(audio_path: Path, work_dir: Path) -> dict[str, Path]:
    """
    Separate stems using Demucs Python API + soundfile for saving.
    Avoids torchaudio.save() which requires torchcodec in torchaudio ≥ 2.7.
    """
    out = work_dir / "demucs"
    out.mkdir(parents=True, exist_ok=True)

    track_name  = audio_path.stem
    expected    = out / "htdemucs" / track_name
    stem_names  = ("vocals", "other", "bass", "drums")

    # Already done?
    if expected.exists() and all((expected / f"{s}.wav").exists() for s in stem_names):
        print(f"    [1/4] Stems already separated — skipping Demucs")
        return {s: expected / f"{s}.wav" for s in stem_names}

    expected.mkdir(parents=True, exist_ok=True)
    print(f"    [1/4] Demucs separating stems…")

    try:
        import torch
        import torchaudio
        import soundfile as sf
        from demucs.pretrained import get_model
        from demucs.apply import apply_model

        model = get_model("htdemucs")
        model.eval()

        # ── Load audio ────────────────────────────────────────────────────────
        if audio_path.suffix.lower() in (".wav", ".flac", ".aiff", ".aif"):
            audio_np, sr = sf.read(str(audio_path), dtype="float32", always_2d=True)
            wav = torch.from_numpy(audio_np.T)          # (channels, samples)
        else:
            # MP3 / other — use librosa (torchaudio MP3 needs torchcodec)
            import numpy as np
            import librosa as _librosa
            audio_np, sr = _librosa.load(str(audio_path), sr=None, mono=False)
            if audio_np.ndim == 1:
                audio_np = np.stack([audio_np, audio_np])
            wav = torch.from_numpy(audio_np.astype("float32"))

        # Resample to model's expected rate (44 100 Hz for htdemucs)
        if sr != model.samplerate:
            wav = torchaudio.functional.resample(wav, sr, model.samplerate)

        # Ensure stereo
        if wav.shape[0] == 1:
            wav = wav.repeat(2, 1)
        elif wav.shape[0] > 2:
            wav = wav[:2]

        # Normalise for model stability
        ref = wav.mean(0)
        std = ref.std().clamp(min=1e-8)
        wav_norm = (wav - ref.mean()) / std

        # Separate
        with torch.no_grad():
            sources = apply_model(model, wav_norm[None], split=True, overlap=0.25)[0]

        # Denormalise
        sources = sources * std + ref.mean()

        # ── Save with soundfile (bypasses broken torchaudio.save) ─────────────
        stems: dict[str, Path] = {}
        for src, name in zip(sources, model.sources):
            out_path = expected / f"{name}.wav"
            sf.write(str(out_path), src.cpu().numpy().T, model.samplerate)
            stems[name] = out_path

        return stems

    except Exception as e:
        print(f"    [!] Demucs Python API failed: {e}")
        raise RuntimeError("Demucs failed")

# ── Step 2: Audio → MIDI (librosa pyin + onset detection) ────────────────────
def run_basic_pitch(stem_path: Path, midi_out_dir: Path) -> Path | None:
    """Transcribe a stem WAV to MIDI using librosa pyin + onset detection."""
    midi_out_dir.mkdir(parents=True, exist_ok=True)
    stem_slug = stem_path.stem
    midi_path = midi_out_dir / f"{stem_slug}.mid"

    if midi_path.exists():
        return midi_path

    # Try basic_pitch first if available (better quality)
    try:
        from basic_pitch.inference import predict
        _, midi_data, _ = predict(
            str(stem_path),
            onset_threshold=0.35,
            frame_threshold=0.25,
            minimum_note_length=80,
            minimum_frequency=60,
            maximum_frequency=4000,
        )
        midi_data.write(str(midi_path))
        return midi_path
    except Exception:
        pass  # fall through to librosa

    try:
        import librosa
        import numpy as np
        import mido

        y, sr = librosa.load(str(stem_path), sr=22050, mono=True)

        # Pitch tracking via pyin (monophonic, good for vocals/melody)
        hop = 512
        f0, voiced, _ = librosa.pyin(
            y,
            fmin=librosa.note_to_hz('C2'),
            fmax=librosa.note_to_hz('C7'),
            sr=sr,
            hop_length=hop,
        )

        # Convert Hz → MIDI note numbers (NaN = silence)
        midi_notes = np.where(voiced & (f0 > 0),
                              librosa.hz_to_midi(np.where(f0 > 0, f0, 1.0)).round().astype(int),
                              -1)

        # Build note events: group consecutive same-pitch frames into notes
        mid = mido.MidiFile(ticks_per_beat=480)
        track = mido.MidiTrack()
        mid.tracks.append(track)
        tempo = 500000  # 120 BPM
        track.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))

        sec_per_frame = hop / sr
        ticks_per_sec = (480 * 1_000_000) / tempo

        def sec_to_ticks(s):
            return int(s * ticks_per_sec)

        prev_note = -1
        note_start = 0.0
        abs_time = 0.0

        events = []  # (time_sec, type, note, velocity)

        for i, note in enumerate(midi_notes):
            t = i * sec_per_frame
            if note != prev_note:
                if prev_note >= 0 and prev_note <= 127:
                    events.append((note_start, 'note_on',  prev_note, 80))
                    events.append((t,          'note_off', prev_note, 0))
                if note >= 0 and note <= 127:
                    note_start = t
                prev_note = note

        if prev_note >= 0 and prev_note <= 127:
            events.append((note_start, 'note_on',  prev_note, 80))
            events.append((abs_time,   'note_off', prev_note, 0))

        events.sort(key=lambda e: e[0])

        last_tick = 0
        for ev in events:
            tick = sec_to_ticks(ev[0])
            delta = max(0, tick - last_tick)
            if ev[1] == 'note_on':
                track.append(mido.Message('note_on',  note=int(ev[2]), velocity=int(ev[3]), time=delta))
            else:
                track.append(mido.Message('note_off', note=int(ev[2]), velocity=0,          time=delta))
            last_tick = tick

        mid.save(str(midi_path))
        return midi_path

    except Exception as e:
        print(f"    [!] MIDI transcription failed on {stem_path.name}: {e}")
        return None

# ── Step 3: music21 — MIDI → MusicXML ────────────────────────────────────────
def midi_to_musicxml(midi_path: Path, xml_out_dir: Path,
                     title: str, track_num: int, album: str) -> Path | None:
    """Quantise, annotate, and export MusicXML."""
    xml_out_dir.mkdir(parents=True, exist_ok=True)
    xml_path = xml_out_dir / (midi_path.stem + ".xml")

    if xml_path.exists():
        return xml_path

    try:
        from music21 import converter, tempo, key, meter, stream, metadata as m21meta

        s = converter.parse(str(midi_path))

        # music21 v9+ uses .flatten() — older versions used .flat
        def flat(stream_obj):
            return stream_obj.flatten() if hasattr(stream_obj, "flatten") else stream_obj.flat

        # ── Flatten to a single Part if multiple tracks ────────────────────
        parts = s.parts
        if len(parts) >= 1:
            part = parts[0]  # take melodic track (highest part)
        else:
            part = flat(s).notesAndRests.stream()

        # ── Quantise to 16th note grid ────────────────────────────────────
        part = part.quantize(
            [0.5, 0.25],          # 8th and 16th note boundaries
            processOffsets=True,
            processDurations=True,
            inPlace=False,
        )

        # ── Remove very short notes (< 32nd note = 0.125 quarters) ────────
        for n in list(flat(part).notes):
            if n.quarterLength < 0.125:
                part.remove(n, recurse=True)

        # ── Key signature ─────────────────────────────────────────────────
        try:
            detected_key = flat(part).analyze("key")
        except Exception:
            detected_key = key.Key("C")
        part.insert(0, detected_key)

        # ── Time signature (4/4 if none found) ───────────────────────────
        if not flat(part).getElementsByClass("TimeSignature"):
            part.insert(0, meter.TimeSignature("4/4"))

        # ── Tempo ─────────────────────────────────────────────────────────
        if not flat(part).getElementsByClass("MetronomeMark"):
            part.insert(0, tempo.MetronomeMark(number=72))

        # ── Metadata ─────────────────────────────────────────────────────
        sc = stream.Score()
        sc.insert(0, part)
        md = m21meta.Metadata()
        md.title  = title
        md.composer = "NoiraCiel"
        sc.insert(0, md)

        sc.write("musicxml", fp=str(xml_path))
        return xml_path

    except Exception as e:
        print(f"    [!] music21 failed for {midi_path.name}: {e}")
        return None

# ── Step 4: verovio + cairosvg + reportlab → PDF ──────────────────────────────
def save_score_svgs(xml_paths: list[Path], out_dir: Path,
                    slug: str, stem_labels: list[str]) -> dict | None:
    """Render each MusicXML to SVG pages and save for web display."""
    import verovio

    tk = verovio.toolkit()
    tk.setOptions({
        "pageWidth":        2100,
        "pageHeight":       2970,
        "scale":            30,
        "adjustPageHeight": 1,
        "svgViewBox":       1,   # responsive scaling in browser
        "pageMarginTop":    100,
        "pageMarginBottom": 100,
        "pageMarginLeft":   100,
        "pageMarginRight":  100,
        "font":             "Leipzig",
    })

    def _render_svg(n: int) -> str:
        for method in ("renderToSVG", "renderPage", "renderToSVGPage"):
            fn = getattr(tk, method, None)
            if fn:
                return fn(n)
        raise RuntimeError("verovio: no render method found")

    pages_per_stem: dict[str, int] = {}

    for xml_path, stem_label in zip(xml_paths, stem_labels):
        if not xml_path or not xml_path.exists():
            continue

        loaded = tk.loadData(xml_path.read_text(encoding="utf-8"))
        if not loaded:
            print(f"    [!] verovio: could not load {xml_path.name}")
            continue

        page_count = tk.getPageCount()
        if page_count == 0:
            print(f"    [!] verovio: 0 pages for {xml_path.name}")
            continue

        pages_per_stem[stem_label] = page_count
        for page_num in range(1, page_count + 1):
            svg_str  = _render_svg(page_num)
            svg_path = out_dir / f"{stem_label}-page-{page_num}.svg"
            svg_path.write_text(svg_str, encoding="utf-8")

        print(f"          → {stem_label}: {page_count} page(s)")

    if not pages_per_stem:
        return None

    manifest = {
        "slug":   slug,
        "stems":  list(pages_per_stem.keys()),
        "pages":  pages_per_stem,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    return manifest


# ── (legacy) PDF render — replaced by save_score_svgs ────────────────────────
def render_score_pdf(xml_paths: list[Path], pdf_path: Path,
                     title: str, track_num: int,
                     album_label: str, genre: str,
                     stem_labels: list[str]) -> None:
    """Render all MusicXML files into a single styled PDF."""
    import verovio
    import fitz  # PyMuPDF — renders SVG including <use>/<symbol> glyphs
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.utils import ImageReader
    from reportlab.lib.colors import HexColor

    W, H = A4  # 595.27 × 841.89 points

    # colours
    BLACK_BG  = HexColor("#04040a")
    GOLD      = HexColor("#c4953a")
    IVORY     = HexColor("#F2EDE3")
    SILVER    = HexColor("#8a8a9a")

    c = canvas.Canvas(str(pdf_path), pagesize=A4)

    # ── Cover page ────────────────────────────────────────────────────────
    c.setFillColor(BLACK_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Gold accent line
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.5)
    c.line(48, H - 72, W - 48, H - 72)
    c.line(48, 72, W - 48, 72)

    # Label
    c.setFillColor(GOLD)
    c.setFont("Helvetica", 7)
    c.drawCentredString(W / 2, H - 56, "NOIRACIEL")

    # Chapter tag
    c.setFillColor(SILVER)
    c.setFont("Helvetica", 8)
    tag = f"Chapter {str(track_num).zfill(2)}  ·  {album_label.upper()}"
    c.drawCentredString(W / 2, H - 84, tag)

    # Title
    c.setFillColor(IVORY)
    font_size = 32 if len(title) < 22 else 24 if len(title) < 30 else 18
    c.setFont("Helvetica-BoldOblique", font_size)
    c.drawCentredString(W / 2, H / 2 + 20, title)

    # Genre
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Oblique", 10)
    c.drawCentredString(W / 2, H / 2 - 14, genre)

    # Stems label
    c.setFillColor(SILVER)
    c.setFont("Helvetica", 7)
    c.drawCentredString(W / 2, H / 2 - 46,
        f"Musical score  ·  Stems: {', '.join(stem_labels)}")

    # Disclaimer
    disclaimer = (
        "Approximate AI transcription via Demucs stem separation + "
        "Basic Pitch pitch detection. Intended as a creative reference — "
        "not a professional engraver's score."
    )
    text_obj = c.beginText(72, 120)
    text_obj.setFont("Helvetica-Oblique", 7)
    text_obj.setFillColor(HexColor("#555566"))
    for line in textwrap.wrap(disclaimer, width=80):
        text_obj.textLine(line)
    c.drawText(text_obj)

    c.setFillColor(HexColor("#333344"))
    c.setFont("Helvetica", 6)
    c.drawCentredString(W / 2, 56, "noiraciel.com")

    c.showPage()

    # ── Score pages (per stem) ─────────────────────────────────────────────
    tk = verovio.toolkit()
    tk.setOptions({
        "pageWidth":       1950,
        "pageHeight":      2750,
        "scale":           40,
        "adjustPageHeight": 1,
        "noJustification":  0,
        "svgViewBox":       1,
        "pageMarginTop":    150,
        "pageMarginBottom": 150,
        "pageMarginLeft":   150,
        "pageMarginRight":  150,
        "font":             "Leipzig",
    })

    # verovio 6.x: renderToSVG(pageNo) renders a specific page
    # Earlier versions used renderToSVGPage(pageNo) or renderPage(pageNo)
    def _render_page(page_no: int) -> str:
        for method in ("renderToSVG", "renderPage", "renderToSVGPage"):
            fn = getattr(tk, method, None)
            if fn:
                return fn(page_no)
        raise RuntimeError("verovio: no page render method found")

    for xml_path, stem_label in zip(xml_paths, stem_labels):
        if not xml_path or not xml_path.exists():
            continue

        try:
            with open(xml_path, "r", encoding="utf-8") as f:
                xml_content = f.read()
            loaded = tk.loadData(xml_content)
        except Exception:
            loaded = False

        if not loaded:
            print(f"    [!] verovio could not load {xml_path.name}")
            continue

        page_count = tk.getPageCount()
        if page_count == 0:
            print(f"    [!] verovio: 0 pages for {xml_path.name}")
            continue

        for page_num in range(1, page_count + 1):
            svg_str = _render_page(page_num)

            # SVG → PNG via PyMuPDF (handles <use>/<symbol> glyphs; no system deps)
            try:
                svg_doc  = fitz.open(stream=svg_str.encode("utf-8"), filetype="svg")
                svg_pg   = svg_doc[0]
                # Render at 2× scale for crisp notation on A4
                mat      = fitz.Matrix(2.0, 2.0)
                pix      = svg_pg.get_pixmap(matrix=mat, alpha=False)
                png_bytes = pix.tobytes("png")
                svg_doc.close()
            except Exception as e:
                print(f"    [!] PyMuPDF render error page {page_num}: {e}")
                continue

            img_reader = ImageReader(io.BytesIO(png_bytes))

            # White page background
            c.setFillColor(HexColor("#ffffff"))
            c.rect(0, 0, W, H, fill=1, stroke=0)
            c.drawImage(img_reader, 0, 0, width=W, height=H,
                        preserveAspectRatio=True, anchor="c")

            # Small watermark header
            c.setFillColor(HexColor("#aaaaaa"))
            c.setFont("Helvetica", 6)
            c.drawString(36, H - 16,
                f"NoiraCiel  ·  {title}  ·  {stem_label}  ·  p.{page_num}")
            c.drawRightString(W - 36, H - 16, "noiraciel.com")

            c.showPage()

    # ── Back page ─────────────────────────────────────────────────────────
    c.setFillColor(BLACK_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.5)
    c.line(48, H / 2 + 20, W - 48, H / 2 + 20)
    c.setFillColor(GOLD)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W / 2, H / 2, "NoiraCiel")
    c.setFillColor(SILVER)
    c.setFont("Helvetica-Oblique", 7)
    c.drawCentredString(W / 2, H / 2 - 18,
        "Contributions help fund The Invisible Roots Scholarship.")
    c.setFillColor(HexColor("#333344"))
    c.setFont("Helvetica", 6)
    c.drawCentredString(W / 2, H / 2 - 40, "noiraciel.com")
    c.showPage()

    c.save()
    print(f"    [4/4] PDF → {pdf_path.relative_to(ROOT)}")

# ── Step 5: ZIP archive ────────────────────────────────────────────────────────
def build_archive(slug: str, work_dir: Path,
                  pdf_path: Path, archive_path: Path) -> None:
    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # stems
        stems_dir = work_dir / "demucs" / "htdemucs"
        if stems_dir.exists():
            for wav in stems_dir.rglob("*.wav"):
                zf.write(wav, f"stems/{wav.name}")
        # midi
        for mid in (work_dir / "midi").glob("*.mid"):
            zf.write(mid, f"midi/{mid.name}")
        # musicxml
        for xml in (work_dir / "xml").glob("*.xml"):
            zf.write(xml, f"musicxml/{xml.name}")
        # pdf
        if pdf_path.exists():
            zf.write(pdf_path, f"{slug}-score.pdf")
    print(f"    [✓] Archive → {archive_path.relative_to(ROOT)}")

# ── Main pipeline for one track ────────────────────────────────────────────────
def process_track(audio_path: Path, slug: str, title: str,
                  track_num: int, album_label: str, genre: str) -> None:
    print(f"\n{'─'*60}")
    print(f"  {title}  (Chapter {track_num})")
    print(f"{'─'*60}")

    out_dir  = OUT_BASE / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    work_dir = ROOT / ".score-work" / slug
    work_dir.mkdir(parents=True, exist_ok=True)

    pdf_path     = out_dir / f"{slug}-score.pdf"
    archive_path = out_dir / f"{slug}-archive.zip"

    manifest_path = out_dir / "manifest.json"
    if manifest_path.exists():
        print(f"  ⏭  Already done — skipping")
        return

    # 1. Stems
    try:
        stems = run_demucs(audio_path, work_dir)
    except RuntimeError:
        print(f"  ✗  Stem separation failed — skipping track")
        return

    # 2. Basic Pitch — only on melodic stems
    melodic_stems = {k: v for k, v in stems.items() if k in ("vocals", "other")}
    midi_dir = work_dir / "midi"
    midi_paths: dict[str, Path] = {}
    print(f"    [2/4] Basic Pitch MIDI transcription…")
    for stem_name, stem_path in melodic_stems.items():
        print(f"          → {stem_name}.wav")
        midi = run_basic_pitch(stem_path, midi_dir)
        if midi:
            midi_paths[stem_name] = midi

    if not midi_paths:
        print(f"  ✗  No MIDI generated — skipping track")
        return

    # 3. MusicXML
    xml_dir = work_dir / "xml"
    xml_paths_list: list[Path] = []
    stem_labels: list[str] = []
    print(f"    [3/4] music21 → MusicXML…")
    for stem_name, midi_path in midi_paths.items():
        xml = midi_to_musicxml(midi_path, xml_dir, title, track_num, album_label)
        if xml:
            xml_paths_list.append(xml)
            stem_labels.append(stem_name)
            print(f"          → {xml.name}")

    if not xml_paths_list:
        print(f"  ✗  No MusicXML generated — skipping track")
        return

    # 4. SVG pages → public/ (displayed inline on the website)
    print(f"    [4/4] verovio → SVG pages…")
    try:
        manifest = save_score_svgs(xml_paths_list, out_dir, slug, stem_labels)
    except Exception as e:
        print(f"  ✗  SVG render failed: {e}")
        return

    if not manifest:
        print(f"  ✗  No SVG pages generated — skipping track")
        return

    print(f"  ✓  {title} complete")

# ── CLI ────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="NoiraCiel score generator")
    parser.add_argument("audio", nargs="?", help="Path to a single audio file")
    parser.add_argument("--slug",    help="Override slug for the output folder")
    parser.add_argument("--album",   choices=["main", "jazz", "metal", "velvet", "sail", "wymo", "basb", "tsd"],
                        help="Process an entire album")
    parser.add_argument("--all",     action="store_true",
                        help="Process all albums")
    args = parser.parse_args()

    OUT_BASE.mkdir(parents=True, exist_ok=True)

    if args.audio:
        audio_path = Path(args.audio)
        if not audio_path.exists():
            audio_path = ROOT / args.audio
        if not audio_path.exists():
            print(f"[!] File not found: {args.audio}")
            sys.exit(1)
        slug  = args.slug or slugify(audio_path.stem)
        title = audio_path.stem
        process_track(audio_path, slug, title, 0, "NoiraCiel", "Atlantic Noir")

    elif args.album or args.all:
        albums = ["main", "jazz", "metal", "velvet", "sail", "wymo", "basb", "tsd"] if args.all else [args.album]
        for album in albums:
            entries = find_audio_files(album)
            if not entries:
                print(f"[!] No audio files found for album: {album}")
                continue
            print(f"\n{'═'*60}")
            print(f"  Album: {ALBUM_META[album][0]}")
            print(f"  {len(entries)} tracks found")
            print(f"{'═'*60}")
            for audio_path, slug, title, num, label, genre in entries:
                process_track(audio_path, slug, title, num, label, genre)

    else:
        parser.print_help()
        print("\nExamples:")
        print('  python scripts/generate_scores.py "Music/hd_1 - Why.wav" --slug why')
        print("  python scripts/generate_scores.py --album main")
        print("  python scripts/generate_scores.py --all")

if __name__ == "__main__":
    main()
