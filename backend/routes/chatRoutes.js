const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL = "gemini-2.5-flash";

// ✅ FIXED HERE
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

router.post("/", async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    const model = genAI.getGenerativeModel({
      model: MODEL,
    });

    const prompt = `
You are an AI tutor 🤖.

Answer the question based on the context below.
If answer not in context, still try to help simply.

Context:
${context || "No context provided"}

Question:
${question}
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ answer: response });
  } catch (err) {
    console.error("Gemini Error:", err.message);
    res.status(500).json({ error: "Chat failed" });
  }
});

module.exports = router;
