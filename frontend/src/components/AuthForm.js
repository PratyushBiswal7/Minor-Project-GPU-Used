import React, { useState } from "react";
import api from "../api/axiosClient";

export default function AuthForm({ mode = "login", onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", data.token);
        onSuccess && onSuccess();
      } else {
        await api.post("/auth/signup", { email, password, name });
        onSuccess && onSuccess(); // Call parent's onSuccess to alert and toggle
      }
    } catch (e) {
      alert("Auth failed");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 320,
      }}
    >
      {!isLogin && (
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button disabled={loading}>
        {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
      </button>
    </form>
  );
}
