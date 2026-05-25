# Maintainer Architecture

This document explains the maintainer layer of
`n8n-workflow-agentic-development-framework`: the template as software, the
installer around it, and the repository boundaries that keep generated projects
clean.

If you are changing how the template is built, installed, maintained, or
organized, start here.

This is not the architecture document for workflows created from the template.
That responsibility belongs to `template/docs/architecture.md`, which is copied
into generated workflow projects and should describe the generated project's own
architecture.

## Bird's Eye View

This repository has two layers:

```txt
maintainer repo
└── template/
    └── generated workflow project
```

The root is the maintainer workspace. It contains notes, repo-level
configuration, installer scripts, and future tooling for preparing or publishing
the template.

`template/` is the user-facing starter. Its contents should make sense after
being copied into a new n8n workflow project.

The most important rule is that generated workflow projects should not depend on
maintainer-only files.

## Code Map

### `template/`

The distributable starter. The installer copies this directory into a user's
project directory.

Architecture invariant: files inside `template/` must work when `template/` is
the project root.

### `scripts/install-template.sh`

Ubuntu-friendly installer for copying only `template/` into an empty directory.
It is designed to run from a raw GitHub URL with `curl | bash`, while still
being testable locally through `N8N_WORKFLOW_FRAMEWORK_LOCAL_SOURCE`.

Architecture invariant: the installer copies template files only. It must not
copy maintainer docs, maintainer notes, or root repository configuration into a
generated project.

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
