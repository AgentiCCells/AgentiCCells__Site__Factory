# Build log: black-friday-rights.agenticcells.site

Written by trends@AgentiCCells.dinis. It is kept in this request folder because team/trends/ is outside requests/**.

## Cycle 3 (2026-11-20 17:15 UTC to 2026-11-21 ~17:00 UTC)
- board/HOLD.md: not present.
- GTA 6 re-check (2026-11-20 ~17:20): one wording fix. The "Collector's Box" on rockstargames.com/VI links to a merchandise collection, not an edition. Released as gta6-launch v0.1.4 (commit f329de7).
- Topic: UK shoppers' rights for Black Friday (27 November 2026). Research is in candidates.md in this folder. Before picking, we checked that the official sources would answer us: GOV.UK, legislation.gov.uk and Citizens Advice all returned HTTP 200. royalmail.com does not.
- Request: #47, requests-only, green. Merged by Dinis on 2026-11-21 ~16:53 UTC. status.json: live at 16:55:59 UTC (repo, seed, settings, DNS, domain, deploy and HTTPS all ok).
- Review:
  - First reviewer sub-agent: FIX FIRST, 22 points. Fixed:
    - an off-by-one in when the 14 days end for split deliveries;
    - "full refund if faulty" with no time limit;
    - missing caveats: goods not services, the per-item section 75 limit, debit and charge cards, return postage, business sellers, known faults, presents;
    - "free helplines": the 0300 number is not free;
    - the OGL attribution link.
  - Second reviewer sub-agent: FIX FIRST, 8 points. Fixed:
    - the repair or replace wording, which had the law the wrong way round (CRA ss. 23 and 24);
    - regulation 29 cited for cancelling before delivery;
    - the "Yes" FAQ was too broad for shop purchases;
    - unsourced examples removed.
  - All sources were re-fetched on 2026-11-21: unchanged.
- Build: AgentiCCells/AgentiCCells__Site__Black-Friday-Rights.
  - f2db03d adds team/keys.json and the signature and symlink checks.
  - 903ace8 adds the content and wires both checks into pages.yml and release.sh.
  - release.sh: build, validate, leak scan, Agent: trailers, signatures and symlinks all OK.
- Live: https://black-friday-rights.agenticcells.site, v0.1.2 (commit 903ace8).
- Headless Chromium on the live site: 6 requests, all on its own origin, 0 cookies, no console errors, no sideways scroll at 390px.

## Hand-over (trends@, 2026-11-21 ~17:00 UTC)
- Live sites, both re-checked within the last day:
  - gta6-launch v0.1.4: facts from Rockstar's pages; unlock times, size and price listed as not confirmed.
  - black-friday-rights v0.1.2: UK rules from GOV.UK and the legislation.
- How a site is built: the factory seeds the template. Commit 1 adds team/keys.json and copies scripts/check-signatures.mjs and check-symlinks.mjs. Commit 2 pins commit 1 as TRUSTED_BASE, copies pages.yml and release.sh from a finished site, and adds the content. Release with scripts/release.sh after `git fetch --depth=1000 origin dev`, because the signature check refuses a shallow clone.
- Lessons:
  - Test-fetch the official source before picking a topic (royalmail.com answers 403).
  - Run two review passes: the second pass found real legal errors in the fixes.
  - A request commit must be made on top of a dev that already holds the signer's key.
- Merges: the user (Dinis's account) approves each request merge in the trends@ session. cells.b@ has also merged requests-only PRs under its own standing permission.
- Next candidates: none picked. Black Friday ends on 27 November; re-check the page then, or mark it out of date after the sales.
