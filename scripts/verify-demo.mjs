// Independent audit of the demo's headline numbers, recomputed from RAW cached Oriane responses
// (does not import any app code). Usage: node scripts/verify-demo.mjs
import fs from 'node:fs';

const dir = 'data/oriane-cache';
const assets = JSON.parse(fs.readFileSync('data/oriane-assets.json', 'utf8'));
const entries = fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')));
const W = { after: '2026-06-27', before: '2026-09-27' };
const MARKET = ['running', 'runner', 'marathon'];

const isMarketOnly = (b) => b.queries?.length === 1 && JSON.stringify(b.queries[0].filters?.caption?.includesExactly?.values) === JSON.stringify(MARKET);
const inWindow = (b) => b.filters?.publishedAt?.after === W.after && b.filters?.publishedAt?.before === W.before;
function find(pred) {
  return entries.find((e) => e.request.path === '/rest/contents/search' && pred(e.request.body, e.request.query));
}
function stats(e) {
  const r = e.response;
  const n = r.metadata.pagination.totalCount;
  const a = r.data.aggregations;
  const V = a.totalViewsCount, I = a.totalInteractionsCount, F = I / a.totalEngagementRatePerFollowers;
  const top = r.data.results;
  const tV = V - top.reduce((s, x) => s + x.viewsCount, 0);
  const tI = I - top.reduce((s, x) => s + x.interactionsCount, 0);
  const tF = F - top.reduce((s, x) => s + x.profileFollowersCount, 0);
  return { n, reach: tV / tF, er: tI / tV, top: top.map((x) => [x.profileHandle, x.viewsCount]) };
}

const base = stats(find((b, q) => isMarketOnly(b) && inWindow(b) && !b.filters.visualSimilarity && Object.keys(b.filters).length === 2 && q.limit === 3));
console.log(`Market: n=${base.n} reach=${base.reach.toFixed(3)} er=${(base.er * 100).toFixed(2)}%`);

const sunId = assets['a person outdoors under hot desert sun'];
const sunE = find((b, q) => isMarketOnly(b) && inWindow(b) && b.filters.visualSimilarity?.includes?.values?.[0]?.assetId === sunId && b.filters.visualSimilarity.includes.values[0].minScore === 0.8 && q.limit === 3 && q.sort === 'viewsCount:desc');
const sun = stats(sunE);
const ri = sun.reach / base.reach, ei = sun.er / base.er;
console.log(`Desert heat: n=${sun.n} share=${((sun.n / base.n) * 100).toFixed(3)}% reachIdx=${ri.toFixed(2)} erIdx=${ei.toFixed(2)} response=${Math.sqrt(ri * ei).toFixed(2)}`);
console.log(`  top-3 most viewed: ${sun.top.map(([h, v]) => `@${h} ${v}`).join(', ')}`);

const overlap = find((b, q) => b.filters?.visualSimilarity?.includes?.values?.[0]?.assetId === sunId && b.queries?.length === 2 && JSON.stringify(b.queries[1].filters?.caption?.includesExactly?.values) === JSON.stringify(['heat', 'hot weather', 'humidity']) && q.projection === 'basic');
if (overlap) console.log(`Caption/speech overlap: ${overlap.response.metadata.pagination.totalCount} of ${sun.n} → missed ${(((sun.n - overlap.response.metadata.pagination.totalCount) / sun.n) * 100).toFixed(1)}%`);

const styles = ['first-person point of view footage', 'a person talking directly to the camera', 'close-up product shot on a plain studio background', 'a person outdoors under hot desert sun', 'a group of people together outdoors', 'outdoors at night under city lights'];
const ss = styles.map((p) => [p, stats(find((b, q) => isMarketOnly(b) && inWindow(b) && b.filters.visualSimilarity?.includes?.values?.[0]?.assetId === assets[p] && b.filters.visualSimilarity.includes.values[0].minScore === 0.8 && q.limit === 3 && q.sort === 'viewsCount:desc'))]);
const tot = ss.reduce((s, [, x]) => s + x.n, 0);
for (const [p, x] of ss) console.log(`  style "${p}": n=${x.n} (${((x.n / tot) * 100).toFixed(1)}% of ${tot}) er=${(x.er * 100).toFixed(2)}%`);
const pov = ss[0][1];
console.log(`Crowd gap: desert ER / POV ER = ${(sun.er / pov.er).toFixed(2)}×`);
