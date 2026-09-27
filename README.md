# WhiteSpace

**Opportunity intelligence for the video internet.** Find where attention is going before everyone else gets there.

WhiteSpace compares observed creator supply with observed response to find video angles worth investigating. It is **not a virality prediction** or consumer research. This repository is the Replit hackathon track on `replit-track`; do not merge it into the separately developed `main` branch as part of a demo.

## Architecture

- `artifacts/whitespace`: responsive React/Vite app at `/`, with a URL-backed search, interactive white-space map, opportunity details, and presentation mode.
- `artifacts/api-server`: Express server at `/api`. The browser calls this server, **never Oriane directly**. `ORIANE_API_KEY` is read only by the server and sent as a Bearer credential to Oriane.
- `artifacts/api-server/src/lib/oriane`: documented contents-search and text-asset adapter, normalization, memory/disk caching. `artifacts/api-server/data/oriane-cache` contains previously retrieved **real** response snapshots, not invented videos. Responses are keyed by request path, parameters and body. Fresh cached data is used for 24 hours by default; if an upstream call fails, older saved responses may be returned as `stale-cache`. Set `WHITESPACE_DATA_MODE=fixture` on the server to forbid live upstream calls, using saved responses only.
- `artifacts/api-server/src/lib/whitespace`: market parsing, deterministic analysis, evidence, creative patterns, creator candidates and suggested campaign briefs. The OpenAPI contract lives in `lib/api-spec/openapi.yaml`.

Run the existing `artifacts/api-server: API Server` and `artifacts/whitespace: web` managed workflows in Replit. `/api/health` returns service status, whether Oriane is configured, cache count and data mode without exposing the credential. `/api/healthz` remains the platform startup check. A missing key can still serve cached requests; an uncached request returns a clear 503 if Oriane cannot be reached. The status endpoint checks configuration, not live Oriane availability. Production requires the API and web artifact services together, with `ORIANE_API_KEY` configured as a server secret for uncached searches.

## Two-minute demo

1. Select **Presentation mode**, or search **Running shoes UAE**. This exact query is pinned to the **June 27–September 27, 2026** observation window to preserve a verified real Oriane-backed demonstration as the calendar advances; the dates are visible in the scope. Other queries use the rolling three-month window unless `WHITESPACE_WINDOW_END` is explicitly set on the server.
2. Show the scatter map: the horizontal axis is **share of observed video supply**, the vertical axis is **relative observed performance**. Select **Desert heat** (`visual-outdoor-sun`). For the verified snapshot the market baseline has 48,197 global running-content videos and this visual slice has 119 matched videos; these are Oriane aggregates, not invented figures.
3. Read the scope caveat: just 198 locally text-matched videos also mention the UAE, so the analysis falls back to a **global** baseline. This is not a measured UAE opportunity. Walk through the calculation disclosure and open real linked TikTok/Instagram source posts.
4. Show the measured visual-style crowd gap and the Creative DNA traits, each tied to observed posts; review creator candidates only with their available supporting evidence, then present the **recommended** cross-platform brief. Instagram and TikTok evidence comes from Oriane; the YouTube Shorts adaptation is explicitly an editorial suggestion, not a measured YouTube result.

If the demo endpoint is unavailable, show the error rather than replacing it with fake data. The saved responses remain available in fixture mode. Data provenance (`live`, `cache`, `stale-cache`), observation window and scope caveats must stay visible.

## Methodology

The market is an Oriane caption-phrase query for videos published in the specified window. Angle supply is the matching count divided by the market count. Text angles match exact phrases in caption or transcript; vision angles use frame similarity to reusable text assets at **≥0.8**. Supply groups can overlap. The map's x value is supply share; its y value is `√(reach index × engagement index)`. Reach index compares `(views / creator followers)` to the market; engagement index compares `(likes + comments + shares) / views` to the market. The three most-viewed videos are excluded from both numerator groups when enough remain. Population aggregates use Oriane's full matched set, not the three fetched sample posts.

The deterministic ranking score is `100 × √(clamp(0.5 + log₂(relative performance), 0, 1) × (1 / (1 + supply share / 0.01))) × confidence`; confidence discounts small and top-three-concentrated groups. It is **not** an AI score. Momentum, when available, is the angle's last-30-day share of its three-month posts divided by the same share for the market. It measures posting mix, **not** future demand. The detail view should provide the numbers and formulas, not merely the rank.

The population crowd-gap comparison contrasts the largest measured style or metadata group with the best-responding group (only when both have at least 30 matched videos). Creative DNA is a deterministic summary of observed transcript start, length, audio, caption/transcript CTA, language, hooks and comments where those fields exist. Creator fit is a **candidate ranking**, informed by evidence and available recent creator history; missing history must not be presented as verified personal overperformance. The campaign brief is a creative recommendation, not an Oriane-generated script or a promise of results.

## Limits and data care

- Oriane's documented search index covers **TikTok and Instagram**, not YouTube. Coverage, indexing and geo mentions are incomplete; a caption mentioning a city does not establish the video's actual audience location.
- Visual similarity can return off-topic posts; a frame match does **not** establish product performance or local relevance. Inspect the source video before acting. A broad running-content universe must not be described as a shoe-only market.
- Audience demographics, future virality, consumer purchase intent, creator endorsement and a causal effect of any format are **not measured**. No Audience Lab panel is shown without a grounded, clearly disclosed simulation.
- Aggregate views can be dominated by large accounts, overlapping supply groups and sponsored distribution. We exclude the top three for relative response and disclose concentration; this does not eliminate sampling or selection bias.
- The caches include third-party captions, thumbnails and public post metadata. Treat them as source snapshots, not owned assets; thumbnails may expire and links may be removed by the platforms.

## Development checks

From the workspace root: `pnpm run typecheck`, `pnpm --filter @workspace/whitespace run typecheck`, and `pnpm --filter @workspace/api-server run typecheck`. Use the managed workflows to verify the app and API; the web build needs its workflow-provided `BASE_PATH` and `PORT`. There are no credentials in tracked files.