// v11.5: manba ishonchliligi, umumiy limitlar, hisobni tiklash, DOCX, kitob parchalari, baza yangilash, baholash.
// Hamma tashqi xizmatlar (Gemini, Resend, Netlify Blobs) MOCK: xotiradagi ombor va soxta fetch.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';

process.env.HK_DEV_MEMORY_STORE = '1';
const { openStore, resetMemoryStore } = await import('../netlify/shared/store.mjs');
const rag = await import('../netlify/shared/rag.mjs');
const O = 'https://example.test';
let seq = 0;
const R = (path, method = 'GET', body, cookie) => new Request(O + path, { method, headers: { origin: O, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
const call = async (fn, path, method, body, cookie) => { const r = await fn(R(path, method, body, cookie), { ip: 'v115-' + seq++ }); const ct = r.headers.get('content-type') || ''; return { s: r.status, c: r.headers.get('set-cookie'), r, j: ct.includes('json') ? await r.json() : null }; };
const packet = (text) => ({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] });
const sse = (chunks) => new Response(new ReadableStream({ start(c) { for (const x of chunks) c.enqueue(new TextEncoder().encode(x)); c.close(); } }));
const withEnv = async (vars, fn) => { const old = {}; for (const k of Object.keys(vars)) { old[k] = process.env[k]; if (vars[k] == null) delete process.env[k]; else process.env[k] = vars[k]; } const of = globalThis.fetch; try { await fn(); } finally { globalThis.fetch = of; for (const k of Object.keys(old)) { if (old[k] === undefined) delete process.env[k]; else process.env[k] = old[k]; } } };

// ---------------- 1. Manba ishonchliligi ----------------
test('claim checks link each legal claim to a passage, part and band; weak and unsupported claims are not shown as confirmed', () => {
  const r = rag.retrieve('Qo‘shnimga qarz berdim, tilxat bor, muddat ko‘rsatilmagan, qaytarmayapti');
  const ans = ['Muddat belgilanmagan bo‘lsa, qarz oluvchi qarz beruvchi talab qilgan kundan boshlab o‘ttiz kun ichida qaytarishi kerak (FK 735-modda 2-qism).',
    'Qarz shartnomasi yozma shaklda tuzilishi shart (FK 733-modda 9-qism).',
    'Qarz beruvchi sudga murojaat qilib, ma’naviy zararni ikki baravar undiradi (FK 734-modda).',
    'Da’vo muddati uch yil (FK 150-modda).',
    'Qarzdor 10 kun ichida qaytarishi shart.'].join('\n');
  const { claims, unsupported } = rag.claimChecks(ans, r.provided);
  const by = (s) => claims.find((c) => c.where.startsWith(s));
  assert.equal(by('FK 735').icon, '✅'); assert.match(by('FK 735').where, /2-qism/); assert.match(by('FK 735').url, /-180552/); assert.equal(by('FK 735').asOf, '2026-06-23');
  assert.equal(by('FK 733').icon, '❌'); assert.match(by('FK 733').status, /9-qism yo‘q/);
  assert.equal(by('FK 734').icon, '⚠️', 'parcha berilgan, lekin da’vo mazmuni mos emas');
  assert.equal(by('FK 150').icon, 'ℹ️', 'modda bor, lekin parcha berilmagan');
  assert.equal(unsupported.length, 1);
  const rep = rag.citationReport(ans, r.provided);
  assert.match(rep, /Da’volar va asoslar/); assert.match(rep, /huquqiy kafolat emas/); assert.match(rep, /❔ «Qarzdor 10 kun ichida qaytarishi shart\.»/);
  assert.ok(!/✅[^\n]*734/.test(rep), 'asossiz xulosa tasdiqlangan deb ko‘rsatilmaydi');
});

test('event date before the stored edition: prompt forbids applying current text automatically and marks later-amended articles', () => {
  const art = rag.LAWS.mk.articles.find((a) => rag.changeDates(a).some((d) => d > '2024-01-01'));
  assert.ok(art, 'o‘zgartish izohi bor modda topilsin');
  const r = rag.retrieve(`MK ${art.art}-modda`, { k: 1, eventDate: '2024-01-01' });
  assert.match(r.block, /VOQEA SANASI \(2024-01-01\)[^\n]*Voqea paytidagi tahrir matni bazada YO‘Q/);
  assert.match(r.block, /⚠️ VOQEA SANASIDAN \(2024-01-01\) KEYIN O‘ZGARTIRILGAN/);
  const { claims } = rag.claimChecks(`Bu holatga MK ${art.art}-modda qo‘llanadi va xodim huquqlari himoya qilinadi.`, r.provided, { eventDate: '2024-01-01' });
  assert.ok(claims[0].later.length, 'voqeadan keyingi o‘zgartish sanasi ko‘rsatiladi');
  assert.ok(!/VOQEA SANASI/.test(rag.retrieve(`MK ${art.art}-modda`, { k: 1, eventDate: '2026-10-30' }).block), 'tahrirdan keyingi voqeada ogohlantirish yo‘q');
});

test('smart search marks how well the AI explanation matches the article and shows the edition date', async () => {
  const { normalizeResult } = await import('../netlify/functions/search.mjs');
  const out = normalizeResult({ natijalar: [
    { hujjat: 'Fuqarolik kodeksi', modda: '735', nima_uchun: 'Muddat belgilanmagan qarz qarz beruvchi talab qilgan kundan o‘ttiz kun ichida qaytariladi.' },
    { hujjat: 'Fuqarolik kodeksi', modda: '735', nima_uchun: 'Avtomobil sug‘urtasi bo‘yicha kompensatsiya.' }] }, [], rag.retrieve('qarz tilxat'));
  assert.equal(out.natijalar[0].asos, 'mos'); assert.equal(out.natijalar[0].tahrir, '2026-06-23');
  assert.equal(out.natijalar[1].asos, 'past');
});

// ---------------- 2. Ombor, limitlar, AI sarfi ----------------
test('store update is compare-and-swap: parallel writers do not overwrite each other', async () => {
  resetMemoryStore();
  const s = await openStore('t');
  await Promise.all(Array.from({ length: 40 }, () => s.update('k', (v) => ({ n: (v?.n || 0) + 1 }))));
  assert.equal((await s.get('k')).n, 40);
  assert.equal(await s.setIf('new', { a: 1 }, null), true); assert.equal(await s.setIf('new', { a: 2 }, null), false, 'onlyIfNew');
});

test('shared AI limits: kill switch, per-IP hourly, per-day global; kazus continuation also counts', async () => {
  resetMemoryStore();
  const { guardAi } = await import('../netlify/shared/limits.mjs');
  const req = () => new Request(O + '/api/chat', { method: 'POST' });
  await withEnv({ HK_AI_DISABLED: '1' }, async () => { const r = await guardAi(req(), { ip: '1.1.1.1' }, 'chat'); assert.equal(r.status, 503); });
  await withEnv({ HK_AI_IP_HOURLY: '3', HK_AI_DAILY_LIMIT: '100' }, async () => {
    for (let i = 0; i < 3; i++) assert.equal(await guardAi(req(), { ip: '2.2.2.2' }, 'chat'), null);
    assert.equal((await guardAi(req(), { ip: '2.2.2.2' }, 'chat')).status, 429, 'IP soatlik chegara');
    assert.equal(await guardAi(req(), { ip: '3.3.3.3' }, 'chat'), null, 'boshqa IP alohida hisoblanadi');
  });
  resetMemoryStore();
  await withEnv({ HK_AI_DAILY_LIMIT: '2', GEMINI_API_KEY: 'test-only-not-a-real-key', GEMINI_MODEL: null }, async () => {
    const { default: kazus } = await import('../netlify/functions/kazus.mjs');
    globalThis.fetch = async () => sse(['data: ' + JSON.stringify(packet('Tahlil davomi.'))]);
    const base = { kazus: 'Xodim kasallik davrida ishdan bo‘shatildi, ish beruvchi ogohlantirmagan. Huquqiy baho bering.', fan: 'mehnat' };
    const a = await kazus(R('/api/kazus', 'POST', base), { ip: 'k1' }); assert.equal(a.status, 200); await a.text();
    const b = await kazus(R('/api/kazus', 'POST', { ...base, continuation: { round: 1, partial: 'Oldingi qism matni '.repeat(4) } }), { ip: 'k2' }); assert.equal(b.status, 200); await b.text();
    const c = await kazus(R('/api/kazus', 'POST', { ...base, continuation: { round: 2, partial: 'Oldingi qism matni '.repeat(4) } }), { ip: 'k3' });
    assert.equal(c.status, 429, 'davom so‘rovi ham kunlik chegaraga kiradi'); assert.match((await c.json()).error, /bugungi AI sarf chegarasi/);
  });
});

test('provider logs scrub key-like values', async () => {
  const { scrubSecrets } = await import('../netlify/shared/common.mjs');
  const fake = ['AI', 'za', 'Sy'].join('') + 'Q'.repeat(33);
  assert.equal(scrubSecrets(`bad key ${fake} here`), 'bad key [maxfiy] here');
});

// ---------------- 3. Hisob: tasdiqlash, tiklash, parallel ----------------
test('password reset: generic answer, single-use hashed token with expiry, old sessions revoked; no "sent" claim without mail service', async () => {
  resetMemoryStore();
  const { default: auth } = await import('../netlify/functions/auth.mjs');
  const reg = await call(auth, '/api/auth/register', 'POST', { email: 'reset@mail.uz', password: 'parol1234', acceptOferta: true });
  assert.equal(reg.s, 201); assert.equal(reg.j.verification, 'not_configured'); assert.equal(reg.j.user.emailVerified, false);
  const oldCk = reg.c.split(';')[0];
  // Email xizmati yo'q — xat yuborildi deyilmaydi
  await withEnv({ RESEND_API_KEY: null, HK_MAIL_FROM: null }, async () => {
    const r = await call(auth, '/api/auth/reset-request', 'POST', { email: 'reset@mail.uz' });
    assert.equal(r.s, 503); assert.match(r.j.error, /sozlanmagan.*yuborilmadi/);
  });
  const mails = [];
  await withEnv({ RESEND_API_KEY: 'test-only-mail-key', HK_MAIL_FROM: 'HY <noreply@example.test>' }, async () => {
    globalThis.fetch = async (url, o) => { mails.push({ url, body: JSON.parse(o.body) }); return new Response('{"id":"x"}', { status: 200 }); };
    const a = await call(auth, '/api/auth/reset-request', 'POST', { email: 'reset@mail.uz' });
    const b = await call(auth, '/api/auth/reset-request', 'POST', { email: 'yoq@mail.uz' });
    assert.equal(a.s, 200); assert.deepEqual(a.j, b.j, 'email borligi oshkor qilinmaydi');
    assert.equal(mails.length, 1); assert.match(mails[0].url, /api\.resend\.com/);
    const token = mails[0].body.text.match(/#reset=([\w-]+)/)[1];
    const stored = await (await openStore('tokens')).get('t_' + (await import('../netlify/shared/auth.mjs')).sha256(token));
    assert.equal(stored.type, 'reset'); assert.ok(stored.exp - Date.now() <= 3600000); assert.ok(!JSON.stringify(stored).includes(token), 'token ochiq saqlanmaydi');
    const ok = await call(auth, '/api/auth/reset-confirm', 'POST', { token, password: 'yangiParol9' });
    assert.equal(ok.s, 200);
    assert.equal((await call(auth, '/api/auth/me', 'GET', null, oldCk)).j.user, null, 'eski sessiya bekor qilindi');
    assert.equal((await call(auth, '/api/auth/reset-confirm', 'POST', { token, password: 'boshqaParol9' })).s, 400, 'token bir martalik');
    assert.equal((await call(auth, '/api/auth/login', 'POST', { email: 'reset@mail.uz', password: 'yangiParol9' })).s, 200);
    // Muddati o'tgan token
    globalThis.fetch = async (url, o) => { mails.push({ url, body: JSON.parse(o.body) }); return new Response('{}', { status: 200 }); };
    await call(auth, '/api/auth/reset-request', 'POST', { email: 'reset@mail.uz' });
    const t2 = mails.at(-1).body.text.match(/#reset=([\w-]+)/)[1];
    const { sha256 } = await import('../netlify/shared/auth.mjs');
    await (await openStore('tokens')).update('t_' + sha256(t2), (t) => ({ ...t, exp: Date.now() - 1 }));
    assert.equal((await call(auth, '/api/auth/reset-confirm', 'POST', { token: t2, password: 'yangiParol10' })).s, 400, 'muddati o‘tgan');
  });
});

test('email verification works with one-time token; parallel registration creates only one account; parallel saves keep all items', async () => {
  resetMemoryStore();
  const { default: auth } = await import('../netlify/functions/auth.mjs');
  const { default: account } = await import('../netlify/functions/account.mjs');
  const res = await Promise.all(Array.from({ length: 5 }, () => call(auth, '/api/auth/register', 'POST', { email: 'par@mail.uz', password: 'parol1234', acceptOferta: true })));
  assert.equal(res.filter((r) => r.s === 201).length, 1); assert.equal(res.filter((r) => r.s === 409).length, 4);
  const ck = res.find((r) => r.s === 201).c.split(';')[0];
  const saves = await Promise.all(Array.from({ length: 12 }, (_, i) => call(account, '/api/account/items', 'POST', { op: 'add', type: 'kazus', title: 'T' + i, text: 'Tahlil matni '.repeat(5) }, ck)));
  assert.ok(saves.every((s) => s.s === 201));
  assert.equal((await call(account, '/api/account/items', 'GET', null, ck)).j.items.length, 12, 'parallel saqlashda yozuv yo‘qolmaydi');
  const mails = [];
  await withEnv({ RESEND_API_KEY: 'test-only-mail-key', HK_MAIL_FROM: 'HY <noreply@example.test>' }, async () => {
    globalThis.fetch = async (url, o) => { mails.push(JSON.parse(o.body)); return new Response('{}', { status: 200 }); };
    assert.equal((await call(auth, '/api/auth/verify-request', 'POST', {}, ck)).s, 200);
    const token = mails[0].text.match(/#verify=([\w-]+)/)[1];
    assert.equal((await call(auth, '/api/auth/verify-confirm', 'POST', { token })).j.user.emailVerified, true);
    assert.equal((await call(auth, '/api/auth/verify-confirm', 'POST', { token })).s, 400);
    assert.equal((await call(auth, '/api/auth/reset-confirm', 'POST', { token, password: 'boshqaParol9' })).s, 400, 'tasdiqlash tokeni parolni tiklamaydi');
  });
  assert.equal((await call(auth, '/api/auth/me', 'GET', null, ck)).j.user.emailVerified, true);
});

// ---------------- 4. DOCX ----------------
const { writeZip, readZip } = await import('../netlify/shared/zip.mjs');
const docxMod = await import('../netlify/shared/docx.mjs');
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
function sampleDocx({ complex = false } = {}) {
  const tplFiles = readZip(docxMod.defaultTemplate());
  const body = `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>KAZUS YECHIMI</w:t></w:r></w:p>`
    + `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>1. Fabula</w:t></w:r></w:p>`
    + `<w:p><w:pPr><w:spacing w:line="480" w:lineRule="auto"/><w:jc w:val="both"/><w:ind w:firstLine="567"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="24"/></w:rPr><w:t>Aliyev Botir Karimov Sardorga besh million so‘m qarz berdi, tilxat yozilgan va muddat kelishilmagan edi.</w:t></w:r></w:p>`
    + `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>2. Xulosa</w:t></w:r></w:p>`
    + `<w:p><w:pPr><w:spacing w:line="480" w:lineRule="auto"/><w:jc w:val="both"/><w:ind w:firstLine="567"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="24"/></w:rPr><w:t>Aliyev Botir sudga murojaat qilishga haqli deb hisoblayman, chunki qarz qaytarilmagan.</w:t></w:r></w:p>`
    + (complex ? `<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Jadval</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:r><w:drawing/></w:r></w:p>` : '')
    + `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="567" w:bottom="1134" w:left="1985" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>`;
  tplFiles.set('word/document.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}</w:body></w:document>`));
  tplFiles.set('docProps/core.xml', Buffer.from('<?xml version="1.0"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>Aliyev Botir</dc:creator></cp:coreProperties>'));
  return writeZip(tplFiles);
}

test('DOCX template: format is read from styles and paragraphs; outline contains only headings', () => {
  const info = docxMod.inspectDocx(sampleDocx());
  assert.equal(info.format.font, 'Arial'); assert.equal(info.format.sizePt, 12); assert.equal(info.format.lineSpacing, 2);
  assert.equal(info.format.align, 'both'); assert.equal(info.format.firstLineMm, 10);
  assert.deepEqual(info.format.marginsMm, { top: 25, right: 10, bottom: 20, left: 35 });
  assert.deepEqual(info.outline.map((o) => o.text), ['KAZUS YECHIMI', '1. Fabula', '2. Xulosa']);
  assert.ok(!JSON.stringify(info).includes('Aliyev'), 'namuna matni (shaxslar, faktlar) qaytarilmaydi');
  const complex = docxMod.inspectDocx(sampleDocx({ complex: true }));
  assert.ok(complex.warnings.some((w) => /jadval/i.test(w)) && complex.warnings.some((w) => /Rasm/.test(w)));
});

test('DOCX build: real OOXML package in the template format, without the sample text or its author', () => {
  const md = '# Kazus bo‘yicha yechim\n\n## Faktlar\nQarz beruvchi **Nodira** pulni qaytarmagan.\n\n## Normalar\n1. FK 735-modda 2-qism.\n- Talabnoma\n\n| A | B |\n|---|---|\n| x | y |';
  const { buffer } = docxMod.buildDocx(sampleDocx(), md, { title: 'Test' });
  const files = readZip(buffer);
  const doc = files.get('word/document.xml').toString();
  assert.ok(files.has('[Content_Types].xml') && files.has('word/styles.xml'));
  assert.ok(!doc.includes('Aliyev') && !files.get('docProps/core.xml').toString().includes('Aliyev'), 'namuna matni va muallifi ko‘chirilmaydi');
  assert.match(doc, /<w:pgMar w:top="1418" w:right="567" w:bottom="1134" w:left="1985"/, 'sahifa chegaralari saqlanadi');
  assert.match(doc, /<w:pPr><w:spacing w:line="480" w:lineRule="auto"\/><w:jc w:val="both"\/><w:ind w:firstLine="567"\/><\/w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"\/><w:sz w:val="24"\/><\/w:rPr><w:t xml:space="preserve">Qarz beruvchi /, 'asosiy matn formati (shrift, o‘lcham, interval, tekislash, xatboshi) saqlanadi');
  assert.match(doc, /<w:pStyle w:val="Heading2"\/><\/w:pPr><w:r><w:t xml:space="preserve">Faktlar/);
  assert.match(doc, /<w:b\/><w:bCs\/>[^]*?Nodira/); assert.match(doc, /A — B/);
  assert.match(files.get('docProps/core.xml').toString(), /HuquqYordamchi/);
  // Standart shablon (namunasiz)
  const def = readZip(docxMod.buildDocx(null, md).buffer);
  assert.match(def.get('word/styles.xml').toString(), /Times New Roman/);
});

test('DOCX safety: old .doc, macro, oversized, path traversal and zip bomb are rejected', () => {
  assert.throws(() => docxMod.openDocx(Buffer.concat([Buffer.from('d0cf11e0a1b11ae1', 'hex'), Buffer.alloc(100)])), /eski \.doc/);
  const files = readZip(sampleDocx()); files.set('word/vbaProject.bin', Buffer.from('x'));
  assert.throws(() => docxMod.openDocx(writeZip(files)), /Makros/);
  assert.throws(() => docxMod.openDocx(Buffer.alloc(docxMod.MAX_DOCX_BYTES + 1)), /2 MB/);
  assert.throws(() => readZip(writeZip([['../evil.xml', 'x'], ['[Content_Types].xml', 'x']])), /xavfli nom/);
  const bomb = writeZip([['word/document.xml', Buffer.alloc(20 * 1024 * 1024)]]); // 20 MB nol → ~20 KB
  assert.throws(() => readZip(bomb), /juda katta/);
});

test('DOCX endpoint returns a Word file with the right MIME type and rejects non-docx names', async () => {
  const { default: docx } = await import('../netlify/functions/docx.mjs');
  const ok = await docx(R('/api/docx/build', 'POST', { text: '# Yechim\n\nMatn matn matn matn matn.', template: sampleDocx().toString('base64'), templateName: 'namuna.docx' }), { ip: 'd1' });
  assert.equal(ok.status, 200); assert.equal(ok.headers.get('content-type'), docxMod.DOCX_MIME);
  assert.equal(Buffer.from(await ok.arrayBuffer()).subarray(0, 2).toString(), 'PK');
  const bad = await call(docx, '/api/docx/inspect', 'POST', { file: 'AAAA', name: 'namuna.doc' });
  assert.equal(bad.s, 400); assert.match(bad.j.error, /\.docx/);
});

// ---------------- 5. Kitob parchalari ----------------
test('book excerpts: rights confirmation required, search needs enough overlap, kazus cites page only from uploaded excerpts', async () => {
  resetMemoryStore();
  const { default: auth } = await import('../netlify/functions/auth.mjs');
  const { default: books } = await import('../netlify/functions/books.mjs');
  const ck = (await call(auth, '/api/auth/register', 'POST', { email: 'kitob@mail.uz', password: 'parol1234', acceptOferta: true })).c.split(';')[0];
  const text = '[45]\nQarz shartnomasi real shartnoma hisoblanadi: u pul yoki ashyo qarz oluvchiga topshirilgan paytdan boshlab tuzilgan hisoblanadi. Qarz summasini qaytarish muddati belgilanmagan bo‘lsa, qarz beruvchining talabi muhim ahamiyatga ega.\n[46]\nTilxat qarz shartnomasi tuzilganini tasdiqlovchi yozma dalil hisoblanadi va sud amaliyotida keng qo‘llanadi.';
  const base = { op: 'add', title: 'Fuqarolik huquqi. Darslik', author: 'Muallif A.', year: 2020, origin: 'O‘zim sotib olgan kitobdan', text };
  assert.equal((await call(books, '/api/account/books', 'POST', base, ck)).s, 400, 'huquq tasdig‘isiz qabul qilinmaydi');
  assert.equal((await call(books, '/api/account/books', 'POST', { ...base, rightsConfirmed: true }, ck)).s, 201);
  const list = (await call(books, '/api/account/books', 'GET', null, ck)).j;
  assert.equal(list.books[0].pages, 2); assert.ok(!('text' in list.books[0]));
  assert.equal(list.sources.find((s) => s.id === 'tsul').status, 'not_connected');
  const { searchBooks } = await import('../netlify/shared/books.mjs');
  const { findUser } = await import('../netlify/shared/auth.mjs');
  const user = await findUser('kitob@mail.uz');
  const hits = await searchBooks('Qarz shartnomasi muddati belgilanmagan, qarz beruvchi talab qildi, tilxat bor', { user });
  assert.equal(hits[0].page, 45);
  assert.equal((await searchBooks('Svetoforda jarima kamera shikoyat', { user })).length, 0, 'mos bo‘lmagan parcha ishlatilmaydi');
  await withEnv({ GEMINI_API_KEY: 'test-only-not-a-real-key', GEMINI_MODEL: null }, async () => {
    const { default: kazus } = await import('../netlify/functions/kazus.mjs');
    let sys = '';
    globalThis.fetch = async (url, o) => { sys = JSON.parse(o.body).system_instruction.parts[0].text; return sse(['data: ' + JSON.stringify(packet('Tahlil.'))]); };
    const r = await kazus(R('/api/kazus', 'POST', { kazus: 'Qarz beruvchi qarz shartnomasi bo‘yicha pul berdi, qaytarish muddati belgilanmagan, tilxat bor. Talab qilindi.', fan: 'fuqarolik', useBooks: true }, ck), { ip: 'b1' });
    const out = await r.text();
    assert.match(sys, /FOYDALANUVCHI YUKLAGAN KITOB PARCHALARI[\s\S]*Muallif A\. Fuqarolik huquqi\. Darslik, 2020, 45-bet/);
    assert.match(out, /Kitob manbalari:\*\* Tahlilga berilgan kitob parchalari[^\n]*45-bet/); assert.match(out, /TSUL manbasi:\*\* TSUL kitob matni bu tahlilga avtomatik olinmagan/);
    const r2 = await kazus(R('/api/kazus', 'POST', { kazus: 'Haydovchi svetoforning qizil chirog‘ida o‘tdi, kamera jarima yozdi, shikoyat qilmoqchi.', fan: 'mamuriy', useBooks: true }, ck), { ip: 'b2' });
    assert.match(await r2.text(), /yetarli mos joy topilmadi — javob kitobga asoslanmagan/);
  });
});

// ---------------- 6. Baza yangilash ----------------
test('law update validation rejects empty, duplicate and lost articles; manifest separates publication and import dates', async () => {
  const { validateLaw, pendingEffective } = await import('../scripts/check-law-updates.mjs');
  const ok = rag.LAWS.ok;
  assert.deepEqual(validateLaw(ok, ok), []);
  const broken = structuredClone(ok); broken.articles[1].parts = ['']; broken.articles.push(structuredClone(broken.articles[2])); broken.articles.splice(10, 1);
  const p = validateLaw(broken, ok).join(' | ');
  assert.match(p, /bo‘sh yoki juda qisqa matn/); assert.match(p, /takroriy modda/); assert.match(p, /yo‘qolgan moddalar/);
  assert.deepEqual(pendingEffective({ articles: [{ art: '5', changes: ['(5-modda ... Qonuniga asosan 2099-yil 1-yanvardan kuchga kiradi)'] }] }, '2026-10-31'), [{ art: '5', date: '2099-01-01' }]);
  const m = JSON.parse(fs.readFileSync(new URL('../data/laws/manifest.json', import.meta.url)));
  for (const k of ['mk', 'ok', 'fk1', 'fk2', 'fpk', 'jk', 'jpk', 'mjtk', 'kon', 'sk', 'ujk', 'ipk', 'ist', 'plenum26']) {
    assert.ok(m[k] && m[k].publishedAt && m[k].importedAt && m[k].sha256, k); assert.deepEqual(m[k].problems, []);
  }
  assert.equal(m.plenum26.autoUpdate, false);
  const wf = fs.readFileSync(new URL('../.github/workflows/law-update.yml', import.meta.url), 'utf8');
  assert.match(wf, /data\/laws\/archive/);
});

// ---------------- 7. Baholash to'plami ----------------
test('evaluation set: 30 cases across fields and kinds, expected sources exist, lawyer review pending; offline retrieval recall measured', async () => {
  const { cases } = JSON.parse(fs.readFileSync(new URL('../eval/cases.json', import.meta.url)));
  assert.ok(cases.length >= 30);
  for (const k of ['oddiy', 'murakkab', 'fanlararo', 'eski_sana', 'malumot_yetishmaydi']) assert.ok(cases.some((c) => c.kind === k), k);
  assert.ok(new Set(cases.map((c) => c.fan)).size >= 12);
  const { parseSource, evalRetrieval } = await import('../scripts/eval-rag.mjs');
  for (const c of cases) {
    assert.equal(c.lawyerReview, 'kutilmoqda');
    for (const s of c.expectSources) { const { code, art } = parseSource(s); assert.ok(rag.articleInfo(art, code)?.title, `${c.id}: ${s}`); }
  }
  const rows = cases.map((c) => evalRetrieval(c));
  const recall = rows.reduce((s, r) => s + r.recall, 0) / rows.length;
  assert.ok(recall >= 0.95, `oflayn manba topish: ${recall.toFixed(3)}`);
  assert.ok(rows.filter((r) => r.editionWarning !== null).every((r) => r.editionWarning), 'eski sanali holatlarda tahrir ogohlantirishi');
  assert.deepEqual(rows.find((r) => r.kind === 'malumot_yetishmaydi').codes, [], 'ma’lumot yetishmasa, manba to‘qilmaydi');
});
