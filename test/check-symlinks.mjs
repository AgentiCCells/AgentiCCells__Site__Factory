// Control 10 tests: a pushed symlink fails; one listed in the base passes; one listed only
// in the pushed tree fails; a symlink in an extra directory (an artifact) fails.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkSymlinks } from '../build/check-symlinks.mjs';
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('check-symlinks:', msg); } };
const repo = mkdtempSync(join(tmpdir(), 'sl-'));
const g = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8' }).trim();
g('init', '-q', '-b', 'dev'); g('config', 'user.name', 't'); g('config', 'user.email', 't@t'); g('config', 'commit.gpgsign', 'false');
writeFileSync(join(repo, 'a.txt'), 'a\n'); g('add', '.'); g('commit', '-qm', 'base');
const base = g('rev-parse', 'HEAD');
// 1. a pushed symlink fails, even if a later commit removes it
symlinkSync('a.txt', join(repo, 'link')); g('add', '.'); g('commit', '-qm', 'add link');
g('rm', '-q', 'link'); g('commit', '-qm', 'remove link');
let r = checkSymlinks({ cwd: repo, base, before: base, after: 'HEAD', tree: repo });
ok(r.errors.some((e) => e.includes('link: symlink added')), 'a symlink added then removed was not caught');
// 2. listed only in the pushed tree: still fails
mkdirSync(join(repo, 'team'), { recursive: true });
writeFileSync(join(repo, 'team/symlink-exceptions.json'), JSON.stringify({ exceptions: [{ path: 'link2', reason: 'test' }] }));
symlinkSync('a.txt', join(repo, 'link2')); g('add', '.'); g('commit', '-qm', 'self-listed link');
r = checkSymlinks({ cwd: repo, base, before: base, after: 'HEAD', tree: repo });
ok(r.errors.some((e) => e.includes('link2')), 'a symlink listed only in the pushed tree passed');
// 3. listed in the base: passes
const base2 = g('rev-parse', 'HEAD');
writeFileSync(join(repo, 'b.txt'), 'b\n'); g('add', '.'); g('commit', '-qm', 'more');
r = checkSymlinks({ cwd: repo, base: base2, before: base2, after: 'HEAD', tree: repo });
ok(r.errors.length === 0, `a symlink listed in the base was refused: ${r.errors.join('; ')}`);
// 4. a merge bringing a symlink from a side branch fails
g('switch', '-q', '-c', 'side'); symlinkSync('b.txt', join(repo, 'side-link')); g('add', '.'); g('commit', '-qm', 'side link');
g('switch', '-q', 'dev'); writeFileSync(join(repo, 'c.txt'), 'c\n'); g('add', '.'); g('commit', '-qm', 'main'); g('merge', '-q', '--no-edit', 'side');
r = checkSymlinks({ cwd: repo, base: base2, before: base2, after: 'HEAD' });
ok(r.errors.some((e) => e.includes('side-link')), 'a symlink from a merged side branch was not caught');
// 5. a symlink in an artifact directory fails
const art = mkdtempSync(join(tmpdir(), 'art-')); writeFileSync(join(art, 'plan.md'), 'x'); symlinkSync('/etc/passwd', join(art, 'evil'));
r = checkSymlinks({ cwd: repo, base: base2, before: 'HEAD', after: 'HEAD', dirs: [art] });
ok(r.errors.some((e) => e.endsWith('evil: symlink (not allowed)')), 'a symlink in an artifact was not caught');
// 6. an exception without a reason is refused
g('switch', '-q', '-c', 'bad'); writeFileSync(join(repo, 'team/symlink-exceptions.json'), JSON.stringify({ exceptions: [{ path: 'x' }] })); g('add', '.'); g('commit', '-qm', 'no reason');
let threw = false; try { checkSymlinks({ cwd: repo, base: 'HEAD', before: 'HEAD', after: 'HEAD' }); } catch { threw = true; }
ok(threw, 'an exception without a reason was accepted');

// The workflow wires it in: the trusted job runs the base's copy over the range and the tree,
// and the comment job refuses a symlink in the downloaded artifact.
{
  const { readFileSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const wf = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '.github', 'workflows', 'plan.yml'), 'utf8').replace(/#.*$/gm, '');
  ok(wf.includes('git show "$BASE:build/check-symlinks.mjs"'), 'plan.yml does not take check-symlinks.mjs from the base');
  ok(/check-symlinks\.mjs" "\$BASE" "\$BEFORE" "\$HEAD_SHA" --tree \./.test(wf), 'plan.yml does not run the symlink check over the range and the tree');
  ok(wf.includes('find out -type l'), 'plan.yml does not refuse symlinks in the downloaded artifact');
}
export default fails;
