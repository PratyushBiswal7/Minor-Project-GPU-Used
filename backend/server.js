const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const videoRoutes = require("./routes/videoRoutes");
const quizRoutes = require("./routes/quizRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/temp", express.static("temp"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((e) => console.error("Mongo error", e));

app.use("/api/auth", authRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/chat", chatRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
