// Tests for build/check-signatures.mjs in a throwaway repository, with a throwaway key. No network.
// Skipped (counted as passed) where openssl or ssh-keygen is missing.
import { checkSignatures, SELF } from '../build/check-signatures.mjs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

let fails = 0;
const expect = (label, cond) => { if (!cond) { fails++; console.log(`check-signatures: ${label}`); } };
const has = (cmd, args) => { try { execFileSync(cmd, args, { stdio: 'ignore' }); return true; } catch { return false; } };
if (has("openssl", ["version"]) && has("which", ["ssh-keygen"])) {
  const d = mkdtempSync(join(tmpdir(), 'sigtest-'));
  const repo = join(d, 'r'); mkdirSync(repo);
  const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: repo, encoding: 'utf8', ...opts }).trim();
  const key = join(d, 'k.pem'), pub = join(d, 'k.pub.pem');
  run('openssl', ['ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', key]);
  run('openssl', ['pkey', '-in', key, '-pubout', '-out', pub]);
  execFileSync('chmod', ['600', key]);
  writeFileSync(`${key}.pub`, run('ssh-keygen', ['-y', '-f', key]) + '\n');
  const SESSION = 'https://claude.ai/code/session_test';
  run('git', ['init', '-q', '-b', 'dev']);
  for (const [k, v] of [['user.name', 'tester'], ['user.email', 't@example.invalid'], ['gpg.format', 'ssh'], ['gpg.ssh.program', 'ssh-keygen'], ['user.signingkey', key]]) run('git', ['config', k, v]);
  const commit = (msg, { sign = true, file = 'a.txt', env = {} } = {}) => {
    writeFileSync(join(repo, file), String(Math.random()));
    run('git', ['add', '-A']);
    run('git', ['commit', '-q', sign ? '-S' : '--no-gpg-sign', '-m', msg], { env: { ...process.env, ...env } });
    return run('git', ['rev-parse', 'HEAD']);
  };
  const old = commit('before the check', { sign: false });
  mkdirSync(join(repo, 'build')); mkdirSync(join(repo, 'team'));
  copyFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', SELF), join(repo, SELF));
  writeFileSync(join(repo, 'team/keys.json'), JSON.stringify({ keys: [{ agent: 'tester@AgentiCCells.dinis', session: SESSION, status: 'active', bundle: { sign: readFileSync(pub, 'utf8') } }] }));
  const trailers = `\n\nAgent: tester@AgentiCCells.dinis\nClaude-Session: ${SESSION}`;
  commit(`add the check${trailers}`, { file: 'b.txt' });
  const good = checkSignatures({ cwd: repo, before: old });
  expect('signed commit with the right trailers passes', good.errors.length === 0 && good.checked === 1);
  const unsigned = commit(`unsigned${trailers}`, { sign: false });
  expect('unsigned commit fails', checkSignatures({ cwd: repo, before: old }).errors.some((e) => e.startsWith(unsigned.slice(0, 7))));
  run('git', ['reset', '-q', '--hard', 'HEAD~1']);
  commit('wrong session\n\nAgent: tester@AgentiCCells.dinis\nClaude-Session: https://claude.ai/code/session_other');
  expect('wrong session fails', checkSignatures({ cwd: repo, before: old }).errors.some((e) => /Claude-Session/.test(e)));
  run('git', ['reset', '-q', '--hard', 'HEAD~1']);
  commit('wrong agent\n\nAgent: someone@AgentiCCells.dinis\nClaude-Session: ' + SESSION);
  expect('wrong agent fails', checkSignatures({ cwd: repo, before: old }).errors.some((e) => /Agent:/.test(e)));
  run('git', ['reset', '-q', '--hard', 'HEAD~1']);
  commit('Write back request status (real)', { sign: false, env: { GIT_COMMITTER_NAME: 'factory-apply' } });
  const ci = checkSignatures({ cwd: repo, before: old });
  expect('factory workflow commit is exempt', ci.errors.length === 0 && ci.exempt === 1);
  expect('commits before the check are not checked', checkSignatures({ cwd: repo }).errors.length === 0);
  rmSync(d, { recursive: true, force: true });
}
export default fails;
