# Development Webhook Hardening

Layer 3 workflow tests call an active n8n development webhook. That webhook should not be usable just because someone finds its URL.

The template hardens the development test webhook with n8n Header Auth.

## Local Secret

When `npm run setup` writes `.env.development`, it also writes:

```sh
N8N_DEVELOPMENT_WEBHOOK_SECRET_HEADER=X-N8N-Development-Webhook-Secret
N8N_DEVELOPMENT_WEBHOOK_SECRET=<generated-secret>
```

The secret is generated locally and stays in `.env.development`. Do not commit it.

## Push Behavior

`npm run n8n:push:development` reads the local workflow and creates a development variant under `tmp/`.

If `manifest.json` configures `environments.development.entrypoints.testWebhookPath` and the tracked workflow does not already contain that webhook, the generated development variant adds an unconnected `Development Test Webhook` node. When another trigger exists on the canvas, the node is placed below it.

The push script then checks the remote development workflow:

- If the remote webhook already has authentication, the script preserves the remote authentication mode and credential reference.
- If the remote webhook has no authentication, the script creates an n8n `httpHeaderAuth` credential using the local header name and secret, then attaches that credential to the development webhook.

The tracked `workflow.json` does not need to contain the generated webhook node or credential reference. The generated and remote workflow variants may contain the development webhook and credential ID/name because n8n needs those to run the test entrypoint.

## Test Behavior

`npm run test:workflow` requires the local webhook secret. The Layer 3 request helper sends:

```text
<N8N_DEVELOPMENT_WEBHOOK_SECRET_HEADER>: <N8N_DEVELOPMENT_WEBHOOK_SECRET>
```

Fixture-specific headers are still allowed, but the development hardening header is added by the runner.

## Verify Behavior

`npm run n8n:verify:development` preserves the remote webhook authentication before comparing the generated development variant with the remote workflow. This prevents verification from failing just because the tracked workflow omits n8n credential references.

## Boundary

This is development-only hardening. Production credential and route policy should be designed by the project using this template.
