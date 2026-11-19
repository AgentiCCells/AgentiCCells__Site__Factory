// Every job that uses a protected environment (and so its secrets) runs only for dev.
// A manual run started from another branch must not reach them (live.b@'s review, 19 Nov).
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '.github', 'workflows');
let fails = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.yml'))) {
  const text = readFileSync(join(dir, f), 'utf8').replace(/#.*$/gm, '');
  const jobs = text.split(/\n(?=  [a-z0-9-]+:\n)/).slice(1);
  for (const job of jobs) {
    if (!/\n    environment:/.test(job)) continue;
    const name = job.slice(2, job.indexOf(':'));
    const cond = (job.match(/\n    if: (.*)/) || [])[1] || '';
    if (!cond.includes("github.ref == 'refs/heads/dev'")) { fails++; console.log(`${f}: job "${name}" uses an environment without the dev-only guard`); }
  }
}
export default fails;
