import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import { Button, Empty, Icon, Loading, PageShell } from "../components/ui";

export default function ShowDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [show, setShow] = useState<any>(null);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [season, setSeason] = useState<number | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const [activePlayback, setActivePlayback] = useState<{
    episode: any;
    isPlaying: boolean;
    progress: number;
    videoEnded?: boolean;
  } | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingEpisode, setPendingEpisode] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => {
        if (!r.ok) throw new Error("Catalog fetch failed");
        return r.json();
      })
      .then((c) => {
        const s = c.sections.flatMap((sec: any) => sec.shows).find((x: any) => x.id === Number(id));
        if (!s) {
          setState("error");
          return;
        }
        setShow(s);
        // Exclude Season 0 (trailers)
        const playableSeasons = (s.seasons || []).filter((sn: any) => sn.season_number > 0);
        setSeason(playableSeasons[0]?.season_number ?? s.seasons[0]?.season_number ?? 1);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [id]);

  // Exclude Season 0 (trailers) strictly from episode listings
  const availableSeasons = useMemo(() => {
    if (!show?.seasons) return [];
    return show.seasons.filter((s: any) => s.season_number > 0);
  }, [show]);

  const eps = useMemo(() => {
    if (!show || season === null) return [];
    return availableSeasons.find((x: any) => x.season_number === season)?.episodes ?? [];
  }, [show, season, availableSeasons]);

  const languages: string[] = useMemo(() => {
    const list = eps.flatMap((e: any) => (e.languages || []) as string[]);
    return Array.from(new Set<string>(list));
  }, [eps]);

  useEffect(() => {
    if (languages.length && (!lang || !languages.includes(lang))) {
      setLang(languages[0]);
    }
  }, [languages, lang]);

  if (state === "loading") return <Loading />;
  if (state === "error" || !show) {
    return (
      <PageShell>
        <Empty
          title="Show not found"
          msg="This title isn't available in the published catalogue."
          actionText="Back to Home"
          onAction={() => navigate("/")}
        />
      </PageShell>
    );
  }

  const bannerImg = show.banner || show.thumbnail || show.poster;
  const posterImg = show.poster || show.thumbnail;

  const handleStartEpisode = (ep: any, bypassAuthCheck: boolean = false) => {
    // Episode 1 (S1:E1) is free to preview for everyone!
    // Episode 2 and beyond require authentication.
    const isFreeEpisode = ep.episode_number === 1;

    if (!isFreeEpisode && !isAuthenticated && !bypassAuthCheck) {
      setPendingEpisode(ep);
      setShowAuthModal(true);
      return;
    }

    setActivePlayback({
      episode: ep,
      isPlaying: true,
      progress: 0,
      videoEnded: false,
    });
  };

  // Find next episode in sequence if available
  const nextEpisode = activePlayback
    ? eps.find((e: any) => e.episode_number === activePlayback.episode.episode_number + 1)
    : null;

  // Check if this show has a video source for Episode 1 (e.g. Discover India with Moti)
  const isMotiShow =
    show.slug === "discover-india-with-moti" ||
    show.title.toLowerCase().includes("discover india");

  const videoSrc =
    isMotiShow && activePlayback?.episode?.episode_number === 1
      ? "/videos/moti-s01e01.mp4"
      : null;

  return (
    <div className="detail-page">
      <section
        className="detail-hero"
        style={{ backgroundImage: bannerImg ? `url(${bannerImg})` : undefined }}
      >
        <div className="detail-overlay" />
        <div className="detail-content">
          <div className="detail-poster">
            {posterImg ? (
              <img src={posterImg} alt={show.title} />
            ) : (
              <div className="poster-fallback">
                <span>{show.title}</span>
              </div>
            )}
          </div>
          <div className="detail-copy">
            <Link to="/" className="back-link">
              ← Back to Browse
            </Link>
            <div className="eyebrow">
              <span className="eyebrow-pill">PEBLO ORIGINAL</span>
              {show.section && <span className="hero-section-tag">{show.section.toUpperCase()}</span>}
            </div>
            <h1>{show.title}</h1>
            <p>{show.synopsis || "Explore the latest published episodes on Peblo Mini TV."}</p>

            <div className="detail-tags">
              <span className="badge-hd">HD</span>
              <span>{availableSeasons.length} {availableSeasons.length === 1 ? "Season" : "Seasons"}</span>
              {languages.map((l) => (
                <span key={l} className="lang-tag">
                  AUDIO: {l.toUpperCase()}
                </span>
              ))}
              {show.category && <span className="category-tag">{show.category}</span>}
            </div>

            <div className="hero-actions">
              <Button
                variant="primary"
                onClick={() => eps[0] && handleStartEpisode(eps[0])}
                disabled={eps.length === 0}
              >
                <Icon name="play" size={20} /> Play S{season || 1}:E1 (Free Preview)
              </Button>
              <Button onClick={() => navigate("/search")}>
                <Icon name="search" size={18} /> More Titles
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PageShell className="detail-shell">
        <div className="detail-toolbar">
          <div>
            <h2>Episodes</h2>
            <p>
              {eps.length} {eps.length === 1 ? "episode" : "episodes"} in Season {season || 1}
            </p>
          </div>
          <div className="selectors">
            {availableSeasons.length > 1 && (
              <select
                value={season ?? ""}
                onChange={(e) => setSeason(Number(e.target.value))}
                aria-label="Select season"
              >
                {availableSeasons.map((s: any) => (
                  <option key={s.season_number} value={s.season_number}>
                    Season {s.season_number}
                  </option>
                ))}
              </select>
            )}

            {languages.length > 1 && (
              <select
                value={lang ?? ""}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Select audio language"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>
                    Audio: {l.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {eps.length === 0 ? (
          <Empty
            title="No episodes available"
            msg="This season has no published episodes in the catalogue."
          />
        ) : (
          <div className="episodes">
            {eps.map((e: any) => {
              const playable = !lang || (e.languages && e.languages.includes(lang));
              const thumbImg = e.thumbnail || show.thumbnail || show.banner;
              const isFree = e.episode_number === 1;

              return (
                <article
                  className={`episode-row ${playable ? "" : "muted"}`}
                  key={e.episode_number}
                  onClick={() => playable && handleStartEpisode(e)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Play episode ${e.episode_number}: ${e.title}`}
                >
                  <div className="episode-number">
                    {String(e.episode_number).padStart(2, "0")}
                  </div>
                  <div className="episode-thumb">
                    {thumbImg ? (
                      <img src={thumbImg} alt="" loading="lazy" />
                    ) : (
                      <div className="thumb-placeholder">E{e.episode_number}</div>
                    )}
                    <div className="thumb-play-overlay">
                      <Icon name="play" size={24} />
                    </div>
                  </div>
                  <div className="episode-info">
                    <div className="episode-title-row">
                      <div className="episode-title-with-badge">
                        <h3>{e.title}</h3>
                        {isFree ? (
                          <span className="free-preview-pill">FREE PREVIEW</span>
                        ) : !isAuthenticated ? (
                          <span className="auth-required-pill">SIGN IN TO WATCH</span>
                        ) : null}
                      </div>
                      <span className="episode-duration">
                        {Math.max(1, Math.round((e.duration_seconds || 0) / 60))}m
                      </span>
                    </div>
                    <p>{e.description || "Stream this episode now on Peblo Mini TV."}</p>
                    <div className="episode-meta-badges">
                      {e.languages?.map((l: string) => (
                        <span
                          key={l}
                          className={`lang-badge ${l === lang ? "active-lang" : ""}`}
                        >
                          {l.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </PageShell>

      {/* Auth Gate Modal when trying to play an episode requiring login */}
      {showAuthModal && (
        <AuthModal
          episodeTitle={pendingEpisode?.title}
          onClose={() => {
            setShowAuthModal(false);
            setPendingEpisode(null);
          }}
          onSuccess={() => {
            setShowAuthModal(false);
            if (pendingEpisode) {
              handleStartEpisode(pendingEpisode, true);
              setPendingEpisode(null);
            }
          }}
        />
      )}

      {/* Video Player Modal */}
      {activePlayback && (
        <div
          className="player-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Episode Video Player"
        >
          <div className="player-modal-backdrop" onClick={() => setActivePlayback(null)} />
          <div className="player-modal-dialog">
            <button
              className="player-close-btn"
              onClick={() => setActivePlayback(null)}
              aria-label="Close Player"
            >
              <Icon name="close" size={24} />
            </button>

            <div className="video-viewport">
              <div className="screen-indicator">
                <span className="live-dot" /> STREAMING · 1080p HD · S{season}:E{activePlayback.episode.episode_number}
              </div>

              {/* Real Video Element if videoSrc is provided */}
              {videoSrc ? (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="html5-video-player"
                  autoPlay
                  controls
                  onEnded={() =>
                    setActivePlayback((p) => (p ? { ...p, videoEnded: true } : null))
                  }
                  onError={() => {
                    // Fallback to simulation if video file is still uploading
                  }}
                />
              ) : null}

              {/* Video End / Up Next Overlay */}
              {activePlayback.videoEnded && (
                <div className="player-ended-overlay">
                  <div className="ended-card">
                    <span className="ended-eyebrow">EPISODE 1 COMPLETE 🎉</span>
                    <h2>What's Next?</h2>
                    {nextEpisode ? (
                      <p>
                        Continue the adventure with{" "}
                        <strong>
                          S{season}:E{nextEpisode.episode_number} — "{nextEpisode.title}"
                        </strong>
                      </p>
                    ) : (
                      <p>You've completed this episode!</p>
                    )}

                    <div className="ended-actions">
                      {!isAuthenticated && nextEpisode ? (
                        <button
                          className="ended-login-btn"
                          onClick={() => {
                            setActivePlayback(null);
                            handleStartEpisode(nextEpisode);
                          }}
                        >
                          Sign In & Continue with S{season}:E{nextEpisode.episode_number} →
                        </button>
                      ) : nextEpisode ? (
                        <button
                          className="ended-next-btn"
                          onClick={() => handleStartEpisode(nextEpisode)}
                        >
                          Play S{season}:E{nextEpisode.episode_number} Now ▶
                        </button>
                      ) : null}

                      <button
                        className="ended-replay-btn"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = 0;
                            videoRef.current.play();
                          }
                          setActivePlayback((p) =>
                            p ? { ...p, videoEnded: false, progress: 0 } : null
                          );
                        }}
                      >
                        Replay Episode 1 ↺
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulation fallback if no video file loaded or video not playing */}
              {!videoSrc && (
                <>
                  <div className="center-big-play">
                    <button
                      className="big-play-btn"
                      onClick={() =>
                        setActivePlayback((p) =>
                          p ? { ...p, isPlaying: !p.isPlaying } : null
                        )
                      }
                      aria-label={activePlayback.isPlaying ? "Pause video" : "Play video"}
                    >
                      <Icon name={activePlayback.isPlaying ? "pause" : "play"} size={36} />
                    </button>
                  </div>

                  {/* Progress Scrubber */}
                  <div className="player-scrubber-bar">
                    <div
                      className="player-scrubber-fill"
                      style={{ width: `${activePlayback.progress || 35}%` }}
                    />
                  </div>

                  {/* Player Controls Bar */}
                  <div className="player-controls">
                    <button
                      className="ctrl-btn"
                      onClick={() =>
                        setActivePlayback((p) =>
                          p ? { ...p, isPlaying: !p.isPlaying } : null
                        )
                      }
                      aria-label={activePlayback.isPlaying ? "Pause" : "Play"}
                    >
                      <Icon name={activePlayback.isPlaying ? "pause" : "play"} size={22} />
                    </button>
                    <div className="player-track-info">
                      <strong>{activePlayback.episode.title}</strong>
                      <span>
                        {show.title} · S{season}:E{activePlayback.episode.episode_number}
                      </span>
                    </div>
                    <div className="player-time">
                      {Math.max(1, Math.round((activePlayback.episode.duration_seconds || 0) / 60))} min ·{" "}
                      {lang?.toUpperCase() || "EN"}
                    </div>
                    {/* Simulated Finish Button to test the "Complete E1 -> Ask login for E2" prompt */}
                    {activePlayback.episode.episode_number === 1 && !activePlayback.videoEnded && (
                      <button
                        className="simulate-finish-btn"
                        onClick={() =>
                          setActivePlayback((p) => (p ? { ...p, videoEnded: true } : null))
                        }
                        title="Click to simulate completing Episode 1"
                      >
                        Finish E1
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="player-footer-note">
              <p>
                ✓ Now playing: <strong>{activePlayback.episode.title}</strong> (S{season}:E{activePlayback.episode.episode_number}) in{" "}
                <strong>{lang?.toUpperCase()}</strong>.
              </p>
              <Button variant="primary" onClick={() => setActivePlayback(null)}>
                Done Watching
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
