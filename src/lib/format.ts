export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

export function fmtCompact(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "K";
  return String(Math.round(n));
}

export function fmtPct(x: number, digits?: number) {
  const v = x * 100;
  const d = digits ?? (v < 1 ? 2 : v < 10 ? 1 : 0);
  return v.toFixed(d) + "%";
}

function trimZeros(s: string) {
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
}

export function fmtX(x: number) {
  if (!Number.isFinite(x) || x <= 0) return "—";
  return trimZeros(x >= 10 ? x.toFixed(0) : x >= 3 ? x.toFixed(1) : x.toFixed(2)) + "×";
}

/** Views per follower: 63 · 4.4 · 0.25 · 0.04 */
export function fmtRatio(x: number | null) {
  if (x === null || !Number.isFinite(x)) return "—";
  return x >= 10 ? x.toFixed(0) : x >= 1 ? x.toFixed(1) : x.toFixed(2);
}

export const encodeQ = (q: string) => encodeURIComponent(q);

export function timeAgo(iso: string | null) {
  if (!iso) return "";
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}
