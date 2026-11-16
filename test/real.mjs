// Tests for build/real.mjs with fake GitHub, DNS and HTTPS. No network.
import { runReal, recheck } from '../build/real.mjs';
import { fillPlaceholders } from '../build/io.mjs';
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
  expect('all ten steps recorded', r.steps.length === 10);
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
// 5. Apex domains are refused by the dns step.
{
  const r = await runReal('x', { ...site, domain: 'agenticcells.site' }, fakeIo(), { httpsTries: 1 });
  expect('apex dns fails', byName(r).dns === 'failed');
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
export default fails;
