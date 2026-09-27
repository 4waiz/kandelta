"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Eye, MessageSquareText, RotateCw, ShieldCheck } from "lucide-react";
import type { OpportunityDetail } from "@/lib/whitespace/opportunity";
import type { LabContext } from "@/lib/whitespace/audience";
import { fmtCompact, fmtInt, fmtPct, fmtX } from "@/lib/format";
import { useVault } from "@/lib/vault";
import { Button, Chip, SectionTitle, Skeleton, StageBadge, Stat, cn } from "./ui";
import { MethodButton } from "./MethodModal";
import { SourceBadge } from "./SourceBadge";
import { VideoCard } from "./VideoCard";
import { CrowdGapCard } from "./CrowdGapCard";
import { AudienceLab } from "./AudienceLab";
import { Activate } from "./Activate";
import { BrandLandscape } from "./BrandLandscape";

const SECTIONS = [
  ["overview", "Overview"],
  ["evidence", "Evidence"],
  ["crowd-gap", "Crowd Gap"],
  ["dna", "Creative DNA"],
  ["audience-lab", "Audience Lab"],
  ["creators", "Creators"],
  ["activate", "Activate"],
] as const;

const STAGES = ["EARLY", "EMERGING", "CROWDED", "SATURATED"] as const;

function SaturationClock({ share, stage, momentum, n }: { share: number; stage: (typeof STAGES)[number]; momentum: number | null; n: number }) {
  // Segments follow the stage thresholds (0.5%, 1.5%, 4%) on a log scale.
  const pos = Math.max(0.02, Math.min(0.98, (Math.log10(Math.max(share, 0.0005)) - Math.log10(0.0005)) / (Math.log10(0.12) - Math.log10(0.0005))));
  const seg = (lo: number, hi: number) => ((Math.log10(hi) - Math.log10(lo)) / (Math.log10(0.12) - Math.log10(0.0005))) * 100;
  const widths = [seg(0.0005, 0.005), seg(0.005, 0.015), seg(0.015, 0.04), seg(0.04, 0.12)];
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-faint">Saturation clock</div>
        <StageBadge stage={stage} />
      </div>
      <div className="relative mt-3">
        <div className="flex h-1.5 overflow-hidden rounded-full">
          {STAGES.map((s, i) => (
            <div key={s} style={{ width: `${widths[i]}%` }} className={cn(i === 0 ? "bg-accent/70" : i === 1 ? "bg-blue/50" : i === 2 ? "bg-warn/50" : "bg-bad/50", i > 0 && "border-l border-bg")} />
          ))}
        </div>
        <div className="absolute -top-1 h-3.5 w-0.5 rounded bg-fg" style={{ left: `${pos * 100}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[9px] uppercase tracking-wider text-faint">
        {STAGES.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <div className="mt-2 text-xs text-muted">
        {fmtInt(n)} videos · {fmtPct(share)} of supply
        {momentum !== null ? ` · last 30 days: new supply at ${fmtX(momentum)} the market's pace` : ""}
      </div>
      <div className="mt-1 text-[10px] text-faint">Current observed saturation, not a forecast.</div>
    </div>
  );
}

export function OpportunityView() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const id = params.get("id") ?? "";
  const [data, setData] = useState<OpportunityDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [showAds, setShowAds] = useState(false);
  const { save, isSaved } = useVault();

  useEffect(() => {
    if (!q || !id) return;
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`/api/opportunity?q=${encodeURIComponent(q)}&id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) setError(j.error ?? "Video intelligence temporarily unavailable.");
        else setData(j);
      })
      .catch(() => !cancelled && setError("Video intelligence temporarily unavailable."));
    return () => {
      cancelled = true;
    };
  }, [q, id, nonce]);

  const labCtx: LabContext | null = useMemo(() => {
    if (!data) return null;
    const visual = data.crowdGaps.find((g) => g.id === "visual");
    return {
      topic: data.market.label,
      location: data.market.location,
      opportunity: data.opportunity.name,
      evidenceCount: data.dna.sample,
      talkFirstShare: data.dna.norms.talkFirstShare,
      medianDuration: data.dna.norms.medianDuration,
      originalAudioShare: data.dna.norms.originalAudioShare,
      topHookType: data.dna.norms.topHookType,
      arabicShare: data.dna.norms.arabicShare,
      crowdConsensus: visual?.consensus.label ?? null,
      crowdWinner: visual?.winner.label ?? null,
    };
  }, [data]);

  if (error)
    return (
      <div className="mt-12 flex flex-col items-start gap-3 rounded-xl border border-line bg-panel p-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle size={16} className="text-warn" /> {error}
        </div>
        <Button variant="outline" onClick={() => setNonce((n) => n + 1)}>
          <RotateCw size={14} /> Try again
        </Button>
      </div>
    );

  if (!data || !labCtx)
    return (
      <div className="pt-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-5 w-96" />
        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );

  const o = data.opportunity;
  const organic = data.evidence.filter((v) => !v.sponsored && !v.likelyBoosted);
  const paid = data.evidence.filter((v) => v.sponsored || v.likelyBoosted);
  const visualGap = data.crowdGaps.find((g) => g.id === "visual");
  const otherGaps = data.crowdGaps.filter((g) => g.id !== "visual" && g.isGap);
  const missed = data.captionOverlap ? o.stats.n - data.captionOverlap.n : null;
  const from = { query: data.query, opportunity: data.brief.title };

  const whyVideo = (v: (typeof data.evidence)[number]) => {
    const parts: string[] = [];
    if (v.visualMatch !== null) parts.push(`Oriane vision match ${v.visualMatch.toFixed(2)}`);
    return parts.join(" · ");
  };

  return (
    <div className="pt-6">
      <Link href={`/discover?q=${encodeURIComponent(q)}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> WhiteSpace map · {data.query}
      </Link>

      {/* ---------- OVERVIEW ---------- */}
      <section id="overview" className="scroll-mt-24 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              {o.kind === "visual" ? (
                <Chip tone="accent">
                  <Eye size={12} /> Seen in the video
                </Chip>
              ) : (
                <Chip>
                  <MessageSquareText size={12} /> Said in the video
                </Chip>
              )}
              <StageBadge stage={o.stage} />
              <Chip>
                #{data.rank} of {data.totalAngles} angles
              </Chip>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{o.name}</h1>
            <p className="mt-2 text-sm text-muted">{o.description}</p>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-medium uppercase tracking-wider text-faint">Opportunity score</div>
            <div className="text-5xl font-semibold tabular text-accent">{o.score}</div>
            <div className="mt-1">
              <MethodButton label="How is this calculated?" />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-accent/25 bg-accent/[0.04] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Why this matters</div>
          <p className="mt-2 text-lg leading-relaxed">
            Only <span className="font-semibold">{fmtInt(o.stats.n)}</span> of {fmtInt(data.market.n)} {data.market.universe} videos ({fmtPct(o.supplyShare)}) {o.kind === "visual" ? "show this" : "use this angle"}, yet they earn{" "}
            <span className="font-semibold text-accent">{fmtX(o.engagementIndex)} the engagement per view</span> and {fmtX(o.reachIndex)} the views per follower of the average{" "}
            {data.market.universe} video. Audiences respond. Few creators are making it.
          </p>
          {missed !== null && data.captionOverlap ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-muted">
              <Eye size={15} className="mt-0.5 shrink-0 text-accent" />
              <span>
                Found by watching, not reading: only {fmtInt(data.captionOverlap.n)} of these {fmtInt(o.stats.n)} videos say or write “{data.captionOverlap.phrases[0]}”. A caption or transcript search would miss{" "}
                <span className="text-fg">{fmtPct(missed / o.stats.n, 0)}</span> of this opportunity. Oriane&apos;s vision sees it in the frames.
              </span>
            </p>
          ) : null}
          {paid.length >= 2 ? (
            <p className="mt-2 flex items-start gap-2 text-sm text-muted">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-warn" />
              <span>
                {paid.length} of the most-watched examples are brand ads or boosted posts ({[...new Set(paid.flatMap((v) => v.mentions).filter(Boolean))].slice(0, 3).map((m) => "@" + m).join(", ") || "paid partnerships"}).
                Brands already pay to distribute this look; organic creators barely make it.
              </span>
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Audience response" value={fmtX(o.relativePerformance)} sub="vs market average (1.0×)" tone="accent" />
          <Stat label="Engagement per view" value={fmtX(o.engagementIndex)} sub={`${fmtPct(o.stats.er, 1)} vs ${fmtPct(data.market.er, 1)} market`} />
          <Stat label="Views per follower" value={fmtX(o.reachIndex)} sub={`${o.stats.reach.toFixed(2)} vs ${data.market.reach.toFixed(2)} market`} />
          <SaturationClock share={o.supplyShare} stage={o.stage} momentum={o.momentum} n={o.stats.n} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-faint">
          <SourceBadge sources={data.sources} fetchedAt={null} />
          <span>Top 3 videos excluded from every rate · confidence {Math.round(o.confidence * 100)}% · {o.signal}</span>
        </div>
      </section>

      {/* ---------- SECTION NAV ---------- */}
      <nav className="sticky top-14 z-20 -mx-4 mt-8 border-y border-line-soft bg-bg/85 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex gap-1 overflow-x-auto py-2 scrollbar-thin">
          {SECTIONS.map(([sid, label]) => (
            <a key={sid} href={`#${sid}`} className="shrink-0 rounded-md px-2.5 py-1 text-xs text-muted transition-colors hover:bg-panel-2 hover:text-fg">
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* ---------- EVIDENCE ---------- */}
      <section className="mt-10">
        <SectionTitle id="evidence" eyebrow="Evidence" title="Real videos from Oriane">
          <span className="text-xs text-faint">
            {organic.length} organic examples{data.hiddenUnsafe ? ` · ${data.hiddenUnsafe} hidden by brand-safety filter` : ""}
          </span>
        </SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {organic.slice(0, 8).map((v) => (
            <VideoCard key={v.id} v={v} marketReach={data.market.reach} marketEr={data.market.er} why={whyVideo(v)} saved={isSaved(v.id)} onSave={() => save(data.brief.title, v, from)} />
          ))}
        </div>
        {paid.length ? (
          <div className="mt-4">
            <button onClick={() => setShowAds((s) => !s)} className="text-xs text-muted hover:text-fg">
              {showAds ? "Hide" : "Show"} {paid.length} brand ads / boosted posts with this look →
            </button>
            {showAds ? (
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {paid.map((v) => (
                  <VideoCard key={v.id} v={v} marketReach={data.market.reach} marketEr={data.market.er} why={whyVideo(v)} saved={isSaved(v.id)} onSave={() => save(data.brief.title, v, from)} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* ---------- CROWD GAP ---------- */}
      <section className="mt-14">
        <SectionTitle id="crowd-gap" eyebrow="Crowd gap" title="What most creators do vs what audiences reward" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {visualGap ? <CrowdGapCard gap={visualGap} /> : null}
          {otherGaps.slice(0, 1).map((g) => (
            <CrowdGapCard key={g.id} gap={g} />
          ))}
          {!otherGaps.length ? (
            <div className="rounded-xl border border-line bg-panel p-5 text-sm text-muted">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Other dimensions checked</div>
              <ul className="mt-2 space-y-1.5">
                {data.crowdGaps
                  .filter((g) => g.id !== "visual")
                  .map((g) => (
                    <li key={g.id}>
                      <span className="text-fg">{g.dimension}:</span> {g.headline}
                    </li>
                  ))}
              </ul>
              <p className="mt-3 text-xs text-faint">WhiteSpace only reports a gap when the data shows one.</p>
            </div>
          ) : null}
        </div>
        <div className="mt-4">
          <BrandLandscape q={q} id={id} universe={data.market.universe} opportunityName={o.name} />
        </div>
      </section>

      {/* ---------- CREATIVE DNA ---------- */}
      <section className="mt-14">
        <SectionTitle id="dna" eyebrow="Creative DNA" title="What the winners have in common">
          <span className="text-xs text-faint">Measured on {data.dna.sample} organic evidence videos</span>
        </SectionTitle>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="rounded-xl border border-line bg-panel">
            {data.dna.traits.map((t) => (
              <div key={t.label} className="grid grid-cols-[110px_1fr_64px] items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">{t.label}</div>
                <div>
                  <div className="text-sm">{t.value}</div>
                  {t.note ? <div className="text-[11px] text-faint">{t.note}</div> : null}
                </div>
                <div className="text-right">
                  <div className="text-xs tabular text-muted">
                    {t.support}/{t.of}
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-line">
                    <div className="h-1 rounded-full bg-accent/70" style={{ width: `${(t.support / Math.max(t.of, 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-panel p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Hooks that worked (first 3 seconds, transcribed by Oriane)</div>
              <ul className="mt-3 space-y-3">
                {data.dna.hooks.slice(0, 3).map((h) => (
                  <li key={h.videoId} className="text-sm">
                    <span className="text-fg">“{h.text}”</span>
                    <span className="mt-0.5 block text-[11px] text-faint">
                      @{h.handle}
                      {h.reach ? ` · ${h.reach >= 10 ? h.reach.toFixed(0) : h.reach.toFixed(1)} views per follower` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              {data.dna.hookTypes.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.dna.hookTypes.map((h) => (
                    <Chip key={h.type}>
                      {h.type} · {h.count}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </div>
            {data.dna.audienceVoice.length ? (
              <div className="rounded-xl border border-line bg-panel p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Audience voice (top comments)</div>
                <ul className="mt-3 space-y-2">
                  {data.dna.audienceVoice.slice(0, 3).map((c) => (
                    <li key={c.text} className="text-sm text-muted">
                      “{c.text}” <span className="text-[11px] text-faint">· {fmtInt(c.likes)} likes</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ---------- AUDIENCE LAB ---------- */}
      <section className="mt-14">
        <SectionTitle id="audience-lab" eyebrow="Audience Lab" title="Test the concept before you shoot it" />
        <div className="mt-4">
          <AudienceLab initialScript={data.brief.script} ctx={labCtx} />
        </div>
      </section>

      {/* ---------- CREATORS ---------- */}
      <section className="mt-14">
        <SectionTitle id="creators" eyebrow="Creator fit" title="Creators who can execute this">
          <span className="text-xs text-faint">Fit = 35% beat own median · 20% reach · 15% engagement · 20% on-topic · 10% fresh</span>
        </SectionTitle>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.creators.map((c) => (
            <div key={c.handle} className="rounded-xl border border-line bg-panel p-4">
              <div className="flex items-center gap-3">
                {c.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatar} alt="" className="h-10 w-10 rounded-full border border-line object-cover" />
                ) : (
                  <span className="h-10 w-10 rounded-full bg-panel-2" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">@{c.handle}</div>
                  <div className="text-[11px] text-faint">
                    {c.platform === "tiktok" ? "TikTok" : "Instagram"} · {fmtCompact(c.followers)} followers
                    {c.medianViews ? ` · median ${fmtCompact(c.medianViews)} views` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold tabular">{c.fit}</div>
                  <div className="text-[10px] uppercase tracking-wider text-faint">fit</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {(
                  [
                    ["Beat median", c.components.execution],
                    ["Reach", c.components.reach],
                    ["Engagement", c.components.resonance],
                    ["On-topic", c.components.topic],
                    ["Fresh", c.components.freshness],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <div className="h-1 rounded-full bg-line">
                      <div className="h-1 rounded-full bg-accent/70" style={{ width: `${Math.round(v * 100)}%` }} />
                    </div>
                    <div className="mt-1 text-[9px] uppercase tracking-wide text-faint">{k}</div>
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-1 text-xs text-muted">
                {c.why.slice(0, 3).map((w) => (
                  <li key={w}>· {w}</li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                {c.videos.slice(0, 3).map((v) =>
                  v.thumbnail ? (
                    <a key={v.id} href={v.url ?? "#"} target="_blank" rel="noreferrer" title={v.caption.slice(0, 80)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.thumbnail} alt="" className="h-16 w-12 rounded-md border border-line object-cover opacity-90 hover:opacity-100" />
                    </a>
                  ) : null,
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- ACTIVATE ---------- */}
      <section className="mt-14">
        <SectionTitle id="activate" eyebrow="Activate" title="Build the campaign" />
        <div className="mt-4">
          <Activate brief={data.brief} evidence={organic} />
        </div>
      </section>
    </div>
  );
}
