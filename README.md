# WhiteSpace

**Find where attention is going before everyone else gets there.**
Opportunity intelligence for the video internet, built on [Oriane](https://www.oriane.xyz) and [Replit](https://replit.com).

> Oriane understands the video. WhiteSpace understands what to do about it.

---

## Problem

Brands, agencies and creators decide what to make by scrolling what's already trending. By the time a format is visible
enough to copy, it's crowded: everyone ships the same POV, the same talking head, the same unboxing. Social analytics
tools read captions and hashtags, so they miss most of what actually happens *inside* the video.

Would someone pay for this? A brand planning a creator campaign spends thousands per video. Knowing which creative
angle audiences reward, *before* the crowd arrives, and having the evidence, the recipe, the creators and the brief in
one place, replaces days of manual research.

## Insight

When **audience response is unusually high** but **creator supply is still low**, there is a creative opportunity.
WhiteSpace measures that mismatch with real video intelligence, not guesses.

## What it found (real Oriane data, last 3 months)

Search **"Running shoes UAE"** →

- Oriane measured **48,197 running videos** (Instagram + TikTok).
- **Desert heat** (runners outdoors under hot desert sun) appears in only **119 videos, 0.25% of supply**, yet earns
  **2.1× the engagement per view** of the average running video.
- **Found by watching, not reading:** only 12 of those 119 videos mention heat, hot weather or humidity in their caption
  or speech. A caption or transcript search would miss ~90% of this opportunity. Oriane's vision sees it in the frames.
- **Brands already pay for this look:** several of the most-watched examples are disclosed ads or boosted posts
  (e.g. partner posts tagging @altrarunning, @zalando). Organic creators barely make it.
- **No brand owns the space:** the six biggest running brands collect 2,068 mentions across running videos, but only
  33 of those mentions are in desert-heat videos.
- **Crowd gap:** 49% of style-matched running videos are first-person POV; desert heat is 9% of them and earns 2× the
  engagement per view.

## How it works

```
Oriane (vision · spoken words · metadata · comments)
  → WhiteSpace measurement (supply, reach, engagement, momentum)
  → Opportunity map → Evidence → Crowd Gap → Creative DNA
  → Audience Lab → Creator Fit → Campaign Brief → Activate (TikTok · Reels · Shorts)
```

1. **Discover.** Describe a market. WhiteSpace measures ~28 creative angles: 22 detected in what's *said*
   (exact phrases in the transcript or caption) and 6 detected in what's *shown* (Oriane visual similarity ≥ 0.8
   against text prompts such as "a person outdoors under hot desert sun").
2. **WhiteSpace Map.** Supply (x) vs audience response (y). Top-left = white space.
3. **Evidence.** Real videos, ranked by visual match, with sponsored / likely-boosted posts separated and a
   brand-safety screen on what's displayed.
4. **Crowd Gap.** What most creators default to vs what audiences reward (visual style, sound, collabs, tagging,
   language). A gap is only reported when the data shows one.
5. **Who's already there + Hidden conversation.** Brand coverage of the gap, and what's *spoken* about brands in
   videos that never caption or tag them (Oriane Shadow Reach concept, via transcript-include + caption-exclude +
   mention-exclude filters).
6. **Creative DNA.** Measured on the evidence: talk-first openings (transcript timestamps), duration, voice density,
   original vs licensed audio, CTA patterns, real hooks (first 3 seconds, transcribed by Oriane), audience comments.
7. **Audience Lab.** Pressure-test the brief with six simulated personas before paying for production.
8. **Creator Fit.** Creators ranked by proven execution: the angle video's views vs **the creator's own median**
   (fetched per creator), reach, engagement, on-topic share and freshness. Not follower count.
9. **Activate.** A concrete brief plus TikTok / Reels / Shorts adaptations, and an **Evidence Vault** swipe file.

## Why Oriane

Oriane is the video intelligence layer. WhiteSpace uses it deeply:

| Oriane capability | How WhiteSpace uses it |
|---|---|
| `totalCount` over the whole index | Content **supply** per angle (not a sample) |
| Aggregations (Σ views, Σ interactions, Σ interactions/followers) | Exact **views per follower** and **engagement per view** per angle |
| Visual similarity (text assets) | Angles and crowd gaps detected **in the frames** |
| Transcripts + chunk timestamps | Phrase-matched angles, real hooks, talk-first timing, hidden brand mentions |
| Popular comments | Audience voice |
| Audio / co-author / mention / language metadata | Crowd gaps |
| `profileId` search | Each creator's own median views (creator baseline) |

API notes (non-secret): [`docs/ORIANE_API_NOTES.md`](docs/ORIANE_API_NOTES.md).

## Why Replit

WhiteSpace runs and deploys on Replit: Next.js on Node 20, `ORIANE_API_KEY` in Replit Secrets, autoscale deployment
(`.replit`). The Oriane cache of real responses ships with the repo, so the demo stays reliable even if the API is slow.

## Architecture

```
browser ──▶ Next.js UI (React 19, Tailwind 4)
              │
              ▼
        /api/analyze · /api/opportunity · /api/landscape   (server routes)
              │
              ▼
        lib/whitespace/*  (scoring, crowd gaps, DNA, creators, brief, audience lab)
              │
              ▼
        lib/oriane/client.ts  (server-only; memory → disk cache → Oriane API; stale fallback)
              │
              ▼
        connect.oriane.xyz  (Bearer ORIANE_API_KEY, never sent to the browser)
```

## Opportunity model

All inputs are Oriane population statistics. The 3 most-viewed videos are excluded from every rate (views, followers,
interactions), so one viral hit or boosted ad cannot manufacture an opportunity.

```
Reach index         = (views ÷ followers)_angle ÷ (views ÷ followers)_market
Engagement index    = (interactions ÷ views)_angle ÷ (interactions ÷ views)_market
Response            = √(reach index × engagement index)
Performance         = clamp(0.5 + log₂(response), 0, 1)
Scarcity            = 1 ÷ (1 + supply share ÷ 1%)
Confidence          = size factor (log₁₀ n ÷ log₁₀ 300) × concentration factor (top-3 share of views)
Opportunity Score   = 100 × √(Performance × Scarcity) × Confidence
Stage               = EARLY < 0.5% ≤ EMERGING < 1.5% ≤ CROWDED < 4% ≤ SATURATED   (current, not a forecast)
Momentum            = angle's last-30-day share of its 3-month supply ÷ the market's
```

Every screen has **"How is this calculated?"**.

## Crowd Gap

For each dimension WhiteSpace compares the **most common choice** (creator consensus) with the **best-responding
choice** (audience response). A gap is reported only when the best-responding choice beats the consensus by ≥ 1.25×.
Otherwise it says "No gap here".

## Audience Lab (honest by design)

**Simulated audience panel: directional feedback, not real market research.** Six rule-based personas (serious runner,
casual student, potential buyer, content creator, heavy short-form viewer, UAE resident) react to measurable features
of the draft (when the stakes are stated, jargon, proof beats, price context, CTA style, local and Arabic cues), weighed
against norms Oriane measured on the evidence. Every reaction lists *why* it fired; recommendations cite their evidence.
It never produces market statistics such as "87% would buy".

## Running locally

```bash
npm install
cp .env.example .env.local   # then set ORIANE_API_KEY
npm run dev                  # http://localhost:3000
```

- `npm run demo:fixtures` serves only saved real Oriane responses (no API calls, no credits).
- `npm run explore -- scripts/markets/running.json` is the exploration harness used to validate the idea.
- `npm run lint`, `npm run typecheck`, `npm run build`.

## Environment variables

| Name | Purpose |
|---|---|
| `ORIANE_API_KEY` | Oriane API key (server-only; Replit Secret / `.env.local`) |
| `WHITESPACE_DATA_MODE` | `fixture` = never call Oriane, serve cached real responses only |
| `WHITESPACE_CACHE_TTL_HOURS` | Cache freshness before re-querying (default 24) |
| `WHITESPACE_WINDOW_END` | Pin the 3-month analysis window end date (YYYY-MM-DD) for a reproducible demo |

## Hackathon

Oriane x Replit: *Build for the Video Economy*, Dubai, 27 September 2026. Built today.

## Limitations

- WhiteSpace does not predict virality. It detects observable mismatches between content supply and audience response.
- Angle supply depends on how an angle is detected: phrase matching misses videos that never say it, and vision
  prompts are approximations (threshold 0.8).
- Oriane aggregates are sums, so large accounts weigh more; we trim the top 3 videos and show confidence.
- Market definition is caption-based ("running" also catches "running late"); evidence is screened for relevance and
  brand safety, but population numbers include some noise.
- Location slices (e.g. UAE-only) are often too small; WhiteSpace says so and falls back to the global market.
- Audience Lab is simulated. YouTube Shorts adaptations are not grounded in Oriane data (Oriane indexes Instagram +
  TikTok).
- Oriane API credit costs are not publicly documented; results are cached aggressively.

## Future work

- **Live Signal:** continuously monitor fresh Oriane data and alert when a new crowd gap opens (not built; we don't
  fake live monitoring).
- Demand-gap mining from comments at scale (recurring questions → supply check).
- Image-asset vision prompts (logo / product shots) for visual Shadow Reach.
- Expose WhiteSpace as a tool for AI agents (Oriane already ships MCP for AIs).
