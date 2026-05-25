# Getting Started

## 1. Rename the Project

Update `manifest.json`:

- `name`
- `displayName`
- `description`
- `author`, if wanted
- `environments.development.workflowName`
- `environments.development.entrypoints.testWebhookPath`, if you use Layer 3 tests

## 2. Add a Workflow

Replace `workflow.json` with an n8n export. Keep the export valid JSON and keep `manifest.source` pointed at it.

## 3. Run Local Checks

```sh
npm test
```

The blank starter passes with no fixtures.

## 4. Configure Live Development

Copy `.env.development.example` to `.env.development` and fill in your development n8n values. Then run:

```sh
npm run n8n:push:development
npm run n8n:verify:development
```

## 5. Add Fixtures

Use `tests/code-node-fixtures/` for local Code node behavior and `tests/development-fixtures/` for live webhook behavior.

See `docs/testing.md`.
