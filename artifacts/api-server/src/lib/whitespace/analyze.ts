import { searchContents, textAsset } from "../oriane/client";
import { groupStats } from "../oriane/normalize";
import type { ContentFilters, ContentQuery, DataSource } from "../oriane/types";
import { ANGLES, VISUAL_STYLES } from "./concepts";
import { locationNode, marketNode, parseMarket, phraseNode, recentWindow, type MarketSpec } from "./market";
import {
  confidence,
  engagementIndex,
  opportunityScore,
  quadrantFor,
  reachIndex,
  relativePerformance,
  scarcity,
  stageFor,
  type GroupStats,
  type Quadrant,
  type Stage,
} from "./scoring";

export const VISUAL_MIN_SCORE = 0.8;
const MIN_MARKET_N = 400;
const MIN_ANGLE_N = 30;

export type AngleKind = "text" | "visual";

export interface Opportunity {
  id: string;
  name: string;
  description: string;
  kind: AngleKind;
  signal: string; // how Oriane detected it
  phrases: string[];
  stats: GroupStats;
  supplyShare: number;
  reachIndex: number;
  engagementIndex: number;
  relativePerformance: number;
  scarcity: number;
  confidence: number;
  score: number;
  stage: Stage;
  quadrant: Quadrant;
  momentum: number | null;
  recentN: number | null;
}

export interface GapGroup {
  label: string;
  stats: GroupStats;
  share: number;
  reachIndex: number;
  engagementIndex: number;
  response: number; // √(reach index × engagement index)
}

export interface CrowdGap {
  id: string;
  dimension: string;
  basis: string;
  groups: GapGroup[];
  consensus: GapGroup;
  winner: GapGroup;
  ratio: number; // winner response / consensus response
  headline: string;
  detail: string;
  isGap: boolean;
}

export interface MarketAnalysis {
  query: string;
  market: MarketSpec;
  scope: string;
  note: string | null;
  baseline: GroupStats;
  recentBaselineN: number | null;
  opportunities: Opportunity[];
  crowdGaps: CrowdGap[];
  sources: Record<DataSource, number>;
  generatedAt: string;
  newestFetch: string | null;
}

function limiter(max: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active >= max) await new Promise<void>((r) => queue.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}

export interface Ctx {
  market: MarketSpec;
  useLocation: boolean;
  sources: Record<DataSource, number>;
  newest: string | null;
  run: ReturnType<typeof limiter>;
}

export function buildBody(ctx: Ctx, extra: ContentQuery[], filters: ContentFilters = {}, window: { after: string; before: string } = ctx.market.window): ContentQuery {
  const loc = ctx.useLocation ? locationNode(ctx.market) : null;
  return {
    operator: "and",
    filters: { format: { includes: ["video"] }, publishedAt: { after: window.after, before: window.before }, ...filters },
    queries: [marketNode(ctx.market), ...(loc ? [loc] : []), ...extra],
  };
}

export async function measure(ctx: Ctx, extra: ContentQuery[], filters: ContentFilters = {}): Promise<GroupStats> {
  const r = await ctx.run(() => searchContents({ limit: 3, offset: 0, projection: "full", sort: "viewsCount:desc" }, buildBody(ctx, extra, filters)));
  ctx.sources[r.source]++;
  if (!ctx.newest || r.fetchedAt > ctx.newest) ctx.newest = r.fetchedAt;
  return groupStats(r.response);
}

async function recentCount(ctx: Ctx, extra: ContentQuery[], filters: ContentFilters = {}): Promise<number> {
  const r = await ctx.run(() => searchContents({ limit: 1, offset: 0, projection: "basic" }, buildBody(ctx, extra, filters, recentWindow(30))));
  ctx.sources[r.source]++;
  return r.response.metadata.pagination?.totalCount ?? 0;
}

export interface AngleDef {
  id: string;
  name: string;
  description: string;
  kind: AngleKind;
  signal: string;
  phrases: string[];
  nodes: ContentQuery[];
  filters: ContentFilters;
  templateId: string; // which editorial template feeds the brief
}

export function textAngleDefs(): AngleDef[] {
  return ANGLES.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    kind: "text" as const,
    signal: `Spoken or written: exact phrases ${a.phrases.map((p) => `“${p}”`).join(", ")} in the transcript or caption`,
    phrases: a.phrases,
    nodes: [phraseNode(a.phrases)],
    filters: {},
    templateId: a.id,
  }));
}

export async function visualAngleDefs(ctx: Ctx): Promise<AngleDef[]> {
  return Promise.all(
    VISUAL_STYLES.map(async (v) => {
      const assetId = await ctx.run(() => textAsset(v.prompt));
      return {
        id: `visual-${v.id}`,
        name: v.name,
        description: v.description,
        kind: "visual" as const,
        signal: `Seen in the video: Oriane vision matches frames to “${v.prompt}” (similarity ≥ ${VISUAL_MIN_SCORE})`,
        phrases: [],
        nodes: [],
        filters: { visualSimilarity: { includes: { values: [{ assetId, minScore: VISUAL_MIN_SCORE }] } } },
        templateId: v.templateId,
      };
    }),
  );
}

export async function resolveAngle(ctx: Ctx, id: string): Promise<AngleDef | null> {
  if (id.startsWith("visual-")) return (await visualAngleDefs(ctx)).find((d) => d.id === id) ?? null;
  return textAngleDefs().find((d) => d.id === id) ?? null;
}

export interface MarketContext {
  ctx: Ctx;
  baseline: GroupStats;
  note: string | null;
}

/** Resolves the measured universe. Falls back to the global topic when a location slice is too thin. */
export async function resolveMarket(input: string): Promise<MarketContext> {
  const market = parseMarket(input);
  const ctx: Ctx = { market, useLocation: !!market.location, sources: { live: 0, cache: 0, "stale-cache": 0 }, newest: null, run: limiter(6) };
  let baseline = await measure(ctx, []);
  let note: string | null = null;
  if (market.location && baseline.n < MIN_MARKET_N) {
    note = `Only ${baseline.n.toLocaleString("en-US")} ${market.label} videos mention ${market.location.label} in the last 3 months, which is too few for reliable splits. WhiteSpace measured the global ${market.label} market and uses heat as the local lens.`;
    ctx.useLocation = false;
    baseline = await measure(ctx, []);
  }
  if (baseline.n === 0) throw new Error(`No videos found for "${market.label}" in the last 3 months.`);
  return { ctx, baseline, note };
}

function toGroup(label: string, s: GroupStats, base: GroupStats, total: number): GapGroup {
  const ri = reachIndex(s, base);
  const ei = engagementIndex(s, base);
  return { label, stats: s, share: total > 0 ? s.n / total : 0, reachIndex: ri, engagementIndex: ei, response: relativePerformance(ri, ei) };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const times = (x: number) => `${x >= 10 ? x.toFixed(0) : x.toFixed(1)}×`;

function buildGap(id: string, dimension: string, basis: string, groups: GapGroup[], noun: string): CrowdGap | null {
  const usable = groups.filter((g) => g.stats.n >= MIN_ANGLE_N && g.response > 0);
  if (usable.length < 2) return null;
  const consensus = usable.slice().sort((a, b) => b.stats.n - a.stats.n)[0];
  const winner = usable.slice().sort((a, b) => b.response - a.response)[0];
  const ratio = consensus.response > 0 ? winner.response / consensus.response : 0;
  const isGap = winner !== consensus && ratio >= 1.25;
  const lead =
    winner.engagementIndex / Math.max(consensus.engagementIndex, 1e-9) >= winner.reachIndex / Math.max(consensus.reachIndex, 1e-9)
      ? `${times(winner.stats.er / consensus.stats.er)} the engagement per view`
      : `${times(winner.stats.reach / consensus.stats.reach)} the views per follower`;
  const headline = isGap
    ? `${pct(consensus.share)} of ${noun} are ${consensus.label.toLowerCase()}. ${winner.label} is ${pct(winner.share)} of them, yet earns ${lead}.`
    : `${consensus.label} is both the most common and the best-responding choice. No gap here.`;
  const describe = (g: GapGroup) =>
    `${g.label}: ${g.stats.n.toLocaleString("en-US")} videos · ${g.stats.reach.toFixed(2)} views/follower · ${(g.stats.er * 100).toFixed(1)}% engagement/view`;
  return { id, dimension, basis, groups, consensus, winner, ratio, headline, detail: isGap ? `${describe(winner)}. ${describe(consensus)}.` : usable.map(describe).join(". ") + ".", isGap };
}

function toOpportunity(d: AngleDef, s: GroupStats, baseline: GroupStats): Opportunity {
  const share = s.n / baseline.n;
  const ri = reachIndex(s, baseline);
  const ei = engagementIndex(s, baseline);
  const rp = relativePerformance(ri, ei);
  const conf = confidence(s).value;
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    kind: d.kind,
    signal: d.signal,
    phrases: d.phrases,
    stats: s,
    supplyShare: share,
    reachIndex: ri,
    engagementIndex: ei,
    relativePerformance: rp,
    scarcity: scarcity(share),
    confidence: conf,
    score: opportunityScore(rp, share, conf),
    stage: stageFor(share),
    quadrant: quadrantFor(share, rp),
    momentum: null,
    recentN: null,
  };
}

export async function analyzeMarket(input: string): Promise<MarketAnalysis> {
  const { ctx, baseline, note } = await resolveMarket(input);
  const market = ctx.market;

  let visualDefs: AngleDef[] = [];
  try {
    visualDefs = await visualAngleDefs(ctx);
  } catch {
    visualDefs = []; // vision unavailable: text angles still work
  }
  const defs = [...textAngleDefs(), ...visualDefs];
  const allStats = await Promise.all(defs.map((d) => measure(ctx, d.nodes, d.filters)));

  const all = defs.map((d, i) => toOpportunity(d, allStats[i], baseline));
  const opportunities = all.filter((o) => o.stats.n >= MIN_ANGLE_N).sort((a, b) => b.score - a.score);

  // Momentum for the top opportunities only (credit protection).
  const top = opportunities.slice(0, 8);
  const [recentBase, ...recentAngles] = await Promise.all([
    recentCount(ctx, []),
    ...top.map((o) => {
      const d = defs.find((x) => x.id === o.id)!;
      return recentCount(ctx, d.nodes, d.filters);
    }),
  ]);
  const baseRecentShare = baseline.n > 0 ? recentBase / baseline.n : 0;
  top.forEach((o, i) => {
    o.recentN = recentAngles[i];
    o.momentum = baseRecentShare > 0 && o.stats.n > 0 ? recentAngles[i] / o.stats.n / baseRecentShare : null;
  });

  // ---- Crowd gaps: what creators default to vs what audiences respond to (population level).
  const pairs: { id: string; dimension: string; noun: string; basis: string; groups: [string, ContentFilters][] }[] = [
    { id: "audio", dimension: "Sound", noun: "videos", basis: "Oriane audio metadata", groups: [["Licensed / trending music", { audioCopyrighted: true }], ["Original audio", { audioCopyrighted: false }]] },
    { id: "collab", dimension: "Collaboration", noun: "videos", basis: "Oriane co-author metadata", groups: [["Solo posts", { hasCoAuthors: false }], ["Collab posts", { hasCoAuthors: true }]] },
    { id: "tags", dimension: "Tagging", noun: "videos", basis: "Oriane mention metadata", groups: [["Untagged posts", { hasMentions: false }], ["Posts tagging brands or people", { hasMentions: true }]] },
    { id: "language", dimension: "Language", noun: "captions", basis: "Oriane caption language detection", groups: [["English", { captionLanguage: { includes: ["en"] } }], ["Non-English", { captionLanguage: { excludes: ["en"] } }]] },
  ];
  const metaGaps = await Promise.all(
    pairs.map(async (p) => {
      const ss = await Promise.all(p.groups.map(([, f]) => measure(ctx, [], f)));
      const total = ss.reduce((a, s) => a + s.n, 0);
      return buildGap(p.id, p.dimension, p.basis, p.groups.map(([label], i) => toGroup(label, ss[i], baseline, total)), p.noun);
    }),
  );
  let visualGap: CrowdGap | null = null;
  if (visualDefs.length) {
    const vs = visualDefs.map((d) => all.find((o) => o.id === d.id)!);
    const total = vs.reduce((a, o) => a + o.stats.n, 0);
    visualGap = buildGap(
      "visual",
      "Visual style",
      `Oriane vision (frame similarity ≥ ${VISUAL_MIN_SCORE}) across ${total.toLocaleString("en-US")} style-matched videos`,
      vs.map((o) => toGroup(o.name, o.stats, baseline, total)),
      "style-matched videos",
    );
  }
  const crowdGaps = [visualGap, ...metaGaps].filter((g): g is CrowdGap => !!g);
  crowdGaps.sort((a, b) => Number(b.isGap) - Number(a.isGap) || b.ratio - a.ratio);

  const scope = `${baseline.n.toLocaleString("en-US")} Instagram + TikTok videos whose captions mention ${market.phrases.map((p) => `“${p}”`).join(", ")}${ctx.useLocation && market.location ? ` and ${market.location.label}` : ""}, published ${market.window.after} → ${market.window.before}`;

  return {
    query: market.query,
    market,
    scope,
    note,
    baseline,
    recentBaselineN: recentBase,
    opportunities,
    crowdGaps,
    sources: ctx.sources,
    generatedAt: new Date().toISOString(),
    newestFetch: ctx.newest,
  };
}
