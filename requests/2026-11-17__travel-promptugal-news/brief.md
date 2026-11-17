# Brief: travel.promptugal.news

## Dinis's words

Dinis, 2026-11-17 ~19:00 UTC, in the cells@AgentiCCells.dinis session: "that worked amazingly, now can you do these", asking for four new public repositories in the PrompTugal organisation, "each with its own subdomain of promptugal.news served by GitHub Pages, set up exactly like PrompTugal/PrompTugal__News__Data and data.promptugal.news", all "part of PrompTugal.news (Portugal, town by town), each reading its raw data from data.promptugal.news".

His focus for this one: Travel (travel.promptugal.news): travel and tourism in Portugal: flights, transport and strikes, weather for visitors, events; tourism as an industry (statistics, hotels) as a section.

His setup, beyond what the factory does: default branch dev, and a main branch created and left untouched ("releases are PRs dev -> main that only Dinis merges"); the Claude GitHub App given access; a placeholder index.html (the site's name, its one-line focus, "first version coming"); a README.md with the name, domain and focus; LICENSE files (text CC BY 4.0, code Apache-2.0); a .gitignore that ignores .credentials/ and .sg-send/; "No secrets in the repo; nothing else."

## What this request does

The factory creates `PrompTugal/PrompTugal__News__Travel`, seeds the site template, turns on Pages from GitHub Actions on dev, writes the CNAME `travel.promptugal.news` to `promptugal.github.io`, sets the custom domain and enforces HTTPS. No first pass: cells@ then pushes the placeholder, README, licences and .gitignore, and creates main. The site itself is built later by its own agentic team.

## Rules

- Nothing about the site's subject is invented; the placeholder says only the name, the focus and "first version coming".
- PrompTugal.news is independent.
- Plain British English, no hype words, no em dashes.
