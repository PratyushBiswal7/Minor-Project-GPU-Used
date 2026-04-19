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
const { getYoutubeTitle } = require("../services/youtubeService");

const { generateSpeech } = require("../services/ttsService");
const { generatePDF } = require("../services/pdfService");

exports.processVideo = async (req, res) => {
  try {
    const {
      videoUrl,
      summarySize = "medium",
      difficulty = "medium",
    } = req.body;

    const userId = req.user?.userId;

    if (!videoUrl) return res.status(400).json({ error: "videoUrl required" });

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    console.time(`[processVideo] ${videoUrl}`);

    const videoId = extractVideoId(videoUrl);

    // CACHE CHECK (faster now)
    const cached = await Video.findOne({ videoId });

    if (cached) {
      console.log(`[processVideo] Cache hit for ${videoUrl}`);
      console.timeEnd(`[processVideo] ${videoUrl}`);

      return res.json({
        ...cached.toObject(),
        shareLink: `http://localhost:3000/quiz/${cached.quizId}`,
      });
    }

    // GET TITLE
    console.time(`[getYoutubeTitle]`);
    const name = await getYoutubeTitle(videoUrl);
    console.timeEnd(`[getYoutubeTitle]`);

    console.log(`[getYoutubeTitle] Title: ${name}`);

    // TRANSCRIPTION
    console.time(`[transcribeFromYoutube]`);
    const { transcript, segments } = await transcribeFromYoutube(videoUrl);
    console.timeEnd(`[transcribeFromYoutube]`);

    console.log(
      `[transcribeFromYoutube] Transcript length: ${transcript.length}`,
    );

    // LIMIT TRANSCRIPT SIZE (very important for speed)
    const trimmedTranscript = transcript.slice(0, 12000);

    // FAST SUMMARIZATION (single AI call)
    console.time(`[summarizeText]`);

    const summary = await summarizeText(trimmedTranscript, summarySize);

    console.timeEnd(`[summarizeText]`);

    // GENERATE QUIZ
    console.time(`[generateQuizFromSummary]`);

    const quizRaw = await generateQuizFromSummary(summary, difficulty);

    console.timeEnd(`[generateQuizFromSummary]`);

    const quiz = safeParseQuiz(quizRaw).slice(0, 5);

    console.log(`[safeParseQuiz] Final quiz questions count: ${quiz.length}`);

    // TEXT TO SPEECH
    console.time(`[generateSpeech]`);

    const audioPath = await generateSpeech(summary);

    console.timeEnd(`[generateSpeech]`);

    // GENERATE PDF
    console.time(`[generatePDF]`);

    const pdfPath = await generatePDF(summary, quiz);

    console.timeEnd(`[generatePDF]`);

    // UNIQUE QUIZ ID
    const quizId = Date.now().toString();

    // SAVE TO DATABASE
    console.time(`[Video.create]`);

    const saved = await Video.create({
      userId,
      videoUrl,
      videoId,
      name,
      transcript,
      segments,
      summary,
      quiz,
      quizId,
      summarySize,
      difficulty,
    });

    console.timeEnd(`[Video.create]`);

    const shareLink = `http://localhost:3000/quiz/${quizId}`;

    console.timeEnd(`[processVideo] ${videoUrl}`);

    return res.json({
      ...saved.toObject(),
      ttsAudio: audioPath,
      pdf: pdfPath,
      shareLink,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      error: "Processing failed",
      detail: String(e).slice(0, 200),
    });
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
    return res.status(500).json({
      error: "Failed to load history",
    });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const video = await Video.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!video) return res.status(404).json({ error: "Not found" });

    return res.json({ message: "Deleted" });
  } catch (e) {
    return res.status(500).json({ error: "Delete failed" });
  }
};
