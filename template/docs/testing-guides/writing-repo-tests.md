# Writing Repo Tests

Use this guide when changing `scripts/check-static.js`.

Repo/static tests are local-only. They must not call n8n or external services.

## What This Test Type Covers

Use repo/static tests for:

- required files.
- required docs.
- required scripts.
- required config templates.
- manifest shape.
- workflow JSON shape.
- forbidden tracked files.
- development command guards.
- generated-file boundaries.

## Adding A Required File Check

Add the path to `REQUIRED_FILES`.

```js
const REQUIRED_FILES = [
	'README.md',
	'manifest.json',
	'workflow.json'
];
```

Use this for files that define the template contract and should not be deleted accidentally.

## Adding A Safety Check

Static safety checks should fail before a live command can hit the wrong target.

Good checks:

- live scripts require `N8N_ENVIRONMENT=development`.
- generated snapshots stay under `tmp/`.
- ignored local env files are not tracked.
- required package scripts exist.

Avoid project-specific checks in the base template. Put workflow-specific rules in the generated project after the workflow exists.

## Validation

Run:

```sh
npm run check
npm test
```
