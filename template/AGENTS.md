# Agent Notes

This repository is a generic n8n workflow DevOps starter.

## Boundaries

- Keep `workflow.json` as the tracked workflow source.
- Keep generated snapshots, reports, and live-test uploads under `tmp/`.
- Do not commit secrets or credential values.
- Live n8n scripts must continue to require `N8N_ENVIRONMENT=development`.

## Workflow Changes

- Follow `docs/node-creation.md` when adding or changing n8n nodes.
- Prefer explicit named-node data references over implicit previous-node assumptions.
- Keep loop phases sequential; do not build nested loop graphs.
- Prefer HTTP Request nodes with predefined n8n credentials when API calls need inspectable responses, headers, retries, or error handling.

## Testing

Run `npm test` after changes. Run `npm run test:workflow` only when a development n8n workflow and test webhook are configured.
