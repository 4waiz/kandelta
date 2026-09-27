import type { ContentQuery } from "../oriane/types";

export interface MarketSpec {
  query: string;
  label: string; // human topic, e.g. "running"
  phrases: string[]; // caption phrases defining the market
  location: { label: string; phrases: string[] } | null;
  window: { after: string; before: string; days: number };
}

// Small synonym map so common demo topics define a sensible universe. Anything else uses the raw words.
const TOPIC_SYNONYMS: Record<string, string[]> = {
  running: ["running", "runner", "marathon"],
  // A running-shoe brand competes for attention across running content, not only shoe reviews.
  "running shoes": ["running", "runner", "marathon"],
  fitness: ["fitness", "workout", "gym"],
  gym: ["gym", "workout"],
  beauty: ["makeup", "skincare", "beauty"],
  skincare: ["skincare", "skin care"],
  makeup: ["makeup"],
  coffee: ["coffee", "espresso", "latte"],
  "specialty coffee": ["specialty coffee", "coffee shop", "barista"],
  "luxury travel": ["luxury travel", "luxury hotel", "five star hotel"],
  travel: ["travel"],
  restaurants: ["restaurant", "restaurants"],
  food: ["food", "foodie"],
  fashion: ["fashion", "outfit"],
};

const LOCATIONS: Record<string, string[]> = {
  dubai: ["dubai"],
  uae: ["uae", "dubai", "abu dhabi"],
  "abu dhabi": ["abu dhabi"],
  "saudi arabia": ["saudi", "riyadh", "jeddah"],
  saudi: ["saudi", "riyadh", "jeddah"],
  riyadh: ["riyadh"],
  qatar: ["qatar", "doha"],
  doha: ["doha"],
  london: ["london"],
  "new york": ["new york", "nyc"],
  paris: ["paris"],
};

const FILLER = /\b(content|creators?|videos?|brands?|market|audience|for|the|a|an|on|tiktok|instagram|reels?)\b/gi;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function windowEnd(): Date {
  const endStr = process.env.WHITESPACE_WINDOW_END;
  return endStr ? new Date(endStr + "T00:00:00Z") : new Date();
}

/** Last N calendar months ending today (UTC), or WHITESPACE_WINDOW_END when pinned for a demo snapshot. */
export function analysisWindow(months = 3) {
  const end = windowEnd();
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months, end.getUTCDate()));
  const days = Math.round((end.getTime() - start.getTime()) / 86400_000);
  return { after: isoDate(start), before: isoDate(end), days };
}

/** Most recent N days of the analysis window — used for supply momentum. */
export function recentWindow(days = 30) {
  const end = windowEnd();
  const start = new Date(end.getTime() - days * 86400_000);
  return { after: isoDate(start), before: isoDate(end), days };
}

export function parseMarket(input: string): MarketSpec {
  const query = input.trim().replace(/\s+/g, " ").slice(0, 120);
  let rest = query.toLowerCase();
  let location: MarketSpec["location"] = null;
  for (const [name, phrases] of Object.entries(LOCATIONS).sort((a, b) => b[0].length - a[0].length)) {
    const re = new RegExp(`\\b(in|across|around|from)?\\s*${name}\\b`, "i");
    if (re.test(rest)) {
      location = { label: name.replace(/\b\w/g, (c) => c.toUpperCase()).replace("Uae", "UAE"), phrases };
      rest = rest.replace(re, " ");
      break;
    }
  }
  const topic = rest.replace(FILLER, " ").replace(/[^\p{L}\p{N}&' ]/gu, " ").replace(/\s+/g, " ").trim() || "running";
  const phrases = TOPIC_SYNONYMS[topic] ?? [topic];
  return { query, label: topic, phrases, location, window: analysisWindow(3) };
}

// Market universe as an Oriane query node (caption phrases, optionally AND a location clause).
export function marketNode(m: MarketSpec): ContentQuery {
  return { operator: "or", filters: { caption: { includesExactly: { values: m.phrases, operator: "or" } } } };
}

export function locationNode(m: MarketSpec): ContentQuery | null {
  if (!m.location) return null;
  return { operator: "or", filters: { caption: { includesExactly: { values: m.location.phrases, operator: "or" } } } };
}

export function phraseNode(phrases: string[]): ContentQuery {
  return {
    operator: "or",
    filters: {
      caption: { includesExactly: { values: phrases, operator: "or" } },
      transcript: { includesExactly: { values: phrases, operator: "or" } },
    },
  };
}
