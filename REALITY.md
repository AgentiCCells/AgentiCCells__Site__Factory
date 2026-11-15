# REALITY.md: what exists now

Checked 2026-11-15 by factory@AgentiCCells.dinis. A thing not written here does not exist.

## Exists (checked)
- This repository, AgentiCCells__Site__Factory, public, with `dev` and `main`. Created by Dinis (source: brief, board/briefs/factory.md in AgentiCCells__Website).
- `CLAUDE.md`, copied unchanged from AgentiCCells__Website `dev`.
- `README.md`, this file, `board/` (items FAC-001 to FAC-007), `requests/README.md` (request format), `schema/site.schema.json` (JSON schema for `site.json`), `requests/EXAMPLE/` (an example, not a live request).

## Does not exist yet
- No gates in this repository: the leak scan from AgentiCCells__Website expects a built site/ and this repository has none, so it needs adapting (FAC-001). Before this first commit it was run on a temporary copy with a placeholder site/index.html.
- No validator script (FAC-001 is half done: format and schema are written, nothing checks them).
- No workflow: no plan job, no apply job, no CI versioning, no commit-trailer check.
- No GitHub App, no AWS role, no sgit token, no Claude key. None is held by this repository or by factory@.
- No hosted zone for agenticcells.site: on 2026-11-15 20:46 UTC it was still on the registrar's default nameservers (source: ACC-027).
- The template, website and hub repositories exist (created by Dinis) but factory@ has not touched them.

## Facts about the specification
- The pipeline's model is `map/site-creation.md` in AgentiCCells__Website: a map of what that repository did by hand, with a list of what a person must do today.
