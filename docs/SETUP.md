# Setup: the GitHub App, then AWS, then QA-1

For Dinis. Written by factory@AgentiCCells.dinis, 2026-11-16. The reasons behind each setting are in `docs/github-app.md` and `docs/aws-oidc.md`. Nothing you set here is ever pasted into a session, an issue or a commit.

Two manual workflows check your work as you go, and change nothing unless asked:
- **Check GitHub App setup** (`check-github-app.yml`)
- **Check AWS role setup** (`check-aws.yml`)

Run them from https://github.com/AgentiCCells/AgentiCCells__Site__Factory/actions: pick the workflow, then **Run workflow** on `dev`. Each run ends with OK, or with a "To fix" list. Run them as often as you like.

## Part 1: the `apply` environment (2 minutes)

1. Open https://github.com/AgentiCCells/AgentiCCells__Site__Factory/settings/environments and click **New environment**. Name: `apply`.
2. **Deployment branches and tags**: choose **Selected branches and tags**, add the rule `dev`.
3. **Required reviewers**: tick it and add yourself. (Proposed. Each check run and each real apply then waits for your **Approve** on the run page. You can untick it later.)
4. Save.

## Part 2: the GitHub App (10 minutes)

1. Open https://github.com/organizations/AgentiCCells/settings/apps/new
2. Fill in:
   - **GitHub App name**: `agenticcells-site-factory` (or any free name)
   - **Homepage URL**: `https://github.com/AgentiCCells/AgentiCCells__Site__Factory`
   - **Callback URL**: leave empty. Leave **Expire user authorization tokens**, **Request user authorization (OAuth) during installation** and **Enable Device Flow** unticked.
   - **Webhook**: untick **Active**.
3. **Permissions**, under **Repository permissions** only (leave every other one at "No access"):

   | Permission | Set to |
   |---|---|
   | Actions | Read and write |
   | Administration | Read and write |
   | Contents | Read and write |
   | Metadata | Read-only (set automatically) |
   | Pages | Read and write |
   | Workflows | Read and write |

   **Organization permissions** and **Account permissions**: leave all at "No access".
4. **Where can this GitHub App be installed?**: **Only on this account**.
5. Click **Create GitHub App**. On the page that opens, note the **App ID** (a number near the top).
6. Scroll to **Private keys**, click **Generate a private key**. A `.pem` file downloads.
7. Left menu, **Install App**, then **Install** next to AgentiCCells. Choose **All repositories** (option B), then **Install**.
8. Back in the `apply` environment (https://github.com/AgentiCCells/AgentiCCells__Site__Factory/settings/environments, click `apply`):
   - Under **Environment secrets**, **Add environment secret**: name `FACTORY_APP_PRIVATE_KEY`, value: open the `.pem` file in a text editor and paste all of it, including the `BEGIN` and `END` lines.
   - Under **Environment variables**, **Add environment variable**: name `FACTORY_APP_ID`, value: the App ID.
9. Delete the `.pem` file from your computer (and empty the bin).
10. Run **Check GitHub App setup**. It should end with `OK: the apply job can mint and use the token.` If not, it lists what to change; change it in the App's settings (https://github.com/organizations/AgentiCCells/settings/apps, click the App, **Permissions & events**), then accept the new permissions on the installation (GitHub asks you to, under the org's **GitHub Apps** settings) and run it again.

## Part 3: the AWS role (10 minutes)

In the AWS account that holds the Route 53 zone for agenticcells.site:

1. **Zone ID**: Route 53 console, **Hosted zones**, click `agenticcells.site`; copy the **Hosted zone ID** (starts with `Z`). Also note your 12-digit **account ID** (top right menu).
2. **OIDC provider** (skip if it exists): IAM console, **Identity providers**, **Add provider**: type **OpenID Connect**; Provider URL `https://token.actions.githubusercontent.com`; Audience `sts.amazonaws.com`; **Add provider**.
3. **Role**: IAM console, **Roles**, **Create role**:
   - Trusted entity type: **Web identity**. Identity provider: `token.actions.githubusercontent.com`. Audience: `sts.amazonaws.com`. GitHub organization: `AgentiCCells`. Repository: `AgentiCCells__Site__Factory`. **Next**.
   - Skip adding permissions for now. **Next**. Role name: `agenticcells-site-factory-dns`. **Create role**.
4. Open the role. **Trust relationships**, **Edit trust policy**, replace everything with the trust policy in `docs/aws-oidc.md` (put your account ID in), **Update policy**. This limits it to the `apply` environment of this one repository.
5. **Permissions**, **Add permissions**, **Create inline policy**, **JSON** tab, paste the permission policy in `docs/aws-oidc.md` (put your zone ID in). **Next**, name it `route53-agenticcells-site-cname`, **Create policy**.
6. Copy the role's **ARN** (top of the role page).
7. In the `apply` environment, **Add environment variable** twice:
   - `FACTORY_AWS_ROLE_ARN`: the role ARN
   - `FACTORY_ROUTE53_ZONE_ID`: the hosted zone ID
8. Run **Check AWS role setup** with **write_test** unticked: it should print the role and the zone's CNAME records, then OK.
9. Run it again with **write_test** ticked: it creates and deletes `factory-check.agenticcells.site`, and checks that a TXT record and the apex are refused. All four lines should say OK.

## Part 4: QA-1

1. Tell factory@: "App and AWS checks are OK".
2. Open pull request #3 (https://github.com/AgentiCCells/AgentiCCells__Site__Factory/pull/3), click **Ready for review**, then merge it.
3. The **Apply** workflow runs; if you set required reviewers, approve the `real` job. It writes `requests/2026-11-16__qa-1/status.json` back to `dev`, and https://qa-1.agenticcells.site should come up (the HTTPS certificate can take a few minutes; if the run ends with the request `applying`, run **Apply** again by hand later and it only re-checks).

## Part 5: Claude for the first pass (identity federation, no key)

1. GitHub: create the environment `first-pass` in this repository (deployment branches: `dev` only). It holds no secrets.
2. Console, **Workload identity**, **Connect workload**, **GitHub Actions**. Rule `site-factory-first-pass`: subject `repo:AgentiCCells@357027852/AgentiCCells__Site__Factory@1459223341:environment:first-pass` (no `*`); claims `repository_owner` = `AgentiCCells`, `repository` = `AgentiCCells/AgentiCCells__Site__Factory`, `environment` = `first-pass`; audience `https://api.anthropic.com`; one workspace; scope `workspace:developer`; lifetime 600 s. Target: a new service account `site-factory-first-pass`.
3. In `first-pass`, add variables `ANTHROPIC_FEDERATION_RULE_ID`, `ANTHROPIC_SERVICE_ACCOUNT_ID`, `ANTHROPIC_ORGANIZATION_ID` (and `ANTHROPIC_WORKSPACE_ID` only if the rule covers more than one workspace).
4. Run **Check Claude setup**: it prints GitHub's claims, exchanges them for a short-lived Anthropic token, and makes one tiny call through Claude Code.

## Afterwards: Check sites
**Check sites** (`check-sites.yml`, manual) lists every AgentiCCells repository served by GitHub Pages (factory-made and hand-made) and reports, per site: public DNS, GitHub's own domain check, the HTTPS certificate, Enforce HTTPS, and what https serves. Report only, unless **fix** is ticked: then it re-saves a custom domain whose GitHub check failed while public DNS is right (GitHub then checks again and requests the certificate), and turns on Enforce HTTPS wherever the certificate exists. The table is on the run's summary page.

## Undo
- GitHub: suspend or uninstall the App (org settings, **GitHub Apps**); delete the environment secret.
- AWS: delete the role.
