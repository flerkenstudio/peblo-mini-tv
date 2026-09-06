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
          ? `linear-gradient(to right, rgba(0,0,0,0.7) 40%, transparent 100%), url(${bannerImg})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="hero-copy">
        <h1 className="hero-title">{show.title}</h1>
        {show.synopsis && <p className="hero-subtext">{show.synopsis}</p>}
        <div className="hero-actions">
          <Button variant="primary" onClick={() => nav(`/show/${show.id}`)}>
            <Icon name="play" size={20} /> Watch Now
          </Button>
          <Button onClick={() => nav(`/show/${show.id}`)}>
            <Icon name="info" size={20} /> Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
