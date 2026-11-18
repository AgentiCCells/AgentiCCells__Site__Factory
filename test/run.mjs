// Tests: the good fixture passes; each bad fixture fails with a problem. Prints OK or FAILED.
import { checkRequest } from '../build/validate.mjs';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;
const good = checkRequest(join(here, 'good'), { exampleOk: true });
// the folder name "good" is not a valid request name, so only that one problem is expected
const unexpected = good.filter((e) => !e.startsWith('folder name'));
if (unexpected.length) { fails++; console.log('good fixture failed:', unexpected); }
for (const d of readdirSync(join(here, 'bad'))) {
  const errs = checkRequest(join(here, 'bad', d), { exampleOk: true }).filter((e) => !e.startsWith('folder name'));
  if (!errs.length) { fails++; console.log(`bad fixture "${d}" was accepted`); }
}
const names = checkRequest('/x/2026-13-01__Bad_Label').length + checkRequest('/x/not-a-request').length;
if (names < 2) { fails++; console.log('bad folder names were accepted'); }
fails += (await import('./real.mjs')).default;
fails += (await import('./check-app.mjs')).default;
fails += (await import('./check-sites.mjs')).default;
fails += (await import('./first-pass.mjs')).default;
fails += (await import('./access.mjs')).default;
if (fails) { console.log(`FAILED (${fails})`); process.exit(1); }
console.log('OK (tests)');
