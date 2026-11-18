// Bring every live factory site's repository up to the settings new sites now get
// (build/access.mjs): the About box's website, and the owner's teams. Run by
// .github/workflows/sync-settings.yml (manual), inside the `apply` environment.
// Usage: node build/sync-settings.mjs --list   print what it would touch (no credentials, no network)
//        node build/sync-settings.mjs          act (needs the App token per owner, as build/io.mjs)
// Changes only those two settings; writes nothing to this repository. A repository that is
// gone (a withdrawn site) is reported and skipped. Exit 1 if any repository failed.
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listRequests } from './validate.mjs';
import { setHomepage, addTeams, homepageOf, TEAMS } from './access.mjs';

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

// The live, real requests: one entry per repository (the latest request wins).
export function liveSites(folders = listRequests()) {
  const byRepo = new Map();
  for (const f of folders) {
    if (basename(f) === 'EXAMPLE') continue;
    const site = readJson(join(f, 'site.json'));
    const st = existsSync(join(f, 'status.json')) ? readJson(join(f, 'status.json')) : null;
    if (!site || site.apply !== 'real' || st?.state !== 'live') continue;
    byRepo.set(`${site.repo.owner}/${site.repo.name}`.toLowerCase(), { folder: basename(f), site });
  }
  return [...byRepo.values()];
}

// One repository: read it, then set what differs. Pure apart from io.gh.
export async function syncOne(site, io, teams = TEAMS) {
  const full = `${site.repo.owner}/${site.repo.name}`;
  const got = await io.gh('GET', `/repos/${full}`);
  if (got.status === 404) return { result: 'skipped', detail: 'repository not found (withdrawn?)' };
  if (got.status !== 200) return { result: 'failed', detail: `reading the repository returned ${got.status}` };
  const parts = [], bad = [];
  if (got.data?.homepage === homepageOf(site)) parts.push(`website already ${homepageOf(site)}`);
  else { const h = await setHomepage(site, io); (h.ok ? parts : bad).push(h.detail); }
  const t = await addTeams(site, io, teams);
  parts.push(...t.done); bad.push(...t.bad);
  return bad.length ? { result: 'failed', detail: [...parts, ...bad].join('; ') } : { result: 'ok', detail: parts.join('; ') || 'nothing to do' };
}

async function main() {
  const sites = liveSites();
  if (process.argv.includes('--list')) {
    for (const { folder, site } of sites) console.log(`${folder}: ${site.repo.owner}/${site.repo.name} -> website ${homepageOf(site)}; teams ${(TEAMS[site.repo.owner] ?? []).map((t) => `${t.slug} (${t.permission})`).join(', ') || 'none'}`);
    return;
  }
  const { realIo } = await import('./io.mjs');
  const ios = {};
  const rows = [];
  for (const { folder, site } of sites) {
    let r;
    try { ios[site.repo.owner] ??= realIo(process.env, site.repo.owner); r = await syncOne(site, ios[site.repo.owner]); }
    catch (e) { r = { result: 'failed', detail: String(e.message || e).slice(0, 200) }; }
    rows.push({ folder, repo: `${site.repo.owner}/${site.repo.name}`, ...r });
    console.log(`${folder}: ${r.result}: ${r.detail}`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const esc = (s) => String(s).replace(/\|/g, '\\|');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, ['| Request | Repository | Result | Detail |', '|---|---|---|---|', ...rows.map((x) => `| ${esc(x.folder)} | ${esc(x.repo)} | ${x.result} | ${esc(x.detail)} |`)].join('\n') + '\n');
  }
  const failed = rows.filter((x) => x.result === 'failed').length;
  console.log(failed ? `FAILED (${failed} of ${rows.length})` : `OK (${rows.length} repositories)`);
  if (failed) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
