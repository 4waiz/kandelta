import "server-only";
import { searchContents } from "../oriane/client";
import { normalizeVideo, type Video } from "../oriane/normalize";
import { ANGLES } from "./concepts";
import { analyzeMarket, buildBody, resolveAngle, resolveMarket, type CrowdGap, type Opportunity } from "./analyze";
import type { MarketSpec } from "./market";
import { phraseNode } from "./market";
import type { GroupStats } from "./scoring";
import { clamp } from "./scoring";
import { deriveDNA, type CreativeDNA } from "./dna";
import { buildBrief, type Brief } from "./brief";
import { reviewExample, type RelevanceReview } from "./relevance";

export interface CreatorFit {
  handle: string;
  displayName: string | null;
  platform: "instagram" | "tiktok";
  avatar: string | null;
  followers: number;
  verified: boolean;
  fit: number;
  components: { execution: number; reach: number; resonance: number; topic: number; freshness: number };
  medianViews: number | null;
  baselineVideos: number;
  multiplier: number | null; // best angle video views / creator's own median views
  angleVideosInRecent: number;
  why: string[];
  videos: Video[];
}

export interface OpportunityDetail {
  query: string;
  scope: string;
  note: string | null;
  opportunity: Opportunity;
  rank: number;
  market: { label: string; universe: string; location: string | null; n: number; reach: number; er: number; window: { after: string; before: string } };
  totalAngles: number;
  evidence: Video[];
  hiddenUnsafe: number;
  review: { sampled: number; qualified: number; excluded: { id: string; handle: string; reason: string; visualMatch: number | null }[]; criteria: string };
  exampleContext: Record<string, RelevanceReview>;
  dna: CreativeDNA;
  creators: CreatorFit[];
  brief: Brief;
  crowdGaps: CrowdGap[];
  /** Vision angles only: how many visually-matched videos also SAY or WRITE the angle (caption/transcript). */
  captionOverlap: { phrases: string[]; n: number } | null;
  sources: Record<string, number>;
}

function median(xs: number[]): number | null {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function sixMonthsBefore(date: string) {
  const d = new Date(date + "T00:00:00Z");
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 6, d.getUTCDate())).toISOString().slice(0, 10);
}

async function creatorBaseline(profileId: string, before: string) {
  const r = await searchContents(
    { limit: 12, offset: 0, projection: "default", sort: "publishedAt:desc" },
    {
      operator: "and",
      filters: { format: { includes: ["video"] }, profileId: { includes: [profileId] }, publishedAt: { after: sixMonthsBefore(before), before } },
    },
  );
  return { videos: r.response.data.results.map(normalizeVideo), source: r.source };
}

function matchesAngle(v: Video, phrases: string[]) {
  const text = `${v.caption} ${v.transcript ?? ""}`.toLowerCase();
  return phrases.some((p) => text.includes(p.toLowerCase()));
}

async function creatorFits(evidence: Video[], phrases: string[], marketSpec: MarketSpec, market: GroupStats, before: string, sources: Record<string, number>): Promise<CreatorFit[]> {
  const byCreator = new Map<string, Video[]>();
  for (const v of evidence) {
    if (!v.creator.profileId || v.creator.followers < 1000) continue;
    const list = byCreator.get(v.creator.profileId) ?? [];
    list.push(v);
    byCreator.set(v.creator.profileId, list);
  }
  // Pre-rank by best reach, then fetch real baselines for the top 5 only (credit protection).
  const ranked = [...byCreator.entries()]
    .map(([id, vids]) => ({ id, vids: vids.sort((a, b) => (b.reach ?? 0) - (a.reach ?? 0)) }))
    .sort((a, b) => (b.vids[0].reach ?? 0) - (a.vids[0].reach ?? 0))
    .slice(0, 6);

  const fits = await Promise.all(
    ranked.map(async ({ id, vids }) => {
      const best = vids[0];
      let medianViews: number | null = null;
      let baselineVideos = 0;
      let recentAngle = 0;
      let topicShare = 0;
      try {
        const base = await creatorBaseline(id, before);
        sources[base.source] = (sources[base.source] ?? 0) + 1;
        const others = base.videos.filter((v) => !vids.some((e) => e.id === v.id));
        baselineVideos = others.length;
        medianViews = median(others.map((v) => v.views));
        recentAngle = phrases.length ? base.videos.filter((v) => matchesAngle(v, phrases)).length : 0;
        topicShare = base.videos.length ? base.videos.filter((v) => reviewExample(v, marketSpec).qualified).length / base.videos.length : 0;
      } catch {
        /* baseline unavailable — fit uses what we have */
      }
      const multiplier = medianViews && medianViews > 0 ? best.views / medianViews : null;
      const execution = multiplier ? clamp(Math.log2(multiplier) / 2) : 0;
      const reachC = best.reach && market.reach ? clamp(Math.log2(best.reach / market.reach) / 3) : 0;
      const resonance = best.er && market.er ? clamp(0.5 + Math.log2(best.er / market.er) / 2) : 0;
      const freshness = baselineVideos ? clamp(1 - Math.max(0, recentAngle / Math.max(baselineVideos, 1) - 0.25)) : 0.5;
      const topic = clamp(topicShare / 0.5);
      const fit = Math.round(100 * (0.35 * execution + 0.2 * reachC + 0.15 * resonance + 0.2 * topic + 0.1 * freshness));
      const why: string[] = [];
      if (multiplier) why.push(`This angle drew ${multiplier >= 10 ? multiplier.toFixed(0) : multiplier.toFixed(1)}× their own median views (${Math.round(medianViews!).toLocaleString("en-US")} across ${baselineVideos} recent videos).`);
      if (best.reach) why.push(`${best.reach >= 10 ? best.reach.toFixed(0) : best.reach.toFixed(1)} views per follower on it vs ${market.reach.toFixed(2)} market average.`);
      if (best.er) why.push(`${(best.er * 100).toFixed(1)}% engagement per view vs ${(market.er * 100).toFixed(1)}% market.`);
      if (baselineVideos) why.push(`${Math.round(topicShare * 100)}% of their recent videos are about this market.`);
      if (baselineVideos && phrases.length) why.push(recentAngle <= 1 ? "Rarely uses this angle in recent posts, so it still reads fresh for their audience." : `Already uses this angle in ${recentAngle}/${baselineVideos + vids.length} recent posts.`);
      return {
        handle: best.creator.handle,
        displayName: best.creator.displayName,
        platform: best.creator.platform,
        avatar: best.creator.avatar,
        followers: best.creator.followers,
        verified: best.creator.verified,
        fit,
        components: { execution, reach: reachC, resonance, topic, freshness },
        medianViews,
        baselineVideos,
        multiplier,
        angleVideosInRecent: recentAngle,
        why,
        videos: vids,
      } satisfies CreatorFit;
    }),
  );
  // One row per creator handle (same person across Instagram + TikTok), and only creators who actually cover the market.
  const byHandle = new Map<string, CreatorFit>();
  for (const f of fits.sort((a, b) => b.fit - a.fit)) if (!byHandle.has(f.handle)) byHandle.set(f.handle, f);
  return [...byHandle.values()].filter((f) => f.baselineVideos === 0 || f.components.topic >= 0.15);
}

export async function opportunityDetail(query: string, angleId: string): Promise<OpportunityDetail> {
  const [analysis, { ctx }] = await Promise.all([analyzeMarket(query), resolveMarket(query)]);
  const def = await resolveAngle(ctx, angleId);
  if (!def) throw new Error(`Unknown opportunity "${angleId}".`);
  const opportunity = analysis.opportunities.find((o) => o.id === angleId);
  if (!opportunity) throw new Error("Not enough matching videos for this angle.");
  const rank = analysis.opportunities.indexOf(opportunity) + 1;

  // Evidence: the most representative videos (vision angles: highest frame similarity; text angles: biggest
  // over-performers vs follower count) + the most-watched videos of the angle.
  const [watched, overperf] = await Promise.all([
    searchContents({ limit: 12, offset: 0, projection: "full", sort: "viewsCount:desc" }, buildBody(ctx, def.nodes, def.filters)),
    def.kind === "visual"
      ? searchContents({ limit: 12, offset: 0, projection: "full", sort: "visualSimilarity:desc" }, buildBody(ctx, def.nodes, def.filters))
      : searchContents(
          { limit: 12, offset: 0, projection: "full", sort: "engagementRatePerFollowers:desc" },
          buildBody(ctx, def.nodes, { ...def.filters, profileFollowersCount: { min: 2000 }, viewsCount: { min: 5000 } }),
        ),
  ]);
  const sources: Record<string, number> = { ...analysis.sources };
  sources[watched.source] = (sources[watched.source] ?? 0) + 1;
  sources[overperf.source] = (sources[overperf.source] ?? 0) + 1;
  const seen = new Set<string>();
  const evidence = [...overperf.response.data.results, ...watched.response.data.results]
    .map(normalizeVideo)
    .filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
  const sampled = evidence.length;
  const hiddenUnsafe = evidence.filter((v) => v.brandUnsafe).length;
  const excluded: OpportunityDetail["review"]["excluded"] = [];
  const exampleContext: OpportunityDetail["exampleContext"] = {};
  for (let i = evidence.length - 1; i >= 0; i--) {
    const v = evidence[i];
    const result = reviewExample(v, analysis.market);
    if (result.qualified) exampleContext[v.id] = result;
    else {
      excluded.push({ id: v.id, handle: v.brandUnsafe ? "Hidden for brand safety" : v.creator.handle, reason: result.reason, visualMatch: v.visualMatch });
      evidence.splice(i, 1);
    }
  }
  excluded.reverse();
  // Organic = not disclosed as an ad and not showing the paid-boost signature. DNA + creator fit use organic only.
  const organic = evidence.filter((v) => !v.sponsored && !v.likelyBoosted);
  const rankKey = (v: (typeof evidence)[number]) => (def.kind === "visual" ? (v.visualMatch ?? 0) * 10 : 0) + Math.log10(1 + (v.reach ?? 0));
  evidence.sort((a, b) => Number(a.sponsored || a.likelyBoosted) - Number(b.sponsored || b.likelyBoosted) || rankKey(b) - rankKey(a));

  // For vision angles: how many of the matched videos would a caption/transcript search also have found?
  let captionOverlap: OpportunityDetail["captionOverlap"] = null;
  const template = ANGLES.find((a) => a.id === def.templateId);
  if (def.kind === "visual" && template) {
    const r = await searchContents({ limit: 1, offset: 0, projection: "basic" }, buildBody(ctx, [phraseNode(template.phrases)], def.filters));
    sources[r.source] = (sources[r.source] ?? 0) + 1;
    captionOverlap = { phrases: template.phrases, n: r.response.metadata.pagination?.totalCount ?? 0 };
  }

  const base = analysis.baseline;
  const dna = deriveDNA(organic, base);
  const creators = await creatorFits(organic, def.phrases, analysis.market, base, analysis.market.window.before, sources);
  const angle = ANGLES.find((a) => a.id === def.templateId) ?? ANGLES[0];
  const brief = buildBrief({ analysis, opportunity, angle, dna, evidence, creators, compoundOf: def.kind === "visual" && def.templateId === "heat" ? "challenge" : null });

  return {
    query: analysis.query,
    scope: analysis.scope,
    note: analysis.note,
    opportunity,
    rank,
    totalAngles: analysis.opportunities.length,
    market: {
      label: analysis.market.label,
      universe: analysis.market.universe,
      location: analysis.market.location?.label ?? null,
      n: base.n,
      reach: base.reach,
      er: base.er,
      window: { after: analysis.market.window.after, before: analysis.market.window.before },
    },
    evidence,
    hiddenUnsafe,
    review: { sampled, qualified: evidence.length, excluded, criteria: "Sampled result pages only. Qualify examples using caption/transcript topic context; exclude unsafe and off-topic posts. Frame score is visual similarity, not product, heat, or local-market proof." },
    exampleContext,
    dna,
    creators,
    brief,
    crowdGaps: analysis.crowdGaps,
    captionOverlap,
    sources,
  };
}
