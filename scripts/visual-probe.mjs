// Calibrate Oriane visual similarity: create a text asset, then search the running market by it.
import { oriane } from './explore-lib.mjs';
import { asset } from './asset-lib.mjs';

const text = process.argv[2] ?? 'a person running outdoors under hot desert sun';
const minScore = process.argv[3] ? Number(process.argv[3]) : undefined;
const id = await asset(text);
console.log('asset', id);
const market = { operator: 'or', filters: { caption: { includesExactly: { values: ['running', 'runner', 'marathon'], operator: 'or' } } } };
const vs = { assetId: id, ...(minScore !== undefined ? { minScore } : {}) };
const body = {
  operator: 'and',
  filters: { format: { includes: ['video'] }, publishedAt: { after: '2026-06-27', before: '2026-09-27' }, visualSimilarity: { includes: { values: [vs] } } },
  queries: [market],
};
const res = await oriane('/rest/contents/search', { limit: Number(process.env.LIMIT ?? 5), offset: 0, projection: 'full', sort: 'visualSimilarity:desc' }, body);
if (res.error) { console.log(JSON.stringify(res).slice(0, 600)); process.exit(1); }
console.log('meta', JSON.stringify({ ...res.metadata, pagination: { ...res.metadata.pagination, aiSearchAnchor: undefined } }));
console.log('agg', JSON.stringify(res.data.aggregations));
for (const x of res.data.results) {
  const scores = (x.frames || []).map((f) => f.visualSimilarityScore?.toFixed(3));
  console.log('-', x.profileHandle, x.viewsCount, 'f=' + x.profileFollowersCount, '| frames:', x.frames?.length, 'scores:', scores.filter(Boolean).slice(0, 6).join(','), '|', (x.caption || '').replace(/\s+/g, ' ').slice(0, 90));
}
