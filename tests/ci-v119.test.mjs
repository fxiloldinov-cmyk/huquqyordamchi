import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('PR CI runs install, build, tests and offline evaluation without write access or deployment',()=>{
 const y=fs.readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
 assert.match(y,/on:\s*\n\s+pull_request:/);assert.match(y,/contents: read/);
 const steps=[...y.matchAll(/- run: (.+)/g)].map(m=>m[1]);assert.deepEqual(steps,['npm ci','npm run build','npm test','npm run eval']);
 assert.ok(!/pull_request_target|secrets\.|contents: write|--live|gh pr merge|netlify deploy|auto.?merge/i.test(y));
 assert.match(y,/GEMINI_API_KEY: ''/);assert.match(y,/API_KEY: ''/);
});
