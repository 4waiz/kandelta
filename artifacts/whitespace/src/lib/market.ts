import { getAnalyzeMarketQueryKey, getGetOpportunityQueryKey, getGetWhiteSpaceHealthQueryKey, useAnalyzeMarket, useGetOpportunity, useGetWhiteSpaceHealth } from "@workspace/api-client-react";

export interface Stats { n: number; reach: number; er: number; top3Share: number }
export interface Opportunity { id: string; name: string; description: string; kind: "text" | "visual"; signal: string; phrases?: string[]; stats: Stats; supplyShare: number; reachIndex: number; engagementIndex: number; relativePerformance: number; score: number; stage: string; quadrant: string; momentum: number | null; recentN: number | null }
export interface GapGroup { label: string; stats: Stats; share: number; response: number }
export interface CrowdGap { id: string; dimension: string; basis: string; groups: GapGroup[]; consensus: GapGroup; winner: GapGroup; ratio: number; headline: string; detail: string; isGap: boolean }
export interface Analysis { query: string; scope: string; note: string | null; baseline: Stats; opportunities: Opportunity[]; crowdGaps: CrowdGap[]; sources: Record<string, number>; newestFetch: string | null; generatedAt: string; market: { label: string; window: { after: string; before: string } } }
export interface Video { id: string; platform: string; url: string | null; thumbnail: string | null; creator: { handle: string; displayName: string | null; followers: number }; publishedAt: string; caption: string; views: number; likes: number; comments: number; shares: number; reach: number | null; er: number | null; duration: number | null; hook: string | null; transcript: string | null; visualMatch: number | null; sponsored: boolean; likelyBoosted: boolean }
export interface DNA { sample: number; hooks: { text: string; videoId: string; handle: string; reach: number | null }[]; hookTypes: { type: string; count: number }[]; traits: { label: string; value: string; support: number; of: number; videoIds: string[]; note?: string }[]; audienceVoice: { text: string; likes: number; handle: string | null; videoId: string }[]; platforms: { platform: string; count: number; medianDuration: number | null }[]; norms: { medianDuration: number | null; topHookType: string | null } }
export interface Creator { handle: string; displayName: string | null; platform: string; avatar: string | null; followers: number; fit: number; medianViews: number | null; baselineVideos: number; multiplier: number | null; why: string[]; videos: Video[] }
export interface Brief { title: string; opportunity: string; whyNow: string; audience: string; premise: string; hook: string; hookReference: { text: string; handle: string; videoId: string } | null; openingShot: string; structure: string[]; tone: string; creatorProfile: string; cta: string; references: { videoId: string; handle: string; url: string | null; views: number }[]; script: string; platforms: { platform: string; hook: string; opening: string; structure: string[]; caption: string; cta: string; pacing: string; basis: string }[]; disclaimer: string }
export interface Detail { query: string; scope: string; note: string | null; newestFetch?: string | null; opportunity: Opportunity; rank: number; market: { label: string; n: number; reach: number; er: number; window: { after: string; before: string } }; evidence: Video[]; hiddenUnsafe: number; review: { sampled: number; qualified: number; excluded: { id: string; handle: string; reason: string; visualMatch: number | null }[]; criteria: string }; exampleContext: Record<string, { topicSignal: string | null; productMention: boolean; locationMention: boolean }>; dna: DNA; creators: Creator[]; brief: Brief; sources: Record<string, number> }
export interface Health { status: string; orianeConfigured: boolean; cachedResponses: number; mode: string }

export function useMarket(q: string) {
  const result = useAnalyzeMarket({ q }, { query: { enabled: !!q, queryKey: getAnalyzeMarketQueryKey({ q }), retry: 1 } });
  return { ...result, data: result.data as Analysis | undefined };
}
export function useOpportunity(q: string, id: string) {
  const result = useGetOpportunity({ q, id }, { query: { enabled: !!q && !!id, queryKey: getGetOpportunityQueryKey({ q, id }), retry: 1 } });
  return { ...result, data: result.data as Detail | undefined };
}
export function useHealth() {
  const result = useGetWhiteSpaceHealth({ query: { queryKey: getGetWhiteSpaceHealthQueryKey(), retry: 1 } });
  return { ...result, data: result.data as Health | undefined };
}
export const formatNumber = (v: number | null | undefined) => v == null || !Number.isFinite(v) ? "—" : Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v);
export const formatPercent = (v: number | null | undefined) => v == null || !Number.isFinite(v) ? "—" : `${(v * 100).toFixed(v < .01 ? 2 : 1)}%`;
export const formatIndex = (v: number | null | undefined) => v == null || !Number.isFinite(v) ? "—" : `${v.toFixed(2)}×`;
export const sourceLabel = (sources?: Record<string, number>) => {
  if (!sources) return "Source status unavailable";
  const live = sources.live || 0, cache = sources.cache || 0, stale = sources["stale-cache"] || 0;
  return `${live} live · ${cache} cached · ${stale} stale-cache source requests`;
};