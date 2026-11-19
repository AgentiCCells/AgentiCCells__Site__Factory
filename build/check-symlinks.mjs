// Control 10 (security@, ed70bd996, relayed by conductor.b@ 19 Nov 16:50 UTC): no symlinks.
// Node built-ins only. Written by cells.b@AgentiCCells.dinis.
//
// Refuses, in the range before..after:
//   - any mode-120000 entry added or changed in any commit (git diff-tree per commit, merges
//     against every parent), not only in the final tree;
//   - any symlink in the checked-out tree (when a working tree is given);
//   - any symlink under an extra directory, such as a downloaded artifact.
// The only exceptions are the paths listed in team/symlink-exceptions.json read from the
// trusted base commit, never from the pull request: {"exceptions":[{"path":"...","reason":"..."}]}.
// An exception added in a pull request counts only once that pull request is merged.
//
// Usage: node build/check-symlinks.mjs <base> <before> <after> [--tree <dir>] [--dir <dir>]...
import { execFileSync } from 'node:child_process';
import { lstatSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } });

export function exceptionsAt(cwd, base) {
  let text;
  try { text = git(cwd, ['show', `${base}:team/symlink-exceptions.json`]); } catch { return new Map(); }
  const data = JSON.parse(text);
  const out = new Map();
  for (const e of data.exceptions || []) {
    if (typeof e.path !== 'string' || !e.path || typeof e.reason !== 'string' || !e.reason.trim()) throw new Error('team/symlink-exceptions.json: every exception needs a path and a reason');
    out.set(e.path, e.reason);
  }
  return out;
}

function walkLinks(dir, root, found) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (p === join(root, '.git')) continue;
    const st = lstatSync(p);
    if (st.isSymbolicLink()) found.push(relative(root, p));
    else if (st.isDirectory()) walkLinks(p, root, found);
  }
}

export function checkSymlinks({ cwd, base, before, after = 'HEAD', tree = null, dirs = [] }) {
  const allowed = exceptionsAt(cwd, base);
  const errors = [];
  const commits = git(cwd, ['rev-list', `${before}..${after}`]).split('\n').filter(Boolean);
  for (const c of commits) {
    // --root covers a commit with no parent; -m compares a merge with each parent.
    const raw = git(cwd, ['diff-tree', '-r', '--raw', '--no-commit-id', '--root', '-m', '-z', c]).split('\0');
    for (let i = 0; i < raw.length - 1; i++) {
      const meta = raw[i];
      if (!meta.startsWith(':')) continue;
      const [, dstMode, , , status] = meta.slice(1).split(' ');
      const path = raw[++i];
      if (/^[RC]/.test(status)) i++; // renames and copies carry a second path
      if (dstMode === '120000' && !allowed.has(path)) errors.push(`${c.slice(0, 7)} ${path}: symlink added or changed (not allowed)`);
    }
  }
  const scan = (dir, label) => {
    if (!dir || !existsSync(dir)) return;
    const found = [];
    walkLinks(dir, dir, found);
    for (const p of found) if (label !== 'tree' || !allowed.has(p)) errors.push(`${label} ${p}: symlink (not allowed)`);
  };
  scan(tree, 'tree');
  for (const d of dirs) scan(d, d);
  return { errors: [...new Set(errors)], commits: commits.length, exceptions: allowed.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const [base, before, after] = a;
  const opt = (name) => a.flatMap((x, i) => (x === name ? [a[i + 1]] : []));
  if (!base || !before || !after) { console.error('usage: check-symlinks.mjs <base> <before> <after> [--tree dir] [--dir dir]...'); process.exit(2); }
  const r = checkSymlinks({ cwd: process.cwd(), base, before, after, tree: opt('--tree')[0] || null, dirs: opt('--dir') });
  if (r.errors.length) { console.error(r.errors.join('\n')); console.error(`FAILED (${r.errors.length})`); process.exit(1); }
  console.log(`OK (no symlinks in ${r.commits} commits${opt('--tree').length ? ' or the tree' : ''}; ${r.exceptions} listed exceptions)`);
}
