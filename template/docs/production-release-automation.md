# Production Release Automation

Production promotion is intentionally not configured in the base starter.

A future release process can:

- read `manifest.source`
- validate `npm test`
- compare a reviewed workflow artifact with the production target
- apply project-specific credential and route policy
- push to the configured production workflow
- verify the remote production workflow

Production metadata lives under `manifest.environments.production` and defaults to null values. Add concrete values only when the project has an intentional release process.
