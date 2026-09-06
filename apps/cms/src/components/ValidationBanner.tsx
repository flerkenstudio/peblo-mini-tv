export default function ValidationBanner({ report }: { report: any }) {
  if (!report) return null;

  return (
    <div className={`cms-alert ${report.ok ? 'success' : 'error'}`}>
      {report.ok ? (
        <b>✅ No blocking problems. Ready to publish.</b>
      ) : (
        <>
          <b>
            ❌ Publishing is blocked — {report.blocking_count} problem(s) to fix:
          </b>
          {Object.entries(report.groups).map(([group, items]: any) => (
            <div key={group} style={{ marginTop: 8 }}>
              <b>{group}</b>
              <ul style={{ margin: "4px 0" }}>
                {items.map((it: any) => (
                  <li key={it.code}>
                    <code style={{ color: "#666" }}>{it.code}</code> — {it.subject}:{" "}
                    {it.problem} <i style={{ color: "#369" }}>Fix: {it.fix}</i>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
