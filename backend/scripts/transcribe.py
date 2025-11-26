#!/usr/bin/env python3
import sys, json, time
from faster_whisper import WhisperModel

start_time = time.time()
print("[transcribe.py] Starting transcription script", file=sys.stderr)

if len(sys.argv) < 2:
    print(json.dumps({"error": "audio path required"}))
    sys.exit(1)

audio_path = sys.argv[1]
print(f"[transcribe.py] Audio path: {audio_path}", file=sys.stderr)

model_load_start = time.time()
model = WhisperModel("tiny", device="cpu", compute_type="int8")   # Fastest settings for CPU-only
print(f"[transcribe.py] Model loaded in {time.time() - model_load_start:.2f}s", file=sys.stderr)

transcribe_start = time.time()
segments, info = model.transcribe(audio_path, vad_filter=True)
print(f"[transcribe.py] Transcribe completed in {time.time() - transcribe_start:.2f}s", file=sys.stderr)

all_text = []
seg_list = []
for seg in segments:
    t = seg.text.strip()
    if not t:
        continue
    all_text.append(t)
    seg_list.append({"text": t, "start": float(seg.start), "end": float(seg.end)})

total_time = time.time() - start_time
print(f"[transcribe.py] Segments length: {len(seg_list)} - Total time: {total_time:.2f}s", file=sys.stderr)

print(json.dumps({"transcript": " ".join(all_text), "segments": seg_list}))
