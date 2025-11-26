const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

function runYtDlp(args) {
  console.log(`[runYtDlp] Command: yt-dlp ${args.join(' ')}`);
  console.time(`[runYtDlp] ${args[0]}`);
  return new Promise((resolve, reject) => {
    execFile("yt-dlp", args, (err, stdout, stderr) => {
      console.timeEnd(`[runYtDlp] ${args[0]}`);
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

  console.time(`[tryCaptions] ${id}`);
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
      console.timeEnd(`[tryCaptions] ${id}`);
      const vtt = fs.readFileSync(vttPath, "utf8");
      const text = vtt
        .replace(/^WEBVTT.*$/gim, "")
        .replace(
          /\d{2,}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2,}:\d{2}:\d{2}\.\d{3}/g,
          ""
        )
        .replace(/^\d+$/gm, "")
        .replace(/\s+/g, " ")
        .trim();
      console.log(`[tryCaptions] Auto-captions found for ${id}, length: ${text.length}`);
      return { text };
    } else {
      console.log(`[tryCaptions] No auto-captions found for ${id}.`);
    }
  } catch (e) {
    console.error(`[tryCaptions] Error for ${id}`, e);
  }
  console.timeEnd(`[tryCaptions] ${id}`);
  return null;
}

async function downloadAudio(url) {
  const id = extractVideoId(url);
  const outDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const audioPath = path.join(outDir, `${id}.m4a`);
  console.time(`[downloadAudio] ${id}`);
  await runYtDlp(["-x", "--audio-format", "m4a", "-o", audioPath, url]);
  console.timeEnd(`[downloadAudio] ${id}`);
  console.log(`[downloadAudio] Audio saved to: ${audioPath}`);
  return { audioPath };
}

async function getYoutubeTitle(url) {
  try {
    console.time(`[getYoutubeTitle]`);
    const title = await runYtDlp(["--get-title", url]);
    console.timeEnd(`[getYoutubeTitle]`);
    console.log(`[getYoutubeTitle] Title: ${title.trim()}`);
    return title.trim();
  } catch (e) {
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
