// Validator for factory requests. Node built-ins only. Prints OK or the list of problems.
// Usage: node build/validate.mjs            validate every folder in requests/
//        node build/validate.mjs <dir>...   validate the given request folders
// Rules come from requests/README.md and schema/site.schema.json.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FOLDER = /^\d{4}-\d{2}-\d{2}__[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
const OWNER = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;
const REPO = /^[A-Za-z0-9._-]{1,100}$/;
const REF = /^[A-Za-z0-9._/-]{1,100}$/;
// Domains the factory may manage, and the GitHub owners whose repositories each may serve.
// A change here is a decision for Dinis: it also needs the AWS role to cover the zone and
// the GitHub App to be installed on the owner (docs/aws-oidc.md, docs/github-app.md).
// promptugal.news added at Dinis's word, 2026-11-17 ~18:20 UTC ("let's do this").
export const ZONES = {
  'agenticcells.site': ['AgentiCCells'],
  'promptugal.news': ['PrompTugal'],
  // agenticcells.org added at Dinis's word, 2026-11-27 ~13:50 UTC in factory.c's session ("yes I agree with your plan").
  // Apex only: a person points it at GitHub Pages; the factory never writes an apex.
  'agenticcells.org': ['AgentiCCells'],
  // agilecells.org added at Dinis's word, 2026-11-27 ~14:55 UTC in c.maestro's session (relayed): build agilecells.org now, the .org only;
  // ~14:35 UTC relay: it belongs to the new AgileCells organisation (www CNAME agilecells.github.io).
  'agilecells.org': ['AgileCells'],
};
export const ALLOWED_ZONES = Object.keys(ZONES);
// The zone a domain belongs to (the longest allowed suffix), or null.
export const zoneOf = (domain) => ALLOWED_ZONES.filter((z) => domain === z || domain.endsWith('.' + z)).sort((a, b) => b.length - a.length)[0] ?? null;
// GitHub logins invited as collaborators with write (push) access; at most five per request.
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
export const MAX_COLLABORATORS = 5;
// The Claude Code first pass (FAC-005d) is switched off. Dinis, 2026-11-18 ~14:45 UTC: "from now
// on, we don't need to have that Claude code step, since that was an experiment to see how it worked
// and it is costing us money". Each site's conductor session builds its first version instead.
// A request may still say first_pass.enabled; it is recorded as skipped. Turning it back on is a
// decision for Dinis.
export const FIRST_PASS_ON = false;
export const STEPS = ['validate', 'repo', 'seed', 'settings', 'dns', 'domain', 'vault', 'deploy', 'https', 'collaborators', 'first-pass'];
const STATES = ['planned', 'applying', 'live', 'failed', 'torn-down'];
const RESULTS = ['ok', 'failed', 'skipped', 'dry-run', 'pending'];

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function onlyKeys(o, allowed, path, errs) {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) errs.push(`${path}: unknown field "${k}"`);
}
function ownerName(o, path, errs, withRef) {
  if (!isObj(o)) return errs.push(`${path}: must be an object`);
  onlyKeys(o, withRef ? ['owner', 'name', 'ref'] : ['owner', 'name'], path, errs);
  if (typeof o.owner !== 'string' || !OWNER.test(o.owner)) errs.push(`${path}.owner: invalid`);
  if (typeof o.name !== 'string' || !REPO.test(o.name)) errs.push(`${path}.name: invalid`);
  if (withRef && o.ref !== undefined && (typeof o.ref !== 'string' || !REF.test(o.ref))) errs.push(`${path}.ref: invalid`);
}
function flag(o, key, path, errs) {
  if (o === undefined) return;
  if (!isObj(o)) return errs.push(`${path}: must be an object`);
  onlyKeys(o, [key], path, errs);
  if (o[key] !== undefined && typeof o[key] !== 'boolean') errs.push(`${path}.${key}: must be true or false`);
}

export function checkSite(site) {
  const errs = [];
  if (!isObj(site)) return ['site.json: must be an object'];
  onlyKeys(site, ['schema', 'name', 'description', 'domain', 'repo', 'template', 'visibility', 'vault', 'first_pass', 'apply', 'requested_by', 'collaborators'], 'site.json', errs);
  if (site.schema !== 1) errs.push('schema: must be the number 1');
  if (typeof site.name !== 'string' || !site.name.trim() || site.name.length > 80) errs.push('name: 1 to 80 characters');
  if (site.description !== undefined && (typeof site.description !== 'string' || !site.description.trim() || site.description.length > 200)) errs.push('description: 1 to 200 characters');
  if (site.apply !== undefined && !['dry-run', 'real'].includes(site.apply)) errs.push('apply: dry-run or real');
  if (typeof site.domain !== 'string' || !DOMAIN.test(site.domain)) errs.push('domain: not a valid lowercase domain');
  else if (!zoneOf(site.domain)) errs.push(`domain: "${site.domain}" is outside the zones the factory may manage (${ALLOWED_ZONES.join(', ')})`);
  ownerName(site.repo, 'repo', errs, false);
  const zone = typeof site.domain === 'string' ? zoneOf(site.domain) : null;
  if (zone && isObj(site.repo) && typeof site.repo.owner === 'string' && !ZONES[zone].includes(site.repo.owner)) errs.push(`repo.owner: "${site.repo.owner}" may not serve ${zone} (allowed: ${ZONES[zone].join(', ')})`);
  if (site.collaborators !== undefined) {
    if (!Array.isArray(site.collaborators)) errs.push('collaborators: must be a list of GitHub logins');
    else {
      if (site.collaborators.length > MAX_COLLABORATORS) errs.push(`collaborators: at most ${MAX_COLLABORATORS}`);
      for (const c of site.collaborators) if (typeof c !== 'string' || !LOGIN.test(c)) errs.push(`collaborators: "${c}" is not a valid GitHub login`);
      if (new Set(site.collaborators.map((c) => String(c).toLowerCase())).size !== site.collaborators.length) errs.push('collaborators: listed twice');
    }
  }
  if (site.template !== undefined) ownerName(site.template, 'template', errs, true);
  if (site.visibility !== undefined && !['public', 'private'].includes(site.visibility)) errs.push('visibility: public or private');
  flag(site.vault, 'create', 'vault', errs);
  flag(site.first_pass, 'enabled', 'first_pass', errs);
  if (typeof site.requested_by !== 'string' || !site.requested_by.trim() || site.requested_by.length > 120) errs.push('requested_by: 1 to 120 characters');
  return errs;
}

export function checkStatus(st) {
  const errs = [];
  if (!isObj(st)) return ['status.json: must be an object'];
  if (!STATES.includes(st.state)) errs.push(`status.json state: one of ${STATES.join(', ')}`);
  if (!['dry-run', 'real'].includes(st.mode)) errs.push('status.json mode: dry-run or real');
  if (!Array.isArray(st.steps)) errs.push('status.json steps: must be a list');
  else for (const s of st.steps) {
    if (!isObj(s) || !STEPS.includes(s.name)) errs.push('status.json steps: unknown step name');
    else if (!RESULTS.includes(s.result)) errs.push(`status.json step ${s.name}: result must be one of ${RESULTS.join(', ')}`);
  }
  return errs;
}

function readJson(p, errs, label) {
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { errs.push(`${label}: not valid JSON (${e.message})`); return undefined; }
}

// folder: path of a request folder. exampleOk: the name EXAMPLE is allowed (the shipped example).
export function checkRequest(folder, { exampleOk = false } = {}) {
  const errs = [];
  const name = basename(folder);
  if (!(exampleOk && name === 'EXAMPLE') && !FOLDER.test(name)) errs.push(`folder name "${name}": must be YYYY-MM-DD__label (lowercase letters, digits, single hyphens)`);
  const sitePath = join(folder, 'site.json');
  if (!existsSync(sitePath)) errs.push('site.json: missing');
  else { const site = readJson(sitePath, errs, 'site.json'); if (site !== undefined) errs.push(...checkSite(site)); }
  const briefPath = join(folder, 'brief.md');
  if (!existsSync(briefPath)) errs.push('brief.md: missing');
  else if (!readFileSync(briefPath, 'utf8').trim()) errs.push('brief.md: empty');
  const stPath = join(folder, 'status.json');
  if (existsSync(stPath)) { const st = readJson(stPath, errs, 'status.json'); if (st !== undefined) errs.push(...checkStatus(st)); }
  return errs;
}

export function listRequests(dir = join(root, 'requests')) {
  return readdirSync(dir).map((n) => join(dir, n)).filter((p) => statSync(p).isDirectory()).sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const folders = args.length ? args : listRequests();
  let bad = 0;
  for (const f of folders) {
    const errs = checkRequest(f, { exampleOk: true });
    for (const e of errs) console.log(`${basename(f)}: ${e}`);
    bad += errs.length;
  }
  if (bad) { console.log(`FAILED (${bad} problems in ${folders.length} requests)`); process.exit(1); }
  console.log(`OK (${folders.length} requests)`);
}
