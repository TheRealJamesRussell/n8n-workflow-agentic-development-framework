# Testing

## Project Checks

Run:

```sh
npm run check
```

This validates required files, manifest metadata, workflow JSON, package scripts, development command guards, and ignored generated files.

## Code-Node Fixtures

Run:

```sh
npm run test:code
```

Fixtures live under `tests/code-node-fixtures/<fixture-name>/fixture.json`. An empty fixture directory is valid and prints a skip message.

Fixture format:

```json
{
  "node": "Code Node Name",
  "input": [
    {
      "json": {
        "value": "hello"
      }
    }
  ],
  "expected": {
    "output": [
      {
        "json": {
          "value": "hello"
        }
      }
    ]
  }
}
```

`input` may also be `{ "file": "input.json" }` to load JSON from the fixture directory.

Code-node echo fixture example:

```json
{
  "node": "Echo Payload",
  "input": [
    {
      "json": {
        "testRunId": "example-run",
        "message": "hello"
      }
    }
  ],
  "expected": {
    "output": [
      {
        "json": {
          "status": "ok",
          "testRunId": "example-run",
          "message": "hello"
        }
      }
    ]
  }
}
```

## Layer 3 Workflow Fixtures

Run:

```sh
npm run test:workflow
```

This requires development n8n metadata and `environments.development.entrypoints.testWebhookPath`.

Fixtures live under `tests/development-fixtures/<fixture-name>/fixture.json`. An empty fixture directory is valid only after live metadata is configured; the command prints a skip message.

Fixture format:

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
      "expectedNodes": []
    }
  }
}
```

For file uploads, use `request.type: "formData"` with `fields` and `files`.

Reports are written under `tmp/layer3-development-fixtures/`.

Development webhook echo fixture example:

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
        "Echo Payload",
        "Respond"
      ]
    }
  }
}
```

The matching workflow shape is a POST Webhook node using the configured development test path, a Code node named `Echo Payload`, and a Respond to Webhook node. The Code node can return:

```js
return $input.all().map(item => ({
	json: {
		status: 'ok',
		testRunId: item.json.testRunId || '',
		message: item.json.message || ''
	}
}));
```

## Optional Side-Effect Adapters

Project-specific side-effect verification can be added later under `scripts/layer3/adapters/`. Keep adapters opt-in and keep credentials in ignored environment files.
