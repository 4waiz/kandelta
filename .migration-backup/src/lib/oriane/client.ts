import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ContentQuery, DataSource, RawSearchResponse, SearchParams } from "./types";

// Oriane adapter. The ONLY place that talks to connect.oriane.xyz.
// Cache strategy (credit protection):
//   memory (per process) -> disk (data/oriane-cache, real responses) -> live API.
//   Disk entries younger than CACHE_TTL are served without a network call.
//   If the live call fails, any disk entry (however old) is served and flagged "stale-cache".
//   WHITESPACE_DATA_MODE=fixture never calls the API (demo/dev on saved real responses).

const BASE = "https://connect.oriane.xyz";
const CACHE_DIR = path.join(process.cwd(), "data", "oriane-cache");
const ASSETS_FILE = path.join(process.cwd(), "data", "oriane-assets.json");
const CACHE_TTL_MS = Number(process.env.WHITESPACE_CACHE_TTL_HOURS ?? 24) * 3600_000;
const FIXTURE_ONLY = process.env.WHITESPACE_DATA_MODE === "fixture";

export class OrianeUnavailableError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "OrianeUnavailableError";
  }
}

export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(stableStringify).join(",") + "]";
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return (
      "{" +
      Object.keys(o)
        .filter((k) => o[k] !== undefined)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + stableStringify(o[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(v);
}

// Must stay identical to scripts/explore-lib.mjs so exploration fixtures are reusable.
export function cacheKey(p: string, query: object, body: object): string {
  return crypto
    .createHash("sha1")
    .update(p + "|" + stableStringify(query) + "|" + stableStringify(body))
    .digest("hex")
    .slice(0, 20);
}

interface CacheEntry {
  response: RawSearchResponse;
  fetchedAt: string;
}

const memory = new Map<string, CacheEntry>();
let liveCalls = 0;
export const liveCallCount = () => liveCalls;

function readDisk(key: string): CacheEntry | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, key + ".json"), "utf8"));
    if (!raw?.response?.data) return null;
    return { response: raw.response, fetchedAt: raw.fetchedAt };
  } catch {
    return null;
  }
}

function writeDisk(key: string, request: object, entry: CacheEntry) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(CACHE_DIR, key + ".json"),
      JSON.stringify({ request, status: 200, fetchedAt: entry.fetchedAt, response: entry.response }),
    );
  } catch {
    // read-only filesystem (some deployments) — memory cache still works
  }
}

function apiKey(): string {
  const k = process.env.ORIANE_API_KEY;
  if (!k) throw new OrianeUnavailableError("ORIANE_API_KEY is not configured on the server.");
  return k;
}

export interface SearchResult {
  response: RawSearchResponse;
  source: DataSource;
  fetchedAt: string;
}

export async function searchContents(params: SearchParams, body: ContentQuery): Promise<SearchResult> {
  const p = "/rest/contents/search";
  const query: Record<string, string | number> = {
    limit: params.limit,
    offset: params.offset,
    projection: params.projection,
  };
  if (params.sort) query.sort = params.sort;
  const key = cacheKey(p, query, body);

  const mem = memory.get(key);
  if (mem && Date.now() - Date.parse(mem.fetchedAt) < CACHE_TTL_MS) return { ...mem, source: "cache" };
  const disk = readDisk(key);
  if (disk && (FIXTURE_ONLY || Date.now() - Date.parse(disk.fetchedAt) < CACHE_TTL_MS)) {
    memory.set(key, disk);
    return { ...disk, source: "cache" };
  }
  if (FIXTURE_ONLY) throw new OrianeUnavailableError("Fixture mode: no saved response for this request.");

  try {
    const qs = new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)])).toString();
    const res = await fetch(`${BASE}${p}?${qs}`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey()}` },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    liveCalls++;
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.data) {
      const code = json?.error?.code ?? res.status;
      throw new OrianeUnavailableError(`Oriane search failed (${code}).`, res.status);
    }
    const entry: CacheEntry = { response: json as RawSearchResponse, fetchedAt: new Date().toISOString() };
    memory.set(key, entry);
    writeDisk(key, { path: p, query, body }, entry);
    return { ...entry, source: "live" };
  } catch (err) {
    const fallback = disk ?? mem;
    if (fallback) return { ...fallback, source: "stale-cache" };
    if (err instanceof OrianeUnavailableError) throw err;
    throw new OrianeUnavailableError("Video intelligence temporarily unavailable.");
  }
}

// ---- Visual-search assets (text -> asset id), cached forever ----
let assetMap: Record<string, string> | null = null;
function loadAssets(): Record<string, string> {
  if (assetMap) return assetMap;
  try {
    assetMap = JSON.parse(fs.readFileSync(ASSETS_FILE, "utf8"));
  } catch {
    assetMap = {};
  }
  return assetMap!;
}

export async function textAsset(text: string): Promise<string> {
  const assets = loadAssets();
  if (assets[text]) return assets[text];
  if (FIXTURE_ONLY) throw new OrianeUnavailableError("Fixture mode: visual asset not cached.");
  const res = await fetch(`${BASE}/rest/assets`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({ type: "text", text }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  liveCalls++;
  const json = await res.json().catch(() => null);
  const id: string | undefined = json?.data?.id;
  if (!res.ok || !id) throw new OrianeUnavailableError(`Oriane asset creation failed (${res.status}).`, res.status);
  assets[text] = id;
  try {
    fs.writeFileSync(ASSETS_FILE, JSON.stringify(assets, null, 2));
  } catch {
    /* read-only fs */
  }
  return id;
}
