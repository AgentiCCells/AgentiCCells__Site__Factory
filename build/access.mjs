// Repository settings every factory site carries, beyond the ones it needs to be served:
// - the About box's website (GitHub's "homepage" field), set to https://<domain>;
// - the teams given access, per owner.
// Dinis, 2026-11-18 ~22:46 UTC, in the cells.b@AgentiCCells.dinis session: add the team
// https://github.com/orgs/AgentiCCells/teams/agenticcells-team-devs "to every single
// repository", and set "use your GitHub Pages website" on the About box.
// Both run through `io.gh` (the factory's App token), so the tests use fakes.

// Teams per repository owner. Permission: GitHub's repository role for the team
// (pull, triage, push, maintain, admin). Push (write) until Dinis says otherwise.
export const TEAMS = {
  AgentiCCells: [{ slug: 'agenticcells-team-devs', permission: 'push' }],
};

export const homepageOf = (site) => `https://${site.domain}`;
const ok = (status) => status >= 200 && status < 300;

// Set the About box's website. Returns a one-line detail; throws nothing.
export async function setHomepage(site, io) {
  const full = `${site.repo.owner}/${site.repo.name}`;
  const want = homepageOf(site);
  const r = await io.gh('PATCH', `/repos/${full}`, { homepage: want });
  return ok(r.status) ? { ok: true, detail: `website ${want}` } : { ok: false, detail: `website not set (GitHub returned ${r.status})` };
}

// Give each of the owner's teams its role on the repository. GitHub answers 204.
// An App needs the organisation permission "Members" for this, beside repository
// Administration; without it GitHub answers 403 and the detail says so.
export async function addTeams(site, io, teams = TEAMS) {
  const { owner, name } = site.repo;
  const list = teams[owner] ?? [];
  const done = [], bad = [];
  for (const t of list) {
    const r = await io.gh('PUT', `/orgs/${owner}/teams/${encodeURIComponent(t.slug)}/repos/${owner}/${name}`, { permission: t.permission });
    if (ok(r.status)) done.push(`team ${t.slug} (${t.permission})`);
    else bad.push(`team ${t.slug} (GitHub returned ${r.status}${r.status === 403 ? ': does the factory App have the organisation permission Members?' : ''})`);
  }
  return { ok: !bad.length, any: list.length > 0, done, bad };
}
