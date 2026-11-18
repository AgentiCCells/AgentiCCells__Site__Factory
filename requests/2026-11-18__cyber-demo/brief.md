# Brief: cyber-demo.agenticcells.site

## Dinis's words

Dinis, 2026-11-18 ~16:10 UTC, in the cells@AgentiCCells.dinis session: "now what I'd like you to do is I'd like you to see how we now can create some very powerful websites from here and we can create very powerful demo websites for our news thingy. And for our agentic team here ... the idea of these websites is A, to show the power of our agentic self, Yeah, so to show the power of our agentic flows ... we also need to make sure that we have a budget for each one, even like maybe we only do 5 design rounds or 5 full rounds, right? And again, it's very important that you capture all the sequence, because part of the exercise of these websites is to explain how this works, explain what we do, but also explain how to use the raw data that we collect. Because basically what I know with this stuff is that we now are moving so fast and we are implementing this thing at such speed that it's very hard for somebody to understand ... peak weather, maybe cyber, another one. And actually, what about events? That's a good one. Why don't we do the 3? And then part of one to also show is how to use the data, right? How to leverage the data, because what we want is for people to do websites like the one we have right now."

## What the site is for

A demonstration of the agentic flow for threat intelligence. On 2026-11-18 the data catalogue had no cyber source yet (the PrompTugal.news team has just started cyber.promptugal.news to capture it). So the site shows, honestly: the plan (sources, capture, review, publish), the data contract a cyber source will follow (latest, reads, card, as the other sources do), what the social and base-gov-pt sources look like today as worked examples of the contract, and a page that switches on as soon as a cyber source appears in api/v1/index.json. Read cyber.promptugal.news's README for its rules. Three things a visitor must leave with: how the capture works; how the site was made; and how to use the data once it flows.

Pages: home (the data now), one page per source or view, "How it was made" (the agentic flow), "Use the data" (the API with copy-paste examples in JavaScript and with curl, the card and its terms, how to build a page like this one), behind the scenes, Use with AI (llms.txt, index.md), link previews; five designs under /d/ with a chooser.

A conductor session, conductor.cyber-demo@AgentiCCells.dinis, runs the team (Agent Behaviour Policy per role) and builds it from the seed (the first pass is switched off).

## Rules (all four sites)

- Budget: at most five full rounds (design, build, review, release), and stop earlier when the reviewer passes the site. Each round report says what it spent the round on.
- Capture the whole sequence: a behind-the-scenes page (team, policies, flow, a commit timeline generated from git log, every round report), so a visitor can follow how the site was made.
- Read data live in the browser from https://data.promptugal.news (llms.txt, api/v1/index.json, openapi.json; per source latest.json, reads.json, card.json). Never copy the data into the repository beyond small test fixtures. Beside every figure: the source, the publisher and the time read, from the card. When a file is missing or stale, say so on the page.
- Follow each source's terms as its card gives them (for IPMA: no profit-making use, always name IPMA).
- Invent nothing that a visitor could take for real; name no person; plain British English, no hype words, no em dashes.
- No live malware or exploit code, no leaked data, no victims' personal data; indicators only from public sources, with source and date.
- Mark plans as plans: nothing on the site may suggest cyber data exists before it does.
