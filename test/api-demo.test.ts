import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "kandelta-real-responses-"));
fs.cpSync(path.join(process.cwd(), "data"), dataDir, { recursive: true });
process.env.WHITESPACE_DATA_DIR = dataDir;
process.env.WHITESPACE_DATA_MODE = "fixture";
delete process.env.WHITESPACE_WINDOW_END;
delete process.env.ORIANE_API_KEY;

const originalFetch = globalThis.fetch;
after(() => {
  globalThis.fetch = originalFetch;
  fs.rmSync(dataDir, { recursive: true, force: true });
});
const request = (pathname: string) => new Request(`http://localhost${pathname}`);
const saved = fs.readdirSync(path.join(dataDir, "oriane-cache")).map(name =>
  JSON.parse(fs.readFileSync(path.join(dataDir, "oriane-cache", name), "utf8"))
);

test("pinned search, measured map, real-video detail, and repeat load work without Oriane credentials", async () => {
  const [{ GET: analyze }, { GET: opportunity }, { parseMarket }] = await Promise.all([
    import("../src/app/api/analyze/route"),
    import("../src/app/api/opportunity/route"),
    import("../src/lib/whitespace/market"),
  ]);
  assert.deepEqual(parseMarket("Running shoes UAE").window, { after: "2026-06-27", before: "2026-09-27", days: 92 });
  assert(saved.length > 0);
  for (const snapshot of saved) {
    assert([200, 206].includes(snapshot.status), "genuine partial Oriane responses can be HTTP 206");
    assert.equal(snapshot.request.path, "/rest/contents/search");
    assert(Array.isArray(snapshot.response.data.results));
    assert(!JSON.stringify(snapshot).includes("Bearer "));
  }
  globalThis.fetch = (async () => { throw new Error("Fixture mode attempted external network access"); }) as typeof fetch;
  const query = "Running shoes UAE";
  const map = await analyze(request(`/api/analyze?q=${encodeURIComponent(query)}`));
  assert.equal(map.status, 200);
  const analysis = await map.json();
  assert.equal(analysis.query, query);
  assert(analysis.baseline.n > 0);
  assert(analysis.opportunities.length > 0);
  assert.equal(analysis.sources.live, 0);
  assert(analysis.sources.cache > 0);
  const id = analysis.opportunities.find((o: { id: string }) => o.id === "visual-outdoor-sun")?.id ?? analysis.opportunities[0].id;
  const url = `/api/opportunity?q=${encodeURIComponent(query)}&id=${id}`;
  const detailResponse = await opportunity(request(url));
  assert.equal(detailResponse.status, 200);
  const detail = await detailResponse.json();
  assert.equal(detail.opportunity.id, id);
  assert(detail.evidence.length > 0);
  assert(detail.dna.sample > 0);
  assert(detail.brief.title);
  assert.equal(detail.sources.live, 0);
  const realIds = new Set(saved.flatMap(s => s.response.data.results.map((v: { id: string }) => v.id)));
  for (const video of detail.evidence) assert(realIds.has(video.id), `Video ${video.id} is not in a real saved response`);
  assert(detail.evidence.some((v: { url: string | null }) => v.url?.startsWith("https://")));
  assert.deepEqual((await (await opportunity(request(url))).json()).evidence, detail.evidence);
});

test("missing credential, stale upstream failure, and uncached 503 are explicit", () => {
  const output = execFileSync(process.execPath,
    ["--conditions=react-server", "--import", "tsx", "test/failure-cases.ts"],
    {
      cwd: process.cwd(),
      env: { ...process.env, WHITESPACE_DATA_MODE: "live", WHITESPACE_CACHE_TTL_HOURS: "0", ORIANE_API_KEY: "" },
      encoding: "utf8",
    });
  assert.match(output, /failure cases passed/);
});