# Writing Live Workflow Fixtures

Use this guide when adding fixtures under `tests/development-fixtures/`.

Live workflow fixtures call the active development n8n workflow through the configured development test webhook.

## What This Test Type Covers

Use live workflow fixtures for:

- webhook request handling.
- workflow routing inside n8n.
- final response shape.
- execution node presence.
- behavior that depends on n8n runtime mechanics.
- project-specific side effects when an adapter is deliberately added.

Do not use live workflow fixtures casually. They call development n8n and require live metadata and local secrets.

## Files

Fixture root:

```text
tests/development-fixtures/
  fixture-name/
    fixture.json
    payload.json
```

Only `fixture.json` is required unless it references other files.

## JSON Request Fixture

```json
{
  "request": {
    "type": "json",
    "body": {
      "testRunId": "{{testRunId}}",
      "message": "hello"
    }
  },
  "expected": {
    "response": {
      "status": "ok",
      "assertTestRunId": true
    },
    "execution": {
      "expectedNodes": [
        "Development Test Webhook",
        "Respond"
      ]
    }
  }
}
```

## Form Data Fixture

```json
{
  "request": {
    "type": "formData",
    "fields": {
      "testRunId": "{{testRunId}}"
    },
    "files": [
      {
        "field": "upload",
        "path": "payload.txt",
        "filename": "payload.txt",
        "contentType": "text/plain"
      }
    ]
  },
  "expected": {
    "response": {
      "status": "ok"
    }
  }
}
```

Fixture request values support `{{testRunId}}` interpolation.

## Commands

Run all live workflow fixtures:

```sh
npm run test:workflow
```

Run selected fixtures:

```sh
npm run test:workflow -- --only fixture-name
```

## Hardening

The runner automatically sends the configured development webhook secret header. Do not add that secret to fixture files. See `docs/development-webhook-hardening.md`.

## Adding A Fixture

1. Confirm the behavior needs live n8n coverage.
2. Create `tests/development-fixtures/<fixture-name>/`.
3. Add `fixture.json`.
4. Keep request data minimal.
5. Assert stable response fields.
6. Add expected execution nodes only when they prove the behavior.
7. Run `npm test`.
8. Run `npm run test:workflow -- --only <fixture-name>` only when live testing is intended.
