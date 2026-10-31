// Qonunlar bazasini yangilash: har bir kodeksning lex.uz sahifasidagi eng so'nggi tahrir sanasini bazadagi
// "asOf" bilan solishtiradi. Yangi tahrir bo'lsa:
//   - LEX_WORD_URL_TEMPLATE berilgan bo'lsa, Word eksportini yuklab, scripts/import_lexuz.py bilan import qiladi;
//   - aks holda "qo'lda yuklash kerak" deb hisobot beradi (GitHub'da issue va Telegram xabari).
// Qo'lda ishlatish (Word faylni o'zingiz yuklab olganingizda):
//   node scripts/check-law-updates.mjs --file ok=~/Downloads/30.04.1998.doc --file fk2=~/Downloads/29.08.1996.doc
//   node scripts/check-law-updates.mjs --check-only
// Natija: law-update-report.md, GitHub Actions'da esa GITHUB_OUTPUT: changed, pending, failed, summary.
import { readFile, writeFile, appendFile, mkdtemp, rm } from 'node:fs/promises';
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
  { doc: 'ist', file: 'ist.json', name: '“Isteʼmolchilarning huquqlarini himoya qilish toʻgʻrisida”gi Oʻzbekiston Respublikasi Qonuni' },
];

const args = process.argv.slice(2);
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
      const res = await fetch(url, { headers: { 'User-Agent': 'HuquqYordamchi law-update bot (+https://huquqyordamchi.netlify.app)', 'Accept-Language': 'uz' }, signal: AbortSignal.timeout(45000) });
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
      const fresh = JSON.parse(await readFile(outPath, 'utf8'));
      // Ehtiyot chorasi: noto'g'ri fayl (boshqa hujjat, bo'sh sahifa, eski tahrir) bazani buzmasin.
      if (fresh.articles.length < old.articles.length * 0.95) throw new Error(`moddalar soni keskin kamaydi (${old.articles.length} → ${fresh.articles.length}) — fayl to‘g‘riligini tekshiring`);
      if (fresh.asOf < old.asOf) throw new Error(`fayldagi tahrir (${fresh.asOf}) bazadagidan (${old.asOf}) eski`);
      const d = diff(old, fresh);
      if (fresh.asOf === old.asOf && !d.added.length && !d.removed.length && !d.changed.length) { report.push(`- ✓ ${law.name}: fayl bazadagi bilan bir xil (${old.asOf}).`); continue; }
      await writeFile(path, JSON.stringify(fresh));
      changed = true; summary.push(`${law.doc.toUpperCase()} ${fresh.asOf}`);
      const L = a => a.length ? a.slice(0, 40).join(', ') + (a.length > 40 ? ` va yana ${a.length - 40} ta` : '') : '—';
      report.push(`- 🆕 **${law.name}**: ${old.asOf} → ${fresh.asOf}. ${log}\n  - o‘zgargan moddalar: ${L(d.changed)}\n  - yangi moddalar: ${L(d.added)}\n  - olib tashlangan moddalar: ${L(d.removed)}`);
    } catch (e) { failed = true; report.push(`- ❗ **${law.name}**: yangi tahrirni import qilib bo‘lmadi — ${e.message}`); }
  }
} finally { await rm(tmp, { recursive: true, force: true }); }

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
  await main();
}
