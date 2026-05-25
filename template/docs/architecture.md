# Architecture

The starter separates workflow source, project metadata, local validation, and live development checks.

## Workflow Source

`workflow.json` is the tracked n8n export. The default file is a minimal valid empty workflow. Project workflows should replace it while keeping the top-level n8n export shape: `name`, `nodes`, `connections`, and `settings`.

## Manifest

`manifest.json` is the project contract. `source` points to `workflow.json`. Runtime metadata records the n8n version the workflow is tested against. Development and production metadata live under `environments`.

The only default entrypoint is `environments.development.entrypoints.testWebhookPath`, used by optional live workflow fixtures.

## Testing Layers

Layer 1 project checks validate required files, manifest metadata, workflow JSON, package scripts, development command guards, and ignored generated files.

Layer 2 Code-node fixtures execute Code node JavaScript locally with metadata-defined input items and expected outputs.

Layer 3 development fixtures post requests to an active n8n development webhook, optionally fetch execution data, and write reports under `tmp/`.

## Development Deployment

Development push and verify scripts read `manifest.source`, create a generated development variant under `tmp/`, and compare it with the configured n8n development workflow.

## Repository Boundaries

The base repo is target-agnostic. Third-party verification, cleanup, and side effects should be added through project-specific adapters, not through the default framework.
