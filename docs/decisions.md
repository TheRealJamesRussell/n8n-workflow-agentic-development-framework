# Maintainer Decisions

## Root Maintains the Template

The repository root is the maintainer workspace. It is allowed to contain notes, repo configuration, and future tooling that template users do not need.

## Template Contains the User Project

`template/` is the user-facing starter. Its files should make sense when copied into a new workflow project.

## Template CI Lives in the Template

The GitHub workflow under `template/.github/` belongs to generated template projects, so it stays inside `template/`.

## No Maintainer Commands Yet

The root does not define npm commands yet. Template tests are run from inside `template/` until there is a clear maintainer workflow to automate.
