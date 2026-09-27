"use client";

import { useMemo, useState } from "react";
import type { Opportunity } from "@/lib/whitespace/analyze";
import { fmtInt, fmtPct, fmtX } from "@/lib/format";

const W = 820;
const H = 480;
const M = { l: 58, r: 20, t: 20, b: 48 };
const SPLIT_SHARE = 0.01;

const QUAD_LABEL: Record<Opportunity["quadrant"], string> = {
  "white-space": "White space",
  "saturated-winner": "Saturated winner",
  noise: "Content noise",
  "low-signal": "Low signal",
};

export function WhiteSpaceMap({ items, onSelect, highlight }: { items: Opportunity[]; onSelect: (o: Opportunity) => void; highlight?: string }) {
  const [hover, setHover] = useState<Opportunity | null>(null);

  const geo = useMemo(() => {
    const xs = items.map((o) => Math.log10(Math.max(o.supplyShare, 1e-4)));
    const ys = items.map((o) => Math.max(-1.2, Math.min(1.2, Math.log2(Math.max(o.relativePerformance, 0.3)))));
    const xMin = Math.min(Math.log10(SPLIT_SHARE) - 0.6, Math.min(...xs) - 0.15);
    const xMax = Math.max(Math.log10(SPLIT_SHARE) + 0.6, Math.max(...xs) + 0.15);
    const yMin = Math.min(-0.7, Math.min(...ys) - 0.12);
    const yMax = Math.max(0.7, Math.max(...ys) + 0.3);
    const sx = (v: number) => M.l + ((v - xMin) / (xMax - xMin)) * (W - M.l - M.r);
    const sy = (v: number) => H - M.b - ((v - yMin) / (yMax - yMin)) * (H - M.t - M.b);
    const maxN = Math.max(...items.map((o) => o.stats.n));
    const pts = items.map((o, i) => ({ o, x: sx(xs[i]), y: sy(ys[i]), r: 5 + 13 * Math.sqrt(o.stats.n / maxN) }));

    // Where the crowd is: bounding box of angles holding ≥ 1% of supply.
    const crowdPts = pts.filter((p) => p.o.supplyShare >= SPLIT_SHARE);
    const crowd =
      crowdPts.length >= 3
        ? {
            x: Math.min(...crowdPts.map((p) => p.x - p.r)) - 10,
            y: Math.min(...crowdPts.map((p) => p.y - p.r)) - 10,
            x2: Math.max(...crowdPts.map((p) => p.x + p.r)) + 10,
            y2: Math.max(...crowdPts.map((p) => p.y + p.r)) + 10,
            n: crowdPts.length,
          }
        : null;

    // The gap: best-scoring white-space angle gets a two-line callout.
    const order = pts.slice().sort((a, b) => b.o.score - a.o.score);
    const gap = order.find((p) => p.o.quadrant === "white-space") ?? null;

    // Labels: best-scoring first, greedy collision avoidance against labels and bubbles.
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    if (crowd) placed.push({ x: crowd.x, y: crowd.y - 16, w: 150, h: 14 });
    const labels: { id: string; x: number; y: number; text: string; anchor: "start" | "end" }[] = [];
    let gapLabel: { x: number; y: number; anchor: "start" | "end" } | null = null;
    if (gap) {
      const w = 190;
      const right = gap.x + gap.r + 10 + w < W - M.r;
      const bx = right ? gap.x + gap.r + 10 : gap.x - gap.r - 10 - w;
      placed.push({ x: bx, y: gap.y - 14, w, h: 30 });
      gapLabel = { x: right ? bx : bx + w, y: gap.y - 2, anchor: right ? "start" : "end" };
    }
    const coversBubble = (bx: number, by: number, w: number, self: (typeof pts)[number]) =>
      pts.some((q) => q !== self && q.x + q.r > bx && q.x - q.r < bx + w && q.y + q.r > by && q.y - q.r < by + 12);
    for (const p of order.filter((p) => p !== gap).slice(0, 8)) {
      const text = p.o.name;
      const w = text.length * 7 + 6;
      const sides = p.x + p.r + 6 + w < W - M.r ? [true, false] : [false, true];
      let done = false;
      for (const right of sides) {
        for (const dy of [0, -13, 13, -24, 24]) {
          const bx = right ? p.x + p.r + 5 : p.x - p.r - 5 - w;
          const by = p.y - 6 + dy;
          if (bx < M.l || bx + w > W - M.r) continue;
          const hit = placed.some((b) => bx < b.x + b.w && bx + w > b.x && by < b.y + b.h && by + 12 > b.y) || coversBubble(bx, by, w, p);
          if (!hit) {
            placed.push({ x: bx, y: by, w, h: 12 });
            labels.push({ id: p.o.id, x: right ? bx : bx + w, y: by + 9.5, text, anchor: right ? "start" : "end" });
            done = true;
            break;
          }
        }
        if (done) break;
      }
    }

    const xTicks = [0.001, 0.003, 0.01, 0.03, 0.1].filter((t) => Math.log10(t) >= xMin && Math.log10(t) <= xMax);
    const yTicks = [0.5, 0.75, 1, 1.5, 2].filter((t) => Math.log2(t) >= yMin && Math.log2(t) <= yMax);
    return { sx, sy, pts, labels, xTicks, yTicks, xMin, xMax, yMin, yMax, crowd, gap, gapLabel };
  }, [items]);

  const { sx, sy, pts, labels, xTicks, yTicks, yMax, crowd, gap, gapLabel } = geo;
  const splitX = sx(Math.log10(SPLIT_SHARE));
  const splitY = sy(0);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img" aria-label="WhiteSpace map: content supply versus audience response for each creative angle">
        {/* white-space region */}
        <rect x={M.l} y={sy(yMax)} width={splitX - M.l} height={splitY - sy(yMax)} fill="var(--accent)" opacity={0.055} rx={6} />
        {/* grid */}
        {xTicks.map((t) => (
          <g key={t}>
            <line x1={sx(Math.log10(t))} x2={sx(Math.log10(t))} y1={M.t} y2={H - M.b} stroke="var(--line-soft)" />
            <text x={sx(Math.log10(t))} y={H - M.b + 16} textAnchor="middle" className="fill-[var(--faint)] text-[11px]">
              {fmtPct(t, t < 0.01 ? 1 : 0)}
            </text>
          </g>
        ))}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={sy(Math.log2(t))} y2={sy(Math.log2(t))} stroke="var(--line-soft)" />
            <text x={M.l - 8} y={sy(Math.log2(t)) + 3} textAnchor="end" className="fill-[var(--faint)] text-[11px]">
              {t}×
            </text>
          </g>
        ))}
        {/* quadrant split lines */}
        <line x1={splitX} x2={splitX} y1={M.t} y2={H - M.b} stroke="var(--line)" strokeDasharray="3 4" />
        <line x1={M.l} x2={W - M.r} y1={splitY} y2={splitY} stroke="var(--line)" strokeDasharray="3 4" />
        {/* quadrant labels */}
        <text x={M.l + 10} y={sy(yMax) + 18} className="fill-[var(--accent)] text-[12px] font-semibold tracking-[0.12em]">
          WHITE SPACE
        </text>
        <text x={M.l + 10} y={sy(yMax) + 32} className="fill-[var(--faint)] text-[11px]">
          audiences respond · few creators
        </text>
        <text x={W - M.r - 10} y={sy(yMax) + 18} textAnchor="end" className="fill-[var(--muted)] text-[12px] font-semibold tracking-[0.12em]">
          SATURATED WINNERS
        </text>
        <text x={W - M.r - 10} y={H - M.b - 10} textAnchor="end" className="fill-[var(--faint)] text-[12px] font-semibold tracking-[0.12em]">
          CONTENT NOISE
        </text>
        <text x={M.l + 10} y={H - M.b - 10} className="fill-[var(--faint)] text-[12px] font-semibold tracking-[0.12em]">
          LOW SIGNAL
        </text>
        {/* axes titles */}
        <text x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle" className="fill-[var(--muted)] text-[11px]">
          Content supply → share of videos using the angle (log)
        </text>
        <text transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" className="fill-[var(--muted)] text-[11px]">
          Audience response vs average →
        </text>
        {/* where the crowd is */}
        {crowd ? (
          <g className="pointer-events-none">
            <rect x={crowd.x} y={crowd.y} width={crowd.x2 - crowd.x} height={crowd.y2 - crowd.y} rx={14} fill="none" stroke="var(--faint)" strokeOpacity={0.45} strokeDasharray="4 5" />
            <text x={crowd.x + 4} y={crowd.y - 6} className="fill-[var(--muted)] text-[11px]">
              Where most creators are · {crowd.n} crowded angles
            </text>
          </g>
        ) : null}
        {/* bubbles */}
        {pts
          .slice()
          .sort((a, b) => b.r - a.r)
          .map(({ o, x, y, r }) => {
            const ws = o.quadrant === "white-space";
            const fill = ws ? "var(--accent)" : o.quadrant === "saturated-winner" ? "#8b8b95" : "#4a4a52";
            const isHl = highlight === o.id;
            return (
              <g
                key={o.id}
                className="cursor-pointer"
                onMouseEnter={() => setHover(o)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(o)}
                role="button"
                aria-label={`${o.name}: score ${o.score}`}
              >
                {isHl ? <circle cx={x} cy={y} r={r + 7} fill="none" stroke="var(--accent)" strokeOpacity={0.5} className="animate-pulse" /> : null}
                <circle cx={x} cy={y} r={r} fill={fill} fillOpacity={ws ? 0.28 : 0.22} stroke={fill} strokeOpacity={hover?.id === o.id ? 1 : 0.75} strokeWidth={hover?.id === o.id ? 2 : 1.2} />
                {o.kind === "visual" ? <circle cx={x} cy={y} r={r + 3.5} fill="none" stroke={fill} strokeOpacity={0.6} strokeDasharray="2 3" /> : null}
                <circle cx={x} cy={y} r={1.8} fill={fill} />
              </g>
            );
          })}
        {gap && gapLabel ? (
          <g className="pointer-events-none">
            <text x={gapLabel.x} y={gapLabel.y} textAnchor={gapLabel.anchor} className="fill-[var(--accent)] text-[14px] font-semibold">
              The gap: {gap.o.name}
            </text>
            <text x={gapLabel.x} y={gapLabel.y + 15} textAnchor={gapLabel.anchor} className="fill-[var(--muted)] text-[11px]">
              {fmtPct(gap.o.supplyShare)} of supply · {fmtX(gap.o.relativePerformance)} response · {fmtInt(gap.o.stats.n)} videos
            </text>
          </g>
        ) : null}
        {labels.map((l) => {
          const o = items.find((i) => i.id === l.id)!;
          return (
            <text key={l.id} x={l.x} y={l.y} textAnchor={l.anchor} className={`pointer-events-none text-[12px] ${o.quadrant === "white-space" ? "fill-[var(--fg)] font-medium" : "fill-[var(--muted)]"}`}>
              {l.text}
            </text>
          );
        })}
      </svg>

      {hover ? <Tooltip o={hover} x={pts.find((p) => p.o.id === hover.id)!.x} y={pts.find((p) => p.o.id === hover.id)!.y} /> : null}

      <div className="mt-2 flex flex-wrap items-center gap-4 px-1 text-[11px] text-faint">
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12">
            <circle cx="6" cy="6" r="4.5" fill="var(--accent)" fillOpacity="0.3" stroke="var(--accent)" />
          </svg>
          White space
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="14" height="14">
            <circle cx="7" cy="7" r="3.5" fill="#8b8b95" fillOpacity="0.3" stroke="#8b8b95" />
            <circle cx="7" cy="7" r="6" fill="none" stroke="#8b8b95" strokeDasharray="2 2" />
          </svg>
          Detected by Oriane vision (what&apos;s shown)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12">
            <circle cx="6" cy="6" r="4.5" fill="#8b8b95" fillOpacity="0.3" stroke="#8b8b95" />
          </svg>
          Detected in speech or caption (what&apos;s said)
        </span>
        <span>Bubble size = number of videos</span>
      </div>
    </div>
  );
}

function Tooltip({ o, x, y }: { o: Opportunity; x: number; y: number }) {
  const left = `${(x / W) * 100}%`;
  const top = `${(y / H) * 100}%`;
  const flip = x > W * 0.62;
  return (
    <div
      className="pointer-events-none absolute z-10 w-64 rounded-lg border border-line bg-panel-2/95 p-3 text-xs shadow-xl shadow-black/50 backdrop-blur"
      style={{ left, top, transform: `translate(${flip ? "calc(-100% - 14px)" : "14px"}, -50%)` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-fg">{o.name}</div>
        <div className="tabular font-semibold text-accent">{o.score}</div>
      </div>
      <div className="mt-0.5 text-[11px] text-faint">{QUAD_LABEL[o.quadrant]} · {o.stage}</div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-muted">
        <span>Response vs avg</span>
        <span className="tabular text-right text-fg">{fmtX(o.relativePerformance)}</span>
        <span>Engagement / view</span>
        <span className="tabular text-right text-fg">{fmtX(o.engagementIndex)}</span>
        <span>Views / follower</span>
        <span className="tabular text-right text-fg">{fmtX(o.reachIndex)}</span>
        <span>Supply</span>
        <span className="tabular text-right text-fg">{fmtPct(o.supplyShare)}</span>
        <span>Videos</span>
        <span className="tabular text-right text-fg">{fmtInt(o.stats.n)}</span>
      </div>
      <div className="mt-2 border-t border-line pt-2 text-[11px] text-faint">{o.kind === "visual" ? "Seen in the video by Oriane vision" : "Said or written in the video"}</div>
    </div>
  );
}
