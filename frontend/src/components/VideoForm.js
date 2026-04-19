import React, { useState } from "react";
import api from "../api/axiosClient";

export default function VideoForm({ onResult }) {
  const [url, setUrl] = useState("");
  const [summarySize, setSummarySize] = useState("medium");
  const [difficulty, setDifficulty] = useState("medium");

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    onResult(null);

    try {
      setStatus("Transcribing & summarizing...");

      const { data } = await api.post("/video/process", {
        videoUrl: url,
        summarySize,
        difficulty,
      });

      onResult(data);
      setStatus("Done");
    } catch (e) {
      console.error(e.response?.data || e.message);

      setStatus("");
      alert(
        "Processing failed: " + (e.response?.data?.error || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <form
        onSubmit={submit}
        style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
      >
        <input
          type="url"
          placeholder="YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{ flexGrow: 1, padding: "8px" }}
          disabled={loading}
        />

        {/* Summary Size */}

        <select
          value={summarySize}
          onChange={(e) => setSummarySize(e.target.value)}
          disabled={loading}
        >
          <option value="short">Short Summary</option>
          <option value="medium">Medium Summary</option>
          <option value="detailed">Detailed Summary</option>
        </select>

        {/* Quiz Difficulty */}

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          disabled={loading}
        >
          <option value="easy">Easy Quiz</option>
          <option value="medium">Medium Quiz</option>
          <option value="hard">Hard Quiz</option>
        </select>

        <button disabled={loading || !url.trim()}>
          {loading ? "Processing..." : "Summarize & Quiz"}
        </button>
      </form>

      {status && <p style={{ marginTop: 10 }}>{status}</p>}
    </div>
  );
}
