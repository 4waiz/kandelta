"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { ALL_TAGS, useVault } from "@/lib/vault";
import { fmtCompact, fmtPct, fmtRatio } from "@/lib/format";
import { Chip, cn } from "@/components/ui";

export default function VaultPage() {
  const { collections, update, remove } = useVault();
  const [active, setActive] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const col = collections.find((c) => c.id === active) ?? collections[0];
  const items = useMemo(() => (col ? col.items.filter((i) => !tag || i.tags.includes(tag)) : []), [col, tag]);
  const usedTags = useMemo(() => ALL_TAGS.filter((t) => col?.items.some((i) => i.tags.includes(t))), [col]);

  return (
    <div className="pt-10">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Evidence Vault</div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Your swipe file of real videos</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Save evidence from any opportunity. WhiteSpace keeps the source link, thumbnail and Oriane intelligence. Video files stay on the platforms. Saved in this browser.
      </p>

      {!collections.length ? (
        <div className="mt-10 flex flex-col items-start gap-3 rounded-xl border border-dashed border-line p-8">
          <Bookmark size={20} className="text-faint" />
          <p className="text-sm text-muted">Nothing saved yet. Open an opportunity and use the bookmark on any evidence video.</p>
          <Link href="/" className="text-sm text-accent hover:underline">
            Find an opportunity →
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-2">
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActive(c.id);
                  setTag(null);
                }}
                className={cn("rounded-lg border px-3 py-1.5 text-sm transition-colors", col?.id === c.id ? "border-faint bg-panel-2 text-fg" : "border-line text-muted hover:text-fg")}
              >
                {c.name} <span className="ml-1 text-xs text-faint">{c.items.length}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-faint">Filter</span>
            <button onClick={() => setTag(null)} className={cn("rounded-md border px-2 py-0.5 text-[11px]", !tag ? "border-faint text-fg" : "border-line text-muted")}>
              All
            </button>
            {usedTags.map((t) => (
              <button key={t} onClick={() => setTag(t === tag ? null : t)} className={cn("rounded-md border px-2 py-0.5 text-[11px]", tag === t ? "border-accent/40 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg")}>
                {t}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((i) => (
              <div key={i.videoId} className="flex gap-3 rounded-xl border border-line bg-panel p-3">
                {i.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.thumbnail} alt="" className="h-36 w-24 shrink-0 rounded-lg border border-line object-cover" />
                ) : (
                  <div className="h-36 w-24 shrink-0 rounded-lg bg-panel-2" />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">@{i.handle}</div>
                      <div className="text-[11px] text-faint">
                        {i.platform === "tiktok" ? "TikTok" : "Instagram"} · {fmtCompact(i.views)} views · {fmtRatio(i.reach)} views/follower{i.er !== null ? ` · ${fmtPct(i.er, 1)} eng.` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {i.url ? (
                        <a href={i.url} target="_blank" rel="noreferrer" className="rounded-md p-1 text-faint hover:text-fg" aria-label="Open source">
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                      <button onClick={() => col && remove(col.id, i.videoId)} className="rounded-md p-1 text-faint hover:text-bad" aria-label="Remove from vault">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {i.hook ? <p className="line-clamp-2 text-xs text-muted">“{i.hook}”</p> : null}
                  <div className="flex flex-wrap gap-1">
                    {ALL_TAGS.filter((t) => i.tags.includes(t)).map((t) => (
                      <button key={t} onClick={() => col && update(col.id, i.videoId, { tags: i.tags.filter((x) => x !== t) })} title="Remove tag">
                        <Chip tone="accent">{t}</Chip>
                      </button>
                    ))}
                    <select
                      value=""
                      onChange={(e) => col && e.target.value && update(col.id, i.videoId, { tags: [...i.tags, e.target.value] })}
                      className="rounded-md border border-line bg-bg px-1 text-[11px] text-faint"
                      aria-label="Add tag"
                    >
                      <option value="">+ tag</option>
                      {ALL_TAGS.filter((t) => !i.tags.includes(t)).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    defaultValue={i.note}
                    onBlur={(e) => col && update(col.id, i.videoId, { note: e.target.value })}
                    placeholder="Add a note…"
                    rows={2}
                    className="mt-auto w-full resize-none rounded-md border border-line-soft bg-bg px-2 py-1 text-xs text-muted outline-none focus:border-faint"
                  />
                  {i.from ? <div className="text-[10px] text-faint">From: {i.from.opportunity}</div> : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
