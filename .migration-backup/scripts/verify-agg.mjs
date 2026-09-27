// Verify how Oriane computes aggregate engagement-per-follower (sum ratio vs mean of ratios).
import fs from 'node:fs';
import { oriane } from './explore-lib.mjs';
const files = fs.readdirSync('data/oriane-cache').map((f) => JSON.parse(fs.readFileSync('data/oriane-cache/' + f, 'utf8')));
const ids = [...new Set(files.flatMap((f) => (f.response?.data?.results ?? []).map((r) => r.id)))].slice(0, 3);
const res = await oriane('/rest/contents/search', { limit: 3, offset: 0, projection: 'full' }, { operator: 'and', filters: { id: { includes: ids } } });
const rs = res.data.results;
const I = rs.reduce((a, r) => a + r.interactionsCount, 0), V = rs.reduce((a, r) => a + r.viewsCount, 0), F = rs.reduce((a, r) => a + r.profileFollowersCount, 0);
console.log('n', rs.length, 'agg', JSON.stringify(res.data.aggregations));
console.log('sumI/sumV', I / V, 'sumI/sumF', I / F);
console.log('mean(I/F)', rs.reduce((a, r) => a + r.interactionsCount / r.profileFollowersCount, 0) / rs.length);
console.log('per-result engagementRatePerFollowers', rs.map((r) => r.engagementRatePerFollowers), 'recomputed %', rs.map((r) => (100 * r.interactionsCount) / r.profileFollowersCount));
