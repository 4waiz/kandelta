---
name: Artifact runtime configuration
description: How managed artifact services validate configuration and launch commands when the canonical app is at the repository root.
---

Keep workspace-level deployment settings out of an artifact's service manifest, even when similarly named settings work in `.replit`. Validate a minimal change first; a generic schema error may otherwise mask the unsupported section.

**Why:** The manifest validator rejected a deployment section without identifying its specific invalid key, while accepting the original manifest and changes limited to service commands.

**How to apply:** When routing a root-level application through a managed artifact, remember the managed service starts in the artifact directory. Make service commands explicitly target the repository root, then validate the manifest through the artifact validation flow and restart the managed workflow.