import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const nav = useNavigate();

  useEffect(() => {
    api("/auth/me").then(setMe).catch(() => {});
    api("/admin/validation-report").then(setReport).catch(() => {});
  }, []);

  return (
    <div className="cms-shell">
      <button className="cms-btn secondary" onClick={() => nav("/")}>← Back to Library</button>
      <div className="cms-header" style={{ marginTop: 16 }}>
        <h1>Dashboard</h1>
      </div>
      {me && (
        <p>
          Logged in as <b>{me.email}</b> ({me.role})
        </p>
      )}
      {report && (
        <div className={`cms-alert ${report.ok ? 'success' : 'error'}`}>
          {report.ok ? (
            "✅ No blocking problems"
          ) : (
            <>
              ❌ {report.blocking_count} blocking problems
              {Object.entries(report.groups).map(([g, items]: any) => (
                <p key={g}>
                  <b>{g}</b>: {items.length}
                </p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
