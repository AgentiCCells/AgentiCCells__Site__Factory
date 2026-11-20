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
  const base = run('git', ['rev-parse', 'HEAD']);
  const reset = () => run('git', ['reset', '-q', '--hard', base]);
  expect('the commit that adds the check is not itself checked', checkSignatures({ trustedBase: base, cwd: repo, before: old }).checked === 0);
  commit(`signed${trailers}`);
  const good = checkSignatures({ trustedBase: base, cwd: repo, before: old });
  expect('signed commit with the right trailers passes', good.errors.length === 0 && good.checked === 1);
  expect('the test repository uses ssh-keygen, not the environment signer', run('git', ['config', 'gpg.ssh.program']) === 'ssh-keygen');
  reset();
  const unsigned = commit(`unsigned${trailers}`, { sign: false });
  expect('unsigned commit fails for want of a signature', checkSignatures({ trustedBase: base, cwd: repo, before: old }).errors.some((e) => e.startsWith(unsigned.slice(0, 7)) && /no valid signature/.test(e)));
  reset();
  commit('wrong session\n\nAgent: tester@AgentiCCells.dinis\nClaude-Session: https://claude.ai/code/session_other');
  expect('wrong session fails', checkSignatures({ trustedBase: base, cwd: repo, before: old }).errors.some((e) => /Claude-Session: missing or not the session/.test(e)));
  reset();
  commit('wrong agent\n\nAgent: someone@AgentiCCells.dinis\nClaude-Session: ' + SESSION);
  expect('wrong agent fails', checkSignatures({ trustedBase: base, cwd: repo, before: old }).errors.some((e) => /signed by tester@AgentiCCells.dinis, Agent: someone@/.test(e)));
  reset();
  commit('Write back request status (real)', { sign: false, env: { GIT_COMMITTER_NAME: 'factory.apply', GIT_AUTHOR_NAME: 'factory.apply' } });
  expect('no exemption by committer name', ((r) => r.errors.length === 1 && /no valid signature/.test(r.errors[0]))(checkSignatures({ trustedBase: base, cwd: repo, before: old })));
  reset();
  // A commit that adds its own key and signs with it must fail: keys come from the parent.
  const key2 = join(d, 'k2.pem'), pub2 = join(d, 'k2.pub.pem');
  run('openssl', ['ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', key2]);
  run('openssl', ['pkey', '-in', key2, '-pubout', '-out', pub2]);
  execFileSync('chmod', ['600', key2]);
  writeFileSync(`${key2}.pub`, run('ssh-keygen', ['-y', '-f', key2]) + '\n');
  const listed = JSON.parse(readFileSync(join(repo, 'team/keys.json'), 'utf8'));
  const withNew = { keys: [...listed.keys, { agent: 'intruder@AgentiCCells.dinis', session: SESSION, status: 'active', bundle: { sign: readFileSync(pub2, 'utf8') } }] };
  writeFileSync(join(repo, 'team/keys.json'), JSON.stringify(withNew));
  run('git', ['config', 'user.signingkey', key2]);
  commit('self-added key\n\nAgent: intruder@AgentiCCells.dinis\nClaude-Session: ' + SESSION, { file: 'c.txt' });
  expect('a commit signed by a key it adds itself fails', ((r) => r.errors.length === 1 && /no valid signature/.test(r.errors[0]) && /self-added key/.test(r.errors[0]))(checkSignatures({ trustedBase: base, cwd: repo, before: old })));
  reset();
  // The same key added by a commit signed with a listed key, then used: passes.
  run('git', ['config', 'user.signingkey', key]);
  writeFileSync(join(repo, 'team/keys.json'), JSON.stringify(withNew));
  commit(`add a key, signed by a listed key${trailers}`, { file: 'c.txt' });
  run('git', ['config', 'user.signingkey', key2]);
  commit('use the new key\n\nAgent: intruder@AgentiCCells.dinis\nClaude-Session: ' + SESSION);
  const chain = checkSignatures({ trustedBase: base, cwd: repo, before: old });
  expect('a key added by a signed commit is then accepted', chain.errors.length === 0 && chain.checked === 2);
  reset();
  // An unsigned merge commit fails; so does an unsigned commit on a merged side branch.
  run('git', ['checkout', '-q', '-b', 'side']);
  commit(`side, signed${trailers}`, { file: 's.txt' });
  run('git', ['checkout', '-q', 'dev']);
  run('git', ['merge', '-q', '--no-ff', '--no-gpg-sign', '-m', `merge unsigned${trailers}`, 'side']);
  expect('an unsigned merge commit fails', checkSignatures({ trustedBase: base, cwd: repo, before: old }).errors.some((e) => /merge unsigned/.test(e) && /no valid signature/.test(e)));
  reset();
  run('git', ['branch', '-q', '-D', 'side']);
  run('git', ['checkout', '-q', '-b', 'side2', base]);
  commit('side, unsigned', { sign: false, file: 's2.txt' });
  run('git', ['checkout', '-q', 'dev']);
  run('git', ['merge', '-q', '--no-ff', '-S', '-m', `merge signed${trailers}`, 'side2']);
  expect('an unsigned commit on a merged side branch fails', checkSignatures({ trustedBase: base, cwd: repo, before: old }).errors.some((e) => /side, unsigned/.test(e) && /no valid signature/.test(e)));
  reset();
  // Control 6: an orphan commit is refused, even signed and carrying its own keys.
  run('git', ['checkout', '-q', '--orphan', 'orphan']);
  commit(`orphan, signed${trailers}`, { file: 'o.txt' });
  const orphanHead = run('git', ['rev-parse', 'HEAD']);
  run('git', ['checkout', '-q', 'dev']);
  run('git', ['merge', '-q', '--no-ff', '-S', '--allow-unrelated-histories', '-m', `merge orphan${trailers}`, 'orphan']);
  expect('an orphan commit is refused', checkSignatures({ trustedBase: base, cwd: repo, before: old }).errors.some((e) => e.startsWith(orphanHead.slice(0, 7)) && /parent has no team\/keys.json/.test(e)));
  reset();
  run('git', ['branch', '-q', '-D', 'orphan']);
  // Control 7, behaviour: a push that weakens the checker and adds an unsigned commit still fails,
  // because the trusted copy (the one CI takes from the base) does the judging.
  writeFileSync(join(repo, SELF), 'console.log("OK"); process.exit(0);\n');
  commit('weaken the checker', { sign: false, file: SELF });
  const weak = checkSignatures({ trustedBase: base, cwd: repo, before: base });
  expect('a push that weakens the checker still fails under the trusted copy', weak.errors.length === 1 && /no valid signature/.test(weak.errors[0]));
  reset();
  // Control 6: a shallow checkout is refused.
  {
    const shallow = join(d, 'shallow');
    execFileSync('git', ['clone', '-q', '--depth', '1', `file://${repo}`, shallow]);
    const r = checkSignatures({ trustedBase: base, cwd: shallow, before: old });
    expect('a shallow checkout is refused', r.errors.length === 1 && /shallow checkout/.test(r.errors[0]));
  }
  // Control 8: deleting the checker never skips a commit.
  run('git', ['rm', '-q', SELF]);
  commit('remove the checker and change something', { sign: false, file: 'x.txt' });
  const gone = checkSignatures({ trustedBase: base, cwd: repo, before: base });
  expect('a commit that removes the checker and is unsigned fails', gone.errors.length === 1 && /no valid signature/.test(gone.errors[0]));
  reset();
  // Fail closed: a trusted base that is not in the clone refuses everything.
  const missing = checkSignatures({ trustedBase: '0123456789abcdef0123456789abcdef01234567', cwd: repo, before: old });
  expect('a missing trusted base fails closed', missing.errors.length === 1 && /trusted base .* is not in this clone/.test(missing.errors[0]));
  // Control 7: BEFORE must be an ancestor of AFTER (no force-pushed or unrelated base).
  {
    const sideBase = run('git', ['rev-parse', 'HEAD']);
    commit(`ahead on dev${trailers}`, { file: 'y.txt' });
    const devTip = run('git', ['rev-parse', 'HEAD']);
    run('git', ['reset', '-q', '--hard', sideBase]);
    commit(`on a branch${trailers}`, { file: 'z.txt' });
    const r = checkSignatures({ trustedBase: base, cwd: repo, before: devTip });
    expect('BEFORE that is not an ancestor of AFTER fails', r.errors.length === 1 && /is not an ancestor/.test(r.errors[0]));
    reset();
  }
  // Control 8: a backdated orphan is still refused (ancestry, never dates).
  run('git', ['checkout', '-q', '--orphan', 'old-orphan']);
  commit(`backdated orphan${trailers}`, { file: 'q.txt', env: { GIT_AUTHOR_DATE: '2001-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2001-01-01T00:00:00Z' } });
  const oldOrphan = run('git', ['rev-parse', 'HEAD']);
  run('git', ['checkout', '-q', 'dev']);
  run('git', ['merge', '-q', '--no-ff', '-S', '--allow-unrelated-histories', '-m', `merge backdated${trailers}`, 'old-orphan']);
  expect('a backdated orphan is refused', checkSignatures({ trustedBase: base, cwd: repo, before: base }).errors.some((e) => e.startsWith(oldOrphan.slice(0, 7)) && /parent has no team\/keys.json/.test(e)));
  reset();
  run('git', ['branch', '-q', '-D', 'old-orphan']);
  expect('commits before the check are not checked', checkSignatures({ trustedBase: base, cwd: repo }).errors.length === 0);
  rmSync(d, { recursive: true, force: true });
}
// Control 7: CI runs the checker from the base branch's copy.
{
  // Comments are stripped first, so a test cannot be satisfied by a comment in the workflow.
  const wf = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '.github/workflows/plan.yml'), 'utf8').split('\n').filter((l) => !/^\s*#/.test(l)).map((l) => l.replace(/\s+#\s.*$/, '')).join('\n');
  expect('plan.yml runs the checker from the base copy', /git show "\$BASE:build\/check-signatures.mjs"/.test(wf) && !/run: node build\/check-signatures.mjs/.test(wf));
  const trusted = wf.slice(wf.indexOf('  trusted-checks:'), wf.indexOf('\n  plan:'));
  expect('control 9: the trusted job runs no code from the pull request', trusted.length > 0 && !/run: node |node test\/|node build\/(?!\.trusted)/.test(trusted.replace(/"\$NODE_BIN" build\/\.trusted-leak-scan\.mjs/g, '')));
  expect('control 9: clean environment and symlink refusal', /GIT_NO_REPLACE_OBJECTS: "1"/.test(trusted) && /NODE_OPTIONS: ""/.test(trusted) && /not a plain file/.test(trusted) && /persist-credentials: false/.test(trusted));
  expect('control 9: the plan job no longer runs the security checks', !/check-signatures|leak-scan/.test(wf.slice(wf.indexOf('\n  plan:'))));
  expect('plan.yml takes BEFORE from the merge-base with dev', /BEFORE=\$\(git merge-base "\$BASE"/.test(wf));
  expect('plan.yml runs the leak scan from the base copy', /git show "\$BASE:build\/leak-scan.mjs"/.test(wf) && !/run: node build\/leak-scan.mjs/.test(wf));
}
export default fails;
