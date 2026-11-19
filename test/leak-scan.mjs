// Tests for build/leak-scan.mjs in a throwaway repository: a NUL-byte file is still scanned; a symlink is refused.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, symlinkSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

let fails = 0;
const expect = (label, cond) => { if (!cond) { fails++; console.log(`leak-scan: ${label}`); } };
const d = mkdtempSync(join(tmpdir(), 'leaktest-'));
const run = (...a) => execFileSync('git', a, { cwd: d, stdio: 'ignore' });
run('init', '-q');
mkdirSync(join(d, 'build'));
copyFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'build', 'leak-scan.mjs'), join(d, 'build', 'leak-scan.mjs'));
const scan = () => spawnSync(process.execPath, [join(d, 'build', 'leak-scan.mjs')], { cwd: d, encoding: 'utf8' });
expect('a clean tree passes', scan().status === 0);
// A private-key header built from parts, so this file does not match the scan itself.
const header = '-'.repeat(5) + 'BEGIN ' + 'PRIVATE KEY' + '-'.repeat(5);
writeFileSync(join(d, 'blob.bin'), Buffer.concat([Buffer.from([0, 1, 2, 0]), Buffer.from(`\n${header}\nabc\n`)]));
run('add', 'blob.bin');
const nul = scan();
expect('a secret inside a file with NUL bytes is found', nul.status !== 0 && /blob\.bin/.test(nul.stderr));
rmSync(join(d, 'blob.bin')); run('rm', '-q', '--cached', 'blob.bin');
writeFileSync(join(d, 'outside.txt'), 'nothing'); symlinkSync('outside.txt', join(d, 'link.txt'));
run('add', 'outside.txt', 'link.txt');
const link = scan();
expect('a symlink is refused, not followed', link.status !== 0 && /link\.txt:0: symlink/.test(link.stderr));
rmSync(d, { recursive: true, force: true });
export default fails;
