# Setting up the factory's GitHub App (FAC-005a)

The click-by-click steps are in `docs/SETUP.md`. This note explains why each part is needed.

Status: proposal by factory@AgentiCCells.dinis, 2026-11-16, for Dinis to carry out. Dinis chose option B on 2026-11-16: "yes go for 'App installed on all repositories (option B)' ... we will look at a later stage to move this into a separate org". Nothing here exists yet.

Dinis, 2026-11-15 (ACC-027): "Good credentials: a GitHub App and OpenID Connect for AWS, with no long-lived keys in the pipeline." The App's private key is the one long-lived secret: it lives only in GitHub's environment secrets, is never in a repository, and no agent sees it. Each run swaps it for an installation token that lasts about an hour and is scoped to the one repository that run works on.

## What the App is for
Only the apply job (on merge to `dev`) uses it. The plan job on pull requests never can: the key sits in an environment that only `dev` may use.

Real steps it enables, in order:
1. **repo**: adopt the repository if it exists, otherwise create it.
2. **seed**: if (and only if) it is empty, push the template with the site's name, description, repository and domain filled in.
3. **settings**: default branch `dev`, Pages source GitHub Actions, `github-pages` environment allowing `dev` (the steps a person did by hand in map/site-creation.md, steps 6 and 10).
4. **domain**: set the Pages custom domain (after the DNS step).
5. **deploy**: start the site's `pages.yml` on `dev`.

## Two ways to install it (Dinis decides)

| | A. Adopt only (recommended first) | B. Create repositories |
|---|---|---|
| Installed on | selected repositories: AgentiCCells__Site__Website (add each new site by hand) | all repositories in AgentiCCells |
| Who creates a site's repository | Dinis, by hand | the pipeline |
| Risk if the key leaks | changes to the selected site repositories | administration of every repository in the organisation, including deletion |

**Chosen: B** (Dinis, 2026-11-16), so the QA requests (AgentiCCells__Site__Factory__Pipeline__QA-N) can create their repositories. Moving factory-made sites to a separate organisation is for later. Until then, required reviewers on the `apply` environment (below) are the main brake: proposed, Dinis.

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
| Administration | Read and write | create repositories (B); set the default branch; create the `github-pages` environment and its rule that `dev` may deploy |
| Pages | Read and write | set the Pages source and the custom domain |
| Actions | Read and write | start the new site's pages.yml after the settings are in place (the first push runs before Pages exists) |

### Organisation and account permissions
None. Verifying a domain for the organisation (ACC-018) stays a person's step.

## After creating it
1. Install it on AgentiCCells, choosing option A or B above.
2. Generate one private key. It downloads once as a `.pem` file.
3. In AgentiCCells__Site__Factory, under Settings, Environments, create an environment named `apply`:
   - **Deployment branches**: selected branches, `dev` only.
   - **Required reviewers**: optional. With Dinis as reviewer, every real apply waits for his approval; proposed for the first real runs.
   - **Environment variable** `FACTORY_APP_ID`: the App's ID (not secret).
   - The AWS values for the DNS step are in `docs/aws-oidc.md`.
   - **Environment secret** `FACTORY_APP_PRIVATE_KEY`: the whole `.pem` file's text.
4. Delete the downloaded `.pem` file from your machine.
5. Tell factory@ "the App is set up", with the option chosen. Do not paste the key or anything from it into a session, an issue or a commit.

## How the apply job uses it
`.github/workflows/apply.yml`, job `real`: it runs only for requests marked `"apply": "real"`, only on `dev` after merge, inside the `apply` environment. `actions/create-github-app-token` swaps the key for a token that lasts about an hour; `build/io.mjs` uses it for the GitHub API and for one push (the seed), and gives no credential to any child process (git clone, the site's own gates). Every step writes its result to the request's `status.json`.

The token covers the whole installation (option B), because a repository that does not exist yet cannot be named in advance. Narrowing it to one repository after the repo step is a proposed improvement.

## Rotating and revoking
- Rotate: generate a new key, replace the secret, delete the old key in the App's settings.
- Stop everything at once: suspend or uninstall the App. Nothing else holds its power.
