import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('current version, lockfile and report describe actual feature gates and unverified work',()=>{
 const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url))),lock=JSON.parse(fs.readFileSync(new URL('../package-lock.json',import.meta.url)));
 assert.equal(pkg.version,'11.11.0');assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);
 const doc=fs.readFileSync(new URL('../docs/V11_9_HISOBOT_UZ.md',import.meta.url),'utf8');
 for(const token of ['emailVerified','HK_PILOT_ENTITLEMENTS','HK_INTERNATIONAL_ENABLED','HK_FREE_REQUESTS','not_imported','GitHub Actions'])assert.ok(doc.includes(token));
 assert.ok(!/tayyor|ishonchli|yurist tasdiqlagan/i.test(doc));assert.match(doc,/sinovdan o‘tkazilmadi/);
});
