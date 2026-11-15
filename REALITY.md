# REALITY.md: what exists now

Checked 2026-11-15 by factory@AgentiCCells.dinis. A thing not written here does not exist.

## Exists (checked)
- This repository, AgentiCCells__Site__Factory, public, with `dev` and `main`. Created by Dinis (source: brief, board/briefs/factory.md in AgentiCCells__Website).
- `CLAUDE.md`, copied unchanged from AgentiCCells__Website `dev`.
- `README.md`, this file, `board/` (items FAC-001 to FAC-007), `requests/README.md` (request format), `schema/site.schema.json` (JSON schema for `site.json`), `requests/EXAMPLE/` (an example, not a live request).

- `build/validate.mjs` (checks every request folder; the allowed zone is agenticcells.site only), `build/plan.mjs` (Markdown plan, reads files only), `test/` (good and bad fixtures, `node test/run.mjs`), all run locally 2026-11-15 and printing OK.
- `build/leak-scan.mjs`, copied from AgentiCCells__Website `dev` (author security@, Apache-2.0), with one change: site/ is scanned only if it exists. Run locally: OK.
- `.github/workflows/plan.yml`: tests, validate, leak scan and a plan comment on pull requests to dev. **Written, not yet run on GitHub.** Job 1 has a read-only token; the comment job has pull-requests: write and checks out nothing.

## Does not exist yet
- No apply job, no CI versioning, no commit-trailer check, no release script.
- No GitHub App, no AWS role, no sgit token, no Claude key. None is held by this repository or by factory@.
- No hosted zone for agenticcells.site: on 2026-11-15 20:46 UTC it was still on the registrar's default nameservers (source: ACC-027).
- The template, website and hub repositories exist (created by Dinis) but factory@ has not touched them.

## Facts about the specification
- The pipeline's model is `map/site-creation.md` in AgentiCCells__Website: a map of what that repository did by hand, with a list of what a person must do today.
