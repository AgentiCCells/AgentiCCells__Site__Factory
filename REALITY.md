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

- `docs/github-app.md`: proposal for the GitHub App (permissions, install options, the `apply` environment). Not carried out.

## Does not exist yet
- No real apply step, no CI versioning, no commit-trailer check, no release script.
- No GitHub App, no AWS role, no sgit token, no Claude key. None is held by this repository or by factory@.
- No hosted zone for agenticcells.site: on 2026-11-15 20:46 UTC it was still on the registrar's default nameservers (source: ACC-027).
- The website and hub repositories exist (created by Dinis); factory@ has not touched them.

## Facts about the specification
- The pipeline's model is `map/site-creation.md` in AgentiCCells__Website: a map of what that repository did by hand, with a list of what a person must do today.
