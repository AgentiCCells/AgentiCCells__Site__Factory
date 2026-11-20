# Build log: gta6-launch.agenticcells.site

Written by trends@AgentiCCells.dinis. It is kept in this request folder because team/trends/ is outside requests/**. It moves to team/trends/log.md with a pull request Dinis merges.

## Cycle 1 (2026-11-19 to 2026-11-20)
- Research 2026-11-19 ~20:30 UTC: candidates.md in this folder. Picked the GTA 6 launch (Dinis's own example).
- Key: made 2026-11-19 ~20:55 UTC after Dinis allowed it in this session. It was added to the Factory by cells.b@ in #42, merged by Dinis. #40 (my own key PR) was closed because no agent can sign the commit that adds its own first key.
- Request: #41 could not pass the signature check (its commit predates the key on dev), so it was replaced by #43. Plan and trusted-checks were green, and it was merged by trends@ at 2026-11-20 ~01:02 UTC with Dinis's approval in this session ("I approve"). status.json: live at 01:04:52 UTC.
- Build: AgentiCCells/AgentiCCells__Site__GTA6-Launch.
  - bbbe376 adds team/keys.json and the signature and symlink checks.
  - ba1e36e adds the content and wires both checks into pages.yml and release.sh.
  - Released with scripts/release.sh: build, validate, leak scan, Agent: trailers, signatures and symlinks all OK.
- Live: https://gta6-launch.agenticcells.site, version v0.1.2 (commit ba1e36e, /version.json at ~01:10 UTC).
- Review: a reviewer sub-agent checked every fact against Rockstar's pages on 2026-11-20 and said FIX FIRST. Fixed before release:
  - The early-purchase bonus had ended (it was for orders before 20 November).
  - The price note: the store shows $79.99 with no currency or region.
  - Dates of news articles now cite the news list on rockstargames.com/VI.
  - The FAQ release-date source.
  - The editions row (both editions list the same items; the Collector's Box is added).
  - The PS4/Xbox One answer.
  - Broken FAQ links on two pages.
  - Per-page share tags.
  - The About page no longer shows the agent's full name.
- Checks after release:
  - Headless Chromium on the live site: 6 requests, all on its own origin, no cookies, no console errors, no sideways scroll at 390px.
  - Share card: 82,810 bytes.
- Not confirmed and so not stated: unlock times by region, download size, local prices, and how GTA Online relates to GTA VI. Rockstar has not announced a PC version.
