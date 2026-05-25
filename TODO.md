# Maintainer TODO

Use this format:

`- [ ] [P1] Feature(scope): task`

Priority:

- `P1`: needed soon
- `P2`: important but not blocking
- `P3`: future improvement

Types:

- `Feature(scope)`: new capability
- `Docs(scope)`: documentation work
- `Tooling(scope)`: scripts, setup, automation, or developer tooling
- `Skill(scope)`: Codex skill work
- `Research(scope)`: investigate before implementing
- `Bug(scope)`: broken behavior

## Backlog

- [ ] [P1] Tooling(setup): Create setup script.
- [ ] [P1] Tooling(setup): Run final manual test for existing-workflow setup.
- [ ] [P1] Tooling(setup): Run final manual test for start-from-scratch setup.
- [ ] [P1] Tooling(testing): Add automated tests for the setup script.
- [ ] [P1] Tooling(testing): Add maintainer-level tests that verify the template repo works as an installed project.
- [ ] [P1] Docs(template): Sort out documentation.
- [ ] [P1] Docs(architecture): Create base `architecture.md`.
- [ ] [P1] Docs(agent-actions): Document agent action patterns for node creation, test writing, software development thinking, loop rules, and related workflow-building behaviors.
- [ ] [P2] Skill(codex): Create skills.
- [ ] [P2] Tooling(install): Create an install script for Ubuntu that can copy just the template into the active directory.
- [ ] [P2] Skill(n8n-architecture): Create n8n architecture skill.
- [ ] [P2] Skill(n8n-security): Create n8n security hardening skill.
- [ ] [P2] Feature(development-security): Add security hardening for development workflows so discovered development webhooks are not publicly usable.
- [ ] [P3] Research(n8n-nodes): Future improvement: add an MCP or skill that allows the agent to find nodes in their JSON format from n8n.
