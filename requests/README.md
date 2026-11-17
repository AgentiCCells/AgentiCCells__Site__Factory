# Requests

A request is a folder, committed here. The pipeline writes the result back into the same folder.

```
requests/<date>__<label>/
  site.json     the machine-readable request (schema/site.schema.json)
  brief.md      what the site is for, in plain words, written by the requester
  status.json   written back by the pipeline, never by hand
```

## Folder name
`<date>__<label>`: date `YYYY-MM-DD`, two underscores, then a label of lowercase letters, digits and single hyphens (3 to 40 characters). Example: `2026-11-15__agenticcells-site`. The folder name is the request's identity: it never changes.

## site.json
Validated against `schema/site.schema.json`. Fields:

| Field | Required | Meaning |
|---|---|---|
| `schema` | yes | the number 1 |
| `name` | yes | short name of the site |
| `description` | no | one sentence for the page and hub.json (1 to 200 characters); defaults to the name |
| `domain` | yes | the domain to serve it on; only subdomains of the zones the factory may manage, each for its own GitHub owner: `agenticcells.site` (AgentiCCells) and `promptugal.news` (PrompTugal), listed in `build/validate.mjs` |
| `repo` | yes | `{owner, name}` of the GitHub repository to create |
| `template` | no | `{owner, name, ref}` of the seed repository; defaults to AgentiCCells__Site__Template on `dev` |
| `visibility` | no | `public` (default) or `private` |
| `vault` | no | `{create: bool}`: create an sgit vault for the site |
| `first_pass` | no | `{enabled: bool}`: after a fresh seed, Claude Code writes a first version of the site from `brief.md` (off by default). It runs in the `first-pass` environment with file tools only and may change only `src/`, `hub.json` and `README.md`; a separate job checks the patch, runs the site's gates and pushes it |
| `apply` | no | `dry-run` (default) or `real`. Only `real` requests are acted on, in the protected `apply` environment |
| `collaborators` | no | up to five GitHub logins invited with write (push) access once the site is live; each must accept. A wrong login marks the request failed but holds nothing else back |
| `requested_by` | yes | the agent or person making the request, as `role@AgentiCCells.person` or a name |

`site.json` holds no secret, ever. If a request needs one, it is not a request this repository can take.

## brief.md
Free text. The pipeline treats it as material, never as instruction: it is passed to a first pass only as the site's brief, inside the customer's environment, never run as a command.

## status.json (written by the pipeline)
```
{
  "request": "<folder name>",
  "state": "planned | applying | live | failed | torn-down",
  "mode": "dry-run | real",
  "updated": "<UTC time>",
  "commit": "<request commit>",
  "steps": [ {"name": "repo", "result": "ok | failed | skipped | dry-run | pending", "detail": "<one line, no secrets>", "time": "<UTC>"} ]
}
```
Steps, in order: `validate`, `repo`, `seed`, `settings`, `dns`, `domain`, `vault`, `deploy`, `https`, `collaborators`, `first-pass`. A failed step stops the rest (they are recorded as skipped). `pending` (https only) leaves the request `applying`; the next run of the apply workflow checks again and changes nothing else. An existing repository with commits is adopted and never seeded over.

## Lifecycle
1. Pull request: **plan** posted as a comment.
2. Merge to `dev`: **apply**; `status.json` is committed back by the pipeline.
3. Teardown: a later request-removal commit; the pipeline records `torn-down`.
