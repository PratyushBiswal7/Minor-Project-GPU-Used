const Video = require("../models/Video");
const {
  transcribeFromYoutube,
  extractVideoId,
} = require("../services/sttService");
const {
  summarizeText,
  generateQuizFromSummary,
} = require("../services/llmService");
const { safeParseQuiz } = require("../services/parserService");
const { chunkByLength } = require("../utils/chunker");
const { getYoutubeTitle } = require("../services/youtubeService");

const MAX_SUMMARY_CHARS = parseInt(process.env.MAX_SUMMARY_CHARS || "4000", 10);

exports.processVideo = async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const userId = req.user?.userId;
    if (!videoUrl) return res.status(400).json({ error: "videoUrl required" });
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Start overall timer
    console.time(`[processVideo] ${videoUrl}`);

    // Check and report cache hit
    const cached = await Video.findOne({ userId, videoUrl });
    if (cached) {
      console.log(`[processVideo] Cache hit for ${videoUrl}`);
      console.timeEnd(`[processVideo] ${videoUrl}`);
      return res.json(cached);
    }

    // Title retrieval
    console.time(`[getYoutubeTitle]`);
    const name = await getYoutubeTitle(videoUrl);
    console.timeEnd(`[getYoutubeTitle]`);
    console.log(`[getYoutubeTitle] Title: ${name}`);

    // Transcription
    console.time(`[transcribeFromYoutube]`);
    const { transcript, segments } = await transcribeFromYoutube(videoUrl);
    console.timeEnd(`[transcribeFromYoutube]`);
    console.log(
      `[transcribeFromYoutube] Transcript length: ${transcript.length}`
    );

    // Chunking
    const chunks = chunkByLength(transcript, MAX_SUMMARY_CHARS);
    console.log(
      `[chunkByLength] Chunks count: ${chunks.length}, max chars per chunk: ${MAX_SUMMARY_CHARS}`
    );

    // Summarizing each chunk
    const partials = [];
    for (let i = 0; i < chunks.length; i++) {
      console.time(`[summarizeText] chunk ${i + 1}`);
      const summary = await summarizeText(chunks[i]);
      console.timeEnd(`[summarizeText] chunk ${i + 1}`);
      console.log(
        `[summarizeText] Chunk ${i + 1} summary length: ${summary.length}`
      );
      partials.push(summary);
    }

    // Final combine step if more than one chunk
    let summary = partials.join("\n");
    if (partials.length > 1) {
      console.time(`[summarizeText] combine`);
      summary = await summarizeText(
        `Combine these partial summaries into one concise summary within 180 words:\n${summary}`
      );
      console.timeEnd(`[summarizeText] combine`);
      console.log(`[summarizeText] Combined summary length: ${summary.length}`);
    }

    // Quiz generation
    console.time(`[generateQuizFromSummary]`);
    const quizRaw = await generateQuizFromSummary(summary);
    console.timeEnd(`[generateQuizFromSummary]`);
    console.log(`[generateQuizFromSummary] Raw quiz length: ${quizRaw.length}`);

    // Quiz parsing
    console.time(`[safeParseQuiz]`);
    const quiz = safeParseQuiz(quizRaw).slice(0, 5);
    console.timeEnd(`[safeParseQuiz]`);
    console.log(`[safeParseQuiz] Final quiz questions count: ${quiz.length}`);

    // Database save
    console.time(`[Video.create]`);
    const saved = await Video.create({
      userId,
      videoUrl,
      videoId: extractVideoId(videoUrl),
      name,
      transcript,
      segments,
      summary,
      quiz,
    });
    console.timeEnd(`[Video.create]`);

    // End overall timer
    console.timeEnd(`[processVideo] ${videoUrl}`);
    return res.json(saved);
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "Processing failed", detail: String(e).slice(0, 200) });
  }
};

exports.history = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const items = await Video.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(items);
  } catch (e) {
    return res.status(500).json({ error: "Failed to load history" });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const video = await Video.findOneAndDelete({ _id: id, userId });
    if (!video) return res.status(404).json({ error: "Not found" });

    return res.json({ message: "Deleted" });
  } catch (e) {
    return res.status(500).json({ error: "Delete failed" });
  }
};
