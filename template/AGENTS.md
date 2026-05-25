# Agent Notes

This repository is a generic n8n workflow DevOps starter.

## Boundaries

- Keep `workflow.json` as the tracked workflow source.
- Keep generated snapshots, reports, and live-test uploads under `tmp/`.
- Do not commit secrets or credential values.
- Live n8n scripts must continue to require `N8N_ENVIRONMENT=development`.

## Testing

Run `npm test` after changes. Run `npm run test:workflow` only when a development n8n workflow and test webhook are configured.
