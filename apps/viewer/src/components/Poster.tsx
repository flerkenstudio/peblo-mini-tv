import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "./ui";

export default function Poster({ show }: { show: any }) {
  const nav = useNavigate();
  const [imageError, setImageError] = useState(false);
  const image = show.poster || show.thumbnail || show.banner;

  const handleOpen = () => {
    nav(`/show/${show.id}`);
  };

  const seasonCount = show.seasons?.filter((s: any) => s.season_number > 0)?.length || 1;

  return (
    <article
      className="poster-card"
      onClick={handleOpen}
      tabIndex={0}
      role="button"
      aria-label={`View ${show.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      }}
    >
      <div className="poster-art">
        {image && !imageError ? (
          <img
            src={image}
            alt={show.title}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="poster-fallback">
            <span className="fallback-badge">PEBLO</span>
            <strong>{show.title}</strong>
            {show.category && <small>{show.category}</small>}
          </div>
        )}
        <div className="poster-gradient" />
        <div className="poster-card-overlay">
          <div className="poster-card-title">{show.title}</div>
          <div className="poster-meta-sub">
            <span className="match-badge">98% Match</span>
            <span className="badge-hd-mini">HD</span>
            <span>{seasonCount} {seasonCount === 1 ? "Season" : "Seasons"}</span>
          </div>
        </div>
        <div className="poster-hover">
          <div className="poster-actions">
            <button
              className="action-btn-play"
              aria-label={`Play ${show.title}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
            >
              <Icon name="play" size={16} />
            </button>
            <button
              className="action-btn-info"
              aria-label={`More about ${show.title}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
            >
              <Icon name="info" size={16} />
            </button>
          </div>
          <div className="poster-meta">
            <strong>{show.title}</strong>
            <div className="poster-meta-sub">
              <span className="match-badge">98% Match</span>
              <span className="badge-hd-mini">HD</span>
              <span>{seasonCount} {seasonCount === 1 ? "Season" : "Seasons"}</span>
            </div>
            {show.category && <span className="poster-category">{show.category}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
