import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, extractError, getToken } from "../services/api";
import ArtworkUploader from "../components/ArtworkUploader";
import { SECTIONS, CATEGORIES, LANGUAGES } from "../hooks/useCatalog";

export default function ShowEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [show, setShow] = useState<any>(null);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [tab, setTab] = useState<"details" | "content" | "artwork">("details");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [publishNotice, setPublishNotice] = useState("");

  const load = useCallback(async () => {
    const s = await api(`/admin/shows/${id}`);
    setShow(s);
    setArtworks(await api(`/admin/artworks?show_id=${id}`));
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError(extractError(e)));
  }, [load]);

  async function publishToViewer() {
    setPublishing(true);
    setPublishNotice("");
    setError("");
    try {
      const res = await api("/admin/catalog/publish", { method: "POST" });
      setPublishNotice(`✅ Live on Viewer! (v${res.version} — ${res.shows} shows, ${res.episodes} eps)`);
      setTimeout(() => setPublishNotice(""), 4000);
    } catch (e: any) {
      setError(extractError(e));
    } finally {
      setPublishing(false);
    }
  }

  async function save(patch: any) {
    setError("");
    setSaved(false);
    try {
      const updated = await api(`/admin/shows/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setShow(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // If show is published, auto-sync catalogue to viewer
      if (patch.status === "published" || (updated.status === "published" && !patch.status)) {
        api("/admin/catalog/publish", { method: "POST" }).catch(() => {});
      }
    } catch (e: any) {
      setError(extractError(e));
    }
  }

  async function removeShow() {
    if (!confirm("Delete this show and ALL its seasons, episodes and artwork?")) return;
    await api(`/admin/shows/${id}`, { method: "DELETE" });
    nav("/");
  }

  if (!show) return <p className="cms-empty">Loading…</p>;

  return (
    <div className="cms-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="cms-btn secondary" onClick={() => nav("/")}>← Back to Library</button>
        <button
          className="cms-btn"
          disabled={publishing}
          onClick={publishToViewer}
          style={{ background: "#27ae60", borderColor: "#27ae60" }}
          title="Publish current changes so they immediately appear in Viewer"
        >
          {publishing ? "Publishing…" : "🚀 Publish to Viewer"}
        </button>
      </div>

      <div className="cms-header" style={{ marginTop: 16 }}>
        <h1 style={{ margin: 0 }}>
          {show.title} <small style={{ color: "#888" }}>#{show.id}</small>
        </h1>
        {show.status === "published" ? (
          <span style={{ color: "#27ae60", fontWeight: 600, fontSize: "0.95rem" }}>● Published</span>
        ) : (
          <span style={{ color: "#e67e22", fontWeight: 600, fontSize: "0.95rem" }}>○ Draft</span>
        )}
      </div>

      {publishNotice && <div className="cms-alert success" style={{ marginTop: 12 }}>{publishNotice}</div>}
      {error && <div className="cms-alert error" style={{ marginTop: 12 }}>{error}</div>}

      <div className="cms-tabs">
        {(["details", "content", "artwork"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cms-tab ${tab === t ? "active" : ""}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {error && <div className="cms-alert error">{error}</div>}
      {saved && <div className="cms-alert success">✓ Saved</div>}

      {tab === "details" && <DetailsForm show={show} onSave={save} onDelete={removeShow} />}
      {tab === "content" && <ContentTab showId={Number(id)} />}
      {tab === "artwork" && (
        <ArtworkUploader showId={Number(id)} artworks={artworks} onChange={load} />
      )}
    </div>
  );
}

function DetailsForm({ show, onSave, onDelete }: any) {
  const [form, setForm] = useState({ ...show });
  const upd = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="cms-form-group">
      <label className="cms-label">
        Title
        <input className="cms-input" value={form.title} onChange={(e) => upd("title", e.target.value)} />
      </label>
      <label className="cms-label">
        Synopsis
        <textarea
          className="cms-textarea"
          value={form.synopsis || ""}
          onChange={(e) => upd("synopsis", e.target.value)}
        />
      </label>
      <label className="cms-label">
        Section
        <select className="cms-select" value={form.section || ""} onChange={(e) => upd("section", e.target.value)}>
          <option value="">— select —</option>
          {SECTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="cms-label">
        Category
        <select className="cms-select" value={form.category || ""} onChange={(e) => upd("category", e.target.value)}>
          <option value="">— select —</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="cms-label">
        Status
        <select className="cms-select" value={form.status} onChange={(e) => upd("status", e.target.value)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <label className="cms-checkbox-label">
        <input type="checkbox" checked={form.featured} onChange={(e) => upd("featured", e.target.checked)} />
        Featured (hero banner on Home)
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="cms-btn"
          onClick={() =>
            onSave({
              title: form.title,
              synopsis: form.synopsis || null,
              section: form.section || null,
              category: form.category || null,
              status: form.status,
              featured: form.featured,
            })
          }
        >
          Save
        </button>
        <button className="cms-btn danger" onClick={onDelete}>
          Delete show
        </button>
      </div>
    </div>
  );
}

function ContentTab({ showId }: { showId: number }) {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [newSeason, setNewSeason] = useState({ season_number: 1, title: "" });
  const [error, setError] = useState("");

  const loadSeasons = useCallback(async () => {
    const list = await api(`/admin/shows/${showId}/seasons`);
    setSeasons(list);
    return list;
  }, [showId]);

  useEffect(() => {
    loadSeasons().catch((e) => setError(extractError(e)));
  }, [loadSeasons]);

  async function addSeason() {
    setError("");
    try {
      await api(`/admin/shows/${showId}/seasons`, {
        method: "POST",
        body: JSON.stringify({
          season_number: Number(newSeason.season_number),
          title: newSeason.title || null,
        }),
      });
      setNewSeason({ season_number: Number(newSeason.season_number) + 1, title: "" });
      loadSeasons();
    } catch (e: any) {
      setError(extractError(e));
    }
  }

  async function deleteSeason(seasonId: number) {
    if (!confirm("Delete this season and ALL its episodes? This cannot be undone.")) return;
    setError("");
    try {
      await api(`/admin/seasons/${seasonId}`, { method: "DELETE" });
      if (selected === seasonId) setSelected(null);
      loadSeasons();
    } catch (e: any) {
      setError(extractError(e));
    }
  }

  return (
    <div>
      {error && <div className="cms-alert error">{error}</div>}

      <div className="cms-content-layout">
        <div className="cms-sidebar">
          <h3>Seasons</h3>
          <div className="cms-add-season-row">
            <input
              type="number"
              value={newSeason.season_number}
              onChange={(e) => setNewSeason((s) => ({ ...s, season_number: +e.target.value }))}
            />
            <input
              placeholder="Title (optional)"
              type="text"
              value={newSeason.title}
              onChange={(e) => setNewSeason((s) => ({ ...s, title: e.target.value }))}
            />
            <button className="cms-btn small" onClick={addSeason}>+</button>
          </div>
          {seasons.map((s) => (
            <div
              key={s.id}
              className={`cms-season-item ${selected === s.id ? "active" : ""}`}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div onClick={() => setSelected(s.id)} style={{ flex: 1, cursor: "pointer" }}>
                <b>Season {s.season_number}</b> {s.title && `— ${s.title}`}
                <div className="cms-season-meta">{s.episode_count} episodes</div>
              </div>
              <button className="cms-btn danger small" onClick={() => deleteSeason(s.id)} title="Delete season">🗑</button>
            </div>
          ))}
          <p className="cms-hint">
            Use season number 0 for trailers (excluded from the viewer).
          </p>
        </div>

        <div className="cms-main-panel">
          {selected ? (
            <EpisodeList seasonId={selected} onChange={loadSeasons} />
          ) : (
            <p className="cms-empty">Select a season to manage episodes.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EpisodeList({ seasonId, onChange }: { seasonId: number; onChange: () => void }) {
  const [eps, setEps] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [uploadingEpId, setUploadingEpId] = useState<number | null>(null);
  const [previewEpId, setPreviewEpId] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const [draft, setDraft] = useState({
    title: "",
    episode_number: 1,
    content_group: "cg_001",
    language: LANGUAGES[0],
    duration_seconds: "",
    description: "",
  });

  const load = useCallback(async () => {
    setEps(await api(`/admin/seasons/${seasonId}/episodes`));
  }, [seasonId]);

  useEffect(() => {
    load().catch((e) => setError(extractError(e)));
  }, [load]);

  async function handleVideoUpload(epId: number, file: File) {
    setUploadingEpId(epId);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/admin/episodes/${epId}/video`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(extractError(err));
      } else {
        await load();
        onChange();
      }
    } catch (err: any) {
      setError(extractError(err));
    } finally {
      setUploadingEpId(null);
    }
  }

  async function handleVideoDelete(epId: number) {
    if (!confirm("Delete video for this episode?")) return;
    setError("");
    try {
      await api(`/admin/episodes/${epId}/video`, { method: "DELETE" });
      if (previewEpId === epId) setPreviewEpId(null);
      await load();
      onChange();
    } catch (err: any) {
      setError(extractError(err));
    }
  }

  async function addEpisode() {
    setError("");
    try {
      await api(`/admin/seasons/${seasonId}/episodes`, {
        method: "POST",
        body: JSON.stringify({
          title: draft.title,
          description: draft.description || null,
          duration_seconds: draft.duration_seconds ? Number(draft.duration_seconds) : null,
          content_group: String(draft.content_group),
          language: draft.language,
          episode_number: Number(draft.episode_number),
        }),
      });
      setDraft((d) => ({ ...d, title: "", duration_seconds: "" }));
      load();
      onChange();
    } catch (e: any) {
      setError(extractError(e));
    }
  }

  async function patchEp(id: number, patch: any) {
    try {
      await api(`/admin/episodes/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      load();
    } catch (e: any) {
      setError(extractError(e));
    }
  }

  async function delEp(id: number) {
    if (!confirm("Delete episode?")) return;
    await api(`/admin/episodes/${id}`, { method: "DELETE" });
    load();
    onChange();
  }

  return (
    <div>
      <h3>Episodes</h3>
      {error && <div className="cms-alert error">{error}</div>}
      {eps.length === 0 && <p className="cms-empty">No episodes yet — add the first below.</p>}

      {eps.map((e) => (
        <div key={e.id} className="cms-episode-card">
          {editing === e.id ? (
            <div className="cms-form-group" style={{ padding: "8px 0" }}>
              <label className="cms-label">
                Title
                <input className="cms-input" value={editForm.title || ""} onChange={(ev) => setEditForm((f: any) => ({ ...f, title: ev.target.value }))} />
              </label>
              <label className="cms-label">
                Description
                <textarea className="cms-textarea" value={editForm.description || ""} onChange={(ev) => setEditForm((f: any) => ({ ...f, description: ev.target.value }))} />
              </label>
              <label className="cms-label">
                Duration (seconds)
                <input className="cms-input" type="number" value={editForm.duration_seconds || ""} onChange={(ev) => setEditForm((f: any) => ({ ...f, duration_seconds: ev.target.value ? Number(ev.target.value) : null }))} />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="cms-btn small" onClick={async () => {
                  await patchEp(e.id, editForm);
                  setEditing(null);
                }}>Save</button>
                <button className="cms-btn secondary small" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="cms-episode-row">
                <div>
                  <b>E{e.episode_number}</b> — {e.title}{" "}
                  <span className="cms-episode-meta">
                    (group {e.content_group}, {e.language},
                    {e.duration_seconds ? ` ${Math.floor(e.duration_seconds / 60)}m` : " ⚠️ no duration"})
                  </span>
                  <span style={{ marginLeft: 8, fontSize: "0.85rem" }}>
                    {uploadingEpId === e.id ? (
                      <span style={{ color: "#e67e22" }}>⏳ Uploading video…</span>
                    ) : e.video_url ? (
                      <span style={{ color: "#27ae60", fontWeight: 600 }}>🎬 Video Ready</span>
                    ) : (
                      <span style={{ color: "#888" }}>📹 No Video</span>
                    )}
                  </span>
                </div>
                <div className="cms-episode-actions">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                    hidden
                    ref={(el) => (fileInputs.current[e.id] = el)}
                    onChange={(ev) => ev.target.files?.[0] && handleVideoUpload(e.id, ev.target.files[0])}
                  />

                  {e.video_url && (
                    <button
                      className="cms-btn secondary small"
                      onClick={() => setPreviewEpId(previewEpId === e.id ? null : e.id)}
                      title="Preview video"
                    >
                      {previewEpId === e.id ? "Hide Video" : "▶ Play"}
                    </button>
                  )}

                  <button
                    className="cms-btn secondary small"
                    disabled={uploadingEpId === e.id}
                    onClick={() => fileInputs.current[e.id]?.click()}
                    title={e.video_url ? "Replace video file from computer" : "Upload video file from computer"}
                  >
                    {uploadingEpId === e.id ? "Uploading…" : e.video_url ? "Replace Video" : "📁 Add Video"}
                  </button>

                  {e.video_url && (
                    <button
                      className="cms-btn danger small"
                      onClick={() => handleVideoDelete(e.id)}
                      title="Remove video file"
                    >
                      ❌ Video
                    </button>
                  )}

                  <select className="cms-select" style={{ width: "auto", padding: "6px 10px" }} value={e.status} onChange={(ev) => patchEp(e.id, { status: ev.target.value })}>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                  {!e.duration_seconds && (
                    <input
                      placeholder="dur (sec)"
                      className="cms-input"
                      style={{ width: 80, padding: "6px 10px" }}
                      onKeyDown={(ev) =>
                        ev.key === "Enter" &&
                        patchEp(e.id, { duration_seconds: Number((ev.target as HTMLInputElement).value) })
                      }
                    />
                  )}
                  <button className="cms-btn secondary small" onClick={() => {
                    setEditing(e.id);
                    setEditForm({ title: e.title, description: e.description || "", duration_seconds: e.duration_seconds || "" });
                  }}>✏️</button>
                  <button className="cms-btn danger small" onClick={() => delEp(e.id)}>🗑</button>
                </div>
              </div>

              {previewEpId === e.id && e.video_url && (
                <div style={{ marginTop: 12, padding: 8, background: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, color: "#eee", fontSize: "0.85rem" }}>
                    <span>🎬 Video Preview: <b>{e.title}</b></span>
                    <button className="cms-btn secondary small" style={{ padding: "2px 8px" }} onClick={() => setPreviewEpId(null)}>Close</button>
                  </div>
                  <video src={e.video_url} controls style={{ width: "100%", maxHeight: 260, borderRadius: 6, background: "#000" }} />
                </div>
              )}
            </>
          )}
        </div>
      ))}

      <div className="cms-add-form">
        <b style={{ gridColumn: "1 / -1" }}>Add episode</b>
        <input
          placeholder="Title"
          className="cms-input"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        />
        <input
          placeholder="Episode #"
          type="number"
          className="cms-input"
          value={draft.episode_number}
          onChange={(e) => setDraft((d) => ({ ...d, episode_number: +e.target.value }))}
        />
        <input
          placeholder="Content group"
          type="text"
          className="cms-input"
          value={draft.content_group}
          onChange={(e) => setDraft((d) => ({ ...d, content_group: e.target.value }))}
        />
        <select className="cms-select" value={draft.language} onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}>
          {LANGUAGES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <input
          placeholder="Duration (seconds)"
          type="number"
          className="cms-input"
          value={draft.duration_seconds}
          onChange={(e) => setDraft((d) => ({ ...d, duration_seconds: e.target.value }))}
        />
        <button className="cms-btn" style={{ gridColumn: "1 / -1" }} onClick={addEpisode}>
          Add episode
        </button>
      </div>
    </div>
  );
}
