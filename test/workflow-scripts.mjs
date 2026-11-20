// Syntax-check every workflow `run:` block with bash -n, and every single-quoted
// `node -e '...'` body with node --check. A stray apostrophe inside a single-quoted
// script ends the quote early and breaks the run (cyber.b@, 19 Nov); this catches it
// before CI does. GitHub expressions (${{ ... }}) are replaced with a placeholder first.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '.github', 'workflows');
const tmp = mkdtempSync(join(tmpdir(), 'wf-'));
let fails = 0, blocks = 0, scripts = 0;
export function runBlocks(text) {
  const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(?:- )?run: \|\s*$/);
    if (!m) continue;
    const body = [];
    let indent = null;
    for (i++; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim() === '') { body.push(''); continue; }
      const ind = l.match(/^\s*/)[0].length;
      if (indent === null) indent = ind;
      if (ind < indent) { i--; break; }
      body.push(l.slice(indent));
    }
    out.push(body.join('\n').replace(/\$\{\{[^}]*\}\}/g, 'X'));
  }
  return out;
}
export function nodeBodies(script) {
  return [...script.matchAll(/node -e '([^']*)'/g)].map((m) => m[1]);
}
function check(cmd, args, file, label) {
  const r = spawnSync(cmd, [...args, file], { encoding: 'utf8' });
  if (r.status !== 0) { fails++; console.log(`${label}: ${(r.stderr || r.stdout).trim().split('\n')[0]}`); }
}
for (const f of readdirSync(dir).filter((n) => n.endsWith('.yml'))) {
  runBlocks(readFileSync(join(dir, f), 'utf8')).forEach((b, n) => {
    blocks++;
    const sh = join(tmp, `${f}.${n}.sh`);
    writeFileSync(sh, b);
    check('bash', ['-n'], sh, `${f} run block ${n + 1} (bash)`);
    nodeBodies(b).forEach((js, k) => {
      scripts++;
      const p = join(tmp, `${f}.${n}.${k}.mjs`);
      writeFileSync(p, js);
      check(process.execPath, ['--check'], p, `${f} run block ${n + 1}, node -e ${k + 1}`);
    });
  });
}
// The check itself must catch the failure it exists for.
const broken = runBlocks("    steps:\n      - run: |\n          node -e 'console.log(\"it's\")'\n")[0];
writeFileSync(join(tmp, 'broken.sh'), broken);
if (spawnSync('bash', ['-n', join(tmp, 'broken.sh')]).status === 0) { fails++; console.log('workflow-scripts: an apostrophe in node -e was not caught'); }
if (!blocks || !scripts) { fails++; console.log(`workflow-scripts: found ${blocks} run blocks and ${scripts} node -e bodies; expected some`); }
export default fails;
