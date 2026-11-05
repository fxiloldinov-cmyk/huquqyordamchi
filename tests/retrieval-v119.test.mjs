import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {retrieve} from '../netlify/shared/rag.mjs';
import {evalRetrieval} from '../scripts/eval-rag.mjs';
const {cases}=JSON.parse(fs.readFileSync(new URL('../eval/cases.json',import.meta.url)));
test('mixed family/theft and consumer/procedure questions keep all expected source candidates',()=>{
 for(const id of ['E44','E45']){const c=cases.find(c=>c.id===id);const r=evalRetrieval(c);assert.deepEqual(r.missing,[],id)}
 const r=retrieve('Sobiq erim telefonimni o‘g‘irlab ketdi. Bitta bolamiz bor, aliment qancha bo‘lishi kerak?',{k:8});
 assert.ok(r.provided.ok.has('99'));assert.ok(r.provided.jk.has('169'));
});
test('all 46 unreviewed retrieval fixtures retain expected candidates, including single-field E32',()=>{
 // Bu manba topish kontrakti. Kutilgan huquqiy xulosalarni tasdiqlash emas.
 for(const c of cases){const r=evalRetrieval(c);assert.equal(r.recall,1,`${c.id}: ${r.missing.join(',')}`)}
});
