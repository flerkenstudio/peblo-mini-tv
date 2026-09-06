import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui";

export default function Login() {
  const { login, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, show logged-in state with redirect option
  if (isAuthenticated && user) {
    return (
      <div className="login-page">
        <header className="login-header">
          <Link to="/" className="brand" aria-label="Peblo Mini TV home">
            <span className="brand-mark">P</span>
            <span className="brand-text">PEBLO</span>
            <span className="brand-sub">MINI TV</span>
          </Link>
        </header>

        <main className="login-main">
          <div className="login-card logged-in-card">
            <div className="user-avatar-large">
              {user.name ? user.name.charAt(0) : "U"}
            </div>
            <h2>Already Signed In</h2>
            <p className="logged-in-email">{user.email}</p>
            <span className="logged-in-role">Role: {user.role.toUpperCase()}</span>

            <div className="logged-in-actions">
              <Button variant="primary" onClick={() => navigate(redirect)}>
                Continue Watching
              </Button>
              <Button onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirect);
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" className="brand" aria-label="Peblo Mini TV home">
          <span className="brand-mark">P</span>
          <span className="brand-text">PEBLO</span>
          <span className="brand-sub">MINI TV</span>
        </Link>
        <Link to="/" className="login-header-link">
          Browse Preview
        </Link>
      </header>

      <main className="login-main">
        <div className="login-card">
          <h1>Sign In</h1>

          {error && (
            <div className="login-error-banner" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email or username</label>
              <input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? "Signing In…" : "Sign In"}
            </Button>

            <div className="login-help-row">
              <label className="remember-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <span className="need-help-link">Need help?</span>
            </div>
          </form>

          <div className="login-card-footer">
            <p className="signup-prompt">
              New to Peblo Mini TV?{" "}
              <Link to="/">Explore free preview without signing in</Link>
            </p>
            <p className="recaptcha-notice">
              This page is protected by Google reCAPTCHA to ensure you're not a bot.
            </p>
          </div>
        </div>
      </main>

      <footer className="login-footer">
        <div className="login-footer-inner">
          <p className="footer-contact">Questions? Call 000-800-919-1694</p>
          <div className="footer-links-grid">
            <Link to="/">FAQ</Link>
            <Link to="/">Help Centre</Link>
            <Link to="/">Terms of Use</Link>
            <Link to="/">Privacy Policy</Link>
            <Link to="/">Cookie Preferences</Link>
            <Link to="/">Corporate Information</Link>
          </div>
          <p className="footer-copyright">© 2026 Peblo Mini TV, Inc.</p>
        </div>
      </footer>
    </div>
  );
}
