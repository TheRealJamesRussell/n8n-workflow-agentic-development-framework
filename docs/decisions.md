# Maintainer Decision Log

This file records maintainer decisions for `n8n-workflow-agentic-development-framework`.
Use it for choices that affect the template artifact, installer behavior,
repository layout, generated project boundaries, or maintainer workflow.

Keep entries short. If a decision later changes, add a new entry instead of
rewriting history.

## Format

Each decision should use this shape:

```md
## YYYY-MM-DD - Decision Title

Status: Decided | Proposed | Superseded

Decision: The choice we made.

Reason: Why this is the right tradeoff now.

Impact: What repository, template, installer, or documentation behavior this affects.
```

## 2026-05-25 - Root Maintains The Template

Status: Decided

Decision: The repository root is the maintainer workspace.

Reason: The framework needs a place for notes, repo configuration, installer scripts,
versioning, and future maintainer tooling that generated workflow projects do not need.

Impact: Root files are maintainer files unless explicitly placed under `template/`.
Generated workflow projects must not depend on root maintainer files.

## 2026-05-25 - Template Contains The User Project

Status: Decided

Decision: `template/` is the user-facing starter copied into generated workflow
projects.

Reason: Keeping the template under one directory makes it clear what users receive
and allows the maintainer repo to contain extra files without polluting generated
projects.

Impact: Files inside `template/` must work when `template/` becomes the project root.
Template changes should be evaluated as changes to generated workflow projects.

## 2026-05-25 - Installer Copies Only The Template

Status: Decided

Decision: `scripts/install-template.sh` installs only the contents of `template/`
into the target directory.

Reason: Users need the starter project, not maintainer docs, maintainer notes, or
root repo configuration.

Impact: Installer behavior must preserve the template boundary. Generated projects
should not receive root `docs/`, root `AGENTS.md`, root `TODO.md`, or other
maintainer-only files.

## 2026-05-25 - Template CI Lives In The Template

Status: Decided

Decision: The GitHub workflow under `template/.github/` belongs to generated
workflow projects, so it stays inside `template/`.

Reason: The CI file should be installed with the generated project and run that
project's own tests.

Impact: Maintainer-level CI is not currently configured at the root. Template CI
is copied by the installer.

## 2026-05-25 - Root Manifest Versions The Template

Status: Decided

Decision: Root `manifest.json` stores framework and template artifact metadata,
including template versioning.

Reason: `template/manifest.json` belongs to generated n8n workflow projects and
its `version` field describes workflow project metadata, not the template artifact
itself.

Impact: Template/framework versioning lives at root. Generated workflow project
metadata remains in `template/manifest.json`.

## 2026-05-25 - Template Setup Belongs In The Template

Status: Decided

Decision: The future setup command belongs under `template/scripts/` and is exposed
through `template/package.json`.

Reason: Setup runs after the template has been installed into a generated workflow
project, so it should not depend on maintainer root files.

Impact: `pseduocode-setupscript.md` remains maintainer design input, while the
eventual implementation should live inside `template/`.

## 2026-05-25 - No Maintainer Commands Yet

Status: Decided

Decision: The root does not define npm commands yet.

Reason: There is not yet a clear maintainer command workflow. Adding root commands
too early would blur the difference between the maintainer repo and generated
workflow projects.

Impact: Template tests are run from inside `template/` until maintainer automation
is deliberately added.

## 2026-06-03 - Template Hardens Development Test Webhooks

Status: Decided

Decision: The template treats development test webhook hardening as default
framework behavior when a project configures `environments.development.entrypoints.testWebhookPath`.

Reason: Development webhook URLs can be discovered or shared accidentally. A
generated local Header Auth secret lets the Layer 3 runner use the webhook while
blocking unauthenticated calls.

Impact: `template/scripts/setup-placeholder.js` generates a local webhook secret
when it writes `.env.development`. `template/scripts/n8n-push-development-workflow.js`
creates or preserves the remote n8n Header Auth credential for the development
test webhook. `template/scripts/run-development-fixtures.js` sends the configured
secret header during Layer 3 tests. The tracked workflow source should not contain
the credential secret value.
