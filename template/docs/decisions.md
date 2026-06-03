# Decisions

## Track the n8n Export Directly

The workflow source is `workflow.json`. This keeps the n8n export reviewable and lets scripts use `manifest.source` instead of hardcoded workflow filenames.

## Keep Environment Metadata in the Manifest

Development and production identifiers live under `manifest.json` environments. Local secrets and API keys stay in ignored `.env` files.

## Default to a Blank Workflow

The starter ships with no workflow behavior. This prevents accidental assumptions about triggers, routes, credentials, data models, or external systems.

## Keep Layer 3 Generic

Live workflow fixtures post to n8n and assert response or execution shape. External side-effect checks belong in optional project adapters under `scripts/layer3/adapters/`.

## Harden Development Test Webhooks With Header Auth

Development test webhooks should use n8n Header Auth. `npm run setup` generates a local `N8N_DEVELOPMENT_WEBHOOK_SECRET` when it writes `.env.development`. The development push script creates or preserves the remote n8n Header Auth credential for the configured development test webhook. Layer 3 tests send the same secret header from the ignored local environment.

This keeps discovered development webhook URLs from being usable without also knowing the local secret. The tracked workflow may contain the webhook node and path, but it should not contain the credential secret value.
