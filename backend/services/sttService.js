const axios = require("axios");
const {
  tryCaptions,
  downloadAudio,
  extractVideoId,
} = require("./youtubeService");

/**
 * Main entry: Try captions first, else fallback to GPU Whisper service
 */
async function transcribeFromYoutube(url) {
  console.time("[transcribeFromYoutube] Total");

  // 1️⃣ Try YouTube auto-captions first
  const cap = await tryCaptions(url);

  if (cap && cap.text) {
    console.log(
      `[transcribeFromYoutube] Using auto-captions (length: ${cap.text.length})`
    );

    const sentences = cap.text.split(/(?<=[.!?])\s+/).filter(Boolean);

    const segments = sentences.map((t, i) => ({
      text: t,
      start: i * 5,
      end: (i + 1) * 5,
    }));

    console.timeEnd("[transcribeFromYoutube] Total");
    return {
      transcript: cap.text,
      segments,
    };
  }

  // 2️⃣ Fallback to GPU Whisper
  console.log(
    "[transcribeFromYoutube] Auto-captions not found, falling back to Whisper service."
  );

  console.time("[downloadAudio]");
  const { audioPath } = await downloadAudio(url);
  console.timeEnd("[downloadAudio]");
  console.log(`[transcribeFromYoutube] Audio downloaded → ${audioPath}`);

  console.time("[runLocalWhisper]");
  const result = await runLocalWhisper(audioPath);
  console.timeEnd("[runLocalWhisper]");

  console.log(
    `[transcribeFromYoutube] Whisper transcription complete (length: ${result.transcript.length})`
  );

  console.timeEnd("[transcribeFromYoutube] Total");
  return result;
}

/**
 * Calls Python Whisper GPU service via HTTP
 * (NO spawn, NO CUDA crashes)
 */
async function runLocalWhisper(audioPath) {
  try {
    const res = await axios.post(
      "http://127.0.0.1:8001/transcribe",
      {
        audio_path: audioPath,
      },
      {
        timeout: 0, // allow long GPU jobs
      }
    );

    return res.data;
  } catch (err) {
    console.error("[Whisper Service Error]");
    if (err.response) {
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }
    throw err;
  }
}

module.exports = {
  transcribeFromYoutube,
  extractVideoId,
};
