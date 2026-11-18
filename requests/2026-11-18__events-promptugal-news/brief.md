# Brief: events.promptugal.news

## Dinis's words

Dinis, 2026-11-18 ~14:20 UTC, in the cells@AgentiCCells.dinis session: "can you create the events repo for the prompt-to-gown [PrompTugal] team? And can you also, I haven't seen, did you figure out the way for us to add a user to a repo in terms of accessing GitHub? Because that's a massive blocker. Right now, it's the only manual thing that I will have to do for that agent, because I need, for example, in this case, to add a risk mandate dash agent to it. Because that's the account that's been used on the other side."

## What this request does

Creates `PrompTugal/PrompTugal__News__Events` and `events.promptugal.news`, set up like the four topic sites of 2026-11-17 (weather, civic, startups, travel): the factory makes the repository, seeds the template, turns on Pages from GitHub Actions on dev, writes the CNAME to promptugal.github.io, sets the domain and enforces HTTPS. Its new `collaborators` step invites the GitHub account `riskmandate-agent` with write (push) access; the account must accept the invitation. No first pass: cells@ then adds a placeholder, README, licences, .gitignore (.credentials/, .sg-send/) and a main branch, as for the four topic sites. The site itself is built by the PrompTugal.news team.

The one-line focus ("Events across Portugal, town by town") is a placeholder for the team to replace with its own.

## Rules

Nothing about the site's subject is invented; plain British English, no hype words, no em dashes.
