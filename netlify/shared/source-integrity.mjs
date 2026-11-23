import {createHash} from 'node:crypto';
import status from '../../data/source-status.json' with { type: 'json' };

export const todayLegalDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
// To‘liq kodeks xeshi 8–15 ms oladi va bir so‘rovda o‘nlab marta kerak bo‘ladi: hujjat obyekti bo‘yicha keshlanadi.
// Kalit maydonlari (doc, asOf, url, articles massivi) almashsa, xesh qayta hisoblanadi.
const hashCache = new WeakMap();
export const lawContentHash = law => {
  const hit = hashCache.get(law);
  if (hit && hit.doc === law.doc && hit.asOf === law.asOf && hit.url === law.url && hit.articles === law.articles) return hit.hash;
  const hash = createHash('sha256').update(JSON.stringify({doc:law.doc,asOf:law.asOf,url:law.url,articles:law.articles})).digest('hex');
  hashCache.set(law, {doc:law.doc, asOf:law.asOf, url:law.url, articles:law.articles, hash});
  return hash;
};
export function validLegalDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}
export function sourceOrigin(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password) return 'external-unverified';
    return ['lex.uz', 'www.lex.uz'].includes(u.hostname) && /^\/(?:[a-z]{2}\/)?docs\/-?\d+\/?$/.test(u.pathname)
      ? 'lex-document-link' : 'external-unverified';
  } catch { return 'external-unverified'; }
}
export function applicability(law, eventDate = null, today = todayLegalDate()) {
  if (eventDate != null && eventDate !== '' && !validLegalDate(eventDate)) return 'invalid-event-date';
  const date = eventDate || today;
  if (validLegalDate(law.effectiveFrom) && date < law.effectiveFrom) return 'not-yet-effective';
  if (validLegalDate(law.effectiveTo) && date >= law.effectiveTo) return 'expired';
  // Nusxa sanasi (asOf) voqea sanasidan keyin bo‘lsa ham butun hujjat yashirilmaydi: o‘zgartirilgan moddalar
  // rag.mjs da o‘z tahrir izohlari bo‘yicha alohida cheklanadi (modda darajasida).
  if (!validLegalDate(law.effectiveFrom) || law.effectiveDateVerified !== true) return 'effective-date-unverified';
  return 'date-range-checked';
}
export function sourceMetadata(law, eventDate = null, registry = status, now = Date.now()) {
  const audit = registry.documents?.[law.doc] || {};
  const checked = Date.parse(audit.checkedAt || '');
  const recent = Number.isFinite(checked) && now >= checked && now - checked <= 7 * 86400000;
  const editionMatches = audit.localAsOf === law.asOf && audit.localContentSha256 === lawContentHash(law);
  const freshness = !editionMatches ? (audit.localContentSha256 ? 'local-content-changed' : 'unverified') : ['newer-publication','indexed-text-differs'].includes(audit.state) ? audit.state
    : recent ? (audit.state || 'unverified') : 'check-expired';
  return {
    origin: 'local-database', linkType: sourceOrigin(law.url), publishedAt: law.publishedAt || null,
    publicationDateHint: law.asOf || null, importedAt: law.importedAt || null,
    effectiveFrom: law.effectiveFrom || null, effectiveDateVerified: law.effectiveDateVerified === true,
    checkedAt: audit.checkedAt || null, freshness, remotePublishedAt: audit.remotePublishedAt || null,
    applicability: applicability(law, eventDate), textCompared: audit.textCompared === true && editionMatches, indexedTextMatches: editionMatches ? audit.indexedTextMatches ?? null : null, changedArticles: editionMatches ? audit.changedArticles || [] : [],
    textReview: editionMatches && audit.textReview?.status === 'approved' && audit.textReview?.approvedContentSha256 === lawContentHash(law) ? {status:'approved',scope:'source-text',evidenceType:'user-attestation',attestedAt:audit.textReview.attestedAt} : null,
    legalConclusionReviewed: false, verified: false,
    coverage: law.provenance?.scope || 'indexed-text', annexImagesInterpreted: law.provenance?.annexImagesInterpreted === true,
  };
}
export function passageRestriction(law, eventDate = null, article = null, registry = status) {
  const m = sourceMetadata(law, eventDate, registry);
  if (['invalid-event-date','historical-text-unavailable','not-yet-effective','expired'].includes(m.applicability)) return m.applicability;
  if (['date-conflict','local-date-unknown'].includes(m.freshness)) return 'source-date-conflict';
  if (m.freshness === 'local-content-changed') return 'local-content-changed';
  // 'newer-publication': lex.uz’da yangi nashr bor, lekin qaysi moddalar o‘zgargani hali solishtirilmagan. Butun kodeksni
  // yashirish o‘rniga parcha ogohlantirish bilan beriladi (integrityLabel, rag.stale); farqli moddalar 'indexed-text-differs' bilan cheklanadi.
  if (m.freshness === 'indexed-text-differs' && (!article || m.changedArticles.includes(String(article)))) return 'indexed-text-differs';
  return null;
}
export function integrityLabel(m) {
  const freshness = { 'publication-date-matches': 'nashr sanasi teng; matnning to‘liq mosligi tasdiqlanmagan', 'local-content-changed': 'lokal matn tekshirilgan nusxadan farq qiladi', 'indexed-text-differs': 'indekslangan matnda farqlar bor; tegishli moddalar tekshiruvda', 'newer-publication': 'yangi nashr bor — mahalliy nusxa yangilanishi kerak', 'http-error': 'rasmiy havolani ochib bo‘lmadi', 'fetch-error': 'rasmiy manbaga ulanishda xato', 'date-conflict': 'lokal va rasmiy sanalar o‘rtasida tafovut', 'identity-unverified': 'hujjatning bevosita manzili tasdiqlanmagan', 'publication-unknown': 'rasmiy nashr sanasi aniqlanmadi', 'check-expired': 'yangilik tekshiruvi eskirgan', 'unverified': 'yangiligi tekshirilmagan' };
  return `Lokal baza · ${freshness[m.freshness] || 'yangiligi tekshirilmagan'} · tekshirilgan: ${m.checkedAt || 'noma’lum'} · kuchga kirish: ${m.effectiveFrom || 'noma’lum'} (${m.effectiveDateVerified ? 'sana tasdiqlangan' : 'sana tasdiqlanmagan'}) · huquqiy xulosa yurist tomonidan tasdiqlanmagan`;
}
// Foydalanuvchiga va ommaviy JSON’ga boradigan metama’lumot. Egasining umumiy tasdig‘i ("hamma matnlarni yurist tekshirdi")
// yurist ismi va sanasisiz bo‘lgani uchun saytda "yurist ko‘rigidan o‘tgan" sifatida ko‘rsatilmaydi; u faqat ichki yozuv.
export function publicSourceMetadata(...args) { const { textReview, ...m } = sourceMetadata(...args); return m; }
