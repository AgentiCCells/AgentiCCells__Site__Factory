// Tests for assess() in build/check-sites.mjs. No network.
import { assess } from '../build/check-sites.mjs';
let fails = 0;
const expect = (l, c) => { if (!c) { fails++; console.log(`check-sites: ${l}`); } };
const good = { cname: 'qa-1.agenticcells.site', publicCname: 'agenticcells.github.io', healthOk: true, certState: 'approved', httpsEnforced: true, httpsServes: true };
expect('healthy site has no problems', assess(good).problems.length === 0);
// QA-1 on 2026-11-16: DNS right, GitHub's check failed, no certificate, not enforced.
const qa1 = { ...good, healthOk: false, healthReason: 'InvalidDNSError', certState: undefined, httpsEnforced: false, httpsServes: false };
const a = assess(qa1);
expect('QA-1 case: re-check the domain', a.fixes.includes('recheck-domain'));
expect('QA-1 case: do not enforce without a certificate', !a.fixes.includes('enforce-https'));
expect('QA-1 case: problems listed', a.problems.length >= 3);
expect('certificate ready: enforce', assess({ ...good, httpsEnforced: false }).fixes.includes('enforce-https'));
expect('wrong public DNS: no domain re-check', !assess({ ...qa1, publicCname: null, publicA: false }).fixes.includes('recheck-domain'));
expect('apex with GitHub A records counts as right', assess({ ...good, publicCname: null, publicA: true }).problems.length === 0);
expect('no domain is a problem', assess({}).problems.length === 1);
export default fails;
