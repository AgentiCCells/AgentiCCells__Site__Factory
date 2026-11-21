// Tests for build/protect.mjs with a fake GitHub. No network.
import { protectOne, branchProtection, TAG_RULESET, loadConfig, GITHUB_ACTIONS_APP_ID } from '../build/protect.mjs';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
let fails = 0;
const expect = (label, cond) => { if (!cond) { fails++; console.log(`protect: ${label}`); } };
const fake = (over = {}) => {
  const calls = [];
  return { calls, async gh(m, p, b) {
    calls.push({ m, p, b });
    for (const [k, v] of Object.entries(over)) if (`${m} ${p}` === k || `${m} ${p}`.endsWith(k)) return typeof v === 'number' ? { status: v } : v;
    if (m === 'GET' && /^\/repos\/[^/]+\/[^/]+$/.test(p)) return { status: 200, data: { default_branch: 'dev' } };
    if (m === 'GET' && p.endsWith('/rulesets')) return { status: 200, data: [] };
    if (m === 'GET' && p.endsWith('/deployment-branch-policies')) return { status: 200, data: { branch_policies: [] } };
    return { status: m === 'DELETE' ? 204 : 200, data: {} };
  } };
};
const base = { repo: 'PrompTugal/PrompTugal__News__Live', stage: 'base', checks: ['security'] };
const pr = { ...base, stage: 'pr' };

// Dinis's key requirement: the author can merge its own pull request.
expect('stage pr asks for no approving review', branchProtection(pr).required_pull_request_reviews.required_approving_review_count === 0 && branchProtection(pr).required_pull_request_reviews.require_code_owner_reviews === false);
expect('stage pr requires the listed checks', JSON.stringify(branchProtection(pr).required_status_checks.contexts) === '["security"]');
expect('stage base requires no pull request and no check (agents work as now)', branchProtection(base).required_pull_request_reviews === null && branchProtection(base).required_status_checks === null);
for (const e of [base, pr]) expect(`stage ${e.stage}: no force-push, no deletion`, branchProtection(e).allow_force_pushes === false && branchProtection(e).allow_deletions === false);
expect('tags v*: only the github-actions app bypasses', TAG_RULESET.target === 'tag' && TAG_RULESET.conditions.ref_name.include[0] === 'refs/tags/v*' && TAG_RULESET.bypass_actors.length === 1 && TAG_RULESET.bypass_actors[0].actor_id === GITHUB_ACTIONS_APP_ID);
{
  const io = fake();
  const r = await protectOne(base, io);
  expect(`all three set: ${r.detail}`, r.result === 'ok');
  expect('creates the tag ruleset', io.calls.some((c) => c.m === 'POST' && c.p.endsWith('/rulesets')));
  expect('adds the dev deployment policy', io.calls.some((c) => c.m === 'POST' && c.p.endsWith('/deployment-branch-policies') && c.b.name === 'dev'));
}
{
  const io = fake({ '/rulesets': { status: 200, data: [{ id: 7, name: 'release tags', target: 'tag' }] }, '/deployment-branch-policies': { status: 200, data: { branch_policies: [{ id: 3, name: 'dev', type: 'branch' }, { id: 4, name: 'main', type: 'branch' }] } } });
  const r = await protectOne(base, io);
  expect('a second run updates the ruleset, it does not add another', r.result === 'ok' && io.calls.some((c) => c.m === 'PUT' && c.p.endsWith('/rulesets/7')) && !io.calls.some((c) => c.m === 'POST' && c.p.endsWith('/rulesets')));
  expect('a policy other than dev is removed, dev is not re-added', io.calls.some((c) => c.m === 'DELETE' && c.p.endsWith('/4')) && !io.calls.some((c) => c.m === 'DELETE' && c.p.endsWith('/3')) && !io.calls.some((c) => c.m === 'POST' && c.p.endsWith('/deployment-branch-policies')));
}
{
  const r = await protectOne(base, fake({ '/branches/dev/protection': 403 }));
  expect('a 403 fails and names the Administration permission', r.result === 'failed' && /Administration/.test(r.detail));
  const g = await protectOne(base, fake({ 'GET /repos/PrompTugal/PrompTugal__News__Live': 404 }));
  expect('a missing repository is skipped', g.result === 'skipped');
  const m = await protectOne(base, fake({ 'GET /repos/PrompTugal/PrompTugal__News__Live': { status: 200, data: { default_branch: 'main' } } }));
  expect('a repository whose default branch is not dev is refused', m.result === 'failed');
}
{
  const dir = mkdtempSync(join(tmpdir(), 'pr-'));
  const w = (repos) => { const p = join(dir, `${Math.random()}.json`); writeFileSync(p, JSON.stringify({ repos })); return p; };
  let threw = false; try { loadConfig(w([{ repo: 'A/B', stage: 'pr', checks: [] }])); } catch { threw = true; }
  expect('stage pr with no required check is refused', threw);
  threw = false; try { loadConfig(w([{ repo: 'A/B', stage: 'strict', checks: [] }])); } catch { threw = true; }
  expect('an unknown stage is refused', threw);
  expect('the shipped config loads', loadConfig().length >= 3);
}
export default fails;
