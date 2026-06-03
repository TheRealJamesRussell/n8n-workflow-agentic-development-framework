# Production Release Automation

Production promotion is intentionally not configured in the base starter. This document describes the recommended shape when a project is ready to add it.

## Release Boundary

Production automation should own only the release from the repository source of truth to one configured production n8n workflow.

In scope:

- validate the tracked workflow export and project metadata.
- run `npm test`.
- read production n8n deployment API access from protected CI secrets.
- update only the configured production workflow ID.
- apply project-specific credential and route policy.
- fetch the production workflow after deployment.
- verify the remote workflow matches the intended artifact.
- write a deployment summary.

Out of scope by default:

- storing production API keys in local `.env` files.
- committing production credential values.
- creating production n8n credentials automatically.
- running production write tests unless the project has an explicit approval and cleanup policy.

## Required CI Secrets

Use a protected GitHub Actions environment such as `production`. Prefer environment secrets over repository-wide secrets.

Typical secrets:

- `N8N_PRODUCTION_BASE_URL`
- `N8N_PRODUCTION_API_KEY`
- `N8N_PRODUCTION_WORKFLOW_ID`
- `N8N_PRODUCTION_WORKFLOW_NAME`

These are deployment credentials. They are not the node credentials used by the workflow at runtime.

## Credential References

Workflow exports may contain n8n credential references by ID and name. They must not contain plaintext credential values.

Production automation should assume runtime node credentials already exist in the target n8n instance. Verification may confirm credential reference objects are present, but it should not fetch, print, compare, or recreate secret values.

## Branch And Environment Gates

Recommended gate:

- deploy only from `main`.
- run all local validation before any n8n API update.
- require a protected `production` GitHub environment.
- require manual approval if the workflow can cause external side effects.

If release tags are added later, tags should point at commits already present on `main`.

## Pre-Deployment Validation

The CI job should fail before remote API calls if validation does not pass.

Minimum validation:

1. Check out the exact release commit.
2. Use Node.js 20 or newer.
3. Parse `manifest.json`.
4. Confirm `manifest.source` exists.
5. Parse the workflow source JSON.
6. Run `npm test`.
7. Confirm no `.env` files, remote snapshots, generated variants, reports, or `*:Zone.Identifier` sidecars are tracked.

## Deployment Procedure

A production updater should:

1. Read production n8n values from protected CI secrets.
2. Read the local workflow from `manifest.source`.
3. Fetch the remote production workflow.
4. Refuse to continue unless the remote workflow ID and name match the configured production target.
5. Generate a production variant from the tracked workflow.
6. Apply project-specific production policy, such as removing development-only webhook nodes.
7. Preserve any remote production authentication references that should not live in tracked source.
8. Build an update payload using n8n-supported fields:
   - `name`
   - `nodes`
   - `connections`
   - `settings`
9. Update the production workflow.
10. Fetch the production workflow again.
11. Compare the fetched workflow with the intended comparable artifact.

Generated variants and snapshots must stay under `tmp/` locally or the CI artifact workspace. They must not be committed.

## Artifact Verification

Compare only fields that n8n accepts and returns consistently:

- `name`
- `nodes`
- `connections`
- `settings`

Verification should:

- fail if comparable fields differ.
- confirm development-only entrypoints are absent when the project requires that.
- confirm required credential references are present by type, ID, or name when the API returns them.
- avoid printing API keys, webhook secrets, credential values, or secret-derived URLs.

## Deployment Summary

Append a concise summary to `GITHUB_STEP_SUMMARY`.

Include:

- repository and commit SHA.
- manifest version.
- n8n runtime version.
- production workflow ID and name.
- validation commands executed.
- deployment result.
- artifact verification result.
- rollback reference.

Do not include secret values.

## Rollback And Recovery

Preferred rollback is source-controlled:

1. Revert or fix the bad workflow change.
2. Deploy the corrected `main` state through the same automation.
3. Confirm artifact verification passes.

Emergency recovery may use a previous successful release commit. Manual production edits in n8n should be treated as temporary: export the changed workflow, compare it against source, and reconcile through Git as soon as possible.

## Separation From Development Scripts

Production automation must stay separate from local development deployment.

Development scripts:

- load `.env.development`.
- require `N8N_ENVIRONMENT=development`.
- update only the configured development workflow.
- may create development-only Header Auth for the test webhook.

Production automation:

- runs in CI from `main`.
- reads only protected production secrets.
- updates only the configured production workflow.
- does not read local `.env` files.
- does not reuse development-only push scripts.

This separation is intentional. Development scripts are optimized for fast local iteration; production automation should be explicit, reviewable, and protected.
