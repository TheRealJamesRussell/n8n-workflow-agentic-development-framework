# n8n-workflow-agentic-development-framework

## Philosophy & Author's Notes
I made this repo with a few thigs in mind. I wanted version control through git. I wanted agentic development without copy pasting .json files. I wanted the ability to run tests on my n8n. And finally I wanted to not get ripped of by paying per execution for something I'm hosting on hardware I already paid for.

This repo contains the tools and setup for you to have proper DevOps and give agents the tools they need to create and test n8n workflows in a seperate environment.  

## Features
- Version Control
- CI
- Testing
- Production & Dev Environments

This starter keeps an n8n workflow export under source control and adds a small DevOps frame around it: a manifest, local Code-node fixture tests, optional Layer 3 live workflow tests, and development push/verify scripts.

## Layout

- `template/` contains the distributable n8n workflow DevOps starter.
- `LICENSE` applies to this maintainer repository.
- `TODO.md` and `pseduocode-setupscript.md` are maintainer planning files.
- `git-conventional-commits.yaml` is maintainer repo configuration.

There are no maintainer-level npm commands yet. To test the template in place, run commands from inside `template/`.
