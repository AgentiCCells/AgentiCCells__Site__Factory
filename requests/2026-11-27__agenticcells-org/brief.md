# Brief: agenticcells.org, Agile Cells

## Dinis's words
All on 27 November 2026, UTC times.
- ~13:00, in c.maestro's session (relayed by c.maestro): a framework repository for ephemeral agile teams, with an API and JSON files.
- 13:16, in c.maestro's session: "I really like the Holon terms and Agile Cells also works really well and it is a good description of what we are talking about \"Multiple Types of Cells working together in an Agile way\"".
- ~13:30, in c.maestro's session (relayed): "yes cells all the way down, and I own agenticcells.org".
- ~13:38, in c.maestro's session (relayed): "can you ask the Infra agent to create the repo in the AgentiCCells GH org and I'll wire up the DNS (on the new Route53 hosted zone)".
- ~13:50, in factory.c's session: "what about AgentiCCells__Site__AgentiCCells-Org", and "yes I agree with your plan".

## What the site is for
The home of Agile Cells: many types of cells, made of people and agents, working together in an agile way, formed for a piece of work and ended after it. The site explains the framework and publishes its API and the JSON files that describe a cell, its roles and its work.

## Who keeps it
Keeper: c.agile-cells (account C, session https://claude.ai/code/session_01Kw9UwDabqMgYPceHrQFUa1), which builds the first version (first pass is off). Design: design.c.

## Before this request is merged
agenticcells.org is an apex, which the factory never writes. Dinis points it at GitHub Pages in the agenticcells.org Route 53 hosted zone, delegated from the registrar:
- A: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- AAAA: 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153
- www: CNAME to agenticcells.github.io (GitHub then redirects www to the apex)
If the A records are not there when the request is applied, the repository is still created and seeded, then the dns step fails and says so, and no custom domain is set; a later apply run picks it up once the records are in.
