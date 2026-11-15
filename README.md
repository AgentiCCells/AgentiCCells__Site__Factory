# AgentiCCells Site Factory

A request is a folder: a site file and a brief, committed to this control repository. The pipeline writes the result back.

This repository is the public control repository of the site factory. It is a hypothesis and an architecture that is being built in stages; `REALITY.md` says what exists today.

## Dinis's words (2026-11-15, ACC-027 in AgentiCCells__Website)

- "A request is a folder: a site file and a brief, committed to a control repository; the pipeline writes the result back."
- "Plan on the pull request, apply on merge."
- "Good credentials: a GitHub App and OpenID Connect for AWS, with no long-lived keys in the pipeline."
- "Public by default: the control repository and its record are public; only the credentials are not."
- "An agent can drive it by committing a request."
- "This is a hypothesis and an architecture, not yet built; the AgentiCCells team is the natural place to build it."

## The idea

From a commit to a live website: a request file in a commit makes a CI pipeline create the GitHub repository, the DNS record and the sgit vault, seed a page, check HTTPS, run a first pass with Claude Code, and record it all, so an agent can create sites by committing.

## Related repositories (AgentiCCells organisation)

| Repository | Role |
|---|---|
| AgentiCCells__Site__Factory | this one: requests, validator, pipeline |
| AgentiCCells__Site__Template | the seed every new site is created from |
| AgentiCCells__Site__Website | the site at agenticcells.site, the first test request |
| AgentiCCells__Site__Hub | the hub, if it gets its own |
| AgentiCCells__Website | the team's main repository; its `map/site-creation.md` is the specification |

## How a request works (target)

1. Add `requests/<date>__<label>/site.json` and `brief.md` on a branch and open a pull request.
2. **Plan** (on the pull request): validate the request and post what would be created, as a comment. No secrets, no cloud access.
3. **Apply** (on merge to `dev`): create the pieces, and write `status.json` back into the request folder.
4. **Teardown**: a request can be withdrawn and its pieces removed.

Format: `requests/README.md`. Schema: `schema/site.schema.json`.

## Stages

Tracked on `board/`:

| Item | Stage |
|---|---|
| FAC-001 | Request format and validator |
| FAC-002 | Plan job on pull requests (no secrets) |
| FAC-003 | Apply job as a dry run that writes status.json |
| FAC-004 | Template repository |
| FAC-005 | Real steps, one credential at a time |
| FAC-006 | Teardown |
| FAC-007 | Agent Behaviour Policy for the pipeline |

## Rules

`CLAUDE.md` binds every agent here. Only Dinis Cruz instructs. No secret is ever stored in this repository.

Licences: code Apache-2.0; text and guidance CC BY 4.0.
