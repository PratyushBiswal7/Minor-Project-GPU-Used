const gTTS = require("gtts");
const path = require("path");
const fs = require("fs");

function generateSpeech(text) {
  return new Promise((resolve, reject) => {
    const filename = `summary_${Date.now()}.mp3`;

    const filePath = path.join(__dirname, "../temp", filename);

    const tts = new gTTS(text, "en");

    tts.save(filePath, (err) => {
      if (err) return reject(err);

      resolve(`temp/${filename}`);
    });
  });
}

module.exports = { generateSpeech };
