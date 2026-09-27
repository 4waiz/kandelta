import { oriane } from './explore-lib.mjs';
import fs from 'node:fs';
import { asset } from './asset-lib.mjs';

const textAny = (phrases, fields = ['caption', 'transcript']) => ({
  operator: 'or',
  filters: Object.fromEntries(fields.map((f) => [f, { includesExactly: { values: phrases, operator: 'or' } }])),
});

async function stats(market, concept, window, visual) {
  const body = {
    operator: 'and',
    filters: { format: { includes: ['video'] }, publishedAt: window, ...(visual ? { visualSimilarity: { includes: { values: [visual] } } } : {}) },
    queries: concept ? [market, concept] : [market],
  };
  const res = await oriane('/rest/contents/search', { limit: 3, offset: 0, projection: 'full', sort: 'viewsCount:desc' }, body);
  if (res.error) return null;
  const n = res.metadata?.pagination?.totalCount ?? 0;
  const v = res.data?.aggregations?.totalViewsCount ?? 0;
  const i = res.data?.aggregations?.totalInteractionsCount ?? 0;
  const top = (res.data?.results ?? []).map((x) => x.viewsCount);
  const erf = res.data?.aggregations?.totalEngagementRatePerFollowers ?? 0;
  const f = erf ? i / erf : 0;
  const trimmedV = v - top.reduce((a, b) => a + b, 0);
  const trimmedN = n - top.length;
  return { n, v, i, f, reach: f ? v / f : 0, vpv: n ? v / n : 0, tvpv: trimmedN > 0 ? trimmedV / trimmedN : 0, er: v ? i / v : 0, top1Share: v ? (top[0] ?? 0) / v : 0, top };
}

const cfgFile = process.argv[2];
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const market = textAny(cfg.market.phrases, cfg.market.fields);
const window = cfg.window;
const base = await stats(market, null, window);
console.log(`MARKET ${cfg.name}: n=${base.n} views=${base.v} vpv=${base.vpv.toFixed(0)} tvpv=${base.tvpv.toFixed(0)} er=${(base.er * 100).toFixed(2)}% top1Share=${(base.top1Share * 100).toFixed(1)}% reach=${base.reach.toFixed(3)}`);
const rows = [];
for (const c of cfg.concepts) {
  const s = c.visual ? await stats(market, null, window, { assetId: await asset(c.visual), minScore: c.minScore ?? 0.8 }) : await stats(market, textAny(c.phrases, c.fields), window);
  if (!s) continue;
  rows.push({ name: c.name, ...s, share: s.n / base.n, ai: base.tvpv ? s.tvpv / base.tvpv : 0, eri: base.er ? s.er / base.er : 0, ri: base.reach ? s.reach / base.reach : 0 });
}
rows.sort((a, b) => b.ri - a.ri);
console.log('concept'.padEnd(22), 'n'.padStart(7), 'share'.padStart(7), 'tvpv'.padStart(9), 'attnIdx'.padStart(8), 'ER'.padStart(7), 'ERidx'.padStart(6), 'top1%'.padStart(6), 'reach'.padStart(7), 'reachIdx'.padStart(8));
for (const r of rows) console.log(r.name.padEnd(22), String(r.n).padStart(7), (r.share * 100).toFixed(1).padStart(6) + '%', r.tvpv.toFixed(0).padStart(9), r.ai.toFixed(2).padStart(8), (r.er * 100).toFixed(2).padStart(6) + '%', r.eri.toFixed(2).padStart(6), (r.top1Share * 100).toFixed(0).padStart(5) + '%', r.reach.toFixed(3).padStart(7), r.ri.toFixed(2).padStart(8));

