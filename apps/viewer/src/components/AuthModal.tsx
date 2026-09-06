import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Icon } from "./ui";

interface AuthModalProps {
  episodeTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ episodeTitle, onClose, onSuccess }: AuthModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Sign in failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
          <Icon name="close" size={20} />
        </button>

        <div className="auth-modal-header">
          <div className="auth-modal-icon">
            <Icon name="play" size={24} />
          </div>
          <h2>Sign In to Watch</h2>
          <p>
            {episodeTitle ? (
              <>
                Streaming <strong>"{episodeTitle}"</strong> requires a free Peblo account.
              </>
            ) : (
              "Sign in to stream full episodes and track your watch history."
            )}
          </p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form className="auth-modal-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="modal-email">Email Address</label>
            <input
              id="modal-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="modal-password">Password</label>
            <input
              id="modal-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button type="submit" variant="primary" className="auth-modal-submit" disabled={loading}>
            {loading ? "Signing In…" : "Sign In & Play"}
          </Button>
        </form>

        <div className="auth-modal-footer">
          <span>Need a full screen experience?</span>
          <Link to="/login" onClick={onClose}>
            Go to Sign In Page →
          </Link>
        </div>
      </div>
    </div>
  );
}
