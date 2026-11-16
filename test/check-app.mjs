// Tests for build/check-app.mjs: the JWT shape and the permission comparison. No network.
import { jwt, compare } from '../build/check-app.mjs';
import { generateKeyPairSync, createVerify } from 'node:crypto';
let fails = 0;
const expect = (l, c) => { if (!c) { fails++; console.log(`check-app: ${l}`); } };
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs1', format: 'pem' });
const t = jwt('12345', pem, 1000000);
const [h, b, s] = t.split('.');
expect('JWT verifies with the public half', createVerify('RSA-SHA256').update(`${h}.${b}`).verify(publicKey, Buffer.from(s, 'base64url')));
const body = JSON.parse(Buffer.from(b, 'base64url').toString());
expect('JWT claims', body.iss === '12345' && body.exp - body.iat <= 600);
const good = { metadata: 'read', contents: 'write', workflows: 'write', administration: 'write', pages: 'write', actions: 'write' };
expect('full set passes', compare(good).problems.length === 0);
expect('missing pages caught', compare({ ...good, pages: undefined }).problems.some((p) => p.includes('pages')));
expect('read-only contents caught', compare({ ...good, contents: 'read' }).problems.some((p) => p.includes('contents')));
expect('extra listed', compare({ ...good, issues: 'write' }).extra.includes('issues'));
export default fails;
