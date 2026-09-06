import { useRef, useState } from "react";
import { getToken, api } from "../services/api";

type Slot = "POSTER" | "BANNER" | "THUMBNAIL";

const SPECS: Record<Slot, { w: number; h: number; hint: string; defaultBg: string }> = {
  POSTER: { w: 600, h: 900, hint: "2:3 portrait, ~600×900, ≤200 KB", defaultBg: "/placeholders/poster.jpg" },
  BANNER: { w: 1280, h: 720, hint: "16:9 landscape, ~1280×720, ≤200 KB", defaultBg: "/placeholders/banner.jpg" },
  THUMBNAIL: { w: 640, h: 360, hint: "16:9 small, ~640×360, ≤200 KB", defaultBg: "/placeholders/thumb.jpg" },
};

export default function ArtworkUploader({
  showId,
  artworks,
  onChange,
}: {
  showId: number;
  artworks: any[];
  onChange: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<Slot, string>>>({});
  const [busy, setBusy] = useState<Slot | null>(null);
  const inputs = useRef<Record<Slot, HTMLInputElement | null>>({
    POSTER: null,
    BANNER: null,
    THUMBNAIL: null,
  });

  const byType = (t: Slot) => artworks.find((a) => a.type === t);

  async function upload(slot: Slot, file: File) {
    setBusy(slot);
    setErrors((e) => ({ ...e, [slot]: undefined }));
    const fd = new FormData();
    fd.append("type", slot);
    fd.append("show_id", String(showId));
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/artworks", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrors((e) => ({ ...e, [slot]: err.detail || "Upload failed" }));
      } else {
        onChange();
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(slot: Slot) {
    const art = byType(slot);
    if (!art) return;
    await api(`/admin/artworks/${art.id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="cms-artwork-grid">
      {(Object.keys(SPECS) as Slot[]).map((slot) => {
        const art = byType(slot);
        const spec = SPECS[slot];
        return (
          <div key={slot} className="cms-artwork-slot">
            <b>{slot}</b>
            <p className="cms-hint">{spec.hint}</p>
            <div
              className="cms-artwork-preview"
              style={{
                width: spec.w / 3,
                height: spec.h / 3,
                backgroundImage: art ? `url(${art.url})` : `url(${spec.defaultBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '16px'
              }}
            />
            <input
              type="file"
              accept="image/png,image/jpeg"
              hidden
              ref={(el) => (inputs.current[slot] = el)}
              onChange={(e) => e.target.files?.[0] && upload(slot, e.target.files[0])}
            />
            <div className="cms-artwork-actions">
              <button className="cms-btn secondary small" disabled={busy === slot} onClick={() => inputs.current[slot]?.click()}>
                {busy === slot ? "..." : "Replace"}
              </button>
              <button className="cms-btn danger small" disabled={!art} onClick={() => remove(slot)}>Remove</button>
            </div>
            {errors[slot] && (
              <p className="cms-hint error-text" style={{ maxWidth: spec.w / 3 }}>{errors[slot]}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
