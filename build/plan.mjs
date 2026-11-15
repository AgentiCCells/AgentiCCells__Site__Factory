// Plan: what the pipeline would do for each request. Reads files only; creates nothing.
// Usage: node build/plan.mjs <request-folder>...   prints Markdown; exit 1 if any request is invalid.
import { readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { checkRequest } from './validate.mjs';

// Text from a request is data. Neutralise Markdown and mentions before it goes in a comment.
const safe = (v) => String(v).replace(/[`<>@|\r\n\\*_\[\]]/g, ' ').slice(0, 120);

const out = ['## Site factory plan', '', '_Dry run on the pull request. Nothing has been created. No secrets or cloud access are used here._', ''];
let failed = false;
const folders = process.argv.slice(2);
if (!folders.length) out.push('No request folders changed in this pull request.');
for (const f of folders) {
  const errs = checkRequest(f);
  out.push(`### ${safe(basename(f))}`);
  if (errs.length) {
    failed = true;
    out.push('**Invalid.** Fix these before merging:', ...errs.map((e) => `- ${safe(e)}`), '');
    continue;
  }
  const s = JSON.parse(readFileSync(join(f, 'site.json'), 'utf8'));
  const t = s.template ?? { owner: 'AgentiCCells', name: 'AgentiCCells__Site__Template', ref: 'dev' };
  const first = s.first_pass?.enabled === true;
  out.push('Valid. On merge, apply would:', '',
    '| Step | What |', '|---|---|',
    `| repo | create ${safe(s.visibility ?? 'public')} repository ${safe(s.repo.owner)}/${safe(s.repo.name)} from ${safe(t.owner)}/${safe(t.name)} at ${safe(t.ref ?? 'dev')} |`,
    `| dns | add records for ${safe(s.domain)} in the factory zone |`,
    `| vault | ${s.vault?.create ? 'create an sgit vault' : 'skipped (not requested)'} |`,
    '| seed | push a first page |',
    `| https | check https://${safe(s.domain)} answers |`,
    `| first-pass | ${first ? 'run a first pass with Claude Code' : 'skipped (not requested)'} |`, '',
    `Requested by ${safe(s.requested_by)}. Until FAC-003 and FAC-005 exist, apply is not built.`, '');
}
console.log(out.join('\n'));
process.exit(failed ? 1 : 0);
