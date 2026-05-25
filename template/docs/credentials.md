# Credential Policy

Credentials must not be committed.

Use ignored local files such as `.env.development` or your n8n instance credential store for secrets. Example files may document variable names, but must leave values blank.

Project-specific credential setup should document:

- required n8n credentials by display name or purpose
- required environment variables
- how development and production credentials differ
- rotation and revocation steps

Do not put API keys, tokens, passwords, webhook secrets, or generated credential exports in the repo.
