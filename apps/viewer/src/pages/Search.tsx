import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Poster from "../components/Poster";
import { Empty, Icon, Loading, PageShell } from "../components/ui";

const SECTIONS = ["featured", "series", "minisodes", "songs"];
const CATEGORIES = [
  "adventure",
  "folk",
  "friendship",
  "india",
  "language",
  "learning",
  "maths",
  "music",
  "nature",
  "reading",
  "science",
  "singalong",
  "stories",
  "travel",
  "values",
];
const LANGUAGES = ["en", "hi"];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [language, setLanguage] = useState(params.get("language") || "");
  const [section, setSection] = useState(params.get("section") || "");
  const [result, setResult] = useState<any>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  // Sync URL search params with local state
  useEffect(() => {
    const urlQ = params.get("q") || "";
    const urlCat = params.get("category") || "";
    const urlLang = params.get("language") || "";
    const urlSec = params.get("section") || "";
    if (urlQ !== q) setQ(urlQ);
    if (urlCat !== category) setCategory(urlCat);
    if (urlLang !== language) setLanguage(urlLang);
    if (urlSec !== section) setSection(urlSec);
  }, [params]);

  const run = useCallback(async () => {
    setState("loading");
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (language) p.set("language", language);
    if (section) p.set("section", section);

    setParams(p, { replace: true });
    try {
      const r = await fetch(`/api/catalog/search?${p}`);
      if (!r.ok) throw new Error("Search request failed");
      setResult(await r.json());
      setState("ready");
    } catch {
      setState("error");
    }
  }, [q, category, language, section, setParams]);

  useEffect(() => {
    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [run]);

  const clearAll = () => {
    setQ("");
    setCategory("");
    setLanguage("");
    setSection("");
  };

  const hasActiveFilters = Boolean(q || category || language || section);

  return (
    <PageShell className="search-page">
      <div className="search-hero">
        <span className="search-eyebrow">EXPLORE CATALOGUE</span>
        <h1>Find Your Next Story</h1>
        <p>Search published Peblo series, minisodes, songs, and adventures across languages.</p>
      </div>

      <div className="search-controls">
        <div className="big-search">
          <Icon name="search" size={26} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, character, topic…"
            aria-label="Search input"
          />
          {q && (
            <button
              className="clear-search-btn"
              onClick={() => setQ("")}
              aria-label="Clear input"
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </div>

        {/* Section Pills */}
        <div className="filter-chips-section">
          <span className="chips-label">Section:</span>
          <button
            className={`filter-chip ${section === "" ? "active" : ""}`}
            onClick={() => setSection("")}
          >
            All Sections
          </button>
          {SECTIONS.map((sec) => (
            <button
              key={sec}
              className={`filter-chip ${section === sec ? "active" : ""}`}
              onClick={() => setSection(section === sec ? "" : sec)}
            >
              {sec.charAt(0).toUpperCase() + sec.slice(1)}
            </button>
          ))}
        </div>

        {/* Language Pills */}
        <div className="filter-chips-section">
          <span className="chips-label">Language:</span>
          <button
            className={`filter-chip ${language === "" ? "active" : ""}`}
            onClick={() => setLanguage("")}
          >
            All Languages
          </button>
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              className={`filter-chip ${language === lang ? "active" : ""}`}
              onClick={() => setLanguage(language === lang ? "" : lang)}
            >
              {lang === "en" ? "English (EN)" : "Hindi (HI)"}
            </button>
          ))}
        </div>

        {/* Category Pills (Popular & All) */}
        <div className="filter-chips-section">
          <span className="chips-label">Categories:</span>
          <button
            className={`filter-chip ${category === "" ? "active" : ""}`}
            onClick={() => setCategory("")}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(category === cat ? "" : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {state === "loading" && <Loading />}

      {state === "error" && (
        <Empty
          title="Search is temporarily unavailable"
          msg="Could not reach the catalogue API. Please try again in a moment."
          actionText="Retry Search"
          onAction={run}
        />
      )}

      {state === "ready" && result && (
        <div className="search-results">
          <div className="results-head">
            <h2>
              {result.count} {result.count === 1 ? "Result" : "Results"} Found
            </h2>
            {hasActiveFilters && (
              <button className="clear-filter" onClick={clearAll}>
                Clear all filters
              </button>
            )}
          </div>

          {result.count > 0 ? (
            <div className="results-grid">
              {result.shows.map((s: any) => (
                <Poster key={s.id} show={s} />
              ))}
            </div>
          ) : (
            <Empty
              title="No matching titles found"
              msg="Try refining your query, choosing a different category, or clearing active filters."
              actionText="Reset Filters"
              onAction={clearAll}
            />
          )}
        </div>
      )}
    </PageShell>
  );
}
