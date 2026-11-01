// v11.7: manba ishonchliligi (da'vo ↔ parcha), ombor atomarligi, sayt manzili.
// Tashqi xizmatlar MOCK: Netlify Blobs SDK shaklidagi soxta adapter, Gemini — soxta fetch.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

process.env.HK_DEV_MEMORY_STORE = '1';
const store = await import('../netlify/shared/store.mjs');
const rag = await import('../netlify/shared/rag.mjs');
const O = 'https://example.test';
const R = (path, method = 'GET', body, cookie) => new Request(O + path, { method, headers: { origin: O, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });

// ---------------- 1. Da'vo ↔ manba ----------------
const QARZ = 'Qo‘shnimga qarz berdim, tilxat bor, muddat ko‘rsatilmagan, qaytarmayapti';
const one = (text, opts) => rag.claimChecks(text, rag.retrieve(QARZ).provided, opts).claims[0];

test('lexical overlap never yields a green confirmation; existence, overlap, quote and lawyer review are separate fields', () => {
  const c = one('Muddat belgilanmagan bo‘lsa, qarz oluvchi qarz beruvchi talab qilgan kundan boshlab o‘ttiz kun ichida qaytarishi kerak (FK 735-modda 2-qism).');
  assert.notEqual(c.icon, '✅');
  assert.equal(c.exists, true); assert.equal(c.given, true); assert.equal(c.overlap.level, 'yuqori'); assert.equal(c.reviewed, false);
  assert.match(c.overlap.method, /leksik/);
  for (const k of ['claimId', 'sourceId', 'doc', 'art', 'qism', 'url', 'edition', 'method', 'excerpt']) assert.ok(c[k] != null, k);
  assert.equal(c.sourceId, 'FK:735'); assert.equal(c.qism, 2); assert.match(c.excerpt, /o.ttiz kun/);
});

test('quotes are checked against the official text in code; a found quote is not presented as a correct conclusion', () => {
  const ok = one('FK 735-modda 2-qismida «qarz oluvchi uni qarz beruvchi qarzni qaytarish haqida talab qo‘ygan kundan boshlab o‘ttiz kun mobaynida qaytarishi kerak» deyilgan.');
  assert.equal(ok.quote.found, true); assert.equal(ok.icon, '🔎'); assert.match(ok.status, /kafolatlamaydi/);
  const shortened = one('FK 735-modda 2-qismi: «qarz oluvchi uni … o‘ttiz kun mobaynida qaytarishi kerak».');
  assert.equal(shortened.quote.found, true, '… bilan qisqartirilgan iqtibos bo‘laklari tartib bilan topiladi');
  const fake = one('FK 735-modda 2-qismida «qarz oluvchi qarzni talab qilingan kundan e’tiboran o‘n kun ichida qaytarishi lozim» deyilgan.');
  assert.equal(fake.quote.found, false); assert.equal(fake.icon, '⚠️'); assert.ok(fake.risks.some((r) => r.type === 'iqtibos'));
});

test('counterexamples: negation, wrong subject, wrong term and amount are flagged even with high word overlap', () => {
  const neg = one('Muddat belgilanmagan bo‘lsa, qarz oluvchi qarzni qaytarishi shart emas (FK 735-modda 2-qism).');
  assert.equal(neg.icon, '⚠️'); assert.ok(neg.risks.some((r) => r.type === 'inkor'));
  const subj = one('Muddat belgilanmagan bo‘lsa, ish beruvchi qarzni talab qilgan kundan boshlab o‘ttiz kun ichida qaytaradi (FK 735-modda 2-qism).');
  assert.equal(subj.icon, '⚠️'); assert.ok(subj.risks.some((r) => r.type === 'subyekt' && /ish beruvchi/.test(r.note)));
  const term = one('Muddat belgilanmagan bo‘lsa, qarz oluvchi qarz beruvchi talab qilgan kundan boshlab o‘n kun ichida qaytarishi kerak (FK 735-modda 2-qism).');
  assert.equal(term.icon, '⚠️'); assert.ok(term.risks.some((r) => r.type === 'muddat' && /10 kun/.test(r.note)));
  // "o'ttiz kun" = "30 kun": raqam va so'z bir xil hisoblanadi
  assert.ok(!one('Qarz oluvchi talab qo‘yilgan kundan boshlab 30 kun mobaynida qaytarishi kerak (FK 735-modda 2-qism).').risks.some((r) => r.type === 'muddat'));
});

test('exception clause in the source but omitted in the claim is flagged', () => {
  const src = 'Mehnat shartnomasi ish beruvchining tashabbusi bilan bekor qilinishi mumkin, qonunda nazarda tutilgan hollar bundan mustasno.';
  assert.ok(rag.claimRisks('Ish beruvchi mehnat shartnomasini bekor qilishi mumkin.', src).some((r) => r.type === 'istisno'));
  assert.ok(!rag.claimRisks('Ish beruvchi mehnat shartnomasini bekor qilishi mumkin, qonunda nazarda tutilgan hollar bundan mustasno.', src).some((r) => r.type === 'istisno'));
});

test('wrong edition: amended after the event date is a risk; current text is never auto-applied to an older event', () => {
  const art = rag.LAWS.mk.articles.find((a) => rag.changeDates(a).some((d) => d > '2024-01-01'));
  const r = rag.retrieve(`MK ${art.art}-modda`, { k: 1, eventDate: '2024-01-01' });
  const c = rag.claimChecks(`Bu holatga MK ${art.art}-modda qo‘llanadi va xodim huquqlari himoya qilinadi.`, r.provided, { eventDate: '2024-01-01' }).claims[0];
  assert.equal(c.icon, '⚠️'); assert.ok(c.risks.some((x) => x.type === 'tahrir'));
  assert.match(r.block, /Hozirgi matnni voqeaga avtomatik qo‘llamang/);
});

test('missing sources produce a clear limitation and clarifying questions, not a confirmation', () => {
  const rep = rag.citationReport('Sizning holatingizda ariza yozishingiz shart va pul qaytariladi.', rag.retrieve(QARZ).provided);
  assert.match(rep, /Manba yetishmadi/); assert.match(rep, /Voqea qachon sodir bo‘lgan/); assert.ok(!/✅/.test(rep));
  assert.ok(rag.clarifyingQuestions('salom', null).some((q) => /mos parcha topilmadi/.test(q)));
});

test('second-model verdicts are labelled as automatic assessments', () => {
  const { claims } = rag.claimChecks('Qarz o‘ttiz kun ichida qaytariladi (FK 735-modda 2-qism).', rag.retrieve(QARZ).provided);
  rag.applyModelVerdicts(claims, { [claims[0].claimId]: 'mos keladi' });
  assert.equal(claims[0].model.label, 'avtomatik baho (ikkinchi model)'); assert.equal(claims[0].reviewed, false);
});

test('structured sources marker carries passages and claims for the sources panel and is stripped by the client', async () => {
  const r = rag.retrieve(QARZ);
  const m = rag.sourcesMarker('Qarz o‘ttiz kun ichida qaytariladi (FK 735-modda 2-qism).', r);
  assert.ok(m.startsWith(rag.HK_SRC) && m.endsWith('⁣'));
  const p = JSON.parse(decodeURIComponent(m.slice(rag.HK_SRC.length, -1)));
  assert.ok(p.passages.length >= 1 && p.passages.every((x) => x.sourceId && x.text && x.url));
  assert.equal(p.claims[0].sourceId, 'FK:735'); assert.ok(!('text' in p.claims[0]));
  const ui = fs.readFileSync(new URL('../public/workspace.js', import.meta.url), 'utf8');
  assert.match(ui, /HK:SRC:/);
});

test('chat and kazus append the structured sources marker after the citation report', async () => {
  const { default: chat } = await import('../netlify/functions/chat.mjs');
  const old = { k: process.env.GEMINI_API_KEY, f: globalThis.fetch };
  process.env.GEMINI_API_KEY = 'test-only-not-a-real-key';
  globalThis.fetch = async () => new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Qarz o‘ttiz kun ichida qaytariladi (FK 735-modda 2-qism).' }] }, finishReason: 'STOP' }] }) + '\n')); c.close(); } }));
  try {
    const res = await chat(R('/api/chat', 'POST', { messages: [{ role: 'user', content: QARZ }] }), { ip: 'v117-chat' });
    const text = await res.text();
    assert.match(text, /Manba tekshiruvi/); assert.match(text, /⁣HK:SRC:[^⁣]+⁣$/);
  } finally { globalThis.fetch = old.f; if (old.k === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = old.k; }
});

// ---------------- 2. Ombor atomarligi ----------------
// Netlify Blobs SDK (8.2+/11.x) shaklidagi soxta adapter: getWithMetadata → { data, etag }, setJSON → { modified, etag }.
function fakeBlobs({ conditional = true, delay = 0 } = {}) {
  const data = new Map(); let n = 0;
  const wait = () => new Promise((r) => setTimeout(r, Math.random() * delay));
  return { getStore: () => ({
    async get(k) { await wait(); return data.has(k) ? structuredClone(data.get(k).v) : null; },
    async getWithMetadata(k) { await wait(); const e = data.get(k); return e ? { data: structuredClone(e.v), etag: e.etag, metadata: {} } : null; },
    async setJSON(k, v, o = {}) {
      await wait();
      if (!conditional) { data.set(k, { v: structuredClone(v), etag: String(++n) }); return undefined; }
      const cur = data.get(k);
      if ((o.onlyIfNew && cur) || (o.onlyIfMatch && (!cur || cur.etag !== o.onlyIfMatch))) return { modified: false, etag: undefined };
      const etag = String(++n); data.set(k, { v: structuredClone(v), etag }); return { modified: true, etag };
    },
    async delete(k) { data.delete(k); },
  }) };
}

test('real-SDK-shaped adapter: parallel compare-and-swap writers do not lose updates; onlyIfNew conflicts', async () => {
  store.setBlobsAdapterForTests(fakeBlobs({ delay: 4 }));
  try {
    const s = await store.openStore('t');
    await Promise.all(Array.from({ length: 25 }, () => s.update('k', (v) => ({ n: (v?.n || 0) + 1 }), { retries: 60 })));
    assert.equal((await s.get('k')).n, 25);
    assert.equal(await s.setIf('new', { a: 1 }, null), true); assert.equal(await s.setIf('new', { a: 2 }, null), false);
  } finally { store.setBlobsAdapterForTests(null); }
});

test('SDK without a verifiable conditional write: update throws, never reports success; limits and accounts fail safely', async () => {
  store.setBlobsAdapterForTests(fakeBlobs({ conditional: false }));
  try {
    const s = await store.openStore('t');
    await assert.rejects(s.update('k', () => ({ n: 1 })), store.StoreNotAtomic);
    const { guardAi } = await import('../netlify/shared/limits.mjs');
    const r = await guardAi(new Request(O + '/api/chat', { method: 'POST' }), { ip: '9.9.9.9' }, 'chat');
    assert.equal(r.status, 503); const j = await r.json();
    assert.match(j.error, /vaqtincha ishlamayapti/); assert.ok(!/Blobs|etag|modified|SDK/i.test(j.error), 'foydalanuvchiga ichki sabab ko‘rsatilmaydi');
    const { default: auth } = await import('../netlify/functions/auth.mjs');
    const reg = await auth(R('/api/auth/register', 'POST', { email: 'atomic@example.test', password: 'Kuchli-parol-123', acceptOferta: true }), { ip: 'v117-reg' });
    assert.equal(reg.status, 503, 'hisob yaratilgan deb aytilmaydi');
  } finally { store.setBlobsAdapterForTests(null); }
});

test('Blobs environment missing: StoreUnavailable, not a crash', async () => {
  store.setBlobsAdapterForTests({ getStore() { throw Object.assign(new Error('x'), { name: 'MissingBlobsEnvironmentError' }); } });
  try { await assert.rejects(store.openStore('t'), store.StoreUnavailable); } finally { store.setBlobsAdapterForTests(null); }
});

test('@netlify/blobs is pinned by package-lock.json to a version with conditional writes', () => {
  const lock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const v = lock.packages['node_modules/@netlify/blobs'].version;
  assert.ok(+v.split('.')[0] >= 9 || (v.startsWith('8.') && +v.split('.')[1] >= 2), v);
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.ok(!/^>=/.test(pkg.dependencies['@netlify/blobs']), 'ochiq diapazon emas');
});

// ---------------- 4. Ishlar: bog'langan saqlash va qat'iy ajratish ----------------
let ipSeq = 0;
async function signup(email) {
  const { default: auth } = await import('../netlify/functions/auth.mjs');
  const r = await auth(R('/api/auth/register', 'POST', { email, password: 'Kuchli-parol-123', acceptOferta: true }), { ip: 'v117-su-' + ipSeq++ });
  assert.equal(r.status, 201, await r.clone().text());
  return r.headers.get('set-cookie').split(';')[0];
}
const casesCall = async (method, body, cookie, query = '') => {
  const { default: cases } = await import('../netlify/functions/cases.mjs');
  const r = await cases(R('/api/account/cases' + query, method, body, cookie), { ip: 'v117-c-' + ipSeq++ });
  return { s: r.status, j: await r.json() };
};

test('a case links question, date, field, answer, structured sources and document versions', async () => {
  store.resetMemoryStore();
  const a = await signup('ish-a@example.test');
  const c = (await casesCall('POST', { op: 'create', title: 'Qarz ishi', kind: 'vaziyat', soha: 'Fuqarolik huquqi', eventDate: '2026-05-01' }, a)).j.case;
  const src = rag.sourcesPayload('Qarz o‘ttiz kun ichida qaytariladi (FK 735-modda 2-qism).', rag.retrieve(QARZ));
  const ap = await casesCall('POST', { op: 'append', id: c.id, entry: { task: 'chat', question: QARZ, answer: 'Qarz o‘ttiz kun ichida qaytariladi (FK 735-modda 2-qism).', sources: { ...src, evil: '<script>' } } }, a);
  assert.equal(ap.s, 201);
  assert.equal((await casesCall('POST', { op: 'doc', id: c.id, title: 'Talabnoma', text: 'Talabnoma matni: qarzni o‘ttiz kun ichida qaytaring.' }, a)).j.doc.version, 1);
  assert.equal((await casesCall('POST', { op: 'doc', id: c.id, text: 'Talabnoma matni, ikkinchi tahrir: qarzni qaytaring.' }, a)).j.doc.version, 2);
  const full = (await casesCall('GET', null, a, '?id=' + c.id)).j.case;
  assert.equal(full.eventDate, '2026-05-01'); assert.equal(full.soha, 'Fuqarolik huquqi');
  assert.equal(full.entries[0].sources.passages[0].sourceId.split(':')[0], 'FK'); assert.ok(!('evil' in full.entries[0].sources), 'faqat kutilgan maydonlar saqlanadi');
  assert.equal(full.entries[0].sources.claims[0].sourceId, 'FK:735'); assert.equal(full.docs.length, 2);
  const list = (await casesCall('GET', null, a)).j.cases;
  assert.equal(list[0].entries, 1); assert.equal(list[0].docs, 2); assert.ok(list[0].sources >= 1);
});

test('strict isolation: another account cannot read, change or delete a case by its ID', async () => {
  store.resetMemoryStore();
  const a = await signup('iso-a@example.test'), b = await signup('iso-b@example.test');
  const c = (await casesCall('POST', { op: 'create', title: 'Maxfiy ish' }, a)).j.case;
  assert.equal((await casesCall('GET', null, b, '?id=' + c.id)).s, 404);
  for (const body of [{ op: 'append', id: c.id, entry: { question: 'Begona yozuv matni', answer: 'Begona javob matni' } }, { op: 'doc', id: c.id, text: 'Begona hujjat matni, yigirma belgidan ko‘p.' }, { op: 'update', id: c.id, title: 'Buzilgan' }, { op: 'delete', id: c.id }])
    assert.equal((await casesCall('POST', body, b)).s, 404, body.op);
  assert.equal((await casesCall('GET', null, b)).j.cases.length, 0);
  const still = (await casesCall('GET', null, a, '?id=' + c.id)).j.case;
  assert.equal(still.title, 'Maxfiy ish'); assert.equal(still.entries.length, 0);
  assert.equal((await casesCall('GET', null, null)).s, 401);
  assert.equal((await casesCall('GET', null, a, '?id=../../ci_x')).s, 404, 'ID formati tekshiriladi');
});

test('old saved items are not lost: they stay in place and can be turned into a case', async () => {
  store.resetMemoryStore();
  const a = await signup('old@example.test');
  const { default: account } = await import('../netlify/functions/account.mjs');
  const add = await account(R('/api/account/items', 'POST', { op: 'add', type: 'kazus', title: 'Eski kazus', text: 'Eski kazus tahlili matni, yetarlicha uzun.' }, a), { ip: 'v117-it' });
  const item = (await add.json()).item;
  const r = await casesCall('POST', { op: 'import-item', itemId: item.id }, a);
  assert.equal(r.s, 201); assert.equal(r.j.case.kind, 'kazus'); assert.match(r.j.case.entries[0].answer, /Eski kazus tahlili/);
  const items = await (await account(R('/api/account/items', 'GET', null, a), { ip: 'v117-it2' })).json();
  assert.equal(items.items.length, 1, 'asl material o‘chirilmaydi');
});

test('deleting the account removes all cases', async () => {
  store.resetMemoryStore();
  const a = await signup('del@example.test');
  const c = (await casesCall('POST', { op: 'create', title: 'Ish' }, a)).j.case;
  const { currentUser } = await import('../netlify/shared/auth.mjs');
  const uid = (await currentUser(R('/', 'GET', null, a))).user.id;
  const s = await store.openStore('cases');
  assert.ok(await s.get(`c_${uid}_${c.id}`));
  const { default: auth } = await import('../netlify/functions/auth.mjs');
  assert.equal((await auth(R('/api/auth/delete', 'POST', { password: 'Kuchli-parol-123' }, a), { ip: 'v117-del' })).status, 200);
  assert.equal(await s.get(`c_${uid}_${c.id}`), null); assert.equal(await s.get(`ci_${uid}`), null);
});

// ---------------- 5. Kitoblar, talaba rejimi ----------------
test('kazus: only the books the student ticked are used; book passages are marked as user uploads, not verified sources', async () => {
  store.resetMemoryStore();
  const a = await signup('kitob@example.test');
  const { default: books } = await import('../netlify/functions/books.mjs');
  const text = '[12-bet] Qarz shartnomasi bo‘yicha qarz oluvchi qarz summasini shartnomada belgilangan muddatda qaytarishi shart. Muddat belgilanmagan bo‘lsa, talab qo‘yilgan kundan boshlab o‘ttiz kun ichida qaytariladi. Tilxat qarz shartnomasining yozma dalili hisoblanadi va sudda qarz mavjudligini isbotlaydi.';
  const add = async (title) => (await (await books(R('/api/account/books', 'POST', { op: 'add', title, author: 'Muallif', year: 2022, origin: 'o‘z darsligim', text, rightsConfirmed: true }, a), { ip: 'v117-b' + ipSeq++ })).json()).book;
  const b1 = await add('Fuqarolik huquqi darsligi'), b2 = await add('Boshqa kitob');
  const { searchBooks } = await import('../netlify/shared/books.mjs');
  const { currentUser } = await import('../netlify/shared/auth.mjs');
  const user = (await currentUser(R('/', 'GET', null, a))).user;
  const only = await searchBooks('qarz tilxat muddat qaytarish o‘ttiz kun', { user, bookIds: [b2.id] });
  assert.ok(only.length && only.every((p) => p.bookId === b2.id && p.verified === false && p.kind === 'foydalanuvchi yuklagan'));
  const p = rag.sourcesPayload('Qarz qaytariladi (FK 735-modda).', rag.retrieve(QARZ), { books: only });
  const k = p.passages.find((x) => x.kind === 'kitob');
  assert.equal(k.verified, false); assert.equal(k.page, 12); assert.match(k.label, /Muallif\. Boshqa kitob, 2022, 12-bet/);
  assert.ok(b1.id !== b2.id);
});

test('student hint mode asks for step-by-step guidance, not a finished answer, and says AI is not a teacher grade', async () => {
  const { default: kazus } = await import('../netlify/functions/kazus.mjs');
  const old = { k: process.env.GEMINI_API_KEY, f: globalThis.fetch }; let sent = null;
  process.env.GEMINI_API_KEY = 'test-only-not-a-real-key';
  globalThis.fetch = async (_u, init) => { sent = JSON.parse(init.body); return new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: '1) Masala: ...' }] }, finishReason: 'STOP' }] }) + '\n')); c.close(); } })); };
  try {
    store.resetMemoryStore();
    const res = await kazus(R('/api/kazus', 'POST', { kazus: 'Xodim kasallik varaqasi bilan ishga chiqmadi, ish beruvchi uni progul uchun ishdan bo‘shatdi. Baho bering.', fan: 'mehnat', task: 'hint' }), { ip: 'v117-hint' });
    assert.equal(res.status, 200); const text = await res.text();
    const userMsg = sent.contents.at(-1).parts[0].text;
    assert.match(userMsg, /BOSQICHMA-BOSQICH MASLAHAT/); assert.match(userMsg, /Tayyor yechim, yakuniy xulosa yoki to‘liq javob YOZMANG/);
    assert.match(userMsg, /o‘qituvchi yoki universitet bahosi emas/); assert.ok(!/JAVOB SHAKLI/.test(userMsg));
    assert.match(text, /⁣HK:SRC:/);
  } finally { globalThis.fetch = old.f; if (old.k === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = old.k; }
});

// ---------------- 6. Sud amaliyoti va baza qamrovi ----------------
test('court module: separate document kind, empty base shows no demo decisions, import refuses unpermitted or demo records', async () => {
  const court = await import('../netlify/shared/court.mjs');
  assert.equal(court.decisions().length, 0); assert.deepEqual(court.searchDecisions('qarz tilxat sud'), []);
  assert.match(court.courtStatus().message, /ulanmagan/);
  assert.notEqual(court.DOC_KINDS.qonun, court.DOC_KINDS.plenum); assert.match(court.DOC_KINDS.qaror, /Individual/);
  const rec = { court: 'Toshkent shahar Yunusobod tumanlararo fuqarolik ishlari sudi', caseNumber: '2-1234/2026', date: '2026-03-02', instance: 'birinchi instansiya', docType: 'hal qiluv qarori', sourceId: 'oliy-sud-ochiq', sourceUrl: 'https://example.uz/q/1', text: 'Sud FK 735-moddasi 2-qismiga ko‘ra qarz o‘ttiz kun ichida qaytarilishi kerak deb hisobladi. '.repeat(6) };
  assert.ok(court.validateDecision(rec).problems.some((p) => /ruxsati tasdiqlanmagan/.test(p)), 'ruxsatsiz manba rad etiladi');
  const sources = [{ id: 'ok-src', status: 'ruxsat-berilgan', permission: 'yozma ruxsat 2026-11-01', hosts: ['example.uz'] }];
  const good = court.validateDecision({ ...rec, sourceId: 'ok-src' }, sources);
  assert.deepEqual(good.problems, []); assert.equal(good.record.kind, 'qaror'); assert.ok(good.record.lawRefs.includes('FK 735'));
  assert.ok(court.validateDecision({ ...rec, sourceId: 'ok-src', caseNumber: 'DEMO-1' }, sources).problems.some((p) => /demo/.test(p)));
  assert.ok(court.validateDecision({ ...rec, sourceId: 'ok-src', sourceUrl: 'https://boshqa.uz/x' }, sources).problems.some((p) => /domen/.test(p)));
});

test('coverage page numbers are computed from the actual data files', () => {
  const cov = JSON.parse(fs.readFileSync(new URL('../public/coverage.json', import.meta.url), 'utf8'));
  const laws = fs.readdirSync(new URL('../data/laws/', import.meta.url)).filter((f) => f.endsWith('.json') && f !== 'manifest.json');
  assert.equal(cov.totals.documents, laws.length);
  const mk = cov.docs.find((d) => d.doc === 'mk');
  assert.equal(mk.units, rag.LAWS.mk.articles.length); assert.equal(mk.asOf, rag.LAWS.mk.asOf);
  assert.equal(cov.totals.courtDecisions, 0); assert.ok(cov.notConnected.some((n) => /TSUL/.test(n.name)) && cov.notConnected.some((n) => /tarixiy tahrir/i.test(n.name)));
});

// ---------------- 7. PWA ----------------
test('PWA: manifest is installable; service worker never caches API, auth, sessions, cases or AI answers', () => {
  const m = JSON.parse(fs.readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(m.display, 'standalone'); assert.equal(m.scope, '/'); assert.match(m.start_url, /^\//); assert.equal(m.theme_color, '#123a66');
  assert.ok(m.icons.some((i) => i.sizes === '192x192') && m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'));
  for (const i of m.icons) assert.ok(fs.existsSync(new URL('../public' + i.src, import.meta.url)), i.src);
  const sw = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/); assert.match(sw, /req\.method !== 'GET'/);
  assert.match(sw, /const SW_VERSION = 'hk-v\d+\.\d+\.\d+-[0-9a-f]{10}'/, 'versiya build’da fayllardan');
  assert.ok(!/skipWaiting\(\)[^]*install/.test(sw.split("addEventListener('install'")[1].split('});')[0]), 'yangi versiya o‘zi faollashmaydi');
  const shell = sw.match(/const SHELL = \[([\s\S]*?)\];/)[1];
  assert.ok(!/\/api\/|\/\.netlify\//.test(shell), 'API yo‘llari keshlanadigan ro‘yxatda yo‘q');
  for (const p of shell.match(/'([^']+)'/g).map((x) => x.slice(1, -1)).filter((p) => p !== '/')) assert.ok(fs.existsSync(new URL('../public' + p, import.meta.url)), p);
  const pwa = fs.readFileSync(new URL('../public/pwa.js', import.meta.url), 'utf8');
  assert.ok(!/Notification|PushManager|pushManager/.test(pwa), 'push ruxsati so‘ralmaydi');
  assert.match(pwa, /beforeinstallprompt/); assert.match(pwa, /SKIP_WAITING/); assert.match(pwa, /saveDraft/);
  const ws = fs.readFileSync(new URL('../public/workspace.js', import.meta.url), 'utf8');
  assert.match(ws, /clearLocal\(\)/); assert.match(ws, /yashirin qayta yuborilmaydi|avtomatik qayta yuborilmaydi/);
});

// ---------------- 8. Baholash va qidiruv ----------------
test('eval set covers colloquial Uzbek, Cyrillic, Russian and cross-field questions; all expectations still await a lawyer', () => {
  const { cases } = JSON.parse(fs.readFileSync(new URL('../eval/cases.json', import.meta.url), 'utf8'));
  for (const k of ['sozlashuv', 'kirill', 'ruscha', 'fanlararo']) assert.ok(cases.filter((c) => c.kind === k).length >= 3, k);
  assert.ok(cases.every((c) => c.lawyerReview === 'kutilmoqda'));
});

test('E29 generalisation: in a multi-field question each field is searched by its own sentences; colloquial "merosxo‘r" maps to official "voris"', () => {
  const q = 'Ish beruvchi meni shtat qisqarishi sababli bo‘shatdi va oxirgi oylikni bermadi. Bundan tashqari, otam vafot etib, uyni meros qilib qoldirdi, merosxo‘rlar kimlar?';
  const r = rag.retrieve(q, { k: 8 });
  assert.ok(r.provided.mk.has('161') && r.provided.fk.has('1135'));
  assert.deepEqual(rag.tokens('merosxo‘rlar'), rag.tokens('vorislar'));
  // Boshqa so'zlar bilan ham (faqat shu savolga moslanmagan)
  assert.ok(rag.retrieve('Ota-onam vafot etdi, merosxo‘rlar kimlar bo‘ladi?').provided.fk.has('1135'));
});

test('topic regexes keep no state between calls (global /g lastIndex bug): repeated retrieval is identical', () => {
  const qs = ['Xodimni kasallik paytida bo‘shatishdi', 'Aliment miqdori qancha?', 'Telefon o‘g‘irlandi, jazo qanday?'];
  const once = qs.map((q) => rag.retrieve(q).passages.map((p) => p.doc + p.art).join());
  rag.isLaborQuery('mehnat haqi mehnat');
  for (let i = 0; i < 3; i++) assert.deepEqual(qs.map((q) => rag.retrieve(q).passages.map((p) => p.doc + p.art).join()), once);
});

test('Russian questions are expanded with an Uzbek legal glossary; Uzbek Cyrillic is not treated as Russian', () => {
  assert.match(rag.ruGloss('У меня украли телефон'), /o'g'irlik/);
  assert.equal(rag.ruGloss('Телефонимни ўғирлаб кетишди, қандай жазо берилади?'), '');
  assert.ok(rag.retrieve('Меня уволили, когда я был на больничном.').provided.mk.has('163'));
});

test('offline eval never claims AI was called; live eval refuses to run without a key', async () => {
  const { execFileSync } = await import('node:child_process');
  const out = execFileSync(process.execPath, ['scripts/eval-rag.mjs'], { cwd: new URL('../', import.meta.url), encoding: 'utf8' });
  const s = JSON.parse(out.slice(out.indexOf('{'), out.indexOf('\n}') + 2));
  assert.equal(s.mode, 'offline'); assert.equal(s.aiCalled, false); assert.match(s.citationAccuracy, /o‘lchanmadi/); assert.match(s.legalConclusion, /yurist/);
  assert.ok(s.retrievalRecall >= 0.95);
  const env = { ...process.env }; delete env.GEMINI_API_KEY; delete env.API_KEY;
  assert.throws(() => execFileSync(process.execPath, ['scripts/eval-rag.mjs', '--live'], { cwd: new URL('../', import.meta.url), env, stdio: 'pipe' }), (e) => e.status === 2 && /GEMINI_API_KEY yo‘q/.test(e.stderr.toString()));
});

// ---------------- 3. Sayt manzili ----------------
test('canonical, og and sitemap come from one SITE_URL; the old domain cannot come back', () => {
  const home = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const sm = fs.readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const robots = fs.readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
  const origin = home.match(/<link rel="canonical" href="(https:\/\/[^"/]+)\//)[1];
  for (const m of home.matchAll(/(?:og:url|og:image)" content="(https:\/\/[^"/]+)\//g)) assert.equal(m[1], origin);
  assert.ok(sm.includes(`<loc>${origin}/</loc>`)); assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
  const build = fs.readFileSync(new URL('../scripts/build-data.mjs', import.meta.url), 'utf8');
  assert.ok(!/huquqyordamchi\.netlify\.app/.test(build + home + sm + robots), 'eski manzil yo‘q');
  assert.match(build, /SITE_URL/);
});
