# Writing Code-Node Fixtures

Use this guide when adding fixtures under `tests/code-node-fixtures/`.

Code-node fixtures are local-only. They do not call n8n.

These fixtures confirm Code nodes work. Treat them as Code-node coverage, not as a full edge-case testing tool for workflow behavior.

## What This Test Type Covers

Use Code-node fixtures for:

- Code node input/output contracts.
- normalization logic inside Code nodes.
- validation logic inside Code nodes.
- mapping or shaping logic inside Code nodes.
- mocked upstream node outputs consumed through `$()`.
- `$env` and `$vars` usage with fixture-provided test values.

Do not use this test type for:

- behavior that does not run through a Code node.
- webhook behavior.
- credential behavior.
- n8n branch routing.
- final live workflow response behavior.
- external service writes or cleanup.

## Files

Fixture root:

```text
tests/code-node-fixtures/
  fixture-name/
    fixture.json
    input.json
```

Only `fixture.json` is required. Extra files are optional.

## Fixture Format

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

Load larger input from a file:

```json
{
  "node": "Code Node Name",
  "input": {
    "file": "input.json"
  },
  "expected": {
    "output": []
  }
}
```

Mock upstream node output:

```json
{
  "node": "Transform",
  "input": [],
  "nodeOutputs": {
    "Fetch Source": [
      {
        "json": {
          "id": "example"
        }
      }
    ]
  },
  "expected": {
    "output": []
  }
}
```

Provide test-only `$env` or `$vars` values:

```json
{
  "node": "Read Runtime Values",
  "env": {
    "EXAMPLE_ENV": "test"
  },
  "vars": {
    "EXAMPLE_VAR": "test"
  },
  "expected": {
    "output": []
  }
}
```

## Commands

Run all Code-node fixtures:

```sh
npm run test:code
```

Run selected fixtures:

```sh
npm run test:code -- --only fixture-name
```

## Adding A Fixture

1. Confirm the behavior is owned by Code-node JavaScript.
2. Create `tests/code-node-fixtures/<fixture-name>/`.
3. Add `fixture.json`.
4. Keep input data minimal.
5. Assert stable output.
6. Run `npm run test:code -- --only <fixture-name>`.
7. Run `npm test`.

If the behavior must also be proven in the deployed workflow, add a live workflow fixture too.
