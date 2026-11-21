// Release protections for site repositories, from protect/repos.json. Run by the manual
// workflow .github/workflows/protect.yml (dev only, apply environment, factory App token).
// Dinis, 2026-11-20: "let's try this on live and a couple other PrompTugal repos, basically the
// key requirement is that (for now) the agent that creates the PR can still merge it".
//
// stage "base" (changes nothing about how agents work):
//   - dev: no force-push, no deletion (classic branch protection, no PR or check required);
//   - tag ruleset "release tags": refs/tags/v* may be created, moved or deleted only by GitHub Actions;
//   - environment github-pages: deployments from dev only.
// stage "pr": base, plus every change to dev through a pull request (0 approving reviews, so the
//   agent that opened it can merge it) with the repository's listed checks passing.
// Usage: node build/protect.mjs --plan   print what it would set (no network)
//        node build/protect.mjs          act (needs the App token per owner, as build/io.mjs)
// Reads before it writes; reports each repository's result. Exit 1 if any repository failed.
import { readFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const GITHUB_ACTIONS_APP_ID = 15368; // the github-actions integration, as GitHub lists it for ruleset bypass
const ok = (s) => s >= 200 && s < 300;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadConfig(path = join(root, 'protect', 'repos.json')) {
  const c = JSON.parse(readFileSync(path, 'utf8'));
  for (const r of c.repos) {
    if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(r.repo)) throw new Error(`protect: bad repository ${r.repo}`);
    if (!['base', 'pr'].includes(r.stage)) throw new Error(`protect: ${r.repo}: stage must be base or pr`);
    if (!Array.isArray(r.checks) || r.checks.some((x) => typeof x !== 'string' || !x)) throw new Error(`protect: ${r.repo}: checks must be a list of job names`);
    if (r.stage === 'pr' && !r.checks.length) throw new Error(`protect: ${r.repo}: stage pr needs at least one required check`);
  }
  return c.repos;
}

// The body for PUT /repos/{repo}/branches/dev/protection.
export function branchProtection(entry) {
  const pr = entry.stage === 'pr';
  return {
    required_status_checks: pr ? { strict: false, contexts: entry.checks } : null,
    enforce_admins: false,
    required_pull_request_reviews: pr ? { required_approving_review_count: 0, dismiss_stale_reviews: false, require_code_owner_reviews: false } : null,
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
    required_linear_history: false,
    required_conversation_resolution: false,
  };
}

export const TAG_RULESET = {
  name: 'release tags',
  target: 'tag',
  enforcement: 'active',
  conditions: { ref_name: { include: ['refs/tags/v*'], exclude: [] } },
  rules: [{ type: 'creation' }, { type: 'update' }, { type: 'deletion' }],
  bypass_actors: [{ actor_id: GITHUB_ACTIONS_APP_ID, actor_type: 'Integration', bypass_mode: 'always' }],
};

export function plan(entry) {
  const out = [`dev: no force-push, no deletion`];
  if (entry.stage === 'pr') out.push(`dev: pull request required (0 approving reviews: the author may merge), checks ${entry.checks.join(', ')}`);
  out.push(`tags v*: only GitHub Actions may create, move or delete`, `github-pages: deploys from dev only`);
  return out;
}

// One repository. Pure apart from io.gh.
export async function protectOne(entry, io) {
  const r = entry.repo;
  const got = await io.gh('GET', `/repos/${r}`);
  if (got.status === 404) return { result: 'skipped', detail: 'repository not found' };
  if (!ok(got.status)) return { result: 'failed', detail: `reading the repository returned ${got.status}` };
  if (got.data?.default_branch && got.data.default_branch !== 'dev') return { result: 'failed', detail: `default branch is ${got.data.default_branch}, not dev` };
  const done = [], bad = [];
  const hint = (s) => (s === 403 ? ': does the factory App have repository Administration (write)?' : '');

  const bp = await io.gh('PUT', `/repos/${r}/branches/dev/protection`, branchProtection(entry));
  (ok(bp.status) ? done : bad).push(ok(bp.status) ? plan(entry).filter((l) => l.startsWith('dev:')).join('; ') : `dev protection not set (GitHub returned ${bp.status}${hint(bp.status)})`);

  const list = await io.gh('GET', `/repos/${r}/rulesets`);
  if (!ok(list.status)) bad.push(`tag ruleset not read (GitHub returned ${list.status}${hint(list.status)})`);
  else {
    const have = (list.data || []).find((x) => x.name === TAG_RULESET.name && x.target === 'tag');
    const w = have ? await io.gh('PUT', `/repos/${r}/rulesets/${have.id}`, TAG_RULESET) : await io.gh('POST', `/repos/${r}/rulesets`, TAG_RULESET);
    (ok(w.status) ? done : bad).push(ok(w.status) ? `tags v*: GitHub Actions only (${have ? 'updated' : 'created'})` : `tag ruleset not set (GitHub returned ${w.status}${hint(w.status)})`);
  }

  const env = await io.gh('PUT', `/repos/${r}/environments/github-pages`, { deployment_branch_policy: { protected_branches: false, custom_branch_policies: true } });
  if (!ok(env.status)) bad.push(`github-pages not set (GitHub returned ${env.status}${hint(env.status)})`);
  else {
    const pol = await io.gh('GET', `/repos/${r}/environments/github-pages/deployment-branch-policies`);
    const names = ok(pol.status) ? (pol.data?.branch_policies || []).map((p) => `${p.type || 'branch'}:${p.name}`) : null;
    if (names === null) bad.push(`github-pages policies not read (GitHub returned ${pol.status})`);
    else {
      for (const p of (pol.data?.branch_policies || [])) if (!(p.name === 'dev' && (p.type || 'branch') === 'branch')) {
        const d = await io.gh('DELETE', `/repos/${r}/environments/github-pages/deployment-branch-policies/${p.id}`);
        if (!ok(d.status)) bad.push(`github-pages: could not remove policy ${p.name} (${d.status})`);
      }
      if (!names.includes('branch:dev')) {
        const a = await io.gh('POST', `/repos/${r}/environments/github-pages/deployment-branch-policies`, { name: 'dev', type: 'branch' });
        if (!ok(a.status)) bad.push(`github-pages: dev policy not added (GitHub returned ${a.status})`);
      }
      if (!bad.some((b) => b.startsWith('github-pages'))) done.push('github-pages: deploys from dev only');
    }
  }
  return bad.length ? { result: 'failed', detail: [...done, ...bad].join('; ') } : { result: 'ok', detail: done.join('; ') };
}

async function main() {
  const repos = loadConfig();
  if (process.argv.includes('--plan')) {
    for (const e of repos) console.log(`${e.repo} (stage ${e.stage}): ${plan(e).join('; ')}`);
    return;
  }
  const { realIo } = await import('./io.mjs');
  const ios = {}, rows = [];
  for (const e of repos) {
    const owner = e.repo.split('/')[0];
    let r;
    try { ios[owner] ??= realIo(process.env, owner); r = await protectOne(e, ios[owner]); }
    catch (err) { r = { result: 'failed', detail: String(err.message || err).slice(0, 200) }; }
    rows.push({ repo: e.repo, stage: e.stage, ...r });
    console.log(`${e.repo}: ${r.result}: ${r.detail}`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const esc = (s) => String(s).replace(/\|/g, '\\|');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, ['## Protect release branches', '', '| Repository | Stage | Result | Detail |', '|---|---|---|---|', ...rows.map((x) => `| ${x.repo} | ${x.stage} | ${x.result} | ${esc(x.detail)} |`), ''].join('\n'));
  }
  if (rows.some((x) => x.result === 'failed')) process.exit(1);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
