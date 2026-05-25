# Setup Script Pseudocode

RUN setup script

OFFER user two options:
- existing n8n workflow
- create a new repo

IF user selects existing n8n workflow:

1. ASK for workflow URL

2. PULL workflow and name
   - Fill `manifest.json`
   - Add to agent todo list:
     - inspect the n8n workflow
     - create the `manifest.json` description field fill

3. CREATE an empty development workflow on n8n
   - Update `manifest.json`

4. ADD to agent todo:
   - review and consider the n8n workflow
   - create a report to implementation of testing webhooks and Layer 3 testing

   CONTEXT:

   We specifically need to consider test paths.

   For example:

   IF a tool needs to be tested,
   AND the tool is a CRM bulk importer,
   AND the CRM is, say, ClickUp,
   AND you have ClickUp as a live environment,
   THEN you don't want your webhook to actually be testing on the production environment, sending tests into an API or any tool that could affect production-level stuff.

   You don't want to risk anything.

   It is very important for the agent to consider what APIs are being pinged when a test is run and what the effects of these APIs are.

   IF they are read-only APIs,
   FOR EXAMPLE getting a bunch of specific users,
   THEN maybe it's fine depending on if there's cost involved.

   FOR EXAMPLE:

   Just testing functionality, like when you ask an agent to add a code node and you want them to test it live, that's fine if they use the webhooks to test and read the errors.

   The major problem is that when you implemented a webhook at the start and at the end of the workflow, for example, say it takes a lead in and reads into a Google Sheet, you won't be able to clean up that Google Sheet.

   You want that test to run but you actually don't want it to send it to Google Sheet.

   What you end up doing is maybe adding an if statement earlier in the workflow, depending on whether the trigger workflow is in testing or production mode.

   IF the webhook trigger is used,
   THEN use the testing mode.

   That means an if at the end of the statement diverts the path or something of that sort.

   I just want to make sure that if a workflow is being tested, we need to rate its testability for live inputs.

5. ADD to agent todo:
   - update `architecture.md` template with the correct info

6. ADD to agent todo:
   - inspect credentials used by the workflow
   - document credential names and purposes
   - do not store credential values
   - update credential documentation

7. ADD to agent todo:
   - inspect workflow triggers
   - identify the production entrypoint or entrypoints
   - identify whether a development test webhook already exists
   - recommend whether to add a dedicated development test webhook

8. ADD to agent todo:
   - inspect Code nodes
   - identify Code nodes that can be tested locally
   - recommend Code-node fixtures
   - create fixture backlog entries if local tests are not implemented immediately

9. ADD to agent todo:
   - inspect external side effects
   - classify each external API call as:
     - read-only
     - write-capable but safely testable
     - write-capable and not safely testable without a sandbox
     - unknown
   - document required sandbox, mock, branch, or bypass strategy

10. ADD to agent todo:
    - update `docs/testing.md`
    - describe local fixture strategy
    - describe Layer 3 live workflow test strategy
    - describe what should not be tested live

11. ADD to agent todo:
    - update `docs/n8n-development-deploy.md`
    - document development workflow ID
    - document development workflow name
    - document development test webhook path if used
    - document push and verify workflow

12. RUN local checks
    - run `npm test`
    - confirm `workflow.json` parses
    - confirm `manifest.json` points to `workflow.json`

13. OUTPUT setup summary
    - source workflow name
    - development workflow name
    - files updated
    - agent todo items created
    - known testability risks
    - next recommended command

IF user selects create a new repo:

1. ASK for project details
   - project name
   - display name
   - short description
   - author, optional
   - target GitHub owner
   - target repository name
   - private or public repository

2. COPY template into a new project directory
   - use the files from `template/`
   - do not copy maintainer root files
   - initialize the new project as its own working repo

3. UPDATE project placeholders
   - update `manifest.json` name
   - update `manifest.json` displayName
   - update `manifest.json` description
   - update `manifest.json` author if provided
   - update development workflow name
   - update development test webhook path
   - update `workflow.json` name
   - update README title and wording

4. ASK whether to create an empty n8n development workflow now

5. IF user wants an n8n development workflow:
   - create empty development workflow on n8n
   - update `manifest.json` development environment
   - update `.env.development.example` if needed

6. IF user does not want an n8n development workflow yet:
   - leave development baseUrl and workflowId unset
   - keep setup notes in the generated project
   - make live workflow commands fail clearly until configured

7. ASK whether to create a GitHub remote now

8. IF user wants a GitHub remote:
   - create repository with selected visibility
   - add remote
   - create development branch
   - commit initialized project
   - push development branch

9. IF user does not want a GitHub remote yet:
   - initialize local git repo if requested
   - leave remote setup for later

10. ADD to agent todo:
    - define workflow purpose
    - design first workflow version
    - identify required credentials
    - identify safe local tests
    - identify safe Layer 3 tests

11. RUN local checks in the new project
    - run `npm test`
    - confirm `workflow.json` parses
    - confirm `manifest.json` points to `workflow.json`

12. OUTPUT setup summary
    - project path
    - repository URL if created
    - branch pushed if pushed
    - files updated
    - next recommended command

ALWAYS:

1. DO NOT commit secrets or credential values

2. DO NOT assume live tests are safe

3. DO NOT activate a development workflow unless the user explicitly opts in

4. DO write generated reports, snapshots, and uploads under `tmp/`

5. DO keep setup output explicit about what was changed and what still needs human review
