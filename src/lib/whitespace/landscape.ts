import "server-only";
import { searchContents } from "../oriane/client";
import { normalizeVideo } from "../oriane/normalize";
import type { ContentFilters, ContentQuery } from "../oriane/types";
import { buildBody, resolveAngle, resolveMarket } from "./analyze";

// Competitive coverage + "hidden conversation" (Oriane Shadow Reach): what is SAID about a brand in videos
// that neither caption nor tag it. All counts are Oriane totalCount values (limit=1 requests).

export interface Brand {
  name: string;
  phrases: string[];
  handles: string[];
}

const BRANDS_BY_UNIVERSE: Record<string, Brand[]> = {
  running: [
    { name: "Nike", phrases: ["nike"], handles: ["nike", "nikerunning"] },
    { name: "Adidas", phrases: ["adidas"], handles: ["adidas", "adidasrunning"] },
    { name: "Hoka", phrases: ["hoka"], handles: ["hoka"] },
    { name: "ASICS", phrases: ["asics"], handles: ["asics", "asicsrunning"] },
    { name: "New Balance", phrases: ["new balance"], handles: ["newbalance", "newbalancerunning"] },
    { name: "On", phrases: ["on running", "on cloud", "cloudmonster"], handles: ["on_running"] },
  ],
};

export function brandsFor(universe: string, custom?: string[]): Brand[] {
  if (custom?.length)
    return custom.slice(0, 6).map((c) => {
      const name = c.trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
      return { name, phrases: [name.toLowerCase()], handles: [slug] };
    });
  return BRANDS_BY_UNIVERSE[universe] ?? [];
}

export interface BrandRow {
  name: string;
  mentions: number; // market videos mentioning the brand (caption, speech or tag)
  share: number; // of market
  inOpportunity: number; // of those, inside this opportunity
  coverage: number; // inOpportunity / mentions
  hidden: number; // spoken about, but not captioned or tagged
  hiddenShare: number; // hidden / mentions
}

export interface HiddenQuote {
  brand: string;
  handle: string;
  platform: string;
  url: string | null;
  thumbnail: string | null;
  quote: string;
  at: number | null;
  views: number;
}

export interface Landscape {
  brands: BrandRow[];
  opportunityN: number;
  brandedInOpportunity: number;
  hiddenQuotes: HiddenQuote[];
  note: string;
}

const mentionNode = (b: Brand): ContentQuery => ({
  operator: "or",
  filters: {
    caption: { includesExactly: { values: b.phrases, operator: "or" } },
    transcript: { includesExactly: { values: b.phrases, operator: "or" } },
    mentionHandles: { exactMatch: { values: b.handles, operator: "or" } },
  } as ContentFilters,
});

const hiddenNode = (b: Brand): ContentQuery => ({
  operator: "and",
  filters: {
    transcript: { includesExactly: { values: b.phrases, operator: "or" } },
    caption: { excludesExactly: { values: b.phrases, operator: "or" } },
    mentionHandles: { excludesExactly: { values: b.handles, operator: "or" } },
  } as ContentFilters,
});

export async function landscape(query: string, angleId: string, custom?: string[]): Promise<Landscape> {
  const { ctx, baseline } = await resolveMarket(query);
  const def = await resolveAngle(ctx, angleId);
  if (!def) throw new Error("Unknown opportunity.");
  const brands = brandsFor(ctx.market.universe, custom);
  if (!brands.length) return { brands: [], opportunityN: 0, brandedInOpportunity: 0, hiddenQuotes: [], note: "Add competitor brands to compare coverage." };

  const count = async (nodes: ContentQuery[], filters: ContentFilters = {}) => {
    const r = await ctx.run(() => searchContents({ limit: 1, offset: 0, projection: "basic" }, buildBody(ctx, nodes, filters)));
    return r.response.metadata.pagination?.totalCount ?? 0;
  };

  const [oppN, ...rows] = await Promise.all([
    count(def.nodes, def.filters),
    ...brands.map(async (b) => {
      const [mentions, inOpp, hidden] = await Promise.all([count([mentionNode(b)]), count([mentionNode(b), ...def.nodes], def.filters), count([hiddenNode(b)])]);
      return { name: b.name, mentions, share: baseline.n ? mentions / baseline.n : 0, inOpportunity: inOpp, coverage: mentions ? inOpp / mentions : 0, hidden, hiddenShare: mentions ? hidden / mentions : 0 } satisfies BrandRow;
    }),
  ]);

  // Quotes: what is said about the most "hidden" brand, straight from Oriane transcripts.
  const topHidden = rows.slice().sort((a, b) => b.hidden - a.hidden)[0];
  const brand = brands.find((b) => b.name === topHidden?.name);
  let hiddenQuotes: HiddenQuote[] = [];
  if (brand && topHidden.hidden > 0) {
    const r = await ctx.run(() => searchContents({ limit: 6, offset: 0, projection: "full", sort: "viewsCount:desc" }, buildBody(ctx, [hiddenNode(brand)])));
    const seen = new Set<string>();
    hiddenQuotes = r.response.data.results.flatMap((raw): HiddenQuote[] => {
      const v = normalizeVideo(raw);
      if (v.brandUnsafe) return [];
      const chunk = (raw.transcriptChunks ?? []).find((c) => brand.phrases.some((p) => c.text.toLowerCase().includes(p)));
      if (!chunk) return [];
      const key = chunk.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 40);
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ brand: brand.name, handle: v.creator.handle, platform: v.platform, url: v.url, thumbnail: v.thumbnail, quote: chunk.text.trim(), at: chunk.startSeconds, views: v.views }];
    }).slice(0, 4);
  }

  return {
    brands: rows.sort((a, b) => b.mentions - a.mentions),
    opportunityN: oppN,
    brandedInOpportunity: rows.reduce((a, r) => a + r.inOpportunity, 0),
    hiddenQuotes,
    note: "Mentions = brand in caption, spoken transcript or tagged account. Hidden = spoken in the video but not in the caption and not tagged.",
  };
}
