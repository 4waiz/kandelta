// Exploration harness: measures supply vs attention for creative concepts inside a market.
// Every Oriane response is cached to data/oriane-cache so the same request is never paid twice.
// Usage: node scripts/explore.mjs <market-json-file>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const CACHE_DIR = path.join(ROOT, 'data', 'oriane-cache');
fs.mkdirSync(CACHE_DIR, { recursive: true });

function loadKey() {
  if (process.env.ORIANE_API_KEY) return process.env.ORIANE_API_KEY;
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  return /ORIANE_API_KEY=(.+)/.exec(env)[1].trim();
}
const KEY = loadKey();

export function stableStringify(v) {
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
export function cacheKey(p, query, body) {
  return crypto.createHash('sha1').update(p + '|' + stableStringify(query) + '|' + stableStringify(body)).digest('hex').slice(0, 20);
}

let liveCalls = 0;
export async function oriane(p, query, body) {
  const key = cacheKey(p, query, body);
  const file = path.join(CACHE_DIR, key + '.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')).response;
  const qs = new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)])).toString();
  const r = await fetch(`https://connect.oriane.xyz${p}?${qs}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  });
  liveCalls++;
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 500) }; }
  if (r.status >= 400) {
    console.error('ORIANE ERROR', r.status, JSON.stringify(json).slice(0, 400));
    return { error: json, status: r.status };
  }
  fs.writeFileSync(file, JSON.stringify({ request: { path: p, query, body }, status: r.status, fetchedAt: new Date().toISOString(), response: json }));
  return json;
}

