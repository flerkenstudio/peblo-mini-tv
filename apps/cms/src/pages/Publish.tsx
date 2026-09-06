import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import ValidationBanner from "../components/ValidationBanner";
import { canPublish } from "../hooks/useCatalog";

export default function Publish() {
  const [report, setReport] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const nav = useNavigate();
  const role = localStorage.getItem("role");

  const load = useCallback(async () => {
    try {
      setReport(await api("/admin/validation-report"));
      setRuns(await api("/admin/catalog/publish-runs"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function doPublish() {
    setPublishing(true);
    setMessage("");
    try {
      const res = await api("/admin/catalog/publish", { method: "POST" });
      setMessage(`✅ Published! Version ${res.version} — ${res.shows} shows, ${res.episodes} episodes.`);
      load();
    } catch (e: any) {
      const reason = e.reason?.blocking_count
        ? `${e.reason.blocking_count} blocking problem(s) — see above`
        : e.reason || e.detail || "see problems above";
      setMessage(`❌ Publish blocked: ${reason}`);
    } finally {
      setPublishing(false);
    }
  }

  const blocked = !report?.ok;
  const noPermission = !canPublish(role);

  return (
    <div className="cms-shell">
      <button className="cms-btn secondary" onClick={() => nav("/")}>← Back to Library</button>
      <div className="cms-header" style={{ marginTop: 16 }}>
        <h1>🚀 Publish</h1>
      </div>

      <ValidationBanner report={report} />

      {loading && <p className="cms-empty">Loading publish data…</p>}

      <div className="cms-publish-bar">
        <button
          className="cms-btn"
          onClick={doPublish}
          disabled={blocked || noPermission || publishing}
        >
          {publishing ? "Publishing…" : "Publish Catalogue"}
        </button>
        {noPermission && <span className="cms-hint error-text">Sign in required to publish.</span>}
        {blocked && <span className="cms-hint error-text">Fix all problems above to enable publishing.</span>}
      </div>

      {message && <div className={message.includes("✅") ? "cms-alert success" : "cms-alert error"}>{message}</div>}

      <h2 style={{ marginTop: 32 }}>Publish History</h2>
      <div className="cms-table-wrap">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Started</th>
              <th>By</th>
              <th>Status</th>
              <th>Shows</th>
              <th>Episodes</th>
              <th>Version</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.started_at).toLocaleString()}</td>
                <td>{r.triggered_by}</td>
                <td>
                  {r.status === "success" ? "✅" : "❌"} {r.status}
                </td>
                <td>{r.shows ?? "—"}</td>
                <td>{r.episodes ?? "—"}</td>
                <td>
                  <code>{r.version || "—"}</code>
                </td>
                <td style={{ color: "#c00", maxWidth: 260 }}>{r.error || ""}</td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={7} className="cms-empty">
                  No publish runs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
