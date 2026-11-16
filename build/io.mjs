// The real outside world for build/real.mjs. Used only by the apply workflow's
// real job, inside the protected `apply` environment.
// Needs: GH_TOKEN (the App's installation token, about an hour), and for DNS the
// AWS credentials set by OIDC plus FACTORY_ROUTE53_ZONE_ID. Never prints a secret.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const htmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonEsc = (s) => JSON.stringify(String(s)).slice(1, -1);
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? (f === '.git' || f === '.sg_vault' ? [] : walk(p)) : [p]; });

// Replace the template placeholders, escaped for each file type. Exported for the tests.
export function fillPlaceholders(dir, values) {
  for (const f of walk(dir)) {
    if (!/\.(html|json|md|txt|css|js)$/.test(f)) continue;
    let s = readFileSync(f, 'utf8');
    if (!s.includes('__SITE_')) continue;
    const esc = f.endsWith('.json') ? jsonEsc : f.endsWith('.html') ? htmlEsc : String;
    for (const [k, v] of Object.entries(values)) s = s.split(k).join(esc(v));
    writeFileSync(f, s);
  }
}

export function siteReadme(values, request) {
  return `# ${values.__SITE_NAME__}\n\n${values.__SITE_DESCRIPTION__}\n\n- Live at https://${values.__SITE_DOMAIN__} (version at /version.json).\n- Made by the AgentiCCells site factory from request \`requests/${request}/\` in AgentiCCells__Site__Factory, seeded from AgentiCCells__Site__Template.\n- Release: \`scripts/release.sh\` (build, validate, leak scan, then push to dev; CI deploys and tags v0.1.N).\n\nLicences: code Apache-2.0; text CC BY 4.0.\n`;
}

export function realIo(env = process.env) {
  const token = env.GH_TOKEN;
  if (!token) throw new Error('GH_TOKEN is not set: the GitHub App token step did not run');
  const auth = 'AUTHORIZATION: basic ' + Buffer.from(`x-access-token:${token}`).toString('base64');
  // Child processes (git, the site's gates) get no credentials. git's own GIT_CONFIG_* settings are kept.
  const cleanEnv = Object.fromEntries(Object.entries(env).filter(([k]) => /^GIT_CONFIG_/.test(k) || !/TOKEN|SECRET|KEY|AWS_|ACTIONS_ID_TOKEN/i.test(k)));
  // Test only: FACTORY_PUSH_BASE points pushes at a local directory instead of github.com.
  const pushBase = env.FACTORY_PUSH_BASE || 'https://github.com';
  const git = (cwd, ...a) => execFileSync('git', a, { cwd, env: cleanEnv, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

  return {
    now: () => new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    async gh(method, path, body) {
      const res = await fetch(`https://api.github.com${path}`, {
        method,
        headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'agenticcells-site-factory' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await res.text();
      let data = null; try { data = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
      return { status: res.status, data };
    },
    async fetchJson(url) {
      try {
        const res = await fetch(`${url}?t=${Date.now()}`, { headers: { 'user-agent': 'agenticcells-site-factory' }, signal: AbortSignal.timeout(10000) });
        return res.ok ? await res.json() : null;
      } catch { return null; }
    },
    async seed({ template, repo, values, request }) {
      const dir = mkdtempSync(join(tmpdir(), 'seed-'));
      try {
        const src = join(dir, 'site');
        execFileSync('git', ['clone', '-q', '--depth', '1', '--branch', template.ref ?? 'dev', `https://github.com/${template.owner}/${template.name}`, src], { env: cleanEnv });
        rmSync(join(src, '.git'), { recursive: true, force: true });
        rmSync(join(src, '.factory-template'), { force: true });
        fillPlaceholders(src, values);
        writeFileSync(join(src, 'README.md'), siteReadme(values, request));
        writeFileSync(join(src, 'REALITY.md'), `# REALITY.md: what exists now\n\n- Seeded by the AgentiCCells site factory on ${new Date().toISOString().slice(0, 10)} from ${template.owner}/${template.name}@${template.ref ?? 'dev'}.\n- Its live state is recorded in requests/${request}/status.json in AgentiCCells__Site__Factory.\n`);
        git(src, 'init', '-q', '-b', 'dev');
        git(src, 'add', '-A');
        git(src, '-c', 'user.name=factory-apply', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
          'commit', '-q', '-m', `Seed from ${template.name} (factory request ${request})`, '-m', 'Agent: factory-apply@AgentiCCells.dinis');
        // The site's own gates must pass before anything is pushed.
        for (const s of ['scripts/build.mjs', 'scripts/validate.mjs', 'scripts/leak-scan.mjs']) {
          if (existsSync(join(src, s))) execFileSync('node', [s], { cwd: src, env: cleanEnv, stdio: ['ignore', 'pipe', 'pipe'] });
        }
        git(src, '-c', `http.https://github.com/.extraheader=${auth}`, 'push', '-q', `${pushBase}/${repo.owner}/${repo.name}`, 'HEAD:refs/heads/dev');
        return { commit: git(src, 'rev-parse', 'HEAD') };
      } finally { rmSync(dir, { recursive: true, force: true }); }
    },
    dns: {
      async upsertCname(name, target) {
        const zone = env.FACTORY_ROUTE53_ZONE_ID;
        if (!zone) throw new Error('FACTORY_ROUTE53_ZONE_ID is not set: the AWS role is not set up yet');
        const batch = { Comment: `site factory: ${name}`, Changes: [{ Action: 'UPSERT', ResourceRecordSet: { Name: name, Type: 'CNAME', TTL: 300, ResourceRecords: [{ Value: target }] } }] };
        execFileSync('aws', ['route53', 'change-resource-record-sets', '--hosted-zone-id', zone, '--change-batch', JSON.stringify(batch)], { stdio: ['ignore', 'pipe', 'pipe'] });
      },
    },
  };
}
