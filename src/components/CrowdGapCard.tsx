import { AudioLines, Eye, Languages, Tags, UsersRound } from "lucide-react";
import type { CrowdGap, GapGroup } from "@/lib/whitespace/analyze";
import { fmtInt, fmtPct, fmtX } from "@/lib/format";
import { Chip, cn } from "./ui";

const icons = { visual: Eye, tags: Tags, audio: AudioLines, collab: UsersRound, language: Languages };

function Comparison({ group, isWinner, isGap, responseScale }: { group: GapGroup; isWinner: boolean; isGap: boolean; responseScale: number }) {
  const highlight = isWinner && isGap;
  return (
    <div className={cn("rounded-lg border px-3 py-3 sm:px-4", highlight ? "border-accent/25 bg-accent/[0.045]" : "border-line-soft bg-bg/30")}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className={cn("min-w-0 text-xs font-medium leading-snug sm:text-sm", highlight ? "text-fg" : "text-muted")}>{group.label}</span>
        {highlight ? <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-accent">Rewarded</span> : null}
      </div>
      <div className="space-y-2.5">
        <div className="grid grid-cols-[70px_minmax(0,1fr)_43px] items-center gap-2 text-[10px] text-faint">
          <span>Supply</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${fmtPct(group.share, 1)} of measured supply`}>
            <div className="h-full rounded-full bg-[#777780]" style={{ width: `${Math.min(100, Math.max(0, group.share * 100))}%` }} />
          </div>
          <span className="text-right font-mono tabular text-muted">{fmtPct(group.share, 0)}</span>
        </div>
        <div className="grid grid-cols-[70px_minmax(0,1fr)_43px] items-center gap-2 text-[10px] text-faint">
          <span>Response</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${fmtX(group.response)} audience response versus market`}>
            <div className={cn("h-full rounded-full", highlight ? "bg-accent" : "bg-[#777780]")} style={{ width: `${Math.min(100, Math.max(0, (group.response / responseScale) * 100))}%` }} />
          </div>
          <span className={cn("text-right font-mono tabular", highlight ? "text-accent" : "text-muted")}>{fmtX(group.response)}</span>
        </div>
      </div>
    </div>
  );
}

export function CrowdGapCard({ gap, featured = false }: { gap: CrowdGap; featured?: boolean }) {
  const Icon = icons[gap.id as keyof typeof icons] ?? Eye;
  const groups = gap.groups.filter((g) => g.stats.n >= 30 && g.response > 0).sort((a, b) => b.stats.n - a.stats.n);
  const responseScale = Math.max(1, ...groups.map((g) => g.response));
  const visible = featured && gap.isGap ? [gap.consensus, gap.winner] : groups.slice(0, 2);
  const sample = groups.reduce((total, group) => total + group.stats.n, 0);

  return (
    <article className={cn("min-w-0 rounded-xl border", featured ? "p-5 sm:p-7" : "p-4 sm:p-5", featured && gap.isGap ? "border-accent/30 bg-[linear-gradient(115deg,rgba(110,231,183,0.055),transparent_58%)]" : "border-line bg-panel")}>
      <div className={cn(featured && "grid gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-10")}>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className={cn("flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]", featured && gap.isGap ? "text-accent" : "text-faint")}>
              <Icon size={featured ? 17 : 15} strokeWidth={1.7} aria-hidden="true" />
              {gap.dimension}
            </span>
            <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", gap.isGap ? "border-accent/30 bg-accent/10 text-accent" : "border-line text-faint")}>
              {gap.isGap ? "Gap detected" : "No meaningful gap"}
            </span>
          </div>
          <h3 className={cn("font-semibold tracking-tight", featured ? "mt-5 max-w-md text-2xl leading-tight sm:text-[30px]" : "mt-4 text-base leading-snug")}>
            {gap.isGap ? (
              <><span className="text-muted">{gap.consensus.label}</span> is common. <span className="text-accent">{gap.winner.label}</span> responds better.</>
            ) : (
              <>{gap.consensus.label} is the default. No meaningful gap.</>
            )}
          </h3>
          <div className={cn("flex flex-wrap items-end gap-x-6 gap-y-2", featured ? "mt-6" : "mt-4")}>
            <div>
              <div className={cn("font-mono font-medium tabular tracking-tight", featured ? "text-3xl" : "text-xl", gap.isGap ? "text-accent" : "text-muted")}>
                {gap.isGap ? fmtX(gap.ratio) : fmtX(gap.consensus.response)}
              </div>
              <div className="mt-0.5 text-[10px] text-faint">{gap.isGap ? "response lift vs default" : "response vs market"}</div>
            </div>
            <div>
              <div className="font-mono text-sm tabular text-fg">{fmtInt(sample)}</div>
              <div className="mt-0.5 text-[10px] text-faint">measured videos</div>
            </div>
          </div>
        </div>
        <div className={cn("min-w-0", featured ? "lg:border-l lg:border-line lg:pl-8" : "mt-5")}>
          <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
            <span>Creative choice</span>
            <span>Share / response</span>
          </div>
          <div className={cn("grid gap-2", featured && "sm:grid-cols-2")}>
            {visible.map((group) => (
              <Comparison key={group.label} group={group} isWinner={group.label === gap.winner.label} isGap={gap.isGap} responseScale={responseScale} />
            ))}
          </div>
          {featured && groups.length > visible.length ? <p className="mt-2 text-[10px] text-faint">Showing {visible.length} of {groups.length} measured styles</p> : null}
        </div>
      </div>
    </article>
  );
}

/** Preserve the existing Delta Map treatment independently of the opportunity study. */
export function CrowdGapMapCard({ gap }: { gap: CrowdGap }) {
  const groups = gap.groups.filter((g) => g.stats.n >= 30).sort((a, b) => b.stats.n - a.stats.n);
  const maxShare = Math.max(...groups.map((g) => g.share));
  const maxResp = Math.max(...groups.map((g) => g.response));
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{gap.dimension}</div>
        {gap.isGap ? <Chip tone="accent">Crowd gap · {fmtX(gap.ratio)}</Chip> : <Chip>No gap</Chip>}
      </div>
      <p className="mt-2 text-[15px] font-medium leading-snug">{gap.headline}</p>
      <div className="mt-4">
        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 pb-1.5 text-[10px] uppercase tracking-wider text-faint">
          <span>Choice</span><span>What creators make</span><span>How audiences respond</span>
        </div>
        <div className="space-y-2">
          {groups.map((g) => {
            const isWinner = g.label === gap.winner.label && gap.isGap;
            const isCrowd = g.label === gap.consensus.label;
            return (
              <div key={g.label} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-3 text-xs">
                <span className={cn("truncate", isWinner ? "font-medium text-accent" : isCrowd ? "text-fg" : "text-muted")} title={g.label}>{g.label}</span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 rounded-full bg-[#6b6b74]" style={{ width: `${Math.max(4, (g.share / maxShare) * 100)}%` }} />
                  <span className="tabular text-faint">{fmtPct(g.share, 0)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className={cn("h-1.5 rounded-full", isWinner ? "bg-accent" : "bg-[#4a4a52]")} style={{ width: `${Math.max(4, (g.response / maxResp) * 100)}%` }} />
                  <span className={cn("tabular", isWinner ? "text-accent" : "text-faint")}>{fmtX(g.response)}</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          {gap.basis}. Response = √(views per follower index × engagement per view index) vs the market. Based on {fmtInt(groups.reduce((a, g) => a + g.stats.n, 0))} videos.
        </p>
      </div>
    </div>
  );
}