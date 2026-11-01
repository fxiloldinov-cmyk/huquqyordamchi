// Sud qarorlarini import qilish adapteri.
//   node scripts/import-court.mjs <fayl.json> [--dry-run]
// Kirish fayli: [{ court, caseNumber, date, instance, docType, sourceId, sourceUrl, text }, ...]
// Har bir yozuv: majburiy maydonlar, sana, instansiya, hujjat turi, manba ruxsati (data/court/sources.json) va
// domen tekshiriladi; qonunlarga havolalar matndan avtomatik olinadi. Xato yozuv bazaga tushmaydi.
// Tarmoqqa so'rov yubormaydi: matnni manba egasining ruxsati bilan siz tayyorlaysiz.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateDecision } from '../netlify/shared/court.mjs';

const [file, ...flags] = process.argv.slice(2);
if (!file) { console.error('Foydalanish: node scripts/import-court.mjs <fayl.json> [--dry-run]'); process.exit(2); }
const dry = flags.includes('--dry-run');
const DB = new URL('../data/court/decisions.json', import.meta.url);
const db = JSON.parse(await readFile(DB, 'utf8'));
const input = JSON.parse(await readFile(file, 'utf8'));
if (!Array.isArray(input)) { console.error('Kirish fayli massiv bo‘lishi kerak.'); process.exit(2); }
const today = new Date().toISOString().slice(0, 10);
let added = 0, skipped = 0;
for (const [i, d] of input.entries()) {
  const { problems, record } = validateDecision(d);
  if (problems.length) { skipped++; console.log(`✗ #${i + 1} ${d?.caseNumber || ''}: ${problems.join('; ')}`); continue; }
  const sha256 = createHash('sha256').update(record.text).digest('hex').slice(0, 16);
  if (db.decisions.some((x) => x.sha256 === sha256 || (x.court === record.court && x.caseNumber === record.caseNumber && x.date === record.date))) { skipped++; console.log(`= #${i + 1} ${record.caseNumber}: bazada bor`); continue; }
  db.decisions.push({ id: `${record.sourceId}:${sha256}`, ...record, importedAt: today, sha256 }); added++;
  console.log(`✓ #${i + 1} ${record.court}, ${record.date}, № ${record.caseNumber} — havolalar: ${record.lawRefs.join(', ') || '—'}`);
}
if (!dry && added) await writeFile(DB, JSON.stringify(db, null, 2) + '\n');
console.log(`\nQo‘shildi: ${added}, o‘tkazib yuborildi: ${skipped}${dry ? ' (dry-run, bazaga yozilmadi)' : ''}. Keyin: npm run build && npm test`);
