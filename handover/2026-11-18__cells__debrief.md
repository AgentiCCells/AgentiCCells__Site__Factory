# Debrief: cells@AgentiCCells.dinis, 2026-11-15 to 2026-11-18

Written 2026-11-18 ~19:00 UTC at Dinis's word (~18:55 UTC): "we have just hit 94% on this account, so we need to move all current agents to another account I have (including you). Can you stop all ACC activities and ask the agents to write a debrief and follow briefing (including you)".

## What cells@ did
- Ran the site factory (this repository) for Dinis: wrote each request (`requests/<date>__<label>/site.json` + `brief.md` with Dinis's words and UTC times), validated, opened a PR to dev, waited for the plan check, merged (standing permission from Dinis), waited for `status.json` to show live.
- Built factory features: two DNS zones and two owners (agenticcells.site -> AgentiCCells, promptugal.news -> PrompTugal; per-owner GitHub App tokens), the `collaborators` field (up to 5 logins, push), apex adoption (agenticcells.site already on GitHub Pages), and switched the Claude first pass off (Dinis, cost: `FIRST_PASS_ON = false`).
- Set up PrompTugal repositories after the factory: placeholder, README, LICENSE-TEXT (CC BY 4.0) beside LICENSE (Apache-2.0), src/CNAME, .gitignore (.credentials/, .sg-send/), `main` at the same commit (never touched again; releases dev -> main are merged only by Dinis).
- Started a conductor session per site (`conductor.<label>@AgentiCCells.dinis`, Opus): a team of sub-agents with ROLE.md + Agent Behaviour Policy per role, rounds, five designs, behind the scenes, Use with AI, link previews. Shared instructions: `handover/conductor-common.md`.

## Sites and their state (2026-11-18 ~19:00 UTC)

All requests in `requests/` show live except agenticcells.site (https pending: its version.json has no `commit` field; its conductor never started, see below). `vicky-wang` shows live but was withdrawn: Dinis deleted the repository and DNS; the site is `yiheng-wang`.

| Site | Conductor / agent | State |
|---|---|---|
| yiheng-wang, silvio-switha, jose-bota, gabriel-dacruz (.agenticcells.site) | site@ sessions, idle | Live; link previews done. Silvio's agent asked whether to keep editing or leave it to a conductor (unanswered). |
| marc-noah | conductor, idle | Live, five designs with photos and films; HANDOVER.md in repo. Open: Marc's answers (lead photo, credits, Portuguese, is marcnoah.pt still his). |
| sustain-nobility | conductor, idle | Live, six designs; a draft email to the founder ready to paste; permission email draft in cells@ scratchpad (Dinis to send). |
| indi-gupte | conductor, idle | Live, five designs; waiting for Indi's decisions and the YouTube video id. |
| mondweep-chakravorty | conductor, idle | Live, round 2 (Ledger default); Mondweep's review pending. |
| ipma-data | conductor, idle | Live round 2 (v0.1.4); live review not done; may Dinis be named; policies to approve. |
| weather-demo | conductor, done | Live v0.1.8; reviewer passed the whole site after 3 rounds; HANDOVER.md. Open: naming Dinis; approve the six policies; data-team note. |
| algarve-holiday-homes | conductor, asked to stop 18:55 | Live round 2 (Cinco Chaminés, 19 AI pictures, 5 designs); round 3 (simulation modes, agents on both sides) in progress; Dinis widened the brief in its session (17:10 to 17:45 UTC). |
| london-billboard | conductor, asked to stop 18:55 | 100% simulated billboard; London or Portuguese cities; 100% client side (Dinis 18:00 UTC). Round 1/2 in progress. |
| evals, openrouter-evals | conductor.evals, asked to stop 18:55 | Created 18:45; round 1 (shared core + hub) just started. |
| events-demo, cyber-demo | conductors BLOCKED since 16:18 | Never ran: each stopped at an "Add Repo" approval prompt nobody answered. Sites are still the factory seed page. Restart on the new account. |
| agenticcells.site | conductor BLOCKED since 17 Nov 23:09 | Never ran (same Add Repo prompt). Restart on the new account; add `commit` to version.json so https completes. |
| *.promptugal.news (weather, civic, startups, travel, events, signals, library, videos, cyber, live, bulletins (added 19:30 UTC), data) | PrompTugal.news team | Placeholders by cells@; the PrompTugal team builds them. live.promptugal.news: stream, never record, public officially shared webcams only. |

Each running conductor was asked to write `team/DEBRIEF.md` and `team/NEXT-BRIEFING.md` in its repository.

## Open items for Dinis
1. Data-team note (paste into the PrompTugal data team's session): IPMA vault writes stopped after 17 Nov ~19:29 UTC; events-pt has no history (events/past 404); by_place covers 18 Algarve places; ipma-uv date and "Sagres" label wrong; storm-charles-archive/reads.json 404; collector gap 7 h 15 min; London weather and London to FAO schedule sources wanted for the billboard.
2. Decisions waiting on sites: naming Dinis on behind-the-scenes pages (weather-demo, ipma-data); approving team policies; Marc, Indi, Mondweep, SUSTAIN-NOBILITY answers.
3. Fast-inference / router site: which one Dinis meant by "an OpenRouter competitor" (fast inference: Groq, Cerebras, SambaNova; or a router: Requesty, Portkey, AI gateways).
4. A further eval site for a prospective partner (name with Dinis, kept out of this public repository).
5. Promised and not done: template PR (OG tags + check; hyphen/dot commit-check fix) to AgentiCCells__Site__Template; FAC-008 (hub auto-listing).
