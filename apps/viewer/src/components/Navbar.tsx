import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./ui";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close user menu on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === "/search") {
      setSearchOpen(true);
      const q = new URLSearchParams(location.search).get("q") || "";
      setQuery(q);
    }
  }, [location.pathname, location.search]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate("/search");
    }
  };

  const isActive = (path: string, section?: string) => {
    if (section) {
      return location.pathname === "/search" && new URLSearchParams(location.search).get("section") === section;
    }
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname === path && !new URLSearchParams(location.search).get("section");
  };

  // Don't show redundant nav links on /login
  const isLoginPage = location.pathname === "/login";

  return (
    <header className={`top-nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Peblo home">
          <span className="brand-text" style={{ color: "var(--purple-vibrant)", fontFamily: "var(--font-heading)", textTransform: "none", letterSpacing: "0", fontSize: "28px" }}>Peblo</span>
        </Link>

        {!isLoginPage && (
          <nav className="nav-links">
            <Link className={isActive("/") ? "active" : ""} to="/">
              Home
            </Link>
            <Link
              className={isActive("/search", "series") ? "active" : ""}
              to="/search?section=series"
            >
              Series
            </Link>
            <Link
              className={isActive("/search", "minisodes") ? "active" : ""}
              to="/search?section=minisodes"
            >
              Minisodes
            </Link>
            <Link
              className={isActive("/search", "songs") ? "active" : ""}
              to="/search?section=songs"
            >
              Songs
            </Link>
            <Link
              className={isActive("/search") ? "active" : ""}
              to="/search"
            >
              Browse All
            </Link>
          </nav>
        )}

        <div className="nav-right">
          {!isLoginPage && (
            searchOpen ? (
              <form className="nav-search" onSubmit={submit}>
                <Icon name="search" size={18} />
                <input
                  autoFocus={location.pathname === "/search"}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (location.pathname === "/search") {
                      navigate(`/search?q=${encodeURIComponent(e.target.value)}`, { replace: true });
                    }
                  }}
                  placeholder="Titles, categories, tags…"
                />
                {query && (
                  <button
                    type="button"
                    className="nav-search-clear"
                    onClick={() => {
                      setQuery("");
                      if (location.pathname === "/search") navigate("/search", { replace: true });
                    }}
                    aria-label="Clear search"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </form>
            ) : (
              <button
                className="icon-button"
                aria-label="Search"
                onClick={() => {
                  setSearchOpen(true);
                  navigate("/search");
                }}
              >
                <Icon name="search" size={20} />
              </button>
            )
          )}

          {isAuthenticated && user ? (
            <div className="user-nav-wrap" ref={menuRef}>
              <button
                className="profile-dot-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="User Account Menu"
                aria-expanded={menuOpen}
              >
                <span className="profile-dot">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </span>
              </button>

              {menuOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user.name || user.email.split("@")[0]}</div>
                    <div className="user-dropdown-email">{user.email}</div>
                    <span className="user-role-badge">{user.role.toUpperCase()}</span>
                  </div>
                  <div className="user-dropdown-divider" />
                  <button
                    className="user-dropdown-item signout-item"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                  >
                    Sign Out of Peblo
                  </button>
                </div>
              )}
            </div>
          ) : (
            !isLoginPage && (
              <Link
                to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                className="nav-signin-pill"
              >
                Sign In
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
