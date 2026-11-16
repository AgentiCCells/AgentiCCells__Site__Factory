# REALITY.md: what exists now

Checked 2026-11-15 by factory@AgentiCCells.dinis. A thing not written here does not exist.

## Exists (checked)
- This repository, AgentiCCells__Site__Factory, public, with `dev` and `main`. Created by Dinis (source: brief, board/briefs/factory.md in AgentiCCells__Website).
- `CLAUDE.md`, copied unchanged from AgentiCCells__Website `dev`.
- `README.md`, this file, `board/` (items FAC-001 to FAC-007), `requests/README.md` (request format), `schema/site.schema.json` (JSON schema for `site.json`), `requests/EXAMPLE/` (an example, not a live request).

- `build/validate.mjs` (checks every request folder; the allowed zone is agenticcells.site only), `build/plan.mjs` (Markdown plan, reads files only), `test/` (good and bad fixtures, `node test/run.mjs`), all run locally 2026-11-15 and printing OK.
- `build/leak-scan.mjs`, copied from AgentiCCells__Website `dev` (author security@, Apache-2.0), with one change: site/ is scanned only if it exists. Run locally: OK.
- `.gitignore` (GitHub's Python template) ignored `build/`, so commit c136441 pushed the plan workflow without the scripts it runs. Found by factory@ 2026-11-15 ~21:28 UTC and fixed in the next commit.
- `build/apply.mjs` and `.github/workflows/apply.yml`: on a push to dev that touches requests/, write `status.json` (mode dry-run, state planned or failed) for every request whose status is missing or older than its site.json, and commit it back to dev with the workflow's own token. Tested locally on a copy: writes once, a second run writes nothing, the validator accepts the result. **First run on GitHub 2026-11-15 21:42 UTC** after Dinis merged pull request #2: it wrote `requests/2026-11-15__agenticcells-site/status.json` (state planned, mode dry-run) and pushed it to dev as commit c0e8312 with the workflow's own token; no settings change was needed. Creates nothing.
- `.github/workflows/plan.yml`: tests, validate, leak scan and a plan comment on pull requests to dev. **Written, not yet run on GitHub.** Job 1 has a read-only token; the comment job has pull-requests: write and checks out nothing.

- First request: `requests/2026-11-15__agenticcells-site/` (agenticcells.site, AgentiCCells__Site__Website), merged by Dinis 2026-11-15 21:42 UTC; status planned, dry run.

- AgentiCCells__Site__Template (FAC-004): build, validator, leak scan, Agent: trailer check, CI versioning, release script and CLAUDE.md, cut down from AgentiCCells__Website. Without a CNAME it is built, checked and tagged but not deployed. First CI run 2026-11-15 21:49 UTC passed and tagged v0.1.0. Not yet used to seed a site.

- `docs/github-app.md`: proposal for the GitHub App; Dinis chose option B (all repositories) on 2026-11-16. Not carried out.

- agenticcells.site is on Route 53 (four awsdns nameservers, checked by factory@ 2026-11-16 ~01:30 UTC through dns.google). The apex resolves to GitHub Pages and answers 200; site subdomains are CNAME records to agenticcells.github.io.
- Three site repositories were made by hand on 2026-11-16 (Dinis created each with an initial commit at 00:45 to 00:47 UTC; sites@AgentiCCells.dinis then pushed the site, scripts, CI and an sgit vault). Each is live on a subdomain of agenticcells.site, and its /version.json said v0.1.0 at ~01:30 UTC. Checked by factory@ by reading the repositories and fetching the live pages. They are the worked example the factory must automate; their layout (src/, scripts/, _site/, a committed `.sg_vault/bare/`, hub.json with a public vault read key) differs from AgentiCCells__Site__Template's (content/, build/, site/, no vault).

- **QA-1, the first real run (2026-11-16 02:35 UTC):** after Dinis merged pull request #3, the pipeline created AgentiCCells__Site__Factory__Pipeline__QA-1, seeded it, set Pages and the CNAME, deployed it, and http://qa-1.agenticcells.site served the page at v0.1.1 (screenshot from Dinis). GitHub's own DNS check for the custom domain failed (InvalidDNSError), so no certificate was issued and Enforce HTTPS was unavailable, while the Route 53 record was right. Likely cause: the custom domain was set seconds after the record was written, before it was visible. Fix in code: the dns step now waits until public DNS answers before the domain step. New manual workflow **Check sites** reports every Pages site and can re-check the domain and turn on Enforce HTTPS.

- First pass with Claude Code (2026-11-16): `build/first-pass.mjs` and two jobs in `apply.yml`. `first-pass-claude` runs in the `first-pass` environment (Claude federation settings only), clones the new site anonymously, runs Claude Code with file tools only (no shell, no web), and hands on a patch. `first-pass-push` runs in `apply`, refuses any patch outside `src/`, `hub.json`, `README.md` (and symlinks, mode changes, `..`), applies it, runs the site's own gates with no credential in their environment, pushes to the site's dev and records the result. Tested locally (patch check both ways; a seeded copy with a Claude-style change passes the gates). **Not yet run on GitHub**; QA-2 is its first test.

## Does not exist yet
- Real apply steps (FAC-005): `build/real.mjs` (repo, seed, settings, dns, domain, deploy, https), `build/io.mjs` (GitHub API, seed push, Route 53, HTTPS), and the `real` job in `.github/workflows/apply.yml`, for requests marked `"apply": "real"`. Tested on 2026-11-16 with fakes (`test/real.mjs`) and, for the seed, against the real template pushing to a local bare repository: the seeded site's own gates passed. Not yet run against GitHub or AWS: the App and the AWS role now exist and pass their checks; the first real run is QA-1 (pull request #3).
- `docs/aws-oidc.md`: proposal for the Route 53 role (trust and permission policies). Not carried out.
- `docs/SETUP.md` (step by step for Dinis) and two manual check workflows, `check-github-app.yml` and `check-aws.yml`, which report what is set up and what is missing. Never run yet.
- No CI versioning, no commit-trailer check, no release script.
- GitHub App `agenticcells-site-factory` (App ID 5777442), created and installed by Dinis on 2026-11-16: owned by AgentiCCells, installed on all repositories (option B), permissions actions, administration, contents, pages and workflows write, metadata read. Its key is an environment secret of `apply`; factory@ has never seen it. **Check GitHub App setup** passed on 2026-11-16 (screenshot from Dinis): it minted a token and read AgentiCCells__Site__Template with it (HTTP 200).
- AWS role `agenticcells-site-factory-dns`, created by Dinis on 2026-11-16: assumed through GitHub OIDC from this repository's `apply` environment only (the subject carries the organisation's and repository's numeric IDs); may list the agenticcells.site zone and create or delete CNAME records under `*.agenticcells.site`. No AWS key is stored anywhere. **Check AWS role setup** with the write test passed on 2026-11-16 (screenshot from Dinis): it created and deleted `factory-check.agenticcells.site`, and AWS refused a TXT record and the apex, as intended.
- Claude access for the first pass, set up by Dinis on 2026-11-16: Workload Identity Federation (rule `site-factory-first-pass`, service account `site-factory-first-pass`, one workspace), matched to this repository's `first-pass` environment by subject and by the repository and owner IDs. No API key exists. **Check Claude setup** passed on 2026-11-16 03:03 UTC: GitHub's token was exchanged for a short-lived Anthropic token and Claude Code 2.1.325 answered through it.
- No sgit token. None is held by this repository or by factory@.
- The website and hub repositories exist (created by Dinis); factory@ has not touched them.

## Facts about the specification
- The pipeline's model is `map/site-creation.md` in AgentiCCells__Website: a map of what that repository did by hand, with a list of what a person must do today.
