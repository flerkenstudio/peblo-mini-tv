import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ContentRow from "../components/ContentRow";
import HeroBanner from "../components/HeroBanner";
import { Empty, Loading, PageShell } from "../components/ui";

export default function Home() {
  const [catalog, setCatalog] = useState<any>(null);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const loadCatalogue = () => {
    setState("loading");
    fetch("/api/catalog")
      .then((r) => {
        if (!r.ok) throw new Error("Catalogue unavailable");
        return r.json();
      })
      .then((c) => {
        setCatalog(c);
        setState("ready");
      })
      .catch(() => setState("error"));
  };

  useEffect(() => {
    loadCatalogue();
  }, []);

  const allShows = useMemo(
    () => catalog?.sections?.flatMap((s: any) => s.shows) ?? [],
    [catalog]
  );

  // Link featured hero to its complete show data if present
  const featured = useMemo(() => {
    if (!catalog) return null;
    if (catalog.featured?.show_id) {
      const match = allShows.find((s: any) => s.id === catalog.featured.show_id);
      if (match) return match;
    }
    return catalog.featured || allShows[0];
  }, [catalog, allShows]);

  // Extract all categories present across published shows
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allShows.forEach((s: any) => {
      if (s.categories && Array.isArray(s.categories)) {
        s.categories.forEach((c: string) => set.add(c));
      } else if (s.category) {
        s.category.split(",").forEach((c: string) => set.add(c.trim()));
      }
    });
    return Array.from(set).filter(Boolean).sort();
  }, [allShows]);

  // Filter sections by selected category if active
  const displayedSections = useMemo(() => {
    if (!catalog?.sections) return [];
    if (!selectedCategory) return catalog.sections;

    const catLower = selectedCategory.toLowerCase();
    return catalog.sections
      .map((sec: any) => ({
        ...sec,
        shows: sec.shows.filter((s: any) => {
          const cats = [
            ...(s.categories || []),
            ...(s.category ? s.category.split(",").map((c: string) => c.trim()) : []),
          ].map((c: string) => c.toLowerCase());
          return cats.includes(catLower);
        }),
      }))
      .filter((sec: any) => sec.shows.length > 0);
  }, [catalog, selectedCategory]);

  if (state === "loading") return <Loading />;
  if (state === "error") {
    return (
      <PageShell>
        <Empty
          title="Catalogue unavailable"
          msg="We couldn't load Peblo Mini TV right now. Please verify your backend connection and try again."
          actionText="Try Again"
          onAction={loadCatalogue}
        />
      </PageShell>
    );
  }

  return (
    <>
      <HeroBanner show={featured} />

      <PageShell className="home-shell">
        {availableCategories.length > 0 && (
          <div className="home-filter-bar">
            <span className="filter-label">Quick Filter:</span>
            <button
              className={`filter-chip ${selectedCategory === "" ? "active" : ""}`}
              onClick={() => setSelectedCategory("")}
            >
              All Shows
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                className={`filter-chip ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {displayedSections.map((sec: any) => (
          <ContentRow key={sec.name} title={sec.name} shows={sec.shows} />
        ))}

        {displayedSections.length === 0 && (
          <Empty
            title={selectedCategory ? `No shows in "${selectedCategory}"` : "Nothing published yet"}
            msg={
              selectedCategory
                ? "Try clearing your category filter or explore all titles in Search."
                : "New shows will appear here once published from the CMS."
            }
            actionText={selectedCategory ? "Clear Filter" : undefined}
            onAction={selectedCategory ? () => setSelectedCategory("") : undefined}
          />
        )}

        <footer className="footer">
          <div className="footer-col">
            <div className="footer-brand">PEBLO MINI TV</div>
            <p>Premium streaming experience built on immutable published catalogues.</p>
          </div>
          <div className="footer-links">
            <Link to="/search">Browse All Titles</Link>
            <Link to="/search?section=series">Series</Link>
            <Link to="/search?section=minisodes">Minisodes</Link>
            <Link to="/search?section=songs">Songs</Link>
          </div>
          <div className="footer-meta">
            {catalog?.version && <span>Catalogue Version: <code>{catalog.version}</code></span>}
            <span>{allShows.length} total published shows</span>
          </div>
        </footer>
      </PageShell>
    </>
  );
}
