import type { CrowdGap } from "@/lib/whitespace/analyze";
import { fmtInt, fmtPct, fmtX } from "@/lib/format";
import { Chip, cn } from "./ui";

export function CrowdGapCard({ gap, compact }: { gap: CrowdGap; compact?: boolean }) {
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
      {!compact ? (
        <div className="mt-4">
          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 pb-1.5 text-[10px] uppercase tracking-wider text-faint">
            <span>Choice</span>
            <span>What creators make</span>
            <span>How audiences respond</span>
          </div>
          <div className="space-y-2">
            {groups.map((g) => {
              const isWinner = g.label === gap.winner.label && gap.isGap;
              const isCrowd = g.label === gap.consensus.label;
              return (
                <div key={g.label} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-3 text-xs">
                  <span className={cn("truncate", isWinner ? "font-medium text-accent" : isCrowd ? "text-fg" : "text-muted")} title={g.label}>
                    {g.label}
                  </span>
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
      ) : null}
    </div>
  );
}
