import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("admin@peblo.tv");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
      nav("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cms-login-wrap">
      <div className="cms-login-card">
        <h1>Peblo Mini TV — CMS</h1>
        <form onSubmit={submit} className="cms-form-group">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="cms-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="cms-input"
          />
          <button className="cms-btn" disabled={submitting}>{submitting ? "Signing in…" : "Login"}</button>
          {error && <div className="cms-alert error">{error}</div>}
        </form>
        <p className="cms-hint">
          Seed accounts: admin@peblo.tv / admin123 &nbsp;·&nbsp; editor@peblo.tv / editor123
        </p>
      </div>
    </div>
  );
}
