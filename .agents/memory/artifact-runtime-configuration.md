---
name: Artifact runtime configuration
description: How managed artifact services validate configuration and launch commands when the canonical app is at the repository root.
---

Keep workspace-level deployment settings out of an artifact's service manifest, even when similarly named settings work in `.replit`. Validate a minimal change first; a generic schema error may otherwise mask the unsupported section.

**Why:** The manifest validator rejected a deployment section without identifying its specific invalid key, while accepting the original manifest and changes limited to service commands.

**How to apply:** When routing a root-level application through a managed artifact, account for development commands starting in the artifact directory and deployment build commands starting at the repository root. Production commands should resolve the root from either starting location; validate the manifest and restart the managed workflow after changes.

**Why:** A command that unconditionally changed two directories upward worked in Preview but failed to find the root lockfile during publication because the deployment command was already at the repository root.

Publishing can build every registered artifact service, including a legacy API service no longer used by the canonical app. Remove an obsolete artifact from the project after confirming the canonical app owns those routes.

**Why:** A publish attempt installed the root app successfully but failed while building the obsolete API's dependencies, before the canonical app could go live.

**How to apply:** When the canonical root app owns its own API routes, remove the entire retired artifact directory after confirming no live service uses it; its code remains recoverable in Git history. Merely changing its build command still includes it as a publishing artifact. Verify the next published build; a local application build alone does not validate the full publish.