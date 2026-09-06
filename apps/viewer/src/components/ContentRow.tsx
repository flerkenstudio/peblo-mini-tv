import { useRef, useState, useEffect } from "react";
import Poster from "./Poster";
import { Icon } from "./ui";

const SECTION_TITLES: Record<string, string> = {
  featured: "Featured on Peblo",
  series: "Popular Series",
  minisodes: "Minisodes & Shorts",
  songs: "Songs & Singalongs",
};

export default function ContentRow({ title, shows }: { title: string; shows: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const displayTitle = SECTION_TITLES[title.toLowerCase()] || title.charAt(0).toUpperCase() + title.slice(1);

  const updateScrollButtons = () => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    const current = ref.current;
    if (current) {
      current.addEventListener("scroll", updateScrollButtons, { passive: true });
      window.addEventListener("resize", updateScrollButtons);
    }
    return () => {
      if (current) current.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [shows]);

  const scroll = (dir: number) => {
    if (!ref.current) return;
    const scrollAmount = dir * Math.min(800, ref.current.clientWidth * 0.75);
    ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!shows || shows.length === 0) return null;

  return (
    <section className="content-section">
      <div className="section-head">
        <h2>{displayTitle}</h2>
        <span className="section-count">
          {shows.length} {shows.length === 1 ? "title" : "titles"}
        </span>
      </div>
      <div className="row-wrap">
        {canScrollLeft && (
          <button
            className="row-arrow left"
            aria-label={`Scroll left in ${displayTitle}`}
            onClick={() => scroll(-1)}
          >
            <Icon name="chevron-left" size={26} />
          </button>
        )}
        <div className="poster-row" ref={ref}>
          {shows.map((s) => (
            <Poster key={s.id} show={s} />
          ))}
        </div>
        {canScrollRight && (
          <button
            className="row-arrow right"
            aria-label={`Scroll right in ${displayTitle}`}
            onClick={() => scroll(1)}
          >
            <Icon name="chevron-right" size={26} />
          </button>
        )}
      </div>
    </section>
  );
}
