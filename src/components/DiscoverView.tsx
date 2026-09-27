"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Eye, Info, MessageSquareText, RotateCw } from "lucide-react";
import type { MarketAnalysis, Opportunity } from "@/lib/whitespace/analyze";
import { fmtCompact, fmtInt, fmtPct, fmtX } from "@/lib/format";
import { WhiteSpaceMap } from "./WhiteSpaceMap";
import { CrowdGapCard } from "./CrowdGapCard";
import { MethodButton } from "./MethodModal";
import { SearchBox } from "./SearchBox";
import { Button, Chip, Skeleton, StageBadge } from "./ui";
import { SourceBadge } from "./SourceBadge";
import { DEMO_OPPORTUNITY, usePresenter } from "./Presenter";
import { useJson } from "@/lib/useJson";

const LOADING = [
  "Asking Oriane what's inside the videos…",
  "Counting how many creators use each angle…",
  "Measuring views per follower and engagement per view…",
  "Watching frames for visual styles…",
  "Looking for crowd gaps…",
];

export function useAnalysis(q: string | null) {
  return useJson<MarketAnalysis>(q ? `/api/analyze?q=${encodeURIComponent(q)}` : null);
}

export function DiscoverView() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q");
  const { data, error, retry } = useAnalysis(q);
  const [tick, setTick] = useState(0);
  const { active } = usePresenter();

  useEffect(() => {
    if (data || error) return;
    const t = setInterval(() => setTick((x) => x + 1), 1700);
    return () => clearInterval(t);
  }, [data, error]);

  if (!q)
    return (
      <div className="mx-auto max-w-2xl pt-24">
        <SearchBox />
      </div>
    );

  const open = (o: Opportunity) => router.push(`/opportunity?q=${encodeURIComponent(q)}&id=${o.id}`);

  return (
    <div className="pt-8">
      <div className="max-w-xl">
        <SearchBox size="sm" key={q} />
      </div>

      {error ? (
        <div className="mt-10 flex flex-col items-start gap-3 rounded-xl border border-line bg-panel p-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle size={16} className="text-warn" /> {error}
          </div>
          <p className="text-sm text-muted">No cached result exists for this search yet. KanDelta never substitutes made-up data.</p>
          <Button variant="outline" onClick={retry}>
            <RotateCw size={14} /> Try again
          </Button>
        </div>
      ) : !data ? (
        <div className="mt-8">
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            {LOADING[tick % LOADING.length]}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-[440px] lg:col-span-2" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="fade-in">
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Delta Map</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{data.query}</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted">
                Oriane measured <span className="text-fg">{fmtInt(data.baseline.n)} videos</span> ({fmtCompact(data.baseline.views)} views) and{" "}
                {data.opportunities.length} creative angles. {data.opportunities.filter((o) => o.quadrant === "white-space").length} show an opportunity delta.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <SourceBadge sources={data.sources} fetchedAt={data.newestFetch} />
              <MethodButton />
            </div>
          </div>

          {data.note ? (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-xs text-muted">
              <Info size={14} className="mt-0.5 shrink-0 text-faint" />
              {data.note}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div id="map" className="scroll-mt-24 rounded-xl border border-line bg-panel p-4 lg:col-span-2">
              <WhiteSpaceMap items={data.opportunities} onSelect={open} highlight={active ? DEMO_OPPORTUNITY : data.opportunities[0]?.id} />
            </div>
            <div id="top-opportunities" className="scroll-mt-24 rounded-xl border border-line bg-panel">
              <div className="border-b border-line-soft px-4 py-3">
                <div className="text-sm font-semibold">Strongest opportunities</div>
                <div className="text-xs text-faint">Ranked by Opportunity Score</div>
              </div>
              <ul className="divide-y divide-line-soft">
                {data.opportunities.slice(0, 7).map((o, i) => (
                  <li key={o.id}>
                    <button onClick={() => open(o)} className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel-2">
                      <span className="w-4 shrink-0 text-xs tabular text-faint">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          {o.kind === "visual" ? <Eye size={13} className="shrink-0 text-accent" /> : <MessageSquareText size={13} className="shrink-0 text-faint" />}
                          <span className="truncate">{o.name}</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-faint">
                          {fmtPct(o.supplyShare)} of supply · {fmtX(o.relativePerformance)} response
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className={`text-lg font-semibold tabular ${o.quadrant === "white-space" ? "text-accent" : ""}`}>{o.score}</span>
                        <StageBadge stage={o.stage} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Crowd gap</div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">What everyone makes vs what audiences reward</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {data.crowdGaps.slice(0, 4).map((g) => (
                <CrowdGapCard key={g.id} gap={g} />
              ))}
            </div>
          </div>

          <p className="mt-6 text-xs text-faint">
            Universe: {data.scope}. <Chip className="ml-1">last 3 months</Chip>
          </p>
        </div>
      )}
    </div>
  );
}
