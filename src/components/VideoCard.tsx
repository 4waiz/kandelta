"use client";

import { Bookmark, BookmarkCheck, ExternalLink, Eye } from "lucide-react";
import type { Video } from "@/lib/oriane/normalize";
import { fmtCompact, fmtPct, fmtRatio, fmtX } from "@/lib/format";
import { Chip, cn } from "./ui";

export function PlatformDot({ platform }: { platform: string }) {
  return <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">{platform === "tiktok" ? "TikTok" : "Instagram"}</span>;
}

export function VideoCard({
  v,
  marketReach,
  marketEr,
  why,
  saved,
  onSave,
}: {
  v: Video;
  marketReach: number;
  marketEr: number;
  why?: string;
  saved?: boolean;
  onSave?: () => void;
}) {
  const reachX = v.reach && marketReach ? v.reach / marketReach : null;
  const erX = v.er && marketEr ? v.er / marketEr : null;
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-faint/60">
      <div className="relative aspect-[4/5] overflow-hidden bg-panel-2">
        {v.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.thumbnail} alt={`Video by @${v.creator.handle}`} loading="lazy" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
        ) : null}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2">
          <div className="flex flex-wrap gap-1">
            {v.visualMatch !== null ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-accent backdrop-blur" title="Oriane vision: best frame similarity to the opportunity">
                <Eye size={11} /> {v.visualMatch.toFixed(2)}
              </span>
            ) : null}
            {v.sponsored ? <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-warn backdrop-blur">Ad / partner</span> : null}
            {!v.sponsored && v.likelyBoosted ? (
              <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-warn backdrop-blur" title="Very high views with near-zero engagement, typical of paid distribution">
                Likely boosted
              </span>
            ) : null}
          </div>
          {v.duration ? <span className="rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] tabular text-fg backdrop-blur">{Math.round(v.duration)}s</span> : null}
        </div>
        {v.hook ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-10">
            <p className="line-clamp-3 text-[12px] leading-snug text-fg">“{v.hook}”</p>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">@{v.creator.handle}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-faint">
              <PlatformDot platform={v.platform} /> · {fmtCompact(v.creator.followers)} followers
            </div>
          </div>
          {onSave ? (
            <button onClick={onSave} className={cn("rounded-md p-1.5 transition-colors", saved ? "text-accent" : "text-faint hover:bg-panel-2 hover:text-fg")} aria-label={saved ? "Saved to vault" : "Save to vault"} title={saved ? "Saved to Evidence Vault" : "Save to Evidence Vault"}>
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-1 text-[11px]">
          <div>
            <div className="text-faint">Views</div>
            <div className="tabular font-medium">{fmtCompact(v.views)}</div>
          </div>
          <div>
            <div className="text-faint">Views/follower</div>
            <div className={cn("tabular font-medium", (reachX ?? 0) >= 2 && "text-accent")}>{fmtRatio(v.reach)}</div>
          </div>
          <div>
            <div className="text-faint">Engagement</div>
            <div className={cn("tabular font-medium", (erX ?? 0) >= 1.5 && "text-accent")}>{v.er !== null ? fmtPct(v.er, 1) : "N/A"}</div>
          </div>
        </div>
        {why ? <p className="text-[11px] leading-snug text-muted">{why}</p> : null}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[11px] text-faint">{new Date(v.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          {v.url ? (
            <a href={v.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-fg">
              Open source <ExternalLink size={11} />
            </a>
          ) : null}
        </div>
      </div>
      {erX !== null && reachX !== null && !v.sponsored && !v.likelyBoosted ? (
        <div className="border-t border-line-soft px-3 py-1.5 text-[10px] text-faint">
          {fmtX(reachX)} market views/follower · {fmtX(erX)} market engagement
        </div>
      ) : null}
    </div>
  );
}

export function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Chip key={i}>{i}</Chip>
      ))}
    </div>
  );
}
