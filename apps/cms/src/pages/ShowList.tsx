import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { SECTIONS, canPublish } from "../hooks/useCatalog";

type Show = {
  id: number;
  title: string;
  slug: string;
  section: string | null;
  category: string | null;
  status: string;
  featured: boolean;
};

type Page = {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  items: Show[];
};

const EMPTY_PAGE: Page = { total: 0, page: 1, page_size: 20, pages: 1, items: [] };

export default function ShowList() {
  const [data, setData] = useState<Page>(EMPTY_PAGE);
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: "20" });
    if (section) params.set("section", section);
    if (status) params.set("status", status);
    if (debouncedQ) params.set("q", debouncedQ);
    setData(await api(`/admin/shows?${params}`));
  }, [section, status, debouncedQ, page]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [section, status, debouncedQ]);

  useEffect(() => {
    load()
      .catch((e) => setError(e.detail || e.message || "Failed to load shows"))
      .finally(() => setLoading(false));
  }, [load]);

  async function createShow() {
    if (!title.trim()) return;
    try {
      const show = await api("/admin/shows", {
        method: "POST",
        body: JSON.stringify({ title: title.trim() }),
      });
      nav(`/shows/${show.id}`);
    } catch (e: any) {
      setError(e.detail || "Failed to create show");
    }
  }

  return (
    <div className="cms-shell">
      <div className="cms-header">
        <h1>Show Library</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          {canPublish(role) && (
            <button onClick={() => nav("/publish")} className="cms-btn">
              🚀 Publish
            </button>
          )}
          <button onClick={() => { localStorage.clear(); nav("/login"); }} className="cms-btn secondary">Logout</button>
        </div>
      </div>

      {error && <div className="cms-alert error">{error}</div>}

      <div className="cms-filter-bar">
        <input className="cms-input" style={{ width: "auto", flex: 1 }} placeholder="Search title..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="cms-select" style={{ width: "auto" }} value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="">All sections</option>
          {SECTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="cms-select" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className="cms-filter-bar" style={{ marginBottom: 24 }}>
        <input
          className="cms-input"
          style={{ width: "auto", flex: 1 }}
          placeholder="New show title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createShow()}
        />
        <button className="cms-btn" onClick={createShow}>+ New Show</button>
      </div>

      {loading && <p className="cms-empty">Loading shows…</p>}
      <div className="cms-table-wrap">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Section</th>
              <th>Category</th>
              <th>Status</th>
              <th>Featured</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((s) => (
              <tr
                key={s.id}
                onClick={() => nav(`/shows/${s.id}`)}
              >
                <td>
                  <b>{s.title}</b>
                </td>
                <td>{s.section || "—"}</td>
                <td>{s.category || "—"}</td>
                <td>
                  <span className={`cms-badge ${s.status}`}>
                    {s.status === "published" ? "✅" : "📝"} {s.status}
                  </span>
                </td>
                <td>{s.featured ? "⭐" : ""}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="cms-empty">
                  No shows found. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cms-pagination">
        <button className="cms-btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          ← Prev
        </button>
        <span>
          Page {data.page} of {data.pages} ({data.total} shows)
        </span>
        <button className="cms-btn secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}
