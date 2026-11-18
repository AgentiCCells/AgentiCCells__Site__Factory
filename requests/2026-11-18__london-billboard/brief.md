# Brief: london-billboard.agenticcells.site

## Dinis's words

Dinis, 2026-11-18 ~16:10 UTC, in the cells@AgentiCCells.dinis session: "See if you can find what I've published before about the idea of creating some billboard ads in London with data, live data from the Algarve, even live stream of cameras ... we probably need to map the live stream of cameras to show what it looks like, because they're all public cameras, right? So in fact, why don't we experiment here?"

Dinis, 2026-11-18 ~17:30 UTC, same session, sharing two PDFs (a white paper and a 12-slide deck): "Ok, here is that idea I had, what do you think we should have just about all we need (I'm about to ask the data team if we can also collect the live video cameras from the region)".

Dinis, 2026-11-18 ~17:45 UTC, same session, answering whether to build it as its own site: "Cool, and yes this is 100% simulated, I just want to use it as a nice demo of what we can do with these ACC sites (and the data that we have on the multiple *.pt.news sites)".

## The idea (from Dinis's two PDFs)

- **White paper:** "Dynamic Weather-Driven Algarve Tourism Campaign", by Dinis Cruz (with ChatGPT Deep Research). Its text is beside this brief: `white-paper.md`. When London is cold, grey or wet, digital screens in London (for example on the Underground) show the Algarve live, with the weather, how soon you could be there, and a call to action. Three phases: (1) a live window: a webcam feed and "This is the Algarve right now. You could be here."; (2) actionable data: a 3-day Algarve vs London weather comparison, sunset vs London daylight, indicative travel time; (3) personalisation: "You are N hours away from this sunset", copy that fits the time, place and audience, and a QR code to a planning assistant. Example sources: Faro Marina and Old Town, Vilamoura Marina, Praia da Falésia, Albufeira, Tavira; example screens: Oxford Circus, Victoria, Waterloo, Canary Wharf.
- **Deck (12 slides, made in NotebookLM):** "Closing the Sunshine Gap": a rainy London morning; the sunshine gap; the live window; the three phases with a portrait screen mock-up for each; the technology (webcams, weather, flights into a content engine, out to screens); the locations; the expected returns. Its images are generated; do not copy them: draw your own.

## What the site is for

A **100% simulated** demonstration of what an AgentiCCells site and an agentic team can do with the data on the PrompTugal.news sites. It shows the billboard working, on screen, as a simulation:
- a full-screen portrait "screen" (1080x1920, scaled to fit) that runs the three phases in turn, with live Algarve data from https://data.promptugal.news (ipma-observations, ipma-city-forecasts, ipma-sea, ipma-uv, ipma-warnings, events-pt; adsb-faro as "planes landing at Faro now"), sunset and daylight computed for Faro and London;
- the London side simulated and labelled so until a real source exists (PrompTugal.news has no London weather source on 2026-11-18): a control to set London's weather, time and station, and the screen changing its message with them;
- live cameras: only once live.promptugal.news (public, officially shared webcams, streamed, never recorded) offers them; until then a clearly marked placeholder or drawn scene, never a third-party stream taken without leave;
- the planning assistant behind the QR code as a scripted agent (no live model), labelled a simulation; flights and prices as invented examples, labelled so;
- the idea itself, from the white paper, with credit to Dinis; behind the scenes and "Use the data", as on the other demo sites.

## Rules

- Simulation: every page says "simulation" or "proposal" where it applies; no claim that a campaign runs, that a screen exists, or that any tourism body, operator, airline or advertiser is involved. Name no such organisation as a partner.
- Figures from the white paper (300+ days of sun, hotels closing in winter, January sunshine hours) only with a primary source (for example IPMA or Met Office climate normals, INE), or marked "source unconfirmed".
- Data and terms as in the common rules below; IPMA: no profit-making use, always name IPMA.
- Dinis Cruz may be named as the author of the idea (it is his published white paper); name no other person.

## Rules (common to the demo sites, 2026-11-18)

- Budget: at most five full rounds (design, build, review, release), and stop earlier when the reviewer passes the site. Each round report says what it spent the round on.
- Capture the whole sequence: a behind-the-scenes page (team, policies, flow, a commit timeline generated from git log, every round report).
- Read data live in the browser from https://data.promptugal.news (llms.txt, api/v1/index.json, openapi.json; per source latest.json, reads.json, card.json). Never copy the data into the repository beyond small test fixtures. Beside every figure: the source, the publisher and the time read. When a file is missing or stale, say so on the page.
- Invent nothing a visitor could take for real; plain British English, no hype words, no em dashes.
