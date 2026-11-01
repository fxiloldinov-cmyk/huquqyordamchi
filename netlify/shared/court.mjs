// Sud amaliyoti: individual sud qarorlari uchun alohida hujjat turi.
// Uchta tur hech qachon aralashtirilmaydi:
//   qonun   — rasmiy normativ matn (data/laws, lex.uz);
//   plenum  — Oliy sud Plenumi tushuntirishi (umumiy, majburiy tushuntirish; qonun emas);
//   qaror   — muayyan ish bo'yicha individual sud qarori (faqat shu ish uchun; pretsedent emas).
// Qaror yozuvi: { id, court, caseNumber, date, instance, docType, sourceId, sourceUrl, text, lawRefs[], importedAt, sha256 }
// Baza bo'sh bo'lsa, hech qanday demo qaror ko'rsatilmaydi.
import decisionsFile from '../../data/court/decisions.json' with { type: 'json' };
import sourcesFile from '../../data/court/sources.json' with { type: 'json' };
import { lawRefs, CODE_IDS, tokens } from './rag.mjs';

export const DOC_KINDS = Object.freeze({
  qonun: 'Qonun (rasmiy normativ matn)',
  plenum: 'Plenum tushuntirishi (qonun emas)',
  qaror: 'Individual sud qarori (faqat shu ish bo‘yicha)',
});
export const INSTANCES = ['birinchi instansiya', 'apellyatsiya', 'kassatsiya', 'nazorat', 'Oliy sud'];
export const DOC_TYPES = ['hal qiluv qarori', 'hukm', 'ajrim', 'qaror', 'ma’muriy sud qarori'];
const REQUIRED = ['court', 'caseNumber', 'date', 'instance', 'docType', 'sourceId', 'sourceUrl', 'text'];

// Manbaning ruxsati tasdiqlanganmi va URL shu manba domenidami
export function allowedSource(sourceId, url, sources = sourcesFile.sources) {
  const s = sources.find((x) => x.id === sourceId);
  if (!s) return { ok: false, why: 'manba ro‘yxatda yo‘q' };
  if (s.status !== 'ruxsat-berilgan' || !s.permission) return { ok: false, why: 'manba ruxsati tasdiqlanmagan' };
  let host; try { const u = new URL(url); if (u.protocol !== 'https:') return { ok: false, why: 'faqat https' }; host = u.hostname; } catch { return { ok: false, why: 'URL noto‘g‘ri' }; }
  if (!s.hosts.some((h) => host === h || host.endsWith('.' + h))) return { ok: false, why: `domen (${host}) manba ro‘yxatida emas` };
  return { ok: true };
}

// Import uchun tekshirish va normallashtirish: qonunlarga havolalar matndan kod orqali olinadi
export function validateDecision(d, sources) {
  const problems = REQUIRED.filter((k) => !String(d?.[k] ?? '').trim()).map((k) => `${k} yo‘q`);
  if (d?.date && !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) problems.push('sana YYYY-MM-DD emas');
  if (d?.instance && !INSTANCES.includes(d.instance)) problems.push(`instansiya noma’lum: ${d.instance}`);
  if (d?.docType && !DOC_TYPES.includes(d.docType)) problems.push(`hujjat turi noma’lum: ${d.docType}`);
  if (String(d?.text || '').length < 300) problems.push('matn juda qisqa (to‘liq qaror matni kerak)');
  if (/demo|namuna|test|lorem/i.test(`${d?.caseNumber} ${d?.court}`)) problems.push('demo yoki test yozuv haqiqiy qaror sifatida qabul qilinmaydi');
  const src = allowedSource(d?.sourceId, d?.sourceUrl, sources);
  if (!src.ok) problems.push('manba: ' + src.why);
  const refs = lawRefs(String(d?.text || ''));
  const lawRefsList = CODE_IDS.flatMap((id) => refs[id].map((n) => `${id.toUpperCase()} ${n}`));
  return { problems, record: problems.length ? null : { ...d, kind: 'qaror', lawRefs: lawRefsList } };
}

export const decisions = () => decisionsFile.decisions;
export function courtStatus() {
  const n = decisionsFile.decisions.length;
  const connected = sourcesFile.sources.filter((s) => s.status === 'ruxsat-berilgan');
  return {
    decisions: n,
    connectedSources: connected.map((s) => s.name),
    notConnected: sourcesFile.sources.filter((s) => s.status !== 'ruxsat-berilgan').map((s) => ({ name: s.name, note: s.note })),
    message: n ? `${n} ta individual sud qarori (ruxsatli manbalardan).` : 'Sud qarorlari bazasi hali ulanmagan: hech qanday qaror ko‘rsatilmaydi.',
  };
}
// Kelajakda RAG uchun: savolga mos qarorlar (bo'sh baza → bo'sh natija)
export function searchDecisions(query, { k = 3 } = {}) {
  const q = new Set(tokens(query));
  if (!q.size) return [];
  return decisionsFile.decisions.map((d) => ({ d, s: tokens(d.text).filter((t) => q.has(t)).length }))
    .filter((x) => x.s >= 4).sort((a, b) => b.s - a.s).slice(0, k)
    .map(({ d }) => ({ ...d, label: `${d.court}, ${d.date}, ish № ${d.caseNumber} (${d.instance}) — ${DOC_KINDS.qaror}` }));
}
