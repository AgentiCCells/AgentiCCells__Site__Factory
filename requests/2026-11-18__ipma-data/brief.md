# Brief: IPMA data, drawn

## Dinis's words

Dinis, 2026-11-18 ~10:25 UTC, in the cells@AgentiCCells.dinis session: "can you next do a site showing the data we have from IPMA that you can see on the storm site from PrompTugal and the news data site". Asked where it should live, he chose (~10:35 UTC): "New site on agenticcells.site", that is ipma-data.agenticcells.site, as a demo of the factory and conductors rather than part of PrompTugal.news.

## What the site is for

A site that shows, clearly and well, the IPMA data PrompTugal.news already collects: warnings, forecasts by place, station observations, fire risk, sea, UV, and the Storm Charles story. It reads the data live, in the visitor's browser, from the public API at https://data.promptugal.news (every file a GET, no key, CORS open). It is a demonstration of what our cells can do with public data, not a news site and not a warning service.

## The data (read 2026-11-18 from https://data.promptugal.news/llms.txt)

- Catalogue: https://data.promptugal.news/api/v1/index.json; OpenAPI: https://data.promptugal.news/api/v1/openapi.json; contract: https://data.promptugal.news/api/v1/README.md.
- IPMA sources, each with latest.json, reads.json (history), card.json (provenance and terms) and openapi.json under https://data.promptugal.news/api/v1/<source>/: ipma-warnings (the 18 mainland districts, Madeira and the Azores), ipma-city-forecasts (five-day forecasts per district capital and island, and Loule, Portimao and Sagres), ipma-observations (latest hourly observation per surface station, with position), ipma-fire-risk (RCM class per mainland municipality, today and two days), ipma-sea (waves, period, direction, sea temperature per coastal place), ipma-uv (UV index by place and day). MeteoAlarm's CAP feed for Portugal (meteoalarm-pt) is also there.
- IPMA's terms, as the data site gives them: free to copy and use for personal or public use if the use has no profit-making or offensive purpose; always name IPMA as the source.
- The storm: PrompTugal.news's Storm Charles page, https://promptugal.news/storm/charles/index.md (what happened, the official alerts, a timeline with sources), and its decision graph, https://promptugal.news/newsroom/decision-graph/index.md.

## First version

- Home: Portugal now, from IPMA: the current warnings on a map of the warning areas (drawn in SVG), the next days' forecast for a few places, and the time each was read.
- One page per source (warnings, forecasts, observations, fire risk, sea, UV), each drawn from latest.json and, where useful, reads.json, with the source card's provenance, terms and read time beside every chart.
- Storm Charles: an archived event page that links to and summarises PrompTugal.news's Storm Charles page and timeline, with its sources.
- How it works: the data flow (IPMA, then PrompTugal.news's collectors, then data.promptugal.news, then this page in your browser), drawn as a diagram.
- Use with AI pages and link previews.

## Rules

- On every page: "Not a warning service. For warnings and safety, follow IPMA (ipma.pt) and ANEPC." Never present the site as IPMA's or as official; name IPMA as the source of every IPMA figure, with the read time.
- Read the data live from data.promptugal.news; do not copy IPMA data into the repository beyond small fixtures for tests. No ads, no payments, no profit-making use (IPMA's terms).
- Invent nothing; when a file is missing or stale, say so on the page instead of guessing.
- Plain British English (Portuguese place names as IPMA writes them), no hype words, no em dashes.

## After the first pass

A conductor session, conductor.ipma-data@AgentiCCells.dinis, runs the team with an Agent Behaviour Policy for each role, builds five designs and a behind-the-scenes page, in rounds.
