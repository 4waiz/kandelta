# KanDelta — Hackathon Status

KanDelta by Team Kanban (renamed from the working title "WhiteSpace") · https://github.com/4waiz/kandelta

Oriane x Replit — Build for the Video Economy · Dubai · 2026-09-27 · Submission 16:00 · Demos 16:30

Branches: `main` = shared baseline · `claude-track` = full product (this) · `replit-track` = Replit-native deployment lane.

## DONE
- Oriane API learned from the real OpenAPI spec (`docs/ORIANE_API_NOTES.md`); Bearer auth verified; key only in
  `.env.local` / Replit Secrets; verified absent from client bundle, source and pushed history
- Scoring engine on Oriane population stats (supply = `totalCount`; trimmed views/follower + engagement/view)
- 28 creative angles: 22 detected in speech/caption, 6 detected by Oriane vision
- KanDelta Map (hero) with "The gap" callout and "Where most creators are" outline
- Opportunity page: Why this matters / Why now, Evidence (vision-ranked, ads & boosted separated, brand-safety screen),
  Crowd Gap, Who's already there + Hidden conversation (Shadow Reach), Creative DNA, Audience Lab (AI-simulated,
  Apply loop), Creator Fit (vs each creator's own median), Campaign Brief, Activate (TikTok/Reels/Shorts)
- Evidence Vault (save, auto-tags from Oriane signals, filter, notes, remove, open source)
- Presentation Mode: 12 steps, verified end to end on a production build from a clean session (0 console errors)
- `scripts/verify-demo.mjs`: independent recomputation of every headline number from raw cached Oriane JSON
- lint clean · typecheck clean · production build passes

## Strongest real finding (verified)
Running shoes UAE → 48,197 running videos (last 3 months). "Desert heat" (Oriane vision) = 119 videos (0.25%),
2.10× engagement per view, 1.10× views per follower (top-3 trimmed), response 1.52×. Only 12 of the 119 mention
heat/hot weather/humidity in caption or speech (captions would miss ~90%). The 3 most-watched are brand ads /
boosted posts. Six major running brands: 2,068 mentions, 33 in desert heat.

## NEXT
- Merge `claude-track` into the final branch; Replit deploy from that branch

## RISKS
- Oriane credit cost undocumented → aggressive caching; demo query fully cached (0 live calls)
- Caption-based market definition includes some non-sport "running" videos (evidence is screened; stats include noise)
- Visual-similarity aggregates can be inconsistent for very small sets (guarded: falls back to untrimmed rates)
