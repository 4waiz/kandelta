# Oriane API — working notes (non-secret)

Source: the public API reference at `https://connect.oriane.xyz/rest/docs` (Scalar UI, OpenAPI 3.0.0, v0.0.1),
extracted on 2026-09-27 and verified with live requests. **No keys in this file.** The key lives only in
`ORIANE_API_KEY` (`.env.local` locally, Replit Secrets in deployment).

## Base + auth

| | |
|---|---|
| Server | `https://connect.oriane.xyz` |
| Auth | `Authorization: Bearer <ORIANE_API_KEY>` — verified. `x-api-key` is **rejected** (401). |
| Content type | `application/json` |
| Auth failure | `401 {"error":{"operation":"AUTHENTICATION","code":"UNAUTHORIZED"}}` |
| Validation failure | `400 {"error":{"operation":"VALIDATION","code":"FAILED","context":[{field,rule,message}]}}` |
| Credits exhausted | `402` (OperationError) |
| Range errors | `416` |

Every response is wrapped: `{ data, metadata: { requestId, executionTime, timestamp, pagination? } }`.

## Endpoints

### `POST /rest/contents/search` — search indexed videos/posts (the core endpoint)

Query params:

| param | notes |
|---|---|
| `limit` | 1–100, default 20 |
| `offset` | default 0 |
| `projection` | `basic` \| `default` \| `full` (controls fields **and** aggregations returned) |
| `sort` | comma list of `visualSimilarity, transcriptRelevance, viewsCount, likesCount, sharesCount, commentsCount, interactionsCount, engagementRatePerViews, engagementRatePerFollowers, profileFollowersCount, publishedAt`, each with optional `:asc`/`:desc` (desc default). Default `publishedAt`. |
| `aiSearchAnchor` | returned on the first page of a visual-similarity search; must be echoed on later pages |

Body (recursive query):

```json
{
  "operator": "and" | "or",
  "name": "optional label, echoed in result.matchedQueries",
  "filters": { "...": "field filters (below)" },
  "queries": [ { "operator": "...", "filters": {} } ]
}
```

Limits: nesting depth ≤ 2, ≤ 500 filter values total, ≤ 10 visual-similarity values total.

Filter families:

- **Text** (`caption`, `transcript`, `hashtags`, `profileHandle`, `profileBio`, `audioTitle`, `audioAuthor`,
  `locationCompleteAddress`, `profileLocationCompleteAddress`, `coAuthorHandles`, `mentionHandles`):
  `{ exactMatch | includesExactly | includesFuzzy | excludesExactly ...: { values: string[], operator: "and"|"or" } }`.
  - `includesExactly` = phrase match inside the field. **We use this.**
  - `includesFuzzy` is edit-distance fuzzy; in testing "how to" matched ~27% of running videos, so it is too loose
    for supply measurement.
- **Enum/id lists** (`platform` [instagram|tiktok], `format` [video|image|carousel], `captionLanguage`,
  `transcriptLanguage`, `id`, `profileId`): `{ includes: [], excludes: [], operator }`.
- **Numeric ranges** (`viewsCount`, `interactionsCount`, `engagementRatePerViews`, `engagementRatePerFollowers`,
  `profileFollowersCount`): `{ min, max }` inclusive.
- **Dates** (`publishedAt`): `{ after: "YYYY-MM-DD", before: "YYYY-MM-DD" }` inclusive.
- **Booleans**: `audioCopyrighted`, `hasCoAuthors`, `hasMentions`.
- **Geo**: `locationCoordinates`, `profileLocationCoordinates` (bounding boxes).
- **Visual similarity** (Oriane's in-video AI):
  `visualSimilarity: { includes: { values: [{ assetId, minScore?, maxScore? }], operator } }` — `assetId` comes from
  `POST /rest/assets`.

Response `data`:

- `results[]` — per projection:
  - `basic`: id, matchedQueries, platform, profileHandle, profileDisplayName, format, caption, captionLanguage,
    thumbnailMediaId, publishedAt
  - `default`: + profileId, thumbnailMediaUrl, viewsCount, likesCount, sharesCount, commentsCount,
    interactionsCount, engagementRatePerViews, engagementRatePerFollowers, profileFollowersCount,
    profileFollowingCount, profilePostsCount, mediaCount, duration, hashtags, coAuthors, mentions
  - `full`: + platformId (the post shortcode/id), profilePictureUrl, profileBio, profileVerified, location*,
    profileLocation*, **transcript, transcriptLanguage, transcriptChunks[{startSeconds,endSeconds,text}]**,
    **frames[{id, position, timestampSeconds, visualSimilarityScore?, url}]**, audioPlatformId, audioTitle,
    audioAuthor, audioType (e.g. `original`), audioCopyrighted, **popularComments[{content, likesCount,
    repliesCount, profileHandle, publishedAt}]**, createdAt, updatedAt
- `aggregations` — computed over the **entire matched set**, not the page (verified: a limit=1 request on a
  444-video query returned 43M total views vs 10K on the returned video):
  - `basic`: totalViewsCount
  - `default`: + totalInteractionsCount
  - `full`: + totalEngagementRatePerViews, totalEngagementRatePerFollowers
- `metadata.pagination`: `{ offset, limit, totalCount, aiSearchAnchor? }` — **`totalCount` is the size of the full
  matched set** (our supply measure).

Units (verified):

- Per-result `engagementRatePerViews` / `engagementRatePerFollowers` are **percentages**
  (e.g. 210 interactions / 10,033 views → `2.093`).
- Aggregate `totalEngagementRatePerViews` = Σinteractions / Σviews as a **fraction**.
- Aggregate `totalEngagementRatePerFollowers` = Σinteractions / Σfollowers as a **fraction** (verified exactly on a
  3-video set). Therefore Σfollowers = Σinteractions / totalEngagementRatePerFollowers, and population-level
  **views per follower** = Σviews / Σfollowers is exact.
- HTTP `206` is returned when more results exist than were returned (normal for paged search).

### `POST /rest/assets` — create a reusable visual-search asset

Body: `{ "type": "text", "text": "a person running under hot desert sun" }` or an image
(`{type:"image", image:{type:"url",url}}`, base64, or multipart file ≤ 20 MiB). Response `{ data: { id: "ast_..." } }`.
Asset ids are reusable; we cache them in `data/oriane-assets.json`.

Visual similarity calibration (running market, 90 days, text asset "a person running outdoors under hot desert
sun"): no `minScore` → 1,359 matches; `minScore 0.75` → 759; `minScore 0.8` → 352. Top frame scores reach 0.99.
Matching frames carry `visualSimilarityScore`. WhiteSpace uses **0.8** as a "strong visual match".
Caveat: visually-indexed matches skew toward higher-view videos, so visual groups are only compared with each other,
never against a caption-based baseline.

### `POST /rest/profiles/search` — search profiles

Filters: id, platform, platformId, handle, displayName, bio, language, isPrivate, isVerified, postsCount, likesCount,
followersCount, followingCount, location*, createdAt, updatedAt. Sort: followersCount, createdAt, updatedAt.
Full projection adds bio, bioLink, publicEmail, location. (Not needed for the MVP: content results already carry
creator handle, followers, bio and picture.)

## Platforms / coverage

- Platforms: `instagram`, `tiktok` (enum in the spec).
- Languages: ISO codes on `captionLanguage` / `transcriptLanguage` (e.g. `en`, `ar`).
- Index is fresh: a video published 2026-09-20 was indexed 2026-09-21.

## Credits / rate limits

- No credit price or rate limit is documented publicly (the pricing page shows no API rates, and the API reference
  has no rate-limit section). No rate-limit headers are returned.
- Credit-protection strategy in WhiteSpace:
  - population statistics use `limit=3` requests (supply + attention come from `totalCount` + `aggregations`),
  - rich `full` payloads are fetched only for evidence of the top opportunities,
  - every response is cached on disk (`data/oriane-cache/`) keyed by a stable hash of path + query + body, and
    re-used forever in fixture mode; the in-memory cache has a TTL for live mode.

## Known limitations

- Supply is measured from caption/transcript phrase matching (text concepts) or visual similarity (visual concepts);
  videos that express a concept without saying or showing it clearly are missed.
- Aggregates are sums, so large accounts weigh more; we show the top-video share of views to flag outlier-driven
  concepts, and exclude the top 3 videos from views-per-video.
- No per-creator history endpoint: creator baselines require a `profileId` search per creator.
