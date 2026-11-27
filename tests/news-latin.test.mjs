// Yangiliklar lotin yozuvida: lex.uz lotin lentasi birinchi, kirill zaxirasi frontendda lotinga o'giriladi.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import '../public/legal-core.js';
const {toLatin}=globalThis.HKCore;

test('kirill → lotin: o‘zbek harflari, e/ye, tutuq va katta harflar', () => {
 assert.equal(toLatin('Ўзбекистон Республикаси Президентининг қарори'),'O‘zbekiston Respublikasi Prezidentining qarori');
 assert.equal(toLatin('Енгил саноат ҳуқуқ ғалла эълон оилада'),'Yengil sanoat huquq g‘alla e’lon oilada');
 assert.equal(toLatin('ЎЗБЕКИСТОН ПҚ-407'),'O‘ZBEKISTON PQ-407');
 assert.equal(toLatin('Shahar oʻzgarmaydi 2026'),'Shahar oʻzgarmaydi 2026'); // lotin matn o'zgarmaydi
});

test('RSS: lotin lentasi birinchi, sarlavha lotinga o‘giriladi', () => {
 const src=fs.readFileSync('netlify/functions/news.mjs','utf8');
 assert.match(src,/RSS_URLS = \["https:\/\/lex\.uz\/uz\/rss", "https:\/\/lex\.uz\/rss"\]/);
 const ui=fs.readFileSync('public/ui.js','utf8');
 assert.match(ui,/escapeHtml\(lat\(it\.title\)\)/); assert.match(ui,/organName\(lat\(it\.organ\)\)/);
});
