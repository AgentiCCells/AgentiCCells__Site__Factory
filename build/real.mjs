// The real apply steps (FAC-005). Each step returns { result, detail } and never
// prints a secret. Everything that touches the outside world comes in through
// `io`, so the tests can run the same code with fakes:
//   io.gh(method, path, body)  -> { status, data }   GitHub REST, with the App token
//   io.seed({ template, repo, values })  -> { commit }  push the seeded template to dev
//   io.dns.upsertCname(name, target)     -> void        Route 53, through the OIDC role
//   io.fetchJson(url)                   -> object|null  a public GET, no credentials
//   io.sleep(ms), io.now()
// Order: validate, repo, seed, settings, dns, domain, vault, deploy, https, collaborators, first-pass.

import { FIRST_PASS_ON } from './validate.mjs';
const pagesHost = (owner) => `${owner.toLowerCase()}.github.io`;
// GitHub Pages' apex addresses (docs.github.com, "Managing a custom domain for your GitHub Pages site").
export const PAGES_IPS = ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];

// Once GitHub has issued the certificate, turn on Enforce HTTPS (http redirects to https).
// GitHub refuses it before the certificate exists, so this is tried after the https check passes.
export async function enforceHttps(full, io) {
  const p = await io.gh('GET', `/repos/${full}/pages`);
  if (p.status !== 200) return `Enforce HTTPS not set: reading Pages returned ${p.status}`;
  if (p.data?.https_enforced) return 'Enforce HTTPS already on';
  const r = await io.gh('PUT', `/repos/${full}/pages`, { https_enforced: true });
  return r.status >= 200 && r.status < 300 ? 'Enforce HTTPS turned on' : `Enforce HTTPS not set yet (GitHub returned ${r.status}); the next run tries again`;
}

export async function runReal(name, site, io, opts = {}) {
  const { httpsTries = 40, httpsWaitMs = 15000 } = opts;
  const { owner, name: repo } = site.repo;
  const full = `${owner}/${repo}`;
  const t = site.template ?? { owner: 'AgentiCCells', name: 'AgentiCCells__Site__Template', ref: 'dev' };
  const steps = [];
  let stop = false;
  let seeded = null;
  const step = async (stepName, fn) => {
    if (stop) { steps.push({ name: stepName, result: 'skipped', detail: 'an earlier step failed', time: io.now() }); return; }
    let r;
    try { r = await fn(); } catch (e) { r = { result: 'failed', detail: `error: ${String(e.message || e).slice(0, 200)}` }; }
    if (r.result === 'failed') stop = true;
    steps.push({ name: stepName, ...r, time: io.now() });
  };
  const ok = (status) => status >= 200 && status < 300;

  steps.push({ name: 'validate', result: 'ok', detail: 'request is valid', time: io.now() });

  let created = false;
  await step('repo', async () => {
    const got = await io.gh('GET', `/repos/${full}`);
    if (got.status === 200) return { result: 'ok', detail: `adopted existing repository ${full}` };
    if (got.status !== 404) return { result: 'failed', detail: `reading ${full} returned ${got.status}` };
    const made = await io.gh('POST', `/orgs/${owner}/repos`, {
      name: repo, visibility: site.visibility ?? 'public', description: site.description ?? site.name,
      has_wiki: false, has_projects: false, auto_init: false,
    });
    if (made.status !== 201) return { result: 'failed', detail: `creating ${full} returned ${made.status}` };
    created = true;
    return { result: 'ok', detail: `created ${full}` };
  });

  await step('seed', async () => {
    const commits = await io.gh('GET', `/repos/${full}/commits?per_page=1`);
    // 409: the repository is empty. Only an empty repository is seeded; nothing is ever overwritten.
    if (commits.status !== 409) return { result: 'skipped', detail: created ? 'repository not empty after creation' : 'repository already has commits; not seeded' };
    const values = {
      __SITE_NAME__: site.name,
      __SITE_DESCRIPTION__: site.description ?? site.name,
      __SITE_REPO__: full,
      __SITE_DOMAIN__: site.domain,
    };
    const { commit } = await io.seed({ template: t, repo: { owner, name: repo }, values, request: name });
    seeded = commit;
    return { result: 'ok', detail: `seeded from ${t.owner}/${t.name}@${t.ref ?? 'dev'} as ${commit.slice(0, 7)} on dev` };
  });

  await step('settings', async () => {
    const r1 = await io.gh('PATCH', `/repos/${full}`, { default_branch: 'dev' });
    if (!ok(r1.status)) return { result: 'failed', detail: `default branch returned ${r1.status}` };
    const pages = await io.gh('GET', `/repos/${full}/pages`);
    const r2 = pages.status === 404
      ? await io.gh('POST', `/repos/${full}/pages`, { build_type: 'workflow' })
      : await io.gh('PUT', `/repos/${full}/pages`, { build_type: 'workflow' });
    if (!ok(r2.status)) return { result: 'failed', detail: `Pages source returned ${r2.status}` };
    const r3 = await io.gh('PUT', `/repos/${full}/environments/github-pages`, { deployment_branch_policy: { protected_branches: false, custom_branch_policies: true } });
    if (!ok(r3.status)) return { result: 'failed', detail: `github-pages environment returned ${r3.status}` };
    const pol = await io.gh('GET', `/repos/${full}/environments/github-pages/deployment-branch-policies`);
    const has = (pol.data?.branch_policies ?? []).some((b) => b.name === 'dev');
    if (!has) {
      const r4 = await io.gh('POST', `/repos/${full}/environments/github-pages/deployment-branch-policies`, { name: 'dev', type: 'branch' });
      if (!ok(r4.status)) return { result: 'failed', detail: `dev deploy rule returned ${r4.status}` };
    }
    return { result: 'ok', detail: 'default branch dev; Pages from GitHub Actions; dev may deploy' };
  });

  await step('dns', async () => {
    const labels = site.domain.split('.');
    if (labels.length < 3) {
      // An apex is never written by the factory (the AWS role may not touch it). If a person has
      // already pointed it at GitHub Pages, adopt it as it is; otherwise stop and say why.
      const a = (await io.publicA?.(site.domain)) ?? [];
      if (a.length && a.every((ip) => PAGES_IPS.includes(ip))) return { result: 'ok', detail: `apex ${site.domain} already points at GitHub Pages (${a.length} A records, set by a person); not changed` };
      return { result: 'failed', detail: `apex ${site.domain} does not point at GitHub Pages (A records: ${a.join(', ') || 'none'}); a person sets the apex, the factory does not` };
    }
    await io.dns.upsertCname(site.domain, pagesHost(owner));
    // Wait until public DNS answers, so that GitHub's own DNS check (made the moment the
    // custom domain is set) does not see "no such name" and stop (seen on QA-1, 2026-11-16).
    for (let i = 0; i < (opts.dnsTries ?? 18); i++) {
      if (await io.publicCname(site.domain) === pagesHost(owner)) return { result: 'ok', detail: `CNAME ${site.domain} -> ${pagesHost(owner)}, visible in public DNS` };
      await io.sleep(opts.dnsWaitMs ?? 10000);
    }
    return { result: 'ok', detail: `CNAME ${site.domain} -> ${pagesHost(owner)} written, but not yet visible in public DNS; GitHub's domain check may need a re-check (run the Check sites workflow)` };
  });

  await step('domain', async () => {
    const r = await io.gh('PUT', `/repos/${full}/pages`, { cname: site.domain });
    if (!ok(r.status)) return { result: 'failed', detail: `custom domain returned ${r.status}` };
    return { result: 'ok', detail: `custom domain ${site.domain}` };
  });

  await step('vault', async () => site.vault?.create
    ? { result: 'skipped', detail: 'requested, but the vault step needs the sgit credential (not set up yet)' }
    : { result: 'skipped', detail: 'not requested' });

  let head = seeded;
  await step('deploy', async () => {
    if (!head) {
      const b = await io.gh('GET', `/repos/${full}/branches/dev`);
      if (b.status !== 200) return { result: 'failed', detail: `reading dev returned ${b.status}` };
      head = b.data.commit.sha;
    }
    const r = await io.gh('POST', `/repos/${full}/actions/workflows/pages.yml/dispatches`, { ref: 'dev' });
    if (!ok(r.status)) return { result: 'failed', detail: `starting pages.yml returned ${r.status}` };
    return { result: 'ok', detail: `started pages.yml on dev at ${head.slice(0, 7)}` };
  });

  await step('https', async () => {
    const url = `https://${site.domain}/version.json`;
    for (let i = 0; i < httpsTries; i++) {
      const v = await io.fetchJson(url);
      if (v && v.commit === head) return { result: 'ok', detail: `${url} serves ${v.version} at ${head.slice(0, 7)}; ${await enforceHttps(full, io)}` };
      await io.sleep(httpsWaitMs);
    }
    return { result: 'pending', detail: `${url} did not serve ${head.slice(0, 7)} yet; the next run checks again` };
  });

  // Invite the requested GitHub accounts with write (push) access. Runs last among the
  // site steps, so a wrong login never holds the site back; it does mark the request failed.
  // GitHub answers 201 (invitation sent) or 204 (already a collaborator).
  await step('collaborators', async () => {
    const logins = site.collaborators ?? [];
    if (!logins.length) return { result: 'skipped', detail: 'none requested' };
    const done = [], bad = [];
    for (const login of logins) {
      const r = await io.gh('PUT', `/repos/${full}/collaborators/${encodeURIComponent(login)}`, { permission: 'push' });
      if (r.status === 201) done.push(`${login} invited`);
      else if (r.status === 204) done.push(`${login} already a collaborator`);
      else bad.push(`${login} (GitHub returned ${r.status})`);
    }
    return bad.length
      ? { result: 'failed', detail: `write access: ${[...done, `not invited: ${bad.join(', ')}`].join('; ')}` }
      : { result: 'ok', detail: `write access: ${done.join('; ')}; each must accept the invitation` };
  });

  // The first pass runs in separate jobs (first-pass.yml jobs in apply.yml), only on a
  // repository this run seeded: never on an adopted repository that already had content.
  const seedOk = steps.find((s) => s.name === 'seed')?.result === 'ok';
  const fpOn = opts.firstPassOn ?? FIRST_PASS_ON;
  const fp = !site.first_pass?.enabled ? { result: 'skipped', detail: 'not requested' }
    : !fpOn ? { result: 'skipped', detail: 'requested, but the first pass is switched off (Dinis, 2026-11-18); the site\'s conductor session builds the first version' }
    : stop ? { result: 'skipped', detail: 'an earlier step failed' }
    : !seedOk ? { result: 'skipped', detail: 'requested, but this run did not seed the repository; the first pass only runs on a fresh seed' }
    : { result: 'pending', detail: 'queued for the first-pass jobs' };
  steps.push({ name: 'first-pass', ...fp, time: io.now() });

  // The first pass does not hold the site back: the state reflects the site steps only.
  const site_ = steps.filter((s) => s.name !== 'first-pass');
  const state = site_.some((s) => s.result === 'failed') ? 'failed' : site_.some((s) => s.result === 'pending') ? 'applying' : 'live';
  return { state, steps };
}

// A later run for a request left 'applying': only the https check runs again.
export async function recheck(site, io, previous, opts = {}) {
  const steps = previous.steps.filter((s) => !['https', 'collaborators', 'first-pass'].includes(s.name));
  const deploy = previous.steps.find((s) => s.name === 'deploy');
  const head = (deploy?.detail.match(/at ([0-9a-f]{7})/) || [])[1];
  const url = `https://${site.domain}/version.json`;
  let https = { name: 'https', result: 'pending', detail: `${url} did not serve ${head} yet; the next run checks again` };
  for (let i = 0; i < (opts.httpsTries ?? 4); i++) {
    const v = await io.fetchJson(url);
    if (v && head && String(v.commit).startsWith(head)) { https = { name: 'https', result: 'ok', detail: `${url} serves ${v.version} at ${head}; ${await enforceHttps(`${site.repo.owner}/${site.repo.name}`, io)}` }; break; }
    await io.sleep(opts.httpsWaitMs ?? 15000);
  }
  steps.push({ ...https, time: io.now() });
  for (const n of ['collaborators', 'first-pass']) { const p = previous.steps.find((s) => s.name === n); if (p) steps.push(p); }
  const failed = steps.some((s) => s.name !== 'first-pass' && s.result === 'failed');
  return { state: failed ? 'failed' : https.result === 'ok' ? 'live' : 'applying', steps };
}
