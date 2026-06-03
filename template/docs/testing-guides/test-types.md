# Test Types

The template has three default test types. Each proves a different thing.

## 1. Repo/Static Tests

Purpose: prove repository shape, workflow JSON shape, manifest metadata, script contracts, and safety rules.

Use for:

- required files and directories.
- manifest and workflow JSON validity.
- package script contracts.
- generated-file safety.
- live-command guards such as `N8N_ENVIRONMENT=development`.

Command:

```sh
npm run check
```

External systems: none.

## 2. Local Code-Node Fixtures

Purpose: prove n8n Code node JavaScript works in isolation.

Use for:

- Code node inputs and outputs.
- normalization performed inside Code nodes.
- validation performed inside Code nodes.
- data shaping performed inside Code nodes.
- mocked upstream node output used by Code nodes.

Do not use Code-node fixtures as a complete edge-case testing system. They confirm Code nodes work. They do not prove webhook behavior, n8n routing, credentials, binary upload shape, node execution order, final workflow responses, or external side effects.

Command:

```sh
npm run test:code
```

External systems: none.

## 3. Live Workflow Fixtures

Purpose: prove the active development workflow behaves inside n8n.

Use for:

- webhook request/response behavior.
- final response contracts.
- n8n execution node presence.
- behavior that depends on n8n runtime semantics.
- project-specific side effects when an adapter is deliberately added.

Command:

```sh
npm run test:workflow
```

External systems: development n8n. Project-specific adapters may call other development systems.

## Choosing Quickly

- If it checks file, manifest, script, or safety shape, use repo/static tests.
- If it checks JavaScript inside a Code node, add a Code-node fixture.
- If it checks deployed workflow behavior, add a live workflow fixture.
- If a user-facing behavior is implemented inside a Code node, use Code-node fixtures for code coverage and live workflow fixtures for workflow proof.
- If behavior is not owned by Code-node JavaScript, do not force a Code-node fixture.
