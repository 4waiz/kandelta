"use client";

import { useJson } from "@/lib/useJson";
import { EarOff, ExternalLink } from "lucide-react";
import type { Landscape } from "@/lib/whitespace/landscape";
import { fmtCompact, fmtInt, fmtPct } from "@/lib/format";
import { Skeleton } from "./ui";

export function BrandLandscape({ q, id, universe, opportunityName }: { q: string; id: string; universe: string; opportunityName: string }) {
  const { data, error } = useJson<Landscape>(`/api/landscape?q=${encodeURIComponent(q)}&id=${encodeURIComponent(id)}`);

  if (error) return <div className="rounded-xl border border-line bg-panel p-5 text-sm text-muted">{error}</div>;
  if (!data) return <Skeleton className="h-64" />;
  if (!data.brands.length) return null;

  const totalMentions = data.brands.reduce((a, b) => a + b.mentions, 0);
  const maxMentions = Math.max(...data.brands.map((b) => b.mentions));
  const topHidden = data.brands.slice().sort((a, b) => b.hidden - a.hidden)[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Who&apos;s already there</div>
        <p className="mt-2 text-[15px] font-medium leading-snug">
          The {data.brands.length} biggest {universe} brands collect {fmtInt(totalMentions)} mentions across {universe} videos, but only {fmtInt(data.brandedInOpportunity)} of those mentions are in {opportunityName.toLowerCase()} videos. No single brand owns this space.
        </p>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_70px_90px] gap-x-3 pb-1.5 text-[10px] uppercase tracking-wider text-faint">
          <span>Brand</span>
          <span>{universe} videos mentioning it</span>
          <span className="text-right">In this gap</span>
          <span className="text-right">Hidden</span>
        </div>
        <div className="space-y-2">
          {data.brands.map((b) => (
            <div key={b.name} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_70px_90px] items-center gap-x-3 text-xs">
              <span className="truncate text-fg">{b.name}</span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 rounded-full bg-[#6b6b74]" style={{ width: `${Math.max(4, (b.mentions / maxMentions) * 100)}%` }} />
                <span className="tabular text-faint">{fmtInt(b.mentions)}</span>
              </span>
              <span className="text-right tabular text-accent">{fmtInt(b.inOpportunity)}</span>
              <span className="text-right tabular text-muted">
                {fmtInt(b.hidden)} <span className="text-faint">({fmtPct(b.hiddenShare, 0)})</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-faint">{data.note} Counts from Oriane across the whole index, last 3 months.</p>
      </div>

      <div className="rounded-xl border border-line bg-panel p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
          <EarOff size={13} /> Hidden conversation
        </div>
        <p className="mt-2 text-[15px] font-medium leading-snug">
          {topHidden.name} is spoken about in {fmtInt(topHidden.hidden)} {universe} videos that never caption or tag it.
        </p>
        <p className="mt-1 text-xs text-muted">What&apos;s said when the brand isn&apos;t tagged, transcribed by Oriane:</p>
        <ul className="mt-3 space-y-3">
          {data.hiddenQuotes.map((h) => (
            <li key={h.handle + h.quote} className="flex gap-3">
              {h.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.thumbnail} alt="" className="h-14 w-10 shrink-0 rounded-md border border-line object-cover" />
              ) : null}
              <div className="min-w-0">
                <p className="text-sm text-fg">“{h.quote}”</p>
                <p className="mt-0.5 text-[11px] text-faint">
                  @{h.handle} · {h.at !== null ? `at ${Math.floor(h.at)}s` : "time unavailable"} · {fmtCompact(h.views)} views{" "}
                  {h.url ? (
                    <a href={h.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-muted hover:text-fg">
                      source <ExternalLink size={10} />
                    </a>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
