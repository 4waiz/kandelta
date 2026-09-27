# WhiteSpace — Hackathon Status

Oriane x Replit — Build for the Video Economy · Dubai · 2026-09-27 · Submission 16:00 · Demos 16:30

## DONE
- Oriane API learned from the real OpenAPI spec (`docs/ORIANE_API_NOTES.md`); auth = Bearer (verified)
- Key stored only in `.env.local` (git-ignored via `.env*`)
- Minimal live request → verified aggregations cover the whole matched set, `totalCount` = supply
- Verified aggregate engagement-per-follower = Σinteractions/Σfollowers → exact views-per-follower
- Real-data validation, running market (48,197 videos, last 90 days):
  - "Heat & summer" = 1.9% of supply, 1.45× views/follower, 1.22× engagement/view, top video only 13% of views
  - Visual crowd gap (Oriane visual AI): talking-head running videos get 0.50× market views/follower; race-finish,
    treadmill, run-club footage get 1.5–1.9×
- Disk cache of every real response (`data/oriane-cache/`)
- Next.js 16 + Tailwind 4 scaffold

## CURRENT
- Building the TypeScript Oriane adapter + scoring engine + UI vertical slice

## NEXT
- WhiteSpace map, opportunity detail, evidence, Creative DNA, creator fit, brief
- Replit import + Secrets + deploy
- README, presentation mode

## RISKS
- Credit cost per request is undocumented → heavy caching, small limits
- Claude in Chrome not connected → Replit deployment may need one manual sign-in step
- Visual-similarity matches skew to popular videos → compare visual groups only with each other
