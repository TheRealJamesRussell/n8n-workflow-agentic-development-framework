# Running Tests

Default to local tests unless you intentionally need live n8n.

## Command Summary

| Command | What it runs | Calls n8n? | Uses live secrets? |
| --- | --- | --- | --- |
| `npm test` | `npm run test:local` | No | No |
| `npm run test:local` | Static checks plus Code-node fixtures | No | No |
| `npm run check` | Static project checks | No | No |
| `npm run test:code` | Local Code-node fixtures | No | No |
| `npm run pushdev` | Push, activate, and verify development workflow | Yes, development only | Yes |
| `npm run test:workflow` | `pushdev`, then live workflow fixtures | Yes, development only | Yes |

Run only named fixtures with `--only` or `-o`:

```sh
npm run test:code -- --only fixture-name
npm run test:workflow -- --only fixture-name another-fixture
npm run test:workflow -- -o fixture-name
```

## Safe Local Confidence

Run:

```sh
npm test
```

This command:

- validates required files and JSON.
- validates package script guards.
- runs local Code-node fixtures.
- does not call n8n.
- does not require `.env.development`.

## Live Development Workflow Tests

Run only when live development testing is intended:

```sh
npm run test:workflow
```

This command first runs:

```sh
npm run pushdev
```

Then it posts fixtures from `tests/development-fixtures/` to the configured development test webhook.

Requirements:

- `.env.development` or shell values for development n8n API access.
- `manifest.json` development workflow metadata.
- `environments.development.entrypoints.testWebhookPath`.
- `N8N_DEVELOPMENT_WEBHOOK_SECRET`.

Layer 3 requests send the configured development webhook secret header. See `docs/development-webhook-hardening.md`.

## Reports

Live workflow fixture reports are written under:

```text
tmp/layer3-development-fixtures/
```

Generated workflow variants and remote snapshots are also written under `tmp/`.
