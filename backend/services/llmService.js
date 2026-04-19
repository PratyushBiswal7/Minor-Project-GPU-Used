const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!API_KEY) {
  console.error("Missing GOOGLE_API_KEY in env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

/*
========================================
SUMMARY GENERATION
Supports summary size:
short | medium | detailed
========================================
*/

async function summarizeText(text, size = "medium") {
  console.time(`[summarizeText]`);
  console.log(
    `[summarizeText] Calling Gemini with input length: ${text.length}`,
  );

  const model = genAI.getGenerativeModel({ model: MODEL });

  let instruction;

  if (size === "short") {
    instruction = "Summarize in 5 concise bullet points within 80 words.";
  } else if (size === "detailed") {
    instruction =
      "Provide a detailed explanation summary in 150-200 words with clear bullet points.";
  } else {
    instruction = "Summarize clearly in 8-12 bullet points within 160 words.";
  }

  const prompt = `
You are an assistant summarizing educational transcripts.

${instruction}

Focus on:
- definitions
- key steps
- examples
- important takeaways

Transcript:
"""${text}"""

Summary:
`;

  const res = await model.generateContent(prompt);

  const output = res.response.text();

  console.log(`[summarizeText] Output length: ${output.length}`);
  console.timeEnd(`[summarizeText]`);

  return output;
}

/*
========================================
QUIZ GENERATION
Creates 5 MCQ questions
========================================
*/

async function generateQuizFromSummary(summary) {
  console.time(`[generateQuizFromSummary]`);

  console.log(
    `[generateQuizFromSummary] Calling Gemini with summary length: ${summary.length}`,
  );

  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `
From the summary below, create exactly 5 multiple-choice questions.

Return STRICT JSON array with this schema:

[
  {
    "question":"string",
    "options":["A","B","C","D"],
    "correctIndex":0,
    "explanation":"string"
  }
]

Rules:
- Exactly 5 questions
- 4 options each
- One correct answer
- No ambiguity

Summary:
"""${summary}"""

JSON:
`;

  const res = await model.generateContent(prompt);

  const output = res.response.text();

  console.log(`[generateQuizFromSummary] Output length: ${output.length}`);
  console.timeEnd(`[generateQuizFromSummary]`);

  return output;
}

module.exports = {
  summarizeText,
  generateQuizFromSummary,
};
