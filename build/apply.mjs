// Apply (FAC-003 dry run, FAC-005 real). Writes requests/<folder>/status.json.
// Usage:
//   node build/apply.mjs --dry-run      every request not marked "apply": "real": write a dry-run status
//   node build/apply.mjs --list-real    print the folders a real run would act on (no credentials needed)
//   node build/apply.mjs --real         act for real on those folders (needs an App token per owner; see build/io.mjs)
// A request is handled when its status is missing, older than its site.json or brief.md,
// of the other mode, or (real only) still 'applying'.
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkRequest, listRequests, STEPS } from './validate.mjs';

const git = (...a) => execFileSync('git', a).toString().trim();
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

export function pending(mode, folders = listRequests()) {
  const out = [];
  for (const f of folders) {
    if (basename(f) === 'EXAMPLE') continue;
    const commit = git('log', '-1', '--format=%H', '--', join(f, 'site.json'), join(f, 'brief.md'));
    if (!commit) continue;
    const site = readJson(join(f, 'site.json'));
    const wantsReal = site?.apply === 'real';
    if ((mode === 'real') !== wantsReal) continue;
    const st = readJson(join(f, 'status.json'));
    const fresh = st && st.commit === commit && st.mode === mode;
    if (fresh && !(mode === 'real' && st.state === 'applying')) continue;
    out.push({ folder: f, commit, site, previous: fresh ? st : null });
  }
  return out;
}

const write = (f, status) => { writeFileSync(join(f, 'status.json'), JSON.stringify(status, null, 2) + '\n'); console.log(`${basename(f)}: ${status.state}`); };

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--list-real')) { for (const p of pending('real')) console.log(p.folder); return; }
  if (args.includes('--dry-run')) {
    const todo = pending('dry-run');
    for (const { folder, commit } of todo) {
      const errs = checkRequest(folder);
      const t = now();
      const steps = errs.length
        ? [{ name: 'validate', result: 'failed', detail: `${errs.length} problem(s); run node build/validate.mjs`, time: t }]
        : STEPS.map((name) => ({ name, result: name === 'validate' ? 'ok' : 'dry-run', detail: name === 'validate' ? 'request is valid' : 'not performed: dry run', time: t }));
      write(folder, { request: basename(folder), state: errs.length ? 'failed' : 'planned', mode: 'dry-run', updated: t, commit, steps });
    }
    console.log(`OK (${todo.length} status files written)`);
    return;
  }
  if (args.includes('--real')) {
    const { runReal, recheck } = await import('./real.mjs');
    const { realIo } = await import('./io.mjs');
    const todo = pending('real');
    for (const { folder, commit, site, previous } of todo) {
      const errs = checkRequest(folder);
      let r, io = null;
      if (!errs.length) {
        try { io = realIo(process.env, site.repo.owner); }
        catch (e) { r = { state: 'failed', steps: [{ name: 'validate', result: 'ok', detail: 'request is valid', time: now() }, { name: 'repo', result: 'failed', detail: String(e.message).slice(0, 200), time: now() }] }; }
      }
      if (r) { /* no token for this owner */ }
      else if (errs.length) r = { state: 'failed', steps: [{ name: 'validate', result: 'failed', detail: `${errs.length} problem(s); run node build/validate.mjs`, time: now() }] };
      else if (previous) r = await recheck(site, io, previous);
      else r = await runReal(basename(folder), site, io);
      write(folder, { request: basename(folder), state: r.state, mode: 'real', updated: now(), commit, steps: r.steps });
    }
    console.log(`OK (${todo.length} real requests handled)`);
    return;
  }
  console.log('Usage: node build/apply.mjs --dry-run | --list-real | --real');
  process.exit(2);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
