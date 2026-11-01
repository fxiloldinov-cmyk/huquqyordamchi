// Qonunlar bazasini yangilash: har bir kodeksning lex.uz sahifasidagi eng so'nggi tahrir sanasini bazadagi
// "asOf" bilan solishtiradi. Yangi tahrir bo'lsa:
//   - LEX_WORD_URL_TEMPLATE berilgan bo'lsa, Word eksportini yuklab, scripts/import_lexuz.py bilan import qiladi;
//   - aks holda "qo'lda yuklash kerak" deb hisobot beradi (GitHub'da issue va Telegram xabari).
// Qo'lda ishlatish (Word faylni o'zingiz yuklab olganingizda):
//   node scripts/check-law-updates.mjs --file ok=~/Downloads/30.04.1998.doc --file fk2=~/Downloads/29.08.1996.doc
//   node scripts/check-law-updates.mjs --check-only
// Natija: law-update-report.md, GitHub Actions'da esa GITHUB_OUTPUT: changed, pending, failed, summary.
import { readFile, writeFile, appendFile, mkdtemp, rm, mkdir, readdir } from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const LAWS = [
  { doc: 'mk', file: 'mk.json', name: 'Oʻzbekiston Respublikasining Mehnat kodeksi' },
  { doc: 'ok', file: 'ok.json', name: 'Oʻzbekiston Respublikasining Oila kodeksi' },
  { doc: 'fk1', file: 'fk1.json', name: 'Oʻzbekiston Respublikasining Fuqarolik kodeksi (1-qism)' },
  { doc: 'fk2', file: 'fk2.json', name: 'Oʻzbekiston Respublikasining Fuqarolik kodeksi (2-qism)' },
  { doc: 'fpk', file: 'fpk.json', name: 'Oʻzbekiston Respublikasining Fuqarolik protsessual kodeksi' },
  { doc: 'jk', file: 'jk.json', name: 'Oʻzbekiston Respublikasining Jinoyat kodeksi' },
  { doc: 'jpk', file: 'jpk.json', name: 'Oʻzbekiston Respublikasining Jinoyat-protsessual kodeksi' },
  { doc: 'mjtk', file: 'mjtk.json', name: 'Oʻzbekiston Respublikasining Maʼmuriy javobgarlik toʻgʻrisidagi kodeksi' },
  { doc: 'kon', file: 'kon.json', name: 'Oʻzbekiston Respublikasi Konstitutsiyasi' },
  { doc: 'sk', file: 'sk.json', name: 'Oʻzbekiston Respublikasining Soliq kodeksi' },
  { doc: 'ujk', file: 'ujk.json', name: 'Oʻzbekiston Respublikasining Uy-joy kodeksi' },
  { doc: 'ipk', file: 'ipk.json', name: 'Oʻzbekiston Respublikasining Iqtisodiy protsessual kodeksi' },
  { doc: 'jik', file: 'jik.json', name: 'Oʻzbekiston Respublikasining Jinoyat-ijroiya kodeksi' },
  { doc: 'msk', file: 'msk.json', name: 'Oʻzbekiston Respublikasining Maʼmuriy sud ishlarini yuritish toʻgʻrisidagi kodeksi' },
  { doc: 'ist', file: 'ist.json', name: '“Isteʼmolchilarning huquqlarini himoya qilish toʻgʻrisida”gi Oʻzbekiston Respublikasi Qonuni' },
];

// Avtomatik kuzatilmaydigan manbalar (lex.uz ID yo'q yoki Word eksporti boshqacha) — hisobotda ochiq aytiladi.
const MANUAL_ONLY = [{ file: 'plenum-26-2023.json', name: 'Oliy sud Plenumining 26-son qarori (2023)' }, { file: 'plenum05.json', name: 'Oliy sud Plenumining 5-son qarori (2011, meros)' }];
const ARCHIVE_KEEP = 3;

const args = process.argv.slice(2);
const rollbackDoc = (args.find(a => a.startsWith('--rollback=')) || '').split('=')[1] || (args.includes('--rollback') ? args[args.indexOf('--rollback') + 1] : null);
const checkOnly = args.includes('--check-only');
const manual = Object.fromEntries(args.flatMap((a, i) => a === '--file' ? [args[i + 1]] : []).map(x => {
  const [doc, ...p] = String(x).split('='); return [doc, p.join('=').replace(/^~(?=\/)/, homedir())];
}));
const TEMPLATE = (process.env.LEX_WORD_URL_TEMPLATE || '').trim();

// lex.uz sahifasidagi "Qonunchilik maʼlumotlari milliy bazasi, 12.09.2026-y." ko'rinishidagi sanalarning eng kechi —
// importer ham asOf ni shu usulda (PUBLICATION_ORIGIN dagi eng kech sana) hisoblaydi.
export function latestEdition(html) {
  // Lotin ("12.09.2026-y.") va kirill ("15.10.2026 й.") sahifalar
  const dates = [...String(html).matchAll(/(\d{2})\.(\d{2})\.(\d{4})\s*-?\s*[yй]\./g)].map(([, d, m, y]) => `${y}-${m}-${d}`);
  const today = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return dates.filter(x => x <= today).sort().at(-1) || null;
}

async function get(url, asText = true) {
  let last;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'HuquqYordamchi law-update bot (+https://huquqyordamchiuz.netlify.app)', 'Accept-Language': 'uz' }, signal: AbortSignal.timeout(45000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return asText ? await res.text() : Buffer.from(await res.arrayBuffer());
    } catch (e) { last = e; await new Promise(r => setTimeout(r, 3000)); }
  }
  throw last;
}

function diff(oldL, newL) {
  const o = new Map(oldL.articles.map(a => [a.art, a])), n = new Map(newL.articles.map(a => [a.art, a]));
  const same = (a, b) => a.title === b.title && JSON.stringify(a.parts) === JSON.stringify(b.parts);
  return {
    added: [...n.keys()].filter(k => !o.has(k)),
    removed: [...o.keys()].filter(k => !n.has(k)),
    changed: [...n.keys()].filter(k => o.has(k) && !same(o.get(k), n.get(k))),
  };
}

// Import natijasini amaldagi bazaga qo'yishdan oldin tekshirish. Bo'sh ro'yxat — muammo yo'q.
export function validateLaw(law, old = null) {
  const p = [];
  if (!law || !Array.isArray(law.articles) || !law.articles.length) return ['moddalar topilmadi'];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(law.asOf || '')) p.push('tahrir (e’lon) sanasi aniqlanmadi');
  const seen = new Set();
  for (const a of law.articles) {
    if (!/^\d{1,4}(-\d{1,3})?$/.test(a.art)) p.push(`noto‘g‘ri modda raqami: ${a.art}`);
    if (seen.has(a.art)) p.push(`takroriy modda: ${a.art}`); seen.add(a.art);
    const text = (a.parts || []).join(' ').trim();
    if (!text || text.length < 10 || (a.parts || []).some(x => !String(x).trim())) p.push(`bo‘sh yoki juda qisqa matn: ${a.art}-modda`);
  }
  if (old) {
    const now = new Set(law.articles.map(a => a.art)), rep = new Set(law.repealed || []);
    const lost = old.articles.map(a => a.art).filter(n => !now.has(n) && !rep.has(n));
    if (lost.length) p.push(`yo‘qolgan moddalar (kuchini yo‘qotgani haqida izohsiz): ${lost.slice(0, 20).join(', ')}`);
    if (law.articles.length < old.articles.length * 0.95) p.push(`moddalar soni keskin kamaydi (${old.articles.length} → ${law.articles.length})`);
    if (law.asOf < old.asOf) p.push(`fayldagi tahrir (${law.asOf}) bazadagidan (${old.asOf}) eski`);
  }
  return p.slice(0, 30);
}
// Kelajakda kuchga kiradigan o'zgartishlar (izohdagi "2027-yil 1-yanvardan kuchga kiradi")
const MONTHS = { yanvar: 1, fevral: 2, mart: 3, aprel: 4, may: 5, iyun: 6, iyul: 7, avgust: 8, sentabr: 9, oktabr: 10, noyabr: 11, dekabr: 12 };
export function pendingEffective(law, today = new Date().toISOString().slice(0, 10)) {
  const out = [];
  for (const a of law.articles) for (const c of a.changes || []) for (const m of c.matchAll(/(\d{4})-yil (\d{1,2})-(\w+?)dan (?:eʼtiboran |e'tiboran )?kuchga kir/g)) {
    const mo = MONTHS[m[3]]; if (!mo) continue;
    const d = `${m[1]}-${String(mo).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    if (d > today) out.push({ art: a.art, date: d });
  }
  return out;
}
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const archiveDir = (doc) => new URL(`data/laws/archive/${doc}/`, ROOT);
async function archiveCurrent(doc, raw, asOf) {
  const dir = archiveDir(doc); await mkdir(dir, { recursive: true });
  await writeFile(new URL(`${asOf}.json.gz`, dir), gzipSync(raw));
  const files = (await readdir(dir)).filter(f => f.endsWith('.json.gz')).sort();
  for (const f of files.slice(0, Math.max(0, files.length - ARCHIVE_KEEP))) await rm(new URL(f, dir));
  return `data/laws/archive/${doc}/${asOf}.json.gz`;
}
async function updateManifest(doc, file, law, extra = {}) {
  const path = new URL('data/laws/manifest.json', ROOT);
  let m = {}; try { m = JSON.parse(await readFile(path, 'utf8')); } catch {}
  const raw = await readFile(new URL(`data/laws/${file}`, ROOT));
  m[doc] = { file, name: law.name, publishedAt: law.asOf, importedAt: law.importedAt, articles: law.articles.length, repealed: (law.repealed || []).length, sha256: sha(raw), pendingEffective: pendingEffective(law).length, ...extra };
  await writeFile(path, JSON.stringify(m, null, 2) + '\n');
}
export async function rollback(doc) {
  const spec = LAWS.find(l => l.doc === doc); if (!spec) throw new Error(`Noma’lum hujjat: ${doc}`);
  const dir = archiveDir(doc); const files = (await readdir(dir).catch(() => [])).filter(f => f.endsWith('.json.gz')).sort();
  if (!files.length) throw new Error(`${doc}: arxivda oldingi tahrir yo‘q`);
  const prev = JSON.parse(gunzipSync(await readFile(new URL(files.at(-1), dir))).toString('utf8'));
  const problems = validateLaw(prev); if (problems.length) throw new Error('arxivdagi fayl yaroqsiz: ' + problems.join('; '));
  await writeFile(new URL(`data/laws/${spec.file}`, ROOT), JSON.stringify(prev));
  await updateManifest(doc, spec.file, prev, { rolledBackFrom: files.at(-1), rolledBackAt: new Date().toISOString() });
  return prev.asOf;
}

function importDoc(law, src, outPath) {
  const out = execFileSync('python3', [new URL('import_lexuz.py', import.meta.url).pathname, src, outPath, '--doc', law.doc, '--lex-id', law.lexId, '--name', law.name], { encoding: 'utf8' });
  if (/muammolar: [1-9]/.test(out)) throw new Error('Import muammolari:\n' + out);
  return out.trim();
}

export async function main() {
const report = [], summary = [];
let changed = false, pending = false, failed = false;
const tmp = await mkdtemp(join(tmpdir(), 'lex-'));
try {
  // --file berilsa, faqat shu hujjatlar import qilinadi (lex.uz sahifasi ochilmaydi).
  for (const spec of Object.keys(manual).length ? LAWS.filter(l => manual[l.doc]) : LAWS) {
    const path = new URL(`data/laws/${spec.file}`, ROOT);
    const old = JSON.parse(await readFile(path, 'utf8'));
    const law = { ...spec, lexId: old.lexId };
    let latest = null;
    if (!manual[law.doc]) {
      try { latest = latestEdition(await get(`https://lex.uz/docs/${law.lexId}`)); }
      catch (e) { failed = true; report.push(`- ❗ **${law.name}**: lex.uz sahifasini o‘qib bo‘lmadi (${e.message}).`); continue; }
      if (!latest) { failed = true; report.push(`- ❗ **${law.name}**: sahifada tahrir sanasi topilmadi — lex.uz tuzilishi o‘zgargan bo‘lishi mumkin.`); continue; }
      if (latest <= old.asOf) { report.push(`- ✓ ${law.name}: o‘zgarish yo‘q (bazada ${old.asOf}).`); continue; }
      if (checkOnly || !TEMPLATE) {
        pending = true; summary.push(`${law.doc.toUpperCase()} ${latest}`);
        report.push(`- 🔔 **${law.name}**: lex.uz’da yangi tahrir — ${latest} (bazada ${old.asOf}). Word faylni yuklab, \`node scripts/check-law-updates.mjs --file ${law.doc}=<fayl.doc>\` bilan import qiling. ${old.url}`);
        continue;
      }
    }
    try {
      let src = manual[law.doc];
      if (!src) {
        const url = TEMPLATE.replaceAll('{id}', law.lexId).replaceAll('{num}', law.lexId.replace(/^-/, ''));
        src = join(tmp, law.doc + '.doc'); await writeFile(src, await get(url, false));
      }
      const outPath = join(tmp, law.file), log = importDoc(law, src, outPath);
      // Yangi tahrir avval vaqtinchalik papkaga import qilinadi va tekshiriladi; xato bo'lsa amaldagi baza o'zgarmaydi.
      const fresh = JSON.parse(await readFile(outPath, 'utf8'));
      const problems = validateLaw(fresh, old);
      if (problems.length) throw new Error('tekshiruvdan o‘tmadi — ' + problems.join('; '));
      const d = diff(old, fresh);
      if (fresh.asOf === old.asOf && !d.added.length && !d.removed.length && !d.changed.length) { report.push(`- ✓ ${law.name}: fayl bazadagi bilan bir xil (e’lon ${old.asOf}).`); continue; }
      const arch = await archiveCurrent(law.doc, await readFile(path), old.asOf);
      await writeFile(path, JSON.stringify(fresh));
      await updateManifest(law.doc, law.file, fresh, { previous: { publishedAt: old.asOf, archive: arch } });
      changed = true; summary.push(`${law.doc.toUpperCase()} ${fresh.asOf}`);
      const L = a => a.length ? a.slice(0, 40).join(', ') + (a.length > 40 ? ` va yana ${a.length - 40} ta` : '') : '—';
      const pend = pendingEffective(fresh);
      report.push(`- 🆕 **${law.name}**: so‘nggi o‘zgartish e’lon qilingan sana ${old.asOf} → ${fresh.asOf}; bazaga import ${fresh.importedAt}. ${log}\n  - o‘zgargan moddalar: ${L(d.changed)}\n  - yangi moddalar: ${L(d.added)}\n  - olib tashlangan moddalar: ${L(d.removed)}\n  - hali kuchga kirmagan o‘zgartishlar: ${pend.length ? pend.slice(0, 15).map(x => `${x.art}-modda (${x.date})`).join(', ') : '—'}\n  - oldingi tahrir arxivi: ${arch} (qaytarish: \`node scripts/check-law-updates.mjs --rollback ${law.doc}\`)`);
    } catch (e) { failed = true; report.push(`- ❗ **${law.name}**: yangi tahrirni import qilib bo‘lmadi — ${e.message}`); }
  }
} finally { await rm(tmp, { recursive: true, force: true }); }
if (!Object.keys(manual).length) for (const m of MANUAL_ONLY) report.push(`- ℹ️ ${m.name} (${m.file}): avtomatik kuzatilmaydi — yangi tahrir yoki yangi Plenum qarorlari qo‘lda import qilinadi.`);

const text = `## Qonunlar bazasini tekshirish — ${new Date().toISOString().slice(0, 10)}\n\n${report.join('\n')}\n\n` +
  (changed ? 'Keyingi qadam: PR’dagi o‘zgarishlarni ko‘rib chiqing. O‘zgargan moddalarga tayangan yo‘riqnomalarni (data/legal.json) rasmiy matn bilan qayta tekshiring, keyin birlashtiring (merge).\n' : '') +
  (pending ? 'Yangi tahrir bor, lekin avtomatik yuklash sozlanmagan (LEX_WORD_URL_TEMPLATE). Word faylni lex.uz’dan yuklab, yuqoridagi buyruq bilan import qiling.\n' : '');
await writeFile(new URL('law-update-report.md', ROOT), text);
console.log(text);
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\npending=${pending}\nfailed=${failed}\nsummary=${summary.join(', ') || 'o‘zgarish yo‘q'}\n`);
return { changed, pending, failed, report: text };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const unknown = Object.keys(manual).filter(d => !LAWS.some(l => l.doc === d));
  if (unknown.length) { console.error(`Noma’lum hujjat: ${unknown.join(', ')}. Mumkin: ${LAWS.map(l => l.doc).join(', ')}`); process.exit(2); }
  if (rollbackDoc) { try { console.log(`${rollbackDoc}: ${await rollback(rollbackDoc)} tahririga qaytarildi.`); } catch (e) { console.error(e.message); process.exit(1); } }
  else await main();
}
