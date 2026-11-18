// Tests for build/real.mjs with fake GitHub, DNS and HTTPS. No network.
import { runReal, recheck } from '../build/real.mjs';
import { fillPlaceholders, tokenFor, realIo } from '../build/io.mjs';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const site = { schema: 1, name: 'QA 1', description: 'A test <site> & "more"', domain: 'qa-1.agenticcells.site',
  repo: { owner: 'AgentiCCells', name: 'AgentiCCells__Site__Factory__Pipeline__QA-1' }, apply: 'real', requested_by: 'factory@AgentiCCells.dinis' };
const SHA = 'abcdef1234567890abcdef1234567890abcdef12';

function fakeIo({ exists = false, empty = true, served = true, fail = {} } = {}) {
  const calls = [];
  let pages = false;
  const io = {
    calls, now: () => '2026-11-16T00:00:00Z', sleep: async () => {},
    async gh(method, path, body) {
      calls.push(`${method} ${path}`);
      for (const [k, st] of Object.entries(fail)) if (`${method} ${path}`.includes(k)) return { status: st, data: null };
      if (method === 'GET' && path === `/repos/${site.repo.owner}/${site.repo.name}`) return { status: exists ? 200 : 404 };
      if (method === 'POST' && path.endsWith('/repos')) { exists = true; return { status: 201 }; }
      if (path.includes('/commits?')) return { status: empty ? 409 : 200, data: [] };
      if (method === 'GET' && path.endsWith('/pages')) return { status: pages ? 200 : 404 };
      if (method === 'POST' && path.endsWith('/pages')) { pages = true; return { status: 201 }; }
      if (path.endsWith('/deployment-branch-policies') && method === 'GET') return { status: 200, data: { branch_policies: [] } };
      if (path.endsWith('/branches/dev')) return { status: 200, data: { commit: { sha: SHA } } };
      if (path.endsWith('/dispatches')) return { status: 204 };
      if (method === 'PUT' && path.endsWith('/pages') && body?.https_enforced) { calls.push('enforce'); return { status: 204 }; }
      return { status: 200, data: {} };
    },
    async seed({ values }) { calls.push(`seed ${values.__SITE_DOMAIN__}`); empty = false; return { commit: SHA }; },
    dns: { async upsertCname(n, t) { calls.push(`dns ${n} ${t}`); } },
    async publicCname() { return 'agenticcells.github.io'; },
    async fetchJson() { return served ? { version: 'v0.1.0', commit: SHA } : null; },
  };
  return io;
}
const byName = (r) => Object.fromEntries(r.steps.map((s) => [s.name, s.result]));
let fails = 0;
const expect = (label, cond) => { if (!cond) { fails++; console.log(`real: ${label}`); } };

// 1. A new site: every step runs, in order, and it ends live.
{
  const io = fakeIo();
  const r = await runReal('2026-11-16__qa-1', site, io, { httpsTries: 2 });
  const s = byName(r);
  expect('new site is live', r.state === 'live');
  expect('repo, seed, settings, dns, domain, deploy, https ok', ['repo', 'seed', 'settings', 'dns', 'domain', 'deploy', 'https'].every((k) => s[k] === 'ok'));
  expect('vault and first-pass skipped', s.vault === 'skipped' && s['first-pass'] === 'skipped');
  expect('creates the repository', io.calls.includes('POST /orgs/AgentiCCells/repos'));
  expect('CNAME to agenticcells.github.io', io.calls.includes('dns qa-1.agenticcells.site agenticcells.github.io'));
  expect('dns before the custom domain', io.calls.indexOf('dns qa-1.agenticcells.site agenticcells.github.io') < io.calls.lastIndexOf(`PUT /repos/${site.repo.owner}/${site.repo.name}/pages`));
  expect('all eleven steps recorded', r.steps.length === 11);
  expect('collaborators skipped when none requested', s.collaborators === 'skipped');
  expect('Enforce HTTPS turned on after https passes', io.calls.includes('enforce') && /Enforce HTTPS turned on/.test(r.steps.find((x) => x.name === 'https').detail));
}
// 2. An existing repository with commits is adopted, never seeded over.
{
  const io = fakeIo({ exists: true, empty: false });
  const r = await runReal('x', site, io, { httpsTries: 1 });
  const s = byName(r);
  expect('adopted, not created', !io.calls.includes('POST /orgs/AgentiCCells/repos') && s.repo === 'ok');
  expect('not seeded', s.seed === 'skipped' && !io.calls.some((c) => c.startsWith('seed')));
  expect('adopted site still deploys', s.deploy === 'ok' && r.state === 'live');
}
// 3. A failed step stops the rest.
{
  const io = fakeIo({ fail: { 'POST /orgs/AgentiCCells/repos': 403 } });
  const r = await runReal('x', site, io, { httpsTries: 1 });
  const s = byName(r);
  expect('repo failure fails the request', r.state === 'failed' && s.repo === 'failed');
  expect('later steps skipped', ['seed', 'settings', 'dns', 'domain', 'deploy', 'https'].every((k) => s[k] === 'skipped'));
  expect('no DNS change after a failure', !io.calls.some((c) => c.startsWith('dns')));
}
// 4. Not served yet: applying, then a recheck makes it live.
{
  const io = fakeIo({ served: false });
  const r = await runReal('x', site, io, { httpsTries: 2 });
  expect('pending https leaves it applying', r.state === 'applying' && byName(r).https === 'pending');
  const io2 = fakeIo({ exists: true, empty: false });
  const r2 = await recheck(site, io2, { steps: r.steps }, { httpsTries: 1 });
  expect('recheck makes it live', r2.state === 'live' && byName(r2).https === 'ok');
  expect('recheck only reads Pages and enforces HTTPS', io2.calls.every((c) => c.endsWith('/pages') || c === 'enforce'));
  expect('pending https does not enforce', !io.calls.includes('enforce'));
}
// 4b. First pass: pending only after a fresh seed; never on an adopted repository.
{
  const fp = { ...site, first_pass: { enabled: true } };
  const r0 = await runReal('x', fp, fakeIo(), { httpsTries: 1 });
  expect('first pass switched off by default', byName(r0)['first-pass'] === 'skipped' && /switched off/.test(r0.steps.find((x) => x.name === 'first-pass').detail));
  const r = await runReal('x', fp, fakeIo(), { httpsTries: 1, firstPassOn: true });
  expect('first pass pending after a fresh seed', byName(r)['first-pass'] === 'pending' && r.state === 'live');
  const r2 = await runReal('x', fp, fakeIo({ exists: true, empty: false }), { httpsTries: 1, firstPassOn: true });
  expect('first pass skipped on an adopted repository', byName(r2)['first-pass'] === 'skipped');
  const r3 = await runReal('x', fp, fakeIo({ fail: { 'POST /orgs/AgentiCCells/repos': 403 } }), { httpsTries: 1 });
  expect('first pass skipped after a failure', byName(r3)['first-pass'] === 'skipped');
}
// 5. Apex domains are refused by the dns step.
{
  const r = await runReal('x', { ...site, domain: 'agenticcells.site' }, fakeIo(), { httpsTries: 1 });
  expect('apex dns fails when nothing points at Pages', byName(r).dns === 'failed');
  const io = fakeIo(); io.publicA = async () => ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];
  const r2 = await runReal('x', { ...site, domain: 'agenticcells.site' }, io, { httpsTries: 1 });
  expect('apex already on Pages is adopted, not written', byName(r2).dns === 'ok' && !io.calls.some((c) => c.startsWith('dns ')));
  const io3 = fakeIo(); io3.publicA = async () => ['185.199.108.153', '1.2.3.4'];
  expect('apex partly elsewhere fails', byName(await runReal('x', { ...site, domain: 'agenticcells.site' }, io3, { httpsTries: 1 })).dns === 'failed');
}
// 6. Placeholders are escaped for each file type.
{
  const d = mkdtempSync(join(tmpdir(), 'ph-'));
  writeFileSync(join(d, 'a.html'), '<p>__SITE_DESCRIPTION__</p>');
  writeFileSync(join(d, 'h.json'), '{"x":"__SITE_DESCRIPTION__"}');
  fillPlaceholders(d, { __SITE_DESCRIPTION__: site.description });
  expect('html escaped', readFileSync(join(d, 'a.html'), 'utf8') === '<p>A test &lt;site&gt; &amp; &quot;more&quot;</p>');
  expect('json escaped', JSON.parse(readFileSync(join(d, 'h.json'), 'utf8')).x === site.description);
  rmSync(d, { recursive: true, force: true });
}
// 7. Collaborators: invited with push; 204 means already there; a bad login fails the request but nothing else.
{
  const io = fakeIo({ fail: { '/collaborators/no-such-user': 404 } });
  const orig = io.gh.bind(io);
  io.gh = async (m, p, b) => { if (p.endsWith('/collaborators/already-there')) { io.calls.push(`${m} ${p}`); return { status: 204 }; } if (p.includes('/collaborators/') && !p.endsWith('no-such-user')) { io.calls.push(`${m} ${p} ${b?.permission}`); return { status: 201 }; } return orig(m, p, b); };
  const r = await runReal('x', { ...site, collaborators: ['riskmandate-agent', 'already-there'] }, io, { httpsTries: 1 });
  const c = r.steps.find((x) => x.name === 'collaborators');
  expect('collaborators ok', c.result === 'ok' && r.state === 'live');
  expect('invited with push', io.calls.includes(`PUT /repos/${site.repo.owner}/${site.repo.name}/collaborators/riskmandate-agent push`));
  expect('already-there reported', /already-there already a collaborator/.test(c.detail));
  expect('collaborators after https', r.steps.findIndex((x) => x.name === 'collaborators') > r.steps.findIndex((x) => x.name === 'https'));
  const r2 = await runReal('x', { ...site, collaborators: ['no-such-user'] }, fakeIo({ fail: { '/collaborators/no-such-user': 404 } }), { httpsTries: 1 });
  expect('bad login fails the request', r2.state === 'failed' && byName(r2).collaborators === 'failed' && byName(r2).https === 'ok');
  const r3 = await runReal('x', { ...site, collaborators: ['a'] }, fakeIo({ fail: { 'POST /orgs/AgentiCCells/repos': 403 } }), { httpsTries: 1 });
  expect('no invitation after an earlier failure', byName(r3).collaborators === 'skipped');
}
// 8. A PrompTugal site: CNAME to promptugal.github.io, repository in the PrompTugal organisation.
{
  const pt = { ...site, domain: 'data.promptugal.news', repo: { owner: 'PrompTugal', name: 'PrompTugal__Data' } };
  const io = fakeIo();
  io.gh = ((orig) => async (m, p, b) => (m === 'GET' && p === '/repos/PrompTugal/PrompTugal__Data') ? (io.calls.push(`${m} ${p}`), { status: 404 }) : orig(m, p, b))(io.gh.bind(io));
  io.publicCname = async () => 'promptugal.github.io';
  const r = await runReal('x', pt, io, { httpsTries: 1 });
  expect('PrompTugal repository created in its organisation', io.calls.includes('POST /orgs/PrompTugal/repos'));
  expect('CNAME to promptugal.github.io', io.calls.includes('dns data.promptugal.news promptugal.github.io') && byName(r).dns === 'ok');
}
// 9. Tokens per owner, and the zone ID from FACTORY_ROUTE53_ZONES or the old variable.
{
  expect('PrompTugal token', tokenFor('PrompTugal', { GH_TOKEN: 'a', GH_TOKEN_PROMPTUGAL: 'b' }) === 'b');
  expect('AgentiCCells token', tokenFor('AgentiCCells', { GH_TOKEN: 'a' }) === 'a');
  expect('no token for an owner without one', tokenFor('Other', { GH_TOKEN: 'a' }) === null);
  let threw = false; try { realIo({ GH_TOKEN: 'a' }, 'PrompTugal'); } catch { threw = true; }
  expect('realIo refuses an owner without a token', threw);
  const io = realIo({ GH_TOKEN: 'a', FACTORY_ROUTE53_ZONE_ID: 'ZOLD', FACTORY_ROUTE53_ZONES: '{"promptugal.news":"ZPT"}' });
  expect('zone from the map', io.dns.zoneId('data.promptugal.news') === 'ZPT');
  expect('agenticcells.site from the old variable', io.dns.zoneId('x.agenticcells.site') === 'ZOLD');
  let out = false; try { io.dns.zoneId('x.example.com'); } catch { out = true; }
  expect('a foreign domain has no zone', out);
}
export default fails;
