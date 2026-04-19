import React, { useState } from "react";

export default function ResultView({ item }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleAnswer = (qIdx, optionIdx) => {
    if (submitted) return;
    setAnswers({ ...answers, [qIdx]: optionIdx });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(item.shareLink);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const score = Object.entries(answers).reduce((acc, [qIdx, optionIdx]) => {
    if (item.quiz[qIdx] && optionIdx === item.quiz[qIdx].correctIndex) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const isAllAnswered = item.quiz.length === Object.keys(answers).length;

  return (
    <section style={{ marginTop: 20 }}>
      {/* SUMMARY */}
      <h3>Summary</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{item.summary}</p>

      {/* AUDIO */}
      {item.ttsAudio && (
        <>
          <h3>Listen to Summary</h3>
          <audio controls src={`http://localhost:5000/${item.ttsAudio}`} />
        </>
      )}

      {/* PDF */}
      {item.pdf && (
        <>
          <h3>Download Notes</h3>
          <a
            href={`http://localhost:5000/${item.pdf}`}
            target="_blank"
            rel="noreferrer"
          >
            Download PDF Notes
          </a>
        </>
      )}

      {/* SHARE QUIZ */}
      {item.shareLink && (
        <>
          <h3>Share Quiz</h3>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={item.shareLink}
              readOnly
              style={{ flex: 1, padding: 6 }}
            />

            <button onClick={copyLink}>Copy</button>
          </div>

          {copied && (
            <p style={{ color: "green", marginTop: 6 }}>
              Link copied to clipboard!
            </p>
          )}
        </>
      )}

      {/* QUIZ */}
      <h3>Quiz Questions</h3>

      {item.quiz && item.quiz.length ? (
        <>
          <ol style={{ paddingLeft: 20 }}>
            {item.quiz.map((q, idx) => (
              <li key={idx} style={{ marginBottom: 15 }}>
                <p>
                  <strong>{q.question}</strong>
                </p>

                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                  {q.options.map((opt, i) => (
                    <li
                      key={i}
                      onClick={() => handleAnswer(idx, i)}
                      style={{
                        cursor: submitted ? "default" : "pointer",
                        fontWeight: answers[idx] === i ? "bold" : "normal",
                        color: submitted
                          ? i === q.correctIndex
                            ? "green"
                            : answers[idx] === i
                              ? "red"
                              : "inherit"
                          : "inherit",
                        backgroundColor: !submitted
                          ? answers[idx] === i
                            ? "#d0e8ff"
                            : "#f5f5f5"
                          : "transparent",
                        padding: "6px 10px",
                        borderRadius: 4,
                        marginBottom: 6,
                      }}
                    >
                      {opt}
                    </li>
                  ))}
                </ul>

                {submitted && q.explanation && (
                  <p style={{ fontStyle: "italic", color: "#555" }}>
                    Explanation: {q.explanation}
                  </p>
                )}
              </li>
            ))}
          </ol>

          {!submitted && (
            <button
              onClick={() => setSubmitted(true)}
              disabled={!isAllAnswered}
            >
              Submit Quiz
            </button>
          )}

          {submitted && (
            <p>
              Your score: {score} / {item.quiz.length}
            </p>
          )}
        </>
      ) : (
        <p>No quiz available.</p>
      )}
    </section>
  );
}
