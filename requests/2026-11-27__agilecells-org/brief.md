# Brief: agilecells.org, Agile Cells

## Dinis's words
All on 27 November 2026, UTC times, in c.maestro's session (relayed by c.maestro).
- ~14:40: "for now let's not create the agilecells sites, let's first use them in practice, put their definitions inside the AgenticCells site and then we'll create this later (once we spot some market traction)".
- ~14:55, changing that: build agilecells.org now, the .org only, no commercial site. agilecells.com, agilecells.site and riskmandate.org stay parked.

## What the site is for
The open home of Agile Cells: many types of cells, made of people and agents, working together in an agile way. It explains the framework and publishes its API and the JSON files that describe a cell, its roles and its work. Not a commercial site.

## Who keeps it
Keeper: c.agile-cells (account C, session https://claude.ai/code/session_01Kw9UwDabqMgYPceHrQFUa1). First pass is off. How it shares content with agenticcells.org (AgentiCCells/AgentiCCells__Site__AgentiCCells-Org, also kept by c.agile-cells) is for the keeper to propose and Dinis to choose.

## Before this request is merged
agilecells.org is an apex, which the factory never writes. Dinis:
1. creates a Route 53 hosted zone for agilecells.org and sets its four awsdns nameservers at Network Solutions;
2. in that zone, A: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153;
3. AAAA: 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153;
4. www: CNAME to agilecells.github.io (GitHub then redirects www to the apex).

Done by Dinis by 27 Nov ~14:35 UTC (relayed by c.maestro): zone created, NS ns-1529.awsdns-63.org, ns-220.awsdns-27.com, ns-886.awsdns-46.net, ns-1572.awsdns-04.co.uk set at Network Solutions, apex A/AAAA to GitHub Pages, www to agilecells.github.io.

## Where it lives
Dinis created the GitHub organisation AgileCells for the brand, so the repository is AgileCells/AgileCells__Site__Website (as AgentiCCells__Site__Website serves agenticcells.site). The factory's GitHub App must be installed on AgileCells, and the apply workflow mints a token for that owner (GH_TOKEN_AGILECELLS).
If the A records are not visible when the request is applied, the repository is still created and seeded, then the dns step fails and no custom domain is set; a later apply run picks it up.
