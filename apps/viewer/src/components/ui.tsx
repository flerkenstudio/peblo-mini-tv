import type { ReactNode } from "react";

export const colors = {
  bg: "#FFFFFF",
  panel: "#F2F2F2",
  text: "#000000",
  muted: "#6B6B6B",
  accent: "#FFBB00",
  border: "rgba(0,0,0,.08)",
};

export const posterStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "2 / 3",
  objectFit: "cover",
  display: "block",
};

export type IconName =
  | "search"
  | "play"
  | "pause"
  | "info"
  | "chevron-left"
  | "chevron-right"
  | "close"
  | "plus"
  | "check"
  | "volume"
  | "volume-x"
  | "refresh";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    play: <path d="m9 7 8 5-8 5z" fill="currentColor" stroke="none" />,
    pause: (
      <>
        <rect x="6" y="5" width="4" height="14" fill="currentColor" stroke="none" />
        <rect x="14" y="5" width="4" height="14" fill="currentColor" stroke="none" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),
    "chevron-left": <path d="m15 18-6-6 6-6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    volume: (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    ),
    "volume-x": (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
        <line x1="22" y1="9" x2="16" y2="15" />
        <line x1="16" y1="9" x2="22" y2="15" />
      </>
    ),
    refresh: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export function Button({
  children,
  variant = "secondary",
  onClick,
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      className={`ui-button ${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function PageShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <main className={`page-shell ${className}`}>{children}</main>;
}

export function Loading() {
  return (
    <div className="state-screen">
      <div className="spinner" />
      <span className="loading-text">Loading your streaming catalogue…</span>
      <div className="skeleton-row-preview">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card skeleton" />
        ))}
      </div>
    </div>
  );
}

export function Empty({
  title,
  msg,
  actionText,
  onAction,
}: {
  title: string;
  msg: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name="info" size={36} />
      </div>
      <h2>{title}</h2>
      <p>{msg}</p>
      {actionText && onAction && (
        <div style={{ marginTop: 20 }}>
          <Button variant="primary" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
