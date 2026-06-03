# n8n Development Deploy

Development commands are intentionally guarded. They require `N8N_ENVIRONMENT=development`, an n8n API key, a base URL, and development workflow metadata.

## Setup

Copy `.env.development.example` to `.env.development` and fill in:

```sh
N8N_BASE_URL=
N8N_API_KEY=
N8N_DEVELOPMENT_WORKFLOW_ID=
N8N_DEVELOPMENT_WORKFLOW_NAME=development_project-name
N8N_DEVELOPMENT_WEBHOOK_SECRET_HEADER=X-N8N-Development-Webhook-Secret
N8N_DEVELOPMENT_WEBHOOK_SECRET=
```

The manifest also contains default placeholders under `environments.development`.

`npm run setup` generates `N8N_DEVELOPMENT_WEBHOOK_SECRET` when it writes `.env.development`. When a matching development test webhook node exists, the development push script creates an n8n Header Auth credential from the local header name and secret, then attaches it to the remote development webhook. The secret stays local; it should not be committed.

See `docs/development-webhook-hardening.md` for the full hardening flow.

## Push

Push, activate, and verify the development workflow:

```sh
npm run pushdev
```

Use this before live Layer 3 tests.

Push without activation:

```sh
npm run n8n:push:development
```

The script reads `manifest.source`, creates `tmp/n8n-development-workflow.generated.json`, updates the configured development workflow, and writes `tmp/n8n-development-workflow.remote.json`.

## Verify

```sh
npm run n8n:verify:development
```

The script compares the configured development workflow with the generated development variant.

Set `N8N_REQUIRE_ACTIVE_WORKFLOW=true` to require the remote workflow to be active.

## Activation

Set `N8N_ACTIVATE_DEVELOPMENT_WORKFLOW=true` to activate after push. The workflow name must contain `development`.

## Development Test Webhook

Layer 3 tests use `environments.development.entrypoints.testWebhookPath`. Push and verify scripts only check that webhook when the workflow contains a matching webhook node.

Push creates Header Auth for the matching webhook when needed. Later push and verify runs preserve the remote authentication mode and credential reference. The tracked `workflow.json` does not need to contain the credential reference.
