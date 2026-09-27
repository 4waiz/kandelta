import { Database, Radio } from "lucide-react";
import { timeAgo } from "@/lib/format";

/** Always tells the viewer whether numbers came live from Oriane or from a cached real response. */
export function SourceBadge({ sources, fetchedAt }: { sources: Record<string, number>; fetchedAt: string | null }) {
  const live = (sources.live ?? 0) > 0;
  const stale = (sources["stale-cache"] ?? 0) > 0;
  if (stale)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-warn/30 bg-warn/10 px-2 py-1 text-xs text-warn" title="Oriane was unreachable; showing the last real response">
        <Database size={13} /> Cached result · Oriane unreachable
      </span>
    );
  return live ? (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-xs text-accent">
      <Radio size={13} /> Live from Oriane
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs text-muted" title="Real Oriane response served from cache to protect API credits">
      <Database size={13} /> Cached result{fetchedAt ? ` · ${timeAgo(fetchedAt)}` : ""}
    </span>
  );
}
