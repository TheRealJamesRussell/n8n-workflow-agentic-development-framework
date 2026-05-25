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

## Template Layout

Everything below lives inside `template/`:

```txt
.
├── README.md                    # user-facing project README
├── AGENTS.md                    # agent working rules for generated projects
├── manifest.json                # workflow metadata and environment config
├── workflow.json                # tracked n8n workflow export
├── package.json                 # project commands
├── .env.development.example     # local development env example
├── .github/                     # template CI
├── docs/                        # architecture, credentials, testing, deployment docs
├── scripts/                     # checks, fixtures, n8n push/pull/verify helpers
└── tests/                       # Code-node and live workflow fixtures
```

## Install the Template

Create a directory and open it:

```sh
mkdir my-workflow && cd my-workflow
```

Pull the template from inside the new directory:

```sh
curl -fsSL https://raw.githubusercontent.com/TheRealJamesRussell/n8n-workflow-agentic-development-framework/development/scripts/install-template.sh | bash
```

Run the setup script:

```sh
npm run setup
```

Initialize Git:

```sh
git init
git add .
git commit -m "chore: initialize n8n workflow project"
```

Set your remote GitHub repo and push:

```sh
git remote add origin <your-repo-url>
git push -u origin development
```
