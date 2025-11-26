const { tryCaptions, downloadAudio } = require("./youtubeService");
const { spawn } = require("child_process");

async function transcribeFromYoutube(url) {
  console.time(`[transcribeFromYoutube] Total`);
  const cap = await tryCaptions(url);

  if (cap && cap.text) {
    console.log(
      `[transcribeFromYoutube] Using auto-captions for ${url} (length: ${cap.text.length})`
    );
    const sentences = cap.text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const segments = sentences.map((t, i) => ({
      text: t,
      start: i * 5,
      end: (i + 1) * 5,
    }));
    console.timeEnd(`[transcribeFromYoutube] Total`);
    return { transcript: cap.text, segments };
  }

  console.log(
    `[transcribeFromYoutube] Auto-captions not found, falling back to Whisper.`
  );
  console.time(`[downloadAudio]`);
  const { audioPath } = await downloadAudio(url);
  console.timeEnd(`[downloadAudio]`);
  console.log(`[transcribeFromYoutube] Audio downloaded to ${audioPath}`);

  console.time(`[runLocalWhisper]`);
  const result = await runLocalWhisper(audioPath);
  console.timeEnd(`[runLocalWhisper]`);
  console.log(
    `[transcribeFromYoutube] Whisper transcription complete (length: ${result.transcript.length})`
  );

  console.timeEnd(`[transcribeFromYoutube] Total`);
  return result;
}

function runLocalWhisper(audioPath) {
  console.log(`[runLocalWhisper] Starting Whisper for ${audioPath}`);
  return new Promise((resolve, reject) => {
    const py = spawn("python", ["scripts/transcribe.py", audioPath], {
      cwd: process.cwd(),
    });
    let out = "",
      err = "";
    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));
    py.on("close", (code) => {
      if (code !== 0) {
        console.error(`[runLocalWhisper] Error:`, err || "Whisper failed");
        return reject(new Error(err || "Whisper failed"));
      }
      try {
        const json = JSON.parse(out);
        console.log(
          `[runLocalWhisper] JSON received, segments: ${
            json.segments ? json.segments.length : "N/A"
          }`
        );
        resolve(json);
      } catch (e) {
        console.error(`[runLocalWhisper] JSON parse error:`, e);
        reject(e);
      }
    });
  });
}

module.exports = {
  transcribeFromYoutube,
  extractVideoId: require("./youtubeService").extractVideoId,
};
