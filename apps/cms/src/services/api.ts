const BASE = "/api";

export function getToken() {
  return localStorage.getItem("token");
}

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
    // Prevent callers from trying to parse a body that will never come.
    return new Promise(() => {});
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw body;
  }

  return res.status === 204 ? null : res.json();
}

export function extractError(e: any): string {
  if (typeof e === 'string') return e;
  if (e?.detail) {
    if (typeof e.detail === 'string') return e.detail;
    if (Array.isArray(e.detail))
      return e.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join('; ');
    return JSON.stringify(e.detail);
  }
  return e?.message || 'An unexpected error occurred';
}
