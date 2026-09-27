---
name: Oriane partial responses
description: Valid saved search responses may use HTTP 206 rather than 200.
---

Oriane search snapshots can be successful partial-content responses with status 206. Do not assume every real saved search has status 200; verify that its response contains usable data instead.

**Why:** The pinned presentation's real saved responses include both 200 and 206 statuses. A strict 200-only assertion incorrectly rejects authentic evidence.

**How to apply:** When validating saved Oriane snapshots, accept documented successful partial responses and still require the expected data shape, source provenance, and real evidence.