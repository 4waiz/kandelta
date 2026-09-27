// Deterministic, explainable scoring. Every number here is derived from Oriane population statistics.
// The same text is rendered in the "How is this calculated?" panel (see METHOD below).

export interface GroupStats {
  n: number; // videos matching (Oriane totalCount)
  views: number; // Σ views (Oriane aggregation over ALL matches)
  interactions: number; // Σ likes+comments+shares
  followers: number; // Σ creator followers, derived exactly: Σinteractions / (Σinteractions/Σfollowers)
  reach: number; // views per follower, EXCLUDING the 3 most-viewed videos (robust to viral hits / boosted ads)
  er: number; // interactions per view, excluding the 3 most-viewed videos
  rawReach: number; // untrimmed views per follower
  rawEr: number;
  top1Share: number; // share of all views captured by the single most-viewed video
  top3Share: number; // share captured by the 3 most-viewed videos
  vpvTrimmed: number; // views per video excluding the top 3 videos
}

export const SCARCITY_REF = 0.01; // an angle holding 1% of market supply has scarcity 0.5
export const MIN_CONFIDENT_N = 300;

export const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));

export function reachIndex(c: GroupStats, m: GroupStats) {
  return m.reach > 0 ? c.reach / m.reach : 0;
}
export function engagementIndex(c: GroupStats, m: GroupStats) {
  return m.er > 0 ? c.er / m.er : 0;
}
/** Relative performance: geometric mean of reach index and engagement index (1.0 = market average). */
export function relativePerformance(ri: number, ei: number) {
  return ri > 0 && ei > 0 ? Math.sqrt(ri * ei) : 0;
}
export function scarcity(share: number) {
  return 1 / (1 + share / SCARCITY_REF);
}
export function confidence(s: GroupStats) {
  const size = clamp(Math.log10(Math.max(s.n, 1)) / Math.log10(MIN_CONFIDENT_N));
  const concentration = clamp(1 - Math.max(0, s.top3Share - 0.5) * 1.2, 0.4, 1);
  return { value: size * concentration, size, concentration };
}
export function performanceComponent(rp: number) {
  return rp > 0 ? clamp(0.5 + Math.log2(rp)) : 0;
}
export function opportunityScore(rp: number, share: number, conf: number) {
  return Math.round(100 * Math.sqrt(performanceComponent(rp) * scarcity(share)) * conf);
}

export type Stage = "EARLY" | "EMERGING" | "CROWDED" | "SATURATED";
export function stageFor(share: number): Stage {
  if (share < 0.005) return "EARLY";
  if (share < 0.015) return "EMERGING";
  if (share < 0.04) return "CROWDED";
  return "SATURATED";
}

export type Quadrant = "white-space" | "saturated-winner" | "noise" | "low-signal";
export function quadrantFor(share: number, rp: number): Quadrant {
  const crowded = share >= SCARCITY_REF;
  if (rp >= 1) return crowded ? "saturated-winner" : "white-space";
  return crowded ? "noise" : "low-signal";
}

export const METHOD = {
  summary:
    "Opportunity Score = 100 × √(Performance × Scarcity) × Confidence. Both performance and scarcity must be high for a high score.",
  terms: [
    {
      name: "Supply",
      formula: "videos matching the angle ÷ videos in the market",
      detail:
        "Counted by Oriane across its whole index for the last 3 months (not a sample). An angle is matched by exact phrases in the caption or the spoken transcript.",
    },
    {
      name: "Reach index",
      formula: "(views ÷ creator followers) for the angle ÷ same for the market",
      detail:
        "Controls for creator size. 1.5× means these videos reach 50% more people per follower than the average video in the market. The 3 most-viewed videos are excluded from every group (views, followers and interactions) so a single viral hit or boosted ad cannot drive the result.",
    },
    {
      name: "Engagement index",
      formula: "(interactions ÷ views) for the angle ÷ same for the market",
      detail: "Did viewers care? Likes, comments and shares per view, relative to the market.",
    },
    {
      name: "Relative performance",
      formula: "√(reach index × engagement index)",
      detail: "Geometric mean, so an angle cannot score well on reach alone. 1.0× = market average.",
    },
    {
      name: "Performance",
      formula: "clamp(0.5 + log₂(relative performance), 0, 1)",
      detail: "Market average → 0.5. Twice the market (or better) → 1.0. Half the market → 0.",
    },
    {
      name: "Scarcity",
      formula: "1 ÷ (1 + supply ÷ 1%)",
      detail: "Falls as supply grows: 0.1% of market → 0.91, 1% → 0.50, 5% → 0.17.",
    },
    {
      name: "Confidence",
      formula: "size factor × concentration factor",
      detail:
        "Size: log₁₀(videos) ÷ log₁₀(300), capped at 1. Concentration: reduced when the top 3 videos capture more than half of the angle's views.",
    },
    {
      name: "Stage",
      formula: "EARLY < 0.5% of supply ≤ EMERGING < 1.5% ≤ CROWDED < 4% ≤ SATURATED",
      detail: "Current observed saturation only. It is not a forecast.",
    },
    {
      name: "Momentum",
      formula: "(angle's last-30-day share of its 3-month supply) ÷ (market's)",
      detail: "Above 1.0 means creators are adding this angle faster than the market overall.",
    },
  ],
  caveat:
    "KanDelta does not predict virality. It identifies observed mismatches between content supply and audience response.",
};
