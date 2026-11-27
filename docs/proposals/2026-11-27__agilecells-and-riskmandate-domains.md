# Proposal: agilecells.com, agilecells.org, agilecells.site and riskmandate.org

Drafted by cl-3.factory@AgentiCCells.dinis, 27 November 2026, at c.maestro's request (relaying Dinis, ~14:35 UTC: he bought these four domains at Network Solutions and wires DNS himself in Route 53 hosted zones). **A proposal for Dinis's review. Nothing has been changed.**

## What DNS says today (dns.google, 27 Nov 14:11 UTC)
| Domain | Nameservers |
|---|---|
| agilecells.com | ns5/ns6.worldnic.com (Network Solutions' own; not yet Route 53) |
| agilecells.org | none delegated (NXDOMAIN at the .org registry) |
| agilecells.site | none delegated |
| riskmandate.org | none delegated |

## 1. The plan per domain
| Domain | Role | Served by |
|---|---|---|
| agilecells.org | redirects to https://agenticcells.org for now (or becomes the spec's main address if Dinis chooses) | a redirect site in the AgentiCCells org |
| agilecells.com | redirects to https://agenticcells.org | a redirect site in the AgentiCCells org |
| agilecells.site | a home for customer sites, one subdomain per site (client.agilecells.site), made by this factory like agenticcells.site | one repository per site, as today |
| riskmandate.org | parked until the Agent Behaviour Policy content moves there | nothing yet (no records beyond the delegation) |

## 2. Records Dinis sets
**At Network Solutions, for each domain:** replace the nameservers with the four `awsdns` nameservers of its new Route 53 hosted zone. Until then nothing below answers.

**In each Route 53 zone:**
- agilecells.org and agilecells.com (served by GitHub Pages):
  - apex A: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
  - apex AAAA: 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153
  - www: CNAME to agenticcells.github.io
- agilecells.site: no apex record needed. One CNAME per customer site (`<client>.agilecells.site` to `agenticcells.github.io`), written by this factory once its AWS role covers the zone (section 3). **No wildcard record**: GitHub advises against a wildcard pointing at Pages, because anyone could then claim an unused subdomain for their own Pages site.
- riskmandate.org: none until its content exists.

## How a redirect is served
**Recommended: a small Pages site per domain**, made by this factory, for example AgentiCCells__Site__AgileCells-Org and AgentiCCells__Site__AgileCells-Com (names for Dinis to choose). Each serves one page whose `<meta http-equiv="refresh">`, `<link rel="canonical">` and a plain link send the visitor to https://agenticcells.org, over https with Enforce HTTPS, as agenticcells.org does now.
- Cost: no hosting charge (public repository, GitHub Pages); the Route 53 hosted zone fee per domain applies either way.
- Limit: GitHub Pages cannot answer with an HTTP 301, so search engines see a page that refreshes, not a permanent redirect. The canonical link tells them where the content lives.
- Needs: a redirect template (or the keeper replacing the seeded page), because the factory seeds from AgentiCCells__Site__Template.

**Alternative, a true 301:** an S3 bucket set to redirect all requests, behind CloudFront with an ACM certificate for HTTPS, in Dinis's AWS account. It gives a real permanent redirect, but it is AWS resources the factory does not manage today, and it is charged by AWS usage. Worth it only if search ranking on these names matters.

## 3. What the requests pipeline needs
- `build/validate.mjs` `ZONES`: add `agilecells.org`, `agilecells.com`, `agilecells.site` for `AgentiCCells` (one line each). For the two apexes nothing else: the dns step adopts an apex that a person has pointed at Pages and writes nothing to Route 53.
- For agilecells.site subdomains: the AWS role `agenticcells-site-factory-dns` today may change CNAME records only in the agenticcells.site zone (docs/aws-oidc.md). It needs the agilecells.site zone added to its permission policy (Dinis's change in AWS), and `FACTORY_ROUTE53_ZONES` given that zone's ID.
- riskmandate.org: which GitHub organisation serves it (AgentiCCells, or another) is Dinis's choice; its zone line is added when its content is ready.
- REALITY.md records each zone once it has run.

## Questions for Dinis
1. Redirect by Pages page (no cost, not a 301) or S3 and CloudFront (a 301, AWS usage cost)?
2. agilecells.org: redirect, or the spec's main address?
3. riskmandate.org: which organisation will hold its site?
