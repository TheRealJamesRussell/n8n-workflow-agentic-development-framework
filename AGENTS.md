# Repo Overview
|-- AGENTS.md
|-- LICENSE
|-- README.md
|-- TODO.md
|-- docs
|   |-- architecture.md
|   `-- decisions.md
|-- git-conventional-commits.yaml
|-- pseduocode-setupscript.md
|-- template
|   |-- AGENTS.md
|   |-- README.md
|   |-- docs
|   |   |-- architecture.md
|   |   |-- credentials.md
|   |   |-- decisions.md
|   |   |-- getting-started.md
|   |   |-- n8n-development-deploy.md
|   |   |-- production-release-automation.md
|   |   `-- testing.md
|   |-- manifest.json
|   |-- package.json
|   |-- scripts
|   |   |-- check-static.js
|   |   |-- layer3
|   |   |   |-- adapters
|   |   |   |   `-- README.md
|   |   |   |-- assertions.js
|   |   |   |-- fixtures.js
|   |   |   |-- n8n-api.js
|   |   |   |-- report.js
|   |   |   `-- request.js
|   |   |-- n8n-lib.js
|   |   |-- n8n-pull-development-workflow.js
|   |   |-- n8n-push-development-workflow.js
|   |   |-- n8n-verify-development-workflow.js
|   |   |-- run-code-node-fixtures.js
|   |   |-- run-development-fixtures.js
|   |   `-- setup-placeholder.js
|   |-- tests
|   |   |-- code-node-fixtures
|   |   `-- development-fixtures
|   `-- workflow.json
`-- tmp

This repository maintains the template in `template/`.

## Boundaries

- Treat `template/` as the user-facing starter.
- Keep root files focused on maintaining, documenting, or publishing the template.
- Do not commit secrets or credential values.
- Avoid adding maintainer-only files inside `template/`.

## Testing

Run template commands from inside `template/` when changing template files.
