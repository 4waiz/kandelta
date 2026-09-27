import type { RawContent, RawSearchResponse } from "./types";
import type { GroupStats } from "../whitespace/scoring";

// Internal models — the UI never sees raw Oriane shapes.

export interface Creator {
  handle: string;
  displayName: string | null;
  platform: "instagram" | "tiktok";
  profileId: string | null;
  followers: number;
  avatar: string | null;
  verified: boolean;
  bio: string | null;
}

export interface Video {
  id: string;
  platform: "instagram" | "tiktok";
  url: string | null;
  thumbnail: string | null;
  creator: Creator;
  publishedAt: string;
  caption: string;
  captionLanguage: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  interactions: number;
  reach: number | null; // views / followers
  er: number | null; // interactions / views
  duration: number | null;
  hashtags: string[];
  transcript: string | null;
  transcriptLanguage: string | null;
  hook: string | null; // spoken words in the first ~3 seconds
  firstSpeechAt: number | null;
  wordsPerSecond: number | null;
  frames: { url: string; t: number; score: number | null }[];
  audio: { title: string | null; type: string | null; copyrighted: boolean | null };
  topComments: { text: string; likes: number; handle: string | null }[];
  mentions: string[];
  sponsored: boolean; // caption discloses an ad / paid partnership
  likelyBoosted: boolean; // huge reach with near-zero engagement: typical of paid distribution
  visualMatch: number | null; // best Oriane frame similarity to the vision prompt, when searched visually
  brandUnsafe: boolean; // conflict / politics / adult keywords: excluded from displayed evidence
}

// Disclosure markers: "#ad", "Ad |", "[ad]", "sponsored", "paid partnership", "#HiltonPartner", "Anzeige", "Werbung".
const SPONSORED = /(#ads?\b|^\s*ad\s*[|:]|\[ad\]|\(ad\)|\bsponsored\b|paid partnership|#\w*partner\b|\banzeige\b|\bwerbung\b)/i;

// Brand-safety screen for what we DISPLAY (population stats are untouched).
const UNSAFE = /\b(idf|gaza|israel\w*|palestin\w*|hamas|soldiers?|army|military|war|bomb\w*|killed|shooting|terror\w*|nude|naked|porn\w*|onlyfans|nsfw)\b/i;
const PROFANE = /\b(fuck\w*|shit\w*|bitch\w*|dick|pussy|cunt|nigg\w*)\b/i;

export function postUrl(r: RawContent): string | null {
  if (!r.platformId) return null;
  if (r.platform === "instagram") return `https://www.instagram.com/reel/${r.platformId}/`;
  return `https://www.tiktok.com/@${r.profileHandle}/video/${r.platformId}`;
}

export function normalizeVideo(r: RawContent): Video {
  const views = r.viewsCount ?? 0;
  const interactions = r.interactionsCount ?? 0;
  const followers = r.profileFollowersCount ?? 0;
  const chunks = r.transcriptChunks ?? [];
  const hookChunks = chunks.filter((c) => c.startSeconds < 3.5);
  const words = (r.transcript ?? "").split(/\s+/).filter(Boolean).length;
  return {
    id: r.id,
    platform: r.platform,
    url: postUrl(r),
    thumbnail: r.thumbnailMediaUrl ?? null,
    creator: {
      handle: r.profileHandle,
      displayName: r.profileDisplayName,
      platform: r.platform,
      profileId: r.profileId ?? null,
      followers,
      avatar: r.profilePictureUrl ?? null,
      verified: !!r.profileVerified,
      bio: r.profileBio ?? null,
    },
    publishedAt: r.publishedAt,
    caption: (r.caption ?? "").trim(),
    captionLanguage: r.captionLanguage,
    views,
    likes: r.likesCount ?? 0,
    comments: r.commentsCount ?? 0,
    shares: r.sharesCount ?? 0,
    interactions,
    reach: followers > 0 ? views / followers : null,
    er: views > 0 ? interactions / views : null,
    duration: r.duration ?? null,
    hashtags: (r.hashtags ?? []).map((h) => h.toLowerCase()),
    transcript: r.transcript ?? null,
    transcriptLanguage: r.transcriptLanguage ?? null,
    hook: hookChunks.length ? hookChunks.map((c) => c.text).join(" ").trim() : null,
    firstSpeechAt: chunks.length ? chunks[0].startSeconds : null,
    wordsPerSecond: r.duration && r.transcript ? words / r.duration : null,
    frames: (r.frames ?? [])
      .slice()
      .sort((a, b) => (b.visualSimilarityScore ?? 0) - (a.visualSimilarityScore ?? 0) || a.position - b.position)
      .slice(0, 4)
      .map((f) => ({ url: f.url, t: f.timestampSeconds, score: f.visualSimilarityScore ?? null })),
    audio: { title: r.audioTitle ?? null, type: r.audioType ?? null, copyrighted: r.audioCopyrighted ?? null },
    topComments: (r.popularComments ?? [])
      .slice()
      .sort((a, b) => b.likesCount - a.likesCount)
      .filter((c) => !PROFANE.test(c.content) && !UNSAFE.test(c.content))
      .slice(0, 3)
      .map((c) => ({ text: c.content, likes: c.likesCount, handle: c.profileHandle })),
    mentions: (r.mentions ?? []).map((m) => m.profileHandle),
    sponsored: SPONSORED.test(r.caption ?? ""),
    brandUnsafe: UNSAFE.test(`${r.caption ?? ""} ${r.transcript ?? ""} ${r.profileBio ?? ""}`),
    likelyBoosted: views > 100_000 && followers > 0 && views / followers > 3 && interactions / Math.max(views, 1) < 0.005,
    visualMatch: (r.frames ?? []).reduce<number | null>((m, f) => (f.visualSimilarityScore != null && (m === null || f.visualSimilarityScore > m) ? f.visualSimilarityScore : m), null),
  };
}

/** Population statistics from a limit=3, sort=viewsCount:desc, projection=full response. */
export function groupStats(res: RawSearchResponse): GroupStats {
  const n = res.metadata.pagination?.totalCount ?? 0;
  const agg = res.data.aggregations;
  const views = agg.totalViewsCount ?? 0;
  const interactions = agg.totalInteractionsCount ?? 0;
  const erf = agg.totalEngagementRatePerFollowers ?? 0;
  const followers = erf > 0 ? interactions / erf : 0;
  const results = res.data.results;
  const top = results.map((r) => r.viewsCount ?? 0);
  const topSum = top.reduce((a, b) => a + b, 0);
  const topFollowers = results.reduce((a, r) => a + (r.profileFollowersCount ?? 0), 0);
  const topInteractions = results.reduce((a, r) => a + (r.interactionsCount ?? 0), 0);
  // Trimmed = everything except the 3 most-viewed videos, so one viral hit or boosted ad can't drive the metric.
  const tViews = views - topSum;
  const tFollowers = followers - topFollowers;
  const tInteractions = interactions - topInteractions;
  const trimmedOk = n > results.length + 5 && tViews > 0 && tFollowers > 0;
  return {
    n,
    views,
    interactions,
    followers,
    rawReach: followers > 0 ? views / followers : 0,
    rawEr: views > 0 ? interactions / views : 0,
    reach: trimmedOk ? tViews / tFollowers : followers > 0 ? views / followers : 0,
    er: trimmedOk ? tInteractions / tViews : views > 0 ? interactions / views : 0,
    top1Share: views > 0 ? (top[0] ?? 0) / views : 0,
    top3Share: views > 0 ? topSum / views : 0,
    vpvTrimmed: n > top.length ? (views - topSum) / (n - top.length) : 0,
  };
}
