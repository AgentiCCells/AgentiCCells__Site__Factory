// Tests for build/access.mjs and build/sync-settings.mjs with a fake GitHub. No network.
import { setHomepage, addTeams, homepageOf } from '../build/access.mjs';
import { syncOne, liveSites } from '../build/sync-settings.mjs';

let fails = 0;
const expect = (label, cond) => { if (!cond) { fails++; console.log(`access: ${label}`); } };
const site = { domain: 'london-billboard.agenticcells.site', repo: { owner: 'AgentiCCells', name: 'AgentiCCells__Site__London-Billboard' } };
const fake = (over = {}) => {
  const calls = [];
  return { calls, async gh(m, p, b) {
    calls.push({ m, p, b });
    for (const [k, v] of Object.entries(over)) if (`${m} ${p}`.includes(k)) return typeof v === 'number' ? { status: v } : v;
    return { status: m === 'PUT' ? 204 : 200, data: {} };
  } };
};

expect('homepage is the https domain', homepageOf(site) === 'https://london-billboard.agenticcells.site');
{
  const io = fake();
  const h = await setHomepage(site, io);
  expect('homepage PATCHed', h.ok && io.calls[0].m === 'PATCH' && io.calls[0].b.homepage === 'https://london-billboard.agenticcells.site');
  const t = await addTeams(site, io);
  expect('team PUT with push', t.ok && io.calls[1].p === '/orgs/AgentiCCells/teams/agenticcells-team-devs/repos/AgentiCCells/AgentiCCells__Site__London-Billboard' && io.calls[1].b.permission === 'push');
}
{
  const t = await addTeams(site, fake({ '/teams/': 403 }));
  expect('403 on the team names the Members permission', !t.ok && /Members/.test(t.bad[0]));
  const p = await addTeams({ ...site, repo: { owner: 'PrompTugal', name: 'X' } }, fake());
  expect('an owner with no teams does nothing', p.ok && !p.any);
}
{
  const r = await syncOne(site, fake({ 'GET /repos/': 404 }));
  expect('a gone repository is skipped', r.result === 'skipped');
  const io = fake({ 'GET /repos/': { status: 200, data: { homepage: 'https://london-billboard.agenticcells.site' } } });
  const r2 = await syncOne(site, io);
  expect('website already right is not PATCHed', r2.result === 'ok' && !io.calls.some((c) => c.m === 'PATCH'));
  const r3 = await syncOne(site, fake({ '/teams/': 403 }));
  expect('a team refusal fails the repository', r3.result === 'failed');
}
{
  const sites = liveSites();
  expect('live sites listed, London Billboard among them', sites.some((s) => s.site.repo.name === 'AgentiCCells__Site__London-Billboard'));
  expect('one entry per repository', new Set(sites.map((s) => `${s.site.repo.owner}/${s.site.repo.name}`.toLowerCase())).size === sites.length);
}
export default fails;
