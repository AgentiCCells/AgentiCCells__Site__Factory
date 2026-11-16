// Check the factory's GitHub App setup, without acting on anything.
// Run by .github/workflows/check-github-app.yml (manual) in the `apply` environment.
// Needs FACTORY_APP_ID and FACTORY_APP_PRIVATE_KEY. Prints what it finds and what is
// missing; never prints the key or a token. Exit 0 only when everything is right.
import { createSign } from 'node:crypto';

export const REQUIRED = { metadata: 'read', contents: 'write', workflows: 'write', administration: 'write', pages: 'write', actions: 'write' };
const LEVEL = { read: 1, write: 2, admin: 3 };

export function jwt(appId, pem, nowSec = Math.floor(Date.now() / 1000)) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const body = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iat: nowSec - 60, exp: nowSec + 540, iss: String(appId) })}`;
  return `${body}.${createSign('RSA-SHA256').update(body).sign(pem).toString('base64url')}`;
}

export function compare(perms) {
  const problems = [];
  for (const [k, want] of Object.entries(REQUIRED)) {
    const got = perms?.[k];
    if (!got || LEVEL[got] < LEVEL[want]) problems.push(`permission ${k}: needs ${want}, has ${got ?? 'none'}`);
  }
  const extra = Object.keys(perms ?? {}).filter((k) => !(k in REQUIRED));
  return { problems, extra };
}

async function main() {
  const id = process.env.FACTORY_APP_ID, key = process.env.FACTORY_APP_PRIVATE_KEY;
  const lines = [], problems = [];
  if (!id) problems.push('environment variable FACTORY_APP_ID is not set in the apply environment');
  if (!key) problems.push('environment secret FACTORY_APP_PRIVATE_KEY is not set in the apply environment');
  if (key && !/BEGIN (RSA )?PRIVATE KEY/.test(key)) problems.push('FACTORY_APP_PRIVATE_KEY does not look like the whole .pem file (paste every line, including the BEGIN and END lines)');
  if (!problems.length) {
    let token;
    try { token = jwt(id, key); } catch (e) { problems.push(`the private key could not sign (${e.message}); paste the whole .pem file again`); }
    if (token) {
      const h = { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'agenticcells-site-factory' };
      const app = await fetch('https://api.github.com/app', { headers: h });
      if (app.status !== 200) problems.push(`GitHub refused the App ID and key together (HTTP ${app.status}): check FACTORY_APP_ID is the App ID (a number), and that the key belongs to this App`);
      else {
        const a = await app.json();
        lines.push(`App: ${a.slug} (id ${a.id}), owned by ${a.owner?.login}`);
        const inst = await (await fetch('https://api.github.com/app/installations', { headers: h })).json();
        const mine = (Array.isArray(inst) ? inst : []).find((i) => i.account?.login === 'AgentiCCells');
        if (!mine) problems.push('the App is not installed on the AgentiCCells organisation');
        else {
          lines.push(`Installed on AgentiCCells: repository access "${mine.repository_selection}"`);
          if (mine.repository_selection !== 'all') problems.push('repository access must be "All repositories" (option B), so the pipeline can create repositories');
          if (mine.suspended_at) problems.push('the installation is suspended');
          const { problems: p, extra } = compare(mine.permissions);
          problems.push(...p);
          lines.push(`Permissions granted: ${Object.entries(mine.permissions).map(([k, v]) => `${k}=${v}`).join(', ')}`);
          if (extra.length) lines.push(`Not needed (may be removed): ${extra.join(', ')}`);
          if (mine.events?.length) lines.push(`Webhook events subscribed (not needed): ${mine.events.join(', ')}`);
        }
      }
    }
  }
  for (const l of lines) console.log(l);
  if (problems.length) { console.log('\nTo fix:'); for (const p of problems) console.log(`- ${p}`); console.log(`\nFAILED (${problems.length})`); process.exit(1); }
  console.log('\nOK: the GitHub App is set up as docs/github-app.md asks.');
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) await main();
