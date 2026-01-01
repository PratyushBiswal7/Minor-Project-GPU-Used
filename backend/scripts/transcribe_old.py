"""
import sys
import json
from faster_whisper import WhisperModel

audio_path = sys.argv[1]

model = WhisperModel(
    "tiny",          # or "base" / "small"
    device="cuda",
    compute_type="float16"
)

segments, info = model.transcribe(audio_path)

full_text = []
segment_list = []

for seg in segments:
    full_text.append(seg.text)
    segment_list.append({
        "text": seg.text,
        "start": float(seg.start),
        "end": float(seg.end)
    })

result = {
    "transcript": " ".join(full_text).strip(),
    "segments": segment_list
}

# 🔴 IMPORTANT: print ONLY JSON
print(json.dumps(result, ensure_ascii=False))
"""