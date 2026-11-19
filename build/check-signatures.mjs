// Every commit is signed by its agent's own published key and names its session.
// Dinis Cruz, 18 November 2026 ~23:55 UTC (in cyber.b@PrompTugal.dinis's session), confirmed for every
// agent ~01:10 UTC 19 November (PrompTugal__News__Website board/guidance/2026-11-19-signed-commits-paid-search-and-free-embeds.md,
// section 2): "every single agent that runs in here should have published its public key on the repo that it maintains
// ... every then commit is signed by that key ... you should also include the session ID".
// Pattern: cyber.b@'s scripts/check-signatures.mjs in PrompTugal__News__Cyber (commit c8fff24, Apache-2.0, same team).
//
// Usage: node build/check-signatures.mjs <before> <after>   the range to check (run by plan.yml on pull requests)
// For each non-merge commit in before..after that descends from the commit that added this file:
//   1. it carries a git SSH signature that verifies against a key in team/keys.json (status not "superseded");
//   2. the key's agent is the commit's one Agent: trailer;
//   3. its one Claude-Session: trailer is the session recorded with that key.
// Exempt: commits made by the factory's own workflows (committer factory-apply or factory-first-pass), which only
// write requests/*/status.json or a site's first pass. Merge commits are skipped (GitHub makes them).
// The OpenSSH form of each key is derived from its published PEM (bundle.sign) with ssh-keygen; nothing else is trusted.
// Needs git 2.34+ and ssh-keygen. Prints OK or each failing commit and exits 1. History is never rewritten.
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const SELF = 'build/check-signatures.mjs';
export const CI_COMMITTERS = ['factory-apply', 'factory-first-pass'];
const AGENT = /^[a-z0-9]+(?:[.-][a-z0-9]+)*@[a-z0-9.-]+$/i;
const lines = (s) => (s ? s.split('\n').map((x) => x.trim()).filter(Boolean) : []);

export function checkSignatures({ cwd = process.cwd(), before, after = 'HEAD' } = {}) {
  const git = (...a) => execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();
  const tryGit = (...a) => { try { return git(...a); } catch { return null; } };
  const first = lines(git('log', '--format=%H', '--diff-filter=A', '--reverse', after, '--', SELF))[0];
  if (!first) return { errors: [`cannot find the commit that added ${SELF}`], checked: 0, skipped: 0 };
  const from = before && !/^0+$/.test(before) && tryGit('rev-parse', '--verify', '--quiet', `${before}^{commit}`);
  const range = lines(git('rev-list', '--no-merges', ...(from ? [`${from}..${after}`] : [after])));
  const inScope = new Set([first, ...lines(git('rev-list', '--ancestry-path', `${first}..${after}`))]);

  const dir = mkdtempSync(join(tmpdir(), 'sigcheck-'));
  try {
    const doc = JSON.parse(git('show', `${after}:team/keys.json`));
    const keys = Array.isArray(doc) ? doc : doc.keys || [];
    const signers = [], sessionOf = new Map();
    for (const k of keys) {
      const agent = k.agent, pemText = k.bundle?.sign ?? k.public_key?.sign;
      if (!agent || !AGENT.test(agent) || !pemText || k.status === 'superseded') continue;
      const pem = join(dir, `${signers.length}.pem`); writeFileSync(pem, pemText);
      const ssh = execFileSync('ssh-keygen', ['-i', '-m', 'PKCS8', '-f', pem], { encoding: 'utf8' }).trim().split(' ').slice(0, 2).join(' ');
      signers.push(`${agent} namespaces="git" ${ssh}`);
      if (!sessionOf.has(agent)) sessionOf.set(agent, new Set());
      if (k.session) sessionOf.get(agent).add(k.session);
    }
    const allowed = join(dir, 'allowed_signers'); writeFileSync(allowed, signers.join('\n') + '\n');

    const errors = []; let checked = 0, exempt = 0;
    for (const c of range) {
      if (!inScope.has(c)) continue;
      const subject = git('log', '-1', '--format=%s', c);
      if (CI_COMMITTERS.includes(git('log', '-1', '--format=%cn', c))) { exempt++; continue; }
      checked++;
      const agents = lines(git('log', '-1', '--format=%(trailers:key=Agent,valueonly)', c));
      const sessions = lines(git('log', '-1', '--format=%(trailers:key=Claude-Session,valueonly)', c));
      const v = spawnSync('git', ['-c', 'gpg.format=ssh', '-c', 'gpg.ssh.program=ssh-keygen', '-c', `gpg.ssh.allowedSignersFile=${allowed}`, 'verify-commit', c], { cwd, encoding: 'utf8' });
      if (v.status !== 0) { errors.push(`${c.slice(0, 7)} ${subject}: no valid signature by a key in team/keys.json`); continue; }
      const principal = (`${v.stdout}\n${v.stderr}`.match(/Good "git" signature for (\S+)/) || [])[1];
      if (!principal || agents.length !== 1 || agents[0] !== principal) { errors.push(`${c.slice(0, 7)} ${subject}: signed by ${principal || 'unknown'}, Agent: ${agents.join(', ') || 'none'}`); continue; }
      if (sessions.length !== 1 || !(sessionOf.get(principal) || new Set()).has(sessions[0])) errors.push(`${c.slice(0, 7)} ${subject}: Claude-Session: missing or not the session published with ${principal}'s key`);
    }
    return { errors, checked, skipped: range.length - checked - exempt, exempt };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [before, after] = process.argv.slice(2);
  const r = checkSignatures({ before, after: after || 'HEAD' });
  if (r.errors.length) { console.error(r.errors.join('\n')); console.error(`FAILED (${r.errors.length} of ${r.checked} commits checked)`); process.exit(1); }
  console.log(`OK (${r.checked} signed commits checked, ${r.exempt ?? 0} factory workflow commits exempt, ${r.skipped} older than the check skipped)`);
}
