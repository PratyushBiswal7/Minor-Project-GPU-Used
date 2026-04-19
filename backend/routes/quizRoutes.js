const express = require("express");
const router = express.Router();
const Video = require("../models/Video");

router.get("/:quizId", async (req, res) => {
  try {
    const video = await Video.findOne({
      quizId: req.params.quizId,
    });

    if (!video) {
      return res.status(404).json({
        error: "Quiz not found",
      });
    }

    res.json(video.quiz);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});

module.exports = router;
