# n8n Workflow DevOps Starter

Run in n8n. Develop like software.

This starter keeps an n8n workflow export under source control and adds a small DevOps frame around it: a manifest, local Code-node fixture tests, optional Layer 3 live workflow tests, and development push/verify scripts.

## Repository Shape

- `workflow.json` is the tracked n8n workflow source.
- `manifest.json` describes the project, runtime version, source path, and environment metadata.
- `scripts/` contains checks, fixture runners, and n8n development deployment helpers.
- `tests/code-node-fixtures/` is for local Code-node fixtures.
- `tests/development-fixtures/` is for live n8n webhook fixtures.
- `tmp/` is ignored and is the only default location for generated snapshots and reports.

## Quick Start

1. Update `manifest.json` with your project name and display name.
2. Build or export your workflow into `workflow.json`.
3. Add local Code-node fixtures under `tests/code-node-fixtures/` when you have Code nodes to test.
4. Copy `.env.development.example` to `.env.development` when you are ready to use live n8n development commands.
5. Run `npm test`.

## Commands

- `npm run check` validates required files, manifest metadata, workflow JSON, and development command guards.
- `npm run test:code` runs metadata-driven local Code-node fixtures.
- `npm run test:local` runs checks and local Code-node fixtures.
- `npm test` runs `npm run test:local`.
- `npm run pushdev` pushes, activates, and verifies the configured development workflow.
- `npm run n8n:push:development` pushes `workflow.json` to the configured development workflow.
- `npm run n8n:verify:development` compares the configured development workflow to the generated development variant.
- `npm run test:workflow` runs `pushdev`, then posts Layer 3 fixtures to the configured development test webhook.

Live n8n commands require `.env.development` values and `N8N_ENVIRONMENT=development`.
