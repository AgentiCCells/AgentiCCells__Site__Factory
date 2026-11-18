# Brief: algarve-holiday-homes.agenticcells.site

## Dinis's words

Dinis, 2026-11-18 ~16:10 UTC, in the cells@AgentiCCells.dinis session: "now what I'd like you to do is I'd like you to see how we now can create some very powerful websites from here and we can create very powerful demo websites for our news thingy. And for our agentic team here ... the idea of these websites is A, to show the power of our agentic self, Yeah, so to show the power of our agentic flows ... we also need to make sure that we have a budget for each one, even like maybe we only do 5 design rounds or 5 full rounds, right? And again, it's very important that you capture all the sequence, because part of the exercise of these websites is to explain how this works, explain what we do, but also explain how to use the raw data that we collect. Because basically what I know with this stuff is that we now are moving so fast and we are implementing this thing at such speed that it's very hard for somebody to understand ... peak weather, maybe cyber, another one. And actually, what about events? That's a good one. Why don't we do the 3? And then part of one to also show is how to use the data, right? How to leverage the data, because what we want is for people to do websites like the one we have right now."

And, same message: "in fact, I started all of this by wanting to create a website for a sort of a real estate agency. In fact, why don't you do that too? So it's the 4th one you're going to create. You know, the same way you did for the oranges, can you create a website for a kind of an organization that has, let's say, 4 or 5 Airbnbs in Algarve, real estates, and then you should be able to see the availability, book it, kind of add an agent to it. Why don't you simulate an agent with a bunch of actions that are already pre-scripted, maybe with a little bit of that intelligence that we can try to predict what they say. So even like have that kind of agent that even although we don't have a live LLM in the background, you know, you almost feel like an agent. But what's cool about it is you can now show all of that in action ... you can show the weather, you can show the events, you can show, and they almost say, you know, for the people who are coming and the people who are thinking of coming, they can pick the events for it." And: "See if you can find what I've published before about the idea of creating some billboard ads in London with data, live data from the Algarve, even live stream of cameras ... we probably need to map the live stream of cameras to show what it looks like, because they're all public cameras, right? So in fact, why don't we experiment here?"

## What the site is for

A made-up example, like the orange grower (https://algarve-orange-grower.agenticcells.site): a small company with five holiday homes in different Algarve places. It shows what a real business could do with our data and an agentic team:
- the homes (invented, clearly labelled), each with a calendar of availability (simulated) and a booking flow that ends in a clear "This is a demonstration: nothing was booked, nothing was sent, nothing was charged";
- a scripted agent (no live model: pre-written intents and answers, matched in the browser, with suggested questions), that answers about the homes, availability, the weather and the events for a guest's dates, and says plainly that it is a simulation;
- for each home and stay: the forecast and warnings from ipma-city-forecasts and ipma-warnings, the sea and UV, and events near it on those dates from events-pt, read live from https://data.promptugal.news;
- "Live from the Algarve": a researched list and map of public live cameras (for example beach cameras) with their operators, linking out or embedding only through the operator's own public player where its terms allow; never police or private CCTV;
- a proposal page: "A London billboard, live from the Algarve": what a digital billboard in London could show from this live data and the cameras, drawn as mock-ups and marked as a proposal;
- behind the scenes and "Use the data", as on the other demo sites.

## Rules

- Made-up company: invent a name and check that no real holiday-rental business in the Algarve uses it; say "made-up example" on every page; invented homes, prices and photos-as-drawings only; no brand names of booking platforms; no payments, no personal data collected (forms keep nothing and send nothing).
- Data and cameras: as the common rules below; camera operators named as their pages name them, each with its URL and date checked.
- The billboard idea: Dinis's published piece on it was not found by cells@ (newsroom.sgit.ai, promptugal.news, web-summit.sgit.ai, sgit.ai, riskmandate.ai, ruv.sgit.ai, searched 2026-11-18). Ask Dinis for the link; until then, mark the page as a proposal from his words above.

## Rules (all four sites)

- Budget: at most five full rounds (design, build, review, release), and stop earlier when the reviewer passes the site. Each round report says what it spent the round on.
- Capture the whole sequence: a behind-the-scenes page (team, policies, flow, a commit timeline generated from git log, every round report), so a visitor can follow how the site was made.
- Read data live in the browser from https://data.promptugal.news (llms.txt, api/v1/index.json, openapi.json; per source latest.json, reads.json, card.json). Never copy the data into the repository beyond small test fixtures. Beside every figure: the source, the publisher and the time read, from the card. When a file is missing or stale, say so on the page.
- Follow each source's terms as its card gives them (for IPMA: no profit-making use, always name IPMA).
- Invent nothing that a visitor could take for real; name no person; plain British English, no hype words, no em dashes.
