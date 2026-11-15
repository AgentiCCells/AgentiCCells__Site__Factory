// Apply, dry run only (FAC-003). Writes requests/<folder>/status.json for every
// request whose status is missing or older than its site.json. Creates nothing.
// Usage: node build/apply.mjs --dry-run      (the flag is required; there is no real mode yet)
// Prints the folders it wrote, one per line, then OK.
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkRequest, listRequests, STEPS } from './validate.mjs';

if (!process.argv.includes('--dry-run')) {
  console.log('Only --dry-run exists. Real steps arrive one credential at a time (FAC-005).');
  process.exit(2);
}
const git = (...a) => execFileSync('git', a).toString().trim();
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
let wrote = 0;
for (const f of listRequests()) {
  if (basename(f) === 'EXAMPLE') continue;
  const commit = git('log', '-1', '--format=%H', '--', join(f, 'site.json'), join(f, 'brief.md'));
  if (!commit) continue; // not committed yet
  const stPath = join(f, 'status.json');
  if (existsSync(stPath)) {
    try { if (JSON.parse(readFileSync(stPath, 'utf8')).commit === commit) continue; } catch { /* rewrite a broken status */ }
  }
  const errs = checkRequest(f);
  const t = now();
  const steps = errs.length
    ? [{ name: 'validate', result: 'failed', detail: `${errs.length} problem(s); run node build/validate.mjs`, time: t }]
    : STEPS.map((name) => ({ name, result: name === 'validate' ? 'ok' : 'dry-run', detail: name === 'validate' ? 'request is valid' : 'not performed: dry run', time: t }));
  const status = { request: basename(f), state: errs.length ? 'failed' : 'planned', mode: 'dry-run', updated: t, commit, steps };
  writeFileSync(stPath, JSON.stringify(status, null, 2) + '\n');
  console.log(f);
  wrote++;
}
console.log(`OK (${wrote} status files written)`);
