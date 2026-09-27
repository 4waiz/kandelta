import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function checkFailures() {
const { cacheKey, searchContents, OrianeUnavailableError } = await import("../src/lib/oriane/client");
const { GET: analyze } = await import("../src/app/api/analyze/route");
const cacheDir = path.join(process.env.WHITESPACE_DATA_DIR!, "oriane-cache");
const files = fs.readdirSync(cacheDir);
const sample = files.map(name => JSON.parse(fs.readFileSync(path.join(cacheDir, name), "utf8")))
  .find(s => s.request.query.limit === 3 && s.request.query.projection === "full");
assert(sample);
assert(files.includes(cacheKey(sample.request.path, sample.request.query, sample.request.body) + ".json"));
const realFetch = globalThis.fetch;
try {
  let calls = 0;
  process.env.ORIANE_API_KEY = "test-only-not-a-credential";
  globalThis.fetch = (async () => { calls++; throw new Error("upstream down"); }) as typeof fetch;
  const stale = await searchContents(sample.request.query, sample.request.body);
  assert.equal(stale.source, "stale-cache");
  assert.deepEqual(stale.response, sample.response);
  assert(calls > 0);
  const map = await analyze(new Request("http://localhost/api/analyze?q=Running%20shoes%20UAE"));
  assert.equal(map.status, 200);
  const body = await map.json();
  assert(body.sources["stale-cache"] > 0);
  assert.equal(body.sources.live, 0);

  const unique = { operator: "and" as const, filters: { caption: { includesExactly: { values: ["unseen snapshot test query"] } } } };
  delete process.env.ORIANE_API_KEY;
  await assert.rejects(searchContents({ limit: 81, offset: 0, projection: "basic" }, unique),
    (err: unknown) => err instanceof OrianeUnavailableError && /not configured/.test(err.message));
  assert.equal((await analyze(new Request("http://localhost/api/analyze?q=Uncached%20no-snapshot%20category"))).status, 503);
  process.env.ORIANE_API_KEY = "test-only-not-a-credential";
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: { code: "upstream_down" } }), { status: 503 })) as typeof fetch;
  await assert.rejects(searchContents({ limit: 81, offset: 0, projection: "basic" }, unique),
    (err: unknown) => err instanceof OrianeUnavailableError && err.status === 503);
  const uncached = await analyze(new Request("http://localhost/api/analyze?q=Uncached%20no-snapshot%20category"));
  assert.equal(uncached.status, 503);
  assert.deepEqual(await uncached.json(), { error: "Video intelligence temporarily unavailable." });
  process.stdout.write("failure cases passed\n");
} finally {
  globalThis.fetch = realFetch;
}
}
checkFailures().catch(err => {
  process.stderr.write(String(err) + "\n");
  process.exitCode = 1;
});