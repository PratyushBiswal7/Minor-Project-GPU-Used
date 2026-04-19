import React, { useState } from "react";
import api from "../api/axiosClient";

export default function ChatBot({ context }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendQuestion = async () => {
    if (!question.trim() || loading) return;

    const userMsg = { type: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    setQuestion("");

    try {
      const { data } = await api.post("/chat", {
        question,
        context,
      });

      const botMsg = { type: "bot", text: data.answer };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error getting answer 😢" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Ask Doubts 🤖</h3>

      <div
        style={{
          border: "1px solid #ccc",
          padding: 10,
          height: 200,
          overflowY: "auto",
          marginBottom: 10,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.type === "user" ? "right" : "left",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                background: m.type === "user" ? "#d0e8ff" : "#eee",
                padding: "6px 10px",
                borderRadius: 6,
                display: "inline-block",
              }}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something..."
          style={{ flex: 1, padding: 8, resize: "none" }}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendQuestion();
            }
          }}
        />

        <button onClick={sendQuestion} disabled={loading}>
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </div>
  );
}
