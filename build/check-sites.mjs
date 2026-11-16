// Check every AgentiCCells site served by GitHub Pages: DNS, GitHub's own domain check,
// the HTTPS certificate, Enforce HTTPS, and what the site serves. Factory-made and
// hand-made sites alike. Run by .github/workflows/check-sites.yml (manual).
// Usage: node build/check-sites.mjs          report only; changes nothing
//        node build/check-sites.mjs --fix    also: re-save the custom domain where GitHub's
//                                            DNS check failed but public DNS is right (makes
//                                            GitHub check again and request the certificate),
//                                            and turn on Enforce HTTPS where the certificate exists
// Writes a Markdown table to $GITHUB_STEP_SUMMARY when set. Exit 1 if any site has a problem.
import { appendFileSync } from 'node:fs';

const ORG = 'AgentiCCells';
const pagesHost = ORG.toLowerCase() + '.github.io';
const CERT_OK = ['approved', 'issued'];

// One site's facts in, its problems and possible fixes out. Pure, so the tests can use it.
export function assess(f) {
  const problems = [], fixes = [];
  if (!f.cname) return { problems: ['no custom domain set'], fixes };
  if (f.publicCname !== pagesHost && !f.publicA) problems.push(`public DNS: ${f.cname} does not point to ${pagesHost}`);
  const dnsOk = f.publicCname === pagesHost || f.publicA;
  if (f.healthOk === false) {
    problems.push(`GitHub's DNS check failed${f.healthReason ? ` (${f.healthReason})` : ''}`);
    if (dnsOk) fixes.push('recheck-domain');
  }
  if (!CERT_OK.includes(f.certState)) problems.push(`HTTPS certificate: ${f.certState ?? 'none'}`);
  if (!f.httpsEnforced) {
    problems.push('Enforce HTTPS is off');
    if (CERT_OK.includes(f.certState)) fixes.push('enforce-https');
  }
  if (!f.httpsServes) problems.push(`https://${f.cname}/ does not answer`);
  return { problems, fixes };
}

async function main() {
  const { realIo } = await import('./io.mjs');
  const io = realIo();
  const fix = process.argv.includes('--fix');
  const repos = [];
  for (let page = 1; page < 20; page++) {
    const r = await io.gh('GET', `/orgs/${ORG}/repos?per_page=100&page=${page}`);
    if (r.status !== 200) throw new Error(`listing repositories returned ${r.status}`);
    repos.push(...r.data);
    if (r.data.length < 100) break;
  }
  const rows = [];
  let bad = 0;
  for (const repo of repos.filter((x) => x.has_pages && !x.archived).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = `${ORG}/${repo.name}`;
    const p = await io.gh('GET', `/repos/${full}/pages`);
    if (p.status !== 200) { rows.push([repo.name, '', `reading Pages returned ${p.status}`, '']); bad++; continue; }
    const cname = p.data.cname;
    const f = { cname, certState: p.data.https_certificate?.state, httpsEnforced: p.data.https_enforced };
    if (cname) {
      f.publicCname = await io.publicCname(cname);
      if (!f.publicCname) {
        const a = await io.fetchJson(`https://dns.google/resolve?name=${encodeURIComponent(cname)}&type=A`);
        f.publicA = (a?.Answer ?? []).some((x) => x.type === 1 && /^185\.199\.(108|109|110|111)\.153$/.test(x.data));
      }
      let h = await io.gh('GET', `/repos/${full}/pages/health`);
      if (h.status === 202) { await io.sleep(5000); h = await io.gh('GET', `/repos/${full}/pages/health`); }
      if (h.status === 200) {
        const d = h.data?.domain ?? {};
        f.healthOk = d.is_valid !== false && !d.reason;
        f.healthReason = d.reason ?? null;
      }
      const v = await io.fetchJson(`https://${cname}/version.json`);
      f.httpsServes = !!v;
      f.version = v?.version;
    }
    const { problems, fixes } = assess(f);
    const done = [];
    if (fix) for (const x of fixes) {
      const r = x === 'recheck-domain'
        ? await io.gh('PUT', `/repos/${full}/pages`, { cname })
        : await io.gh('PUT', `/repos/${full}/pages`, { https_enforced: true });
      done.push(`${x}: HTTP ${r.status}`);
    }
    if (problems.length) bad++;
    rows.push([repo.name, cname ?? '', problems.length ? problems.join('; ') : `OK${f.version ? ` (${f.version})` : ''}`, [...done, ...(!fix && fixes.length ? [`fixable with --fix: ${fixes.join(', ')}`] : [])].join('; ')]);
  }
  const table = ['| Repository | Domain | State | Fix |', '|---|---|---|---|', ...rows.map((r) => `| ${r.map((c) => String(c).replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
  console.log(table);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Sites on GitHub Pages\n\n${table}\n`);
  console.log(bad ? `\n${bad} of ${rows.length} sites have a problem${fix ? ' (fixes attempted; run again in a few minutes)' : ''}` : `\nOK (${rows.length} sites)`);
  process.exit(bad ? 1 : 0);
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) await main();
