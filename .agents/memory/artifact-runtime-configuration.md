---
name: Artifact runtime configuration
description: How managed artifact services validate configuration and launch commands when the canonical app is at the repository root.
---

Keep workspace-level deployment settings out of an artifact's service manifest, even when similarly named settings work in `.replit`. Validate a minimal change first; a generic schema error may otherwise mask the unsupported section.

**Why:** The manifest validator rejected a deployment section without identifying its specific invalid key, while accepting the original manifest and changes limited to service commands.

**How to apply:** In this artifact-based project, production commands start at the repository root; use bare root build/run commands with no directory changes. Development workflow commands may start in the artifact directory. Validate the manifest and restart the managed workflow after changes.

**Why:** A command that unconditionally changed two directories upward worked in Preview but failed to find the root lockfile during publication because deployment already started at the repository root. A later publish also failed during `npm ci` despite a successful local run; do not treat local installation success as proof the publishing environment will accept the same install mode.

Publishing can build every registered artifact service, including a legacy API service no longer used by the canonical app. Remove an obsolete artifact from the project after confirming the canonical app owns those routes.

**Why:** A publish attempt installed the root app successfully but failed while building the obsolete API's dependencies, before the canonical app could go live.

**How to apply:** When the canonical root app owns its API routes, unregister obsolete web/API artifacts. Removing an artifact manifest can unregister it while preserving source, but this workspace still needs one deployable web artifact; a configuration-only wrapper can point its production commands at the root app. Verify the next published build; a local build alone does not validate publication.