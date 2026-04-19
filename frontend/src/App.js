import React, { useEffect, useState } from "react";
import api from "./api/axiosClient";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SharedQuiz from "./pages/SharedQuiz";

import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return setAuthed(false);

      try {
        const { data } = await api.get("/auth/me");

        setUserName(data.user?.name || data.user?.email || "");
        setAuthed(true);
      } catch (_e) {
        localStorage.removeItem("token");
        setAuthed(false);
      }
    })();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Shared quiz page (public) */}
        <Route path="/quiz/:quizId" element={<SharedQuiz />} />

        {/* Main app */}
        <Route
          path="/"
          element={
            !authed ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 40,
                  marginTop: 80,
                }}
              >
                <div style={{ width: 200 }}>
                  <Login onAuthSuccess={() => setAuthed(true)} />
                </div>
              </div>
            ) : (
              <Dashboard
                userName={userName}
                onLogout={() => setAuthed(false)}
              />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
