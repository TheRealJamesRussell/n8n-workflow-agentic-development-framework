# Maintainer Architecture

This repository has two scopes:

- the maintainer repo at the root
- the user-facing template under `template/`

Root files are for maintaining the template. Template files are what a workflow project should receive or copy.

## Root Scope

The root holds maintainer documentation, repo configuration, planning notes, and future automation for preparing the template.

Root files should not be required by projects created from the template.

## Template Scope

`template/` contains the starter workflow project:

- `workflow.json`
- `manifest.json`
- template `package.json`
- template `.github/`
- template `docs/`
- template `scripts/`
- template `tests/`

Changes inside `template/` should be evaluated as if a user cloned or copied that directory as their project.

## Testing

There are no maintainer-level commands yet. For now, test template changes from inside `template/`:

```sh
npm test
```
