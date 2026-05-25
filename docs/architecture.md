# Maintainer Architecture

This document explains the high level architecture of
`n8n-workflow-agentic-development-framework`: the template as software, the
installer around it, and the repository boundaries that keep generated projects
clean.

If you are changing how the template is built, installed, maintained, or
organized, start here.

## Bird's Eye View
On the highest level this tool is a methodology to create n8n workflows in a way
that feels closer to software development. 

It primarily supports agentic development IE, using codex/claude/gemini to create
the n8n workflows. But the tools and documentation within can support human first
or agent first development to tackle n8n workflows from a DevOps Standpoint.

`template/` is the user-facing repo. The contents a end user receives to start a 
n8n workflow project or integrate a existing workflow into the repo.

The most important rule is that generated workflow projects should not depend on
maintainer-only files.

## Maintainer Code Map
---
This map covers the root of this repository: the files used to maintain the
template as software.

### `scripts/install-template.sh`

Ubuntu-friendly installer for copying only `template/` into an empty directory.
It is designed to run from a raw GitHub URL with `curl | bash`, while still
being testable locally through `N8N_WORKFLOW_FRAMEWORK_LOCAL_SOURCE`.

Architecture invariant: the installer copies template files only. It must not
copy maintainer docs, maintainer notes, or root repository configuration into a
generated project.

### `manifest.json`

Maintainer manifest for this framework and its distributable template artifact.
This is where template versioning lives.

Architecture invariant: root `manifest.json` versions the template/framework.
`template/manifest.json` belongs to generated n8n workflow projects and versions
that project's workflow metadata.

### `docs/`

Maintainer documentation. These docs explain how this repository is organized,
how the template behaves as a software artifact, and why the template is shaped
the way it is.

Architecture invariant: root `docs/` are not user-facing template docs. Template
project docs live under `template/docs/`.

### `AGENTS.md`

Maintainer instructions for agents working in this repository. The template has
its own `template/AGENTS.md` for agents working in generated projects.

Architecture invariant: maintainer agent instructions should not leak into the
template unless they are also useful to generated workflow projects.

### `README.md`

Maintainer-facing overview and install instructions. It explains what this repo
is, how the template is laid out, and how users can install the template.

Architecture invariant: root `README.md` is about this framework repository.
The generated project README lives at `template/README.md`.

### `TODO.md`

Maintainer backlog. This is for future framework, template, installer, and skill
work.

Architecture invariant: TODO items are planning notes, not generated project
state.

### `pseduocode-setupscript.md`

Maintainer pseudocode for the future template setup flow. It describes what
`npm run setup` should eventually do after the template is installed into a
workflow project.

Architecture invariant: this file is design input for future setup automation,
not the setup implementation itself.

### `git-conventional-commits.yaml`

Maintainer repo commit-message configuration.

Architecture invariant: this file belongs to the framework repo unless the
template intentionally grows its own commit policy.

### `LICENSE`

License for the maintainer repository.

Architecture invariant: the template does not currently ship with its own
license file.

## Template Code Map

This map covers `template/`: the files copied into generated workflow projects.
The template contents are still maintainer-relevant because changing them changes
what users install.

Architecture invariant: files inside `template/` must work when `template/` is
the project root.

### `template/README.md`

User-facing project README. It explains how to use the generated workflow
project after installation.

Architecture invariant: this README should make sense outside the maintainer
repo.

### `template/AGENTS.md`

Agent instructions for generated workflow projects.

Architecture invariant: these instructions should guide work in a workflow
project, not in the maintainer repository.

### `template/manifest.json`

Project metadata: workflow identity, n8n runtime version, source workflow path,
and environment configuration.

Architecture invariant: scripts should read workflow source and environment
metadata from this manifest rather than hardcoding project names or paths.

### `template/workflow.json`

Tracked n8n workflow export.

Architecture invariant: this is the source workflow file in generated projects.

### `template/package.json`

User-facing npm commands for checks, local Code-node fixtures, live workflow
fixtures, and n8n development push/pull/verify.

Architecture invariant: commands must work from the generated project root.

### `template/.env.development.example`

Example development environment values for live n8n commands.

Architecture invariant: example files may document variable names, but must not
contain secrets.

### `template/.gitignore`

Ignore rules for generated workflow projects.

Architecture invariant: local env files, generated snapshots, and temporary
outputs should not be tracked.

### `template/.github/`

GitHub Actions workflow for generated projects.

Architecture invariant: template CI lives inside `template/` because generated
projects should receive it.

### `template/docs/`

User-facing documentation for generated workflow projects. This includes
architecture, credentials, getting started, deployment, and testing docs.

Architecture invariant: `template/docs/architecture.md` describes the generated
project architecture. It is not responsible for this maintainer repo's
architecture.

### `template/scripts/check-static.js`

Generic project health check for generated workflow projects.

Architecture invariant: checks should validate useful project health, not
maintainer-only rules.

### `template/scripts/run-code-node-fixtures.js`

Local Code-node fixture runner.

Architecture invariant: this test layer should not require n8n network access.

### `template/scripts/run-development-fixtures.js`

Layer 3 live workflow fixture runner.

Architecture invariant: live workflow tests require explicit development n8n
configuration.

### `template/scripts/n8n-lib.js`

Shared helper module for n8n API calls, manifest loading, development
environment parsing, and workflow comparison.

Architecture invariant: live n8n scripts should share safety checks here rather
than duplicating them.

### `template/scripts/n8n-pull-development-workflow.js`

Pulls the configured development workflow snapshot from n8n.

Architecture invariant: output belongs under `tmp/`.

### `template/scripts/n8n-push-development-workflow.js`

Pushes local `workflow.json` to the configured development workflow.

Architecture invariant: development activation must remain opt-in.

### `template/scripts/n8n-verify-development-workflow.js`

Verifies that the configured development workflow matches the local source.

Architecture invariant: verification compares against the generated development
variant, not against unrelated remote workflow state.

### `template/scripts/layer3/`

Generic helpers for fixture discovery, webhook requests, execution lookup,
assertions, and reports.

Architecture invariant: external side-effect adapters should be optional and
project-specific.

### `template/scripts/setup-placeholder.js`

Placeholder for the future `npm run setup` flow.

Architecture invariant: setup belongs to generated workflow projects, so the
implementation should stay under `template/scripts/`.

### `template/tests/`

Fixture directories for local Code-node tests and live workflow tests.

Architecture invariant: empty fixture directories are valid in the starter.

## Template Boundary

The template boundary is the directory edge around `template/`.

Everything inside that boundary should be evaluated as if it were copied into a
fresh workflow project:

```txt
template/
├── README.md
├── AGENTS.md
├── manifest.json
├── workflow.json
├── package.json
├── .env.development.example
├── .github/
├── docs/
├── scripts/
└── tests/
```

Everything outside that boundary is maintainer state.

When in doubt:

- template users need it: put it under `template/`
- framework maintainers need it: keep it at the root
- both need it: prefer duplication over hidden coupling

## Install Flow

The installer is intentionally small:

1. clone or read this framework repo
2. locate `template/`
3. refuse to write into a non-empty target directory
4. copy `template/.` into the target directory
5. tell the user to run `npm run setup`

The installer does not configure n8n. It only creates the local project from the
template.

## Setup Flow

The future setup command belongs to the generated project, not the maintainer
root.

That means the implementation should live under:

```txt
template/scripts/
```

and be exposed through:

```txt
template/package.json
```

The maintainer pseudocode in `pseduocode-setupscript.md` describes the intended
behavior: collect project details, update manifest values, optionally connect to
n8n, and create follow-up todo items for testability and credential review.

## Development Workflow

For template changes:

1. edit files under `template/`
2. run tests from inside `template/`
3. test the installer when install behavior changes
4. commit template and maintainer changes separately when possible

For maintainer changes:

1. edit root files
2. avoid changing `template/` unless the generated project should change
3. keep root docs focused on framework maintenance

## Safety Invariants

- Do not commit secrets or credential values.
- Do not let generated projects depend on root maintainer files.
- Do not copy root maintainer files through the installer.
- Do not put generated snapshots or reports outside `tmp/`.
- Do not make live n8n activation implicit.
- Keep template CI inside `template/.github/` because it belongs to generated
  projects.
