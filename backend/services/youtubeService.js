const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

function runYtDlp(args) {
  const label = `[runYtDlp-${args[0]}-${Date.now()}]`;

  console.log(`[runYtDlp] Command: yt-dlp ${args.join(" ")}`);
  console.time(label);

  return new Promise((resolve, reject) => {
    execFile("yt-dlp", args, (err, stdout, stderr) => {
      console.timeEnd(label);

      if (err) {
        console.error(`[runYtDlp] Error:`, stderr || err);
        return reject(stderr || err);
      }

      console.log(`[runYtDlp] Success - Output length: ${stdout.length}`);
      resolve(stdout);
    });
  });
}

function extractVideoId(url) {
  const m = url.match(/v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  const id = m ? m[1] : null;
  console.log(`[extractVideoId] URL: ${url}, ID: ${id}`);
  return id;
}

async function tryCaptions(url) {
  const id = extractVideoId(url);
  const outDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const base = path.join(outDir, id);
  const vttPath = `${base}.en.vtt`;

  const label = `[tryCaptions-${id}-${Date.now()}]`;
  console.time(label);

  try {
    await runYtDlp([
      "--write-auto-subs",
      "--sub-lang",
      "en",
      "--skip-download",
      "-o",
      base,
      url,
    ]);

    if (fs.existsSync(vttPath)) {
      const vtt = fs.readFileSync(vttPath, "utf8");

      const text = vtt
        .replace(/^WEBVTT.*$/gim, "")
        .replace(
          /\d{2,}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2,}:\d{2}:\d{2}\.\d{3}/g,
          "",
        )
        .replace(/^\d+$/gm, "")
        .replace(/\s+/g, " ")
        .trim();

      console.log(
        `[tryCaptions] Auto-captions found for ${id}, length: ${text.length}`,
      );

      console.timeEnd(label);
      return { text };
    } else {
      console.log(`[tryCaptions] No auto-captions found for ${id}.`);
    }
  } catch (e) {
    console.error(`[tryCaptions] Error for ${id}`, e);
  }

  console.timeEnd(label);
  return null;
}

async function downloadAudio(url) {
  const id = extractVideoId(url);
  const outDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const audioPath = path.join(outDir, `${id}.m4a`);

  const label = `[downloadAudio-${id}-${Date.now()}]`;
  console.time(label);

  await runYtDlp(["-x", "--audio-format", "m4a", "-o", audioPath, url]);

  console.timeEnd(label);
  console.log(`[downloadAudio] Audio saved to: ${audioPath}`);

  return { audioPath };
}

async function getYoutubeTitle(url) {
  const label = `[getYoutubeTitle-${Date.now()}]`;

  try {
    console.time(label);

    const title = await runYtDlp(["--get-title", url]);

    console.timeEnd(label);

    return title.trim();
  } catch (e) {
    console.timeEnd(label); // important to avoid missing label warning
    console.error(`[getYoutubeTitle] Error`, e);
    return "";
  }
}

module.exports = {
  extractVideoId,
  tryCaptions,
  downloadAudio,
  getYoutubeTitle,
};
