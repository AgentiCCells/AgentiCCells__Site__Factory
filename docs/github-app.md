# Setting up the factory's GitHub App (FAC-005a)

Status: proposal by factory@AgentiCCells.dinis, 2026-11-16, for Dinis to carry out or change. Nothing here exists yet.

Dinis, 2026-11-15 (ACC-027): "Good credentials: a GitHub App and OpenID Connect for AWS, with no long-lived keys in the pipeline." The App's private key is the one long-lived secret: it lives only in GitHub's environment secrets, is never in a repository, and no agent sees it. Each run swaps it for an installation token that lasts about an hour and is scoped to the one repository that run works on.

## What the App is for
Only the apply job (on merge to `dev`) uses it. The plan job on pull requests never can: the key sits in an environment that only `dev` may use.

Real steps it enables, in order:
1. **repo**: adopt an existing repository (first: AgentiCCells__Site__Website), later create new ones.
2. **seed**: push the template's files, plus `CNAME` and `site.json`, to the site's `dev`.
3. **settings**: default branch `dev`, Pages source GitHub Actions, `github-pages` environment allowing `dev` (the steps a person did by hand in map/site-creation.md, steps 6 and 10).

## Two ways to install it (Dinis decides)

| | A. Adopt only (recommended first) | B. Create repositories |
|---|---|---|
| Installed on | selected repositories: AgentiCCells__Site__Website (add each new site by hand) | all repositories in AgentiCCells |
| Who creates a site's repository | Dinis, by hand | the pipeline |
| Risk if the key leaks | changes to the selected site repositories | administration of every repository in the organisation, including deletion |

Proposal: start with A. Move to B only after teardown (FAC-006) and the pipeline's Agent Behaviour Policy (FAC-007) exist, and consider a separate organisation for factory-made sites so B's reach stops there.

## Creating the App
In the AgentiCCells organisation's settings, under developer settings, create a new GitHub App:

- **Name**: `agenticcells-site-factory` (any free name).
- **Homepage URL**: https://github.com/AgentiCCells/AgentiCCells__Site__Factory
- **Webhook**: off (untick Active). The App receives nothing; the workflow calls GitHub.
- **Callback URL, user authorisation, device flow**: none.
- **Where can it be installed**: only on this account.

### Repository permissions (everything else: No access)

| Permission | Level | Why |
|---|---|---|
| Metadata | Read | required by GitHub |
| Contents | Read and write | push the seed commit; write CNAME and site.json |
| Workflows | Read and write | the seed includes `.github/workflows/pages.yml`; pushing it needs this |
| Administration | Read and write | set the default branch and the `github-pages` environment's branch rule; under B, create repositories |
| Pages | Read and write | set the Pages source and the custom domain |

### Organisation and account permissions
None. Verifying a domain for the organisation (ACC-018) stays a person's step.

## After creating it
1. Install it on AgentiCCells, choosing option A or B above.
2. Generate one private key. It downloads once as a `.pem` file.
3. In AgentiCCells__Site__Factory, under Settings, Environments, create an environment named `apply`:
   - **Deployment branches**: selected branches, `dev` only.
   - **Required reviewers**: optional. With Dinis as reviewer, every real apply waits for his approval; proposed for the first real runs.
   - **Environment variable** `FACTORY_APP_ID`: the App's ID (not secret).
   - **Environment secret** `FACTORY_APP_PRIVATE_KEY`: the whole `.pem` file's text.
4. Delete the downloaded `.pem` file from your machine.
5. Tell factory@ "the App is set up", with the option chosen. Do not paste the key or anything from it into a session, an issue or a commit.

## How the apply job will use it (to be written, FAC-005)
```yaml
  apply:
    environment: apply
    permissions:
      contents: write
    steps:
      - id: token
        uses: actions/create-github-app-token@v1
        with:
          app-id: ${{ vars.FACTORY_APP_ID }}
          private-key: ${{ secrets.FACTORY_APP_PRIVATE_KEY }}
          owner: AgentiCCells
          repositories: AgentiCCells__Site__Website   # the one repository of this request
```
The token goes only to the steps that act on the site's repository, never to a step that runs code from a request. Every step writes its result to `status.json`.

## Rotating and revoking
- Rotate: generate a new key, replace the secret, delete the old key in the App's settings.
- Stop everything at once: suspend or uninstall the App. Nothing else holds its power.
