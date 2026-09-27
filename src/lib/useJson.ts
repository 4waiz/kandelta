"use client";

import { useEffect, useState } from "react";

/** Fetch JSON keyed by URL. State is only set from async callbacks; stale results are ignored by key. */
export function useJson<T>(url: string | null) {
  const [nonce, setNonce] = useState(0);
  const key = url ? `${url}#${nonce}` : null;
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null);
  useEffect(() => {
    if (!url || !key) return;
    let cancelled = false;
    fetch(url)
      .then(async (r) => {
        const j = await r.json();
        if (!cancelled) setResult(r.ok ? { key, data: j as T } : { key, error: j.error ?? "Video intelligence temporarily unavailable." });
      })
      .catch(() => !cancelled && setResult({ key, error: "Video intelligence temporarily unavailable." }));
    return () => {
      cancelled = true;
    };
  }, [url, key]);
  const current = result && result.key === key ? result : null;
  return { data: current?.data ?? null, error: current?.error ?? null, retry: () => setNonce((n) => n + 1) };
}
