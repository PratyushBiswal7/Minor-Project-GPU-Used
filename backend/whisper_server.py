from fastapi import FastAPI
import uvicorn
from faster_whisper import WhisperModel
from pydantic import BaseModel

app = FastAPI()

# Load model ONCE (GPU stays initialized)
model = WhisperModel(
    "tiny",
    device="cuda",
    compute_type="float16"
)

class TranscribeRequest(BaseModel):
    audio_path: str

@app.post("/transcribe")
def transcribe(req: TranscribeRequest):
    segments, info = model.transcribe(req.audio_path)

    text = []
    segs = []

    for s in segments:
        text.append(s.text)
        segs.append({
            "text": s.text,
            "start": float(s.start),
            "end": float(s.end)
        })

    return {
        "transcript": " ".join(text).strip(),
        "segments": segs
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
