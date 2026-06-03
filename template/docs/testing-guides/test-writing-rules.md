# Test Writing Rules

These rules apply to every test type.

## Use Layers For Different Proofs

Each layer proves a different thing:

- repo/static tests prove repository and workflow project structure.
- local Code-node fixtures prove isolated Code-node JavaScript.
- live workflow fixtures prove deployed n8n behavior.

Do not treat a local Code-node fixture as complete coverage for workflow functionality. It proves the extracted JavaScript runs locally with the provided inputs.

For behavior implemented in Code-node logic, the usual target is:

1. a local Code-node fixture for fast code coverage.
2. a live workflow fixture when the behavior must be proven inside n8n.

If the behavior is owned by n8n platform mechanics, credentials, webhook behavior, external service nodes, or final response wiring, do not invent a Code-node fixture.

## Keep Workflow Logic As Source Of Truth

The workflow export is the source of truth for Code-node logic. Local tests should execute JavaScript extracted from the workflow export, not a copied test-only implementation.

## One Behavior Per Fixture

Each fixture should prove one clear behavior.

Good:

- missing required input.
- malformed payload.
- normalized field value.
- expected response contract.

Bad:

- one fixture that tests missing input, malformed payload, bad routing, and response formatting at the same time.

When the same behavior needs local and live coverage, use matching or clearly related fixture names.

## Keep Fixture Data Minimal

Fixture data should contain only what is needed to prove the behavior.

Do not include real people, customer data, API keys, tokens, passwords, production IDs, or production URLs.

## Assert Stable Contracts

Prefer stable assertions:

- returned JSON shape.
- error or warning codes.
- normalized values that matter downstream.
- expected node names.
- stable response fields.

Avoid brittle assertions:

- unrelated object ordering.
- exact timestamps.
- full HTML blobs.
- incidental fields from external services.

## Run The Right Scope

Run `npm test` before committing. Run `npm run test:workflow` only when live development workflow testing is intended.
