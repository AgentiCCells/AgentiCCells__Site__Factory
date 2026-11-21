# Release controls as Agent Behaviour Policies

Dinis, 2026-11-20: "those checks and controls are exactly a good example for our ABPs". Each control below is one ABP entry: the rule an agent follows, why it exists, what enforces it, and how anyone can check it. Each is enforced by code or by GitHub's settings, never by an agent's good behaviour alone.

Sources: the Factory's `build/check-signatures.mjs`, `build/check-symlinks.mjs`, `build/leak-scan.mjs`, `.github/workflows/plan.yml` and `build/protect.mjs`; PrompTugal__News__Live's `.github/workflows/pages.yml` (the `security` job); security@'s rulings and the peer reviews named in REALITY.md.

| # | Rule for the agent | Why | Enforced by | How to check |
|---|---|---|---|---|
| 1 | Sign every commit with your own published key, and name yourself and your session in the trailers (`Agent:`, `Claude-Session:`). | Anyone can type any name into git; only a key proves who made a commit. | `check-signatures.mjs`: each commit against the keys in its first parent's `team/keys.json`, never its own; no exemption by name. | The pull request's trusted check, or run the checker over the range. |
| 2 | Never add your own key. An agent already trusted adds it, at Dinis's word. | A commit that adds its own key would vouch for itself. | The same check: a self-added key fails (control 3). | PR #40 failed this way, by design; PR #42 added the key under cells.b@'s signature. |
| 3 | Never commit, print or log a secret. | Every repository is public. | `leak-scan.mjs` over the files as pushed and the built site, NUL-byte files included, symlinks refused. | The leak scan step in each run. |
| 4 | Add no symlinks; an exception names its path, its target and a reason, and is reviewed. | A link can point a check or a deploy at files that were never reviewed. | `check-symlinks.mjs` (control 10): every commit in the range, the final tree, the checkout and downloaded artifacts; raw-byte paths. | The trusted check's output. |
| 5 | Never weaken the check that judges your change. | A change that edits its own checker can approve itself. | The trusted job runs the checker from the base branch, never from the pull request (control 7). | The workflow takes each checker with `git show "$BASE:..."`. |
| 6 | Never rewrite or delete dev. | History is the record; a rewrite erases it. | Branch protection, stage base: no force-push, no deletion. | Repository settings, Branches. |
| 7 | Release tags are made only by the release job. | A tag a person or another token moved would mark a release that was never checked. | Tag ruleset "release tags": `v*` created, moved or deleted only by GitHub Actions. | Repository settings, Rules. |
| 8 | Deploy only what dev holds. | A deploy from another branch skips every check on dev. | The github-pages environment accepts dev only; jobs that hold secrets run only for dev. | Repository settings, Environments; `test/workflow-guards.mjs`. |
| 9 | Land every change through a pull request whose checks pass; you may merge your own (for now). | The checks run before the change reaches dev, and the pull request is the record of what was checked. | Branch protection, stage pr: pull request required, 0 approving reviews, the listed checks required. | The pull request page: its checks, its log, its merge. |

## Working with stage pr
- Never press GitHub's "Update branch" button on a pull request into a protected repository. It makes a merge commit that no agent signed and that the check cannot attest, and the pull request is then blocked. Bring a branch up to date with a merge the agent signs, or a rebase of its own branch (live.b@, 21 Nov).
- The agent that opens a pull request merges it once the checks pass, with Dinis's standing permission given in that agent's own session.

## Known gaps (said plainly)
- With no required review (row 9, Dinis's choice for now), a pull request could change its own workflow, keep a job's name and make it do nothing. Closing that needs a code-owner review on `.github/` and the check scripts. That is a later step for Dinis.
- GitHub writes and signs the merge commit when a pull request is merged. A repository's own signature check must accept such a merge commit when the commits it brings in were checked in a pull request, or row 9 will fail row 1.
- Row 9 is on only where the repository's workflow runs its checks on pull requests and its agents work through them (stage pr in `protect/repos.json`).
