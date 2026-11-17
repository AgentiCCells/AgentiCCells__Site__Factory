// Plan: what the pipeline would do for each request. Reads files only; creates nothing.
// Usage: node build/plan.mjs <request-folder>...   prints Markdown; exit 1 if any request is invalid.
import { readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { checkRequest, zoneOf } from './validate.mjs';

// Text from a request is data. Each value goes in an inline code span, where
// Markdown, HTML and @mentions are not processed; backticks, pipes and line
// breaks are removed so the span and the table cannot be broken out of.
const safe = (v) => '`' + String(v).replace(/[`|\r\n]/g, ' ').slice(0, 120) + '`';

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
  const real = s.apply === 'real';
  const sub = s.domain.split('.').length >= 3;
  out.push(real ? '**Valid. On merge, apply acts for real** (in the protected `apply` environment):' : 'Valid. On merge, apply writes a **dry-run** status and creates nothing. It would:', '',
    '| Step | What |', '|---|---|',
    `| repo | adopt ${safe(s.repo.owner + '/' + s.repo.name)} if it exists, otherwise create it (${safe(s.visibility ?? 'public')}) |`,
    `| seed | if the repository is empty, push ${safe(t.owner + '/' + t.name)} at ${safe(t.ref ?? 'dev')} to dev with the placeholders filled; never overwrite |`,
    '| settings | default branch dev; Pages from GitHub Actions; dev may deploy |',
    `| dns | ${sub ? `CNAME ${safe(s.domain)} to ${safe(s.repo.owner.toLowerCase() + '.github.io')} in the Route 53 zone ${safe(zoneOf(s.domain))}` : `apex ${safe(s.domain)}: never written by the factory; adopted if a person has already pointed it at GitHub Pages, otherwise the step fails`} |`,
    `| domain | set ${safe(s.domain)} as the Pages custom domain |`,
    `| vault | ${s.vault?.create ? 'requested; skipped until the sgit credential exists' : 'skipped (not requested)'} |`,
    '| deploy | start the site\'s pages.yml on dev |',
    `| https | wait for https://${safe(s.domain)}/version.json to serve the deployed commit |`,
    `| collaborators | ${(s.collaborators ?? []).length ? `invite ${s.collaborators.map(safe).join(', ')} with write (push) access; each must accept` : 'skipped (none requested)'} |`,
    `| first-pass | ${first ? 'after a fresh seed, Claude Code writes a first version from brief.md (file tools only; only src/, hub.json, README.md); checked, gated and pushed by a separate job' : 'skipped (not requested)'} |`, '',
    `Requested by ${safe(s.requested_by)}.`, '');
}
console.log(out.join('\n'));
process.exit(failed ? 1 : 0);
