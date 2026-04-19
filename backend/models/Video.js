const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema(
  {
    question: String,
    options: [String],
    correctIndex: Number,
    explanation: String,
  },
  { _id: false },
);

const SegmentSchema = new mongoose.Schema(
  {
    text: String,
    start: Number,
    end: Number,
  },
  { _id: false },
);

const VideoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    videoUrl: {
      type: String,
      required: true,
    },

    videoId: {
      type: String,
      index: true,
    },

    name: String,

    transcript: String,

    segments: [SegmentSchema],

    summary: String,

    quiz: [QuizSchema],

    summarySize: {
      type: String,
      enum: ["short", "medium", "detailed"],
      default: "medium",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    quizId: {
      type: String,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Video", VideoSchema);
