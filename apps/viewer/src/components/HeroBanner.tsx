import { useNavigate } from "react-router-dom";
import { Button, Icon } from "./ui";

export default function HeroBanner({ show }: { show: any }) {
  const nav = useNavigate();
  if (!show) return null;

  const bannerImg = show.banner || show.thumbnail || show.poster;
  const seasonCount = show.seasons?.filter((s: any) => s.season_number > 0)?.length || 1;

  // Extract available languages across episodes
  const languages: string[] = Array.from(
    new Set<string>(
      (show.seasons || []).flatMap((s: any) =>
        (s.episodes || []).flatMap((e: any) => e.languages || [])
      )
    )
  );

  return (
    <section
      className="hero"
      style={{
        backgroundImage: bannerImg
          ? `linear-gradient(to right, rgba(255, 247, 231, 0.96) 0%, rgba(255, 247, 231, 0.85) 45%, rgba(255, 247, 231, 0.4) 75%, rgba(255, 247, 231, 0.1) 100%), url(${bannerImg})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="hero-vignette" />
      <div className="hero-copy">
        <div className="hero-peblo-badge">
          <span className="badge-pill">PEBLO ORIGINAL</span>
          {show.section && <span className="section-pill">{show.section.toUpperCase()}</span>}
        </div>
        <h1 className="hero-title">{show.title}</h1>
        {show.synopsis && <p className="hero-subtext">{show.synopsis}</p>}
        <div className="hero-actions">
          <button className="netflix-btn netflix-btn-play" onClick={() => nav(`/show/${show.id}`)}>
            <Icon name="play" size={22} /> Play
          </button>
          <button className="netflix-btn netflix-btn-info" onClick={() => nav(`/show/${show.id}`)}>
            <Icon name="info" size={22} /> More Info
          </button>
        </div>
      </div>
    </section>
  );
}
