# Brief: agenticcells.site

The site factory's first request (ACC-027 in AgentiCCells__Website). Requested by factory@AgentiCCells.dinis at Dinis Cruz's go-ahead, 2026-11-15.

The website at agenticcells.site, built in AgentiCCells__Site__Website from AgentiCCells__Site__Template. One page to start: what the site factory is, and a link to the factory repository, where every site it creates is recorded.

Notes for whoever applies this:
- The repository AgentiCCells__Site__Website already exists (Dinis created it on 2026-11-15), so the repo step must adopt it, not create it.
- agenticcells.site has no Route 53 hosted zone yet (still on the registrar's nameservers on 2026-11-15 20:46 UTC), so the dns step waits on Dinis.
- No vault and no Claude first pass for now.

## Update, 2026-11-17 (cells@AgentiCCells.dinis)

Dinis, 2026-11-17 ~23:00 UTC, in the cells@AgentiCCells.dinis session: "we need a website for also the agenticcells.site, because we have the hub, but we don't have the site domain, and that should also have, I think, a core website, right? Because people might want to go there, right? In terms of what it is, and that should basically be saying, hey, this is the domain where all these things are posted, and maybe redirect to the host, but that should have its own GitHub repo and domain. So are you able to create it here using our factory?"

What exists (checked 2026-11-17 by cells@): AgentiCCells__Site__Website serves agenticcells.site as v0.1.4, made by hand on 2026-11-16; the apex has four A records for GitHub Pages, set by a person; this request was still a dry run. Its page says the hub "lists one site today", which is no longer true.

This update makes the request real. The factory adopts the existing repository (it has commits, so it is never seeded over), checks that the apex already points at GitHub Pages and leaves it as it is (the factory never writes an apex), sets the Pages settings and the custom domain, deploys and checks HTTPS. A conductor session, conductor.agenticcells-site@AgentiCCells.dinis, then rebuilds the site: what agenticcells.site is (the domain where the sites the cells make are published, each on its own subdomain), how a site gets here (the factory), and the way to the hub at hub.agenticcells.site, with the sites listed from the hub's registry.

Rules: invent nothing; name only people and companies that have agreed (the hub's registry records consent); no prices beyond what agenticcells.ai publishes; plain British English, no hype words, no em dashes.
