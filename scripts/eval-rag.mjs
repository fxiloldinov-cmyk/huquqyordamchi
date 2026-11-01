// Huquqiy sifatni o'lchash (eval/cases.json, 33 ta kazus).
//
//   node scripts/eval-rag.mjs            — OFLAYN: faqat RAG (manba topish). Tarmoq va AI kerak emas.
//   node scripts/eval-rag.mjs --live     — JONLI: haqiqiy Gemini API (GEMINI_API_KEY kerak, pullik bo'lishi mumkin).
//                                          Ixtiyoriy: HK_PRICE_IN_PER_M / HK_PRICE_OUT_PER_M — 1 mln token narxi (USD),
//                                          HK_EVAL_LIMIT=5 — faqat dastlabki N ta holat.
// Natija: eval/results-<rejim>-<sana>.json va qisqa jadval. Oflayn natija AI javob sifati haqida HECH NARSA demaydi.
// "mustAsk"/"mustNot" bo'yicha avtomatik belgi — taxminiy; yakuniy baho yurist tekshiruvidan keyin.
import fs from 'node:fs';
import { retrieve, citationReport, claimChecks, lawRefs } from '../netlify/shared/rag.mjs';

const ROOT = new URL('../', import.meta.url);
const live = process.argv.includes('--live');
const { cases } = JSON.parse(fs.readFileSync(new URL('eval/cases.json', ROOT), 'utf8'));
const ABBR = { MK: 'mk', OK: 'ok', FK: 'fk', FPK: 'fpk', JK: 'jk', JPK: 'jpk', MJtK: 'mjtk', SK: 'sk', UJK: 'ujk', IPK: 'ipk', IST: 'ist', Konstitutsiya: 'kon', JIK: 'jik', MSK: 'msk' };
export const parseSource = (s) => { const [a, n] = s.split(' '); return { code: ABBR[a], art: n }; };
const FAN_CODE = { mehnat: 'mk', oila: 'ok', fuqarolik: 'fk', jinoyat: 'jk', mamuriy: 'mjtk', 'jinoyat-protsessual': 'jpk', 'fuqarolik-protsessual': 'fpk', konstitutsiyaviy: 'kon', 'jinoyat-ijroiya': 'jik', 'mamuriy-sud': 'msk' };

export function evalRetrieval(c, { force = false } = {}) {
  const t = Date.now();
  const r = retrieve(c.question, { k: 8, force: force ? FAN_CODE[c.fan] : false, eventDate: c.eventDate || null });
  const ms = Date.now() - t;
  const exp = c.expectSources.map(parseSource);
  const found = exp.filter((e) => r.provided[e.code]?.has(e.art));
  return {
    id: c.id, kind: c.kind, ms, codes: r.codes,
    expected: c.expectSources.length, found: found.length,
    missing: exp.filter((e) => !r.provided[e.code]?.has(e.art)).map((e) => `${e.code}:${e.art}`),
    recall: exp.length ? found.length / exp.length : (r.codes.length ? 0 : 1), // ma'lumot yetishmasa — bo'sh qaytishi to'g'ri
    editionWarning: Boolean(c.eventDate) ? /VOQEA SANASI/.test(r.block) : null,
    rag: r,
  };
}

async function liveAnswer(c, rag) {
  const { geminiConfig, callGeminiResilient, extractCandidate, LEGAL_RULES } = await import('../netlify/shared/common.mjs');
  const { apiKey, models, thinkingLevel } = geminiConfig();
  if (!apiKey) throw new Error('GEMINI_API_KEY yo‘q — jonli baholash ishga tushmadi.');
  const t = Date.now();
  const r = await callGeminiResilient({ apiKey, models, thinkingLevel, body: { system_instruction: { parts: [{ text: LEGAL_RULES + rag.block }] }, contents: [{ role: 'user', parts: [{ text: (c.eventDate ? `Voqea sanasi: ${c.eventDate}\n` : '') + c.question }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 3000 } }, timeoutMs: 60000 });
  if (!r.ok) throw new Error(`API xatosi ${r.status}`);
  const raw = await r.upstream.json();
  const { text } = extractCandidate(raw);
  const u = raw.usageMetadata || {};
  return { text, ms: Date.now() - t, model: r.model, inTok: u.promptTokenCount || 0, outTok: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0) };
}

async function main() {
  const rows = [];
  const limit = live ? Number(process.env.HK_EVAL_LIMIT) || cases.length : cases.length;
  for (const c of cases.slice(0, limit)) {
    const ev = evalRetrieval(c);
    const row = { ...ev, rag: undefined };
    if (live) {
      try {
        const a = await liveAnswer(c, ev.rag);
        const { claims, unsupported } = claimChecks(a.text, ev.rag.provided, { eventDate: c.eventDate });
        const cited = lawRefs(a.text);
        const low = a.text.toLowerCase();
        Object.assign(row, {
          answerMs: a.ms, model: a.model, inTok: a.inTok, outTok: a.outTok,
          citedCount: Object.values(cited).flat().length,
          badCitations: claims.filter((x) => x.icon === '❌' || x.icon === '🚫').length,
          weakCitations: claims.filter((x) => x.icon === '⚠️' || x.icon === 'ℹ️').length,
          groundedCitations: claims.filter((x) => x.icon === '✅').length,
          uncitedClaims: unsupported.length,
          asksQuestion: /\?/.test(a.text),
          mustNotHits: c.mustNot.filter((p) => low.includes(p.toLowerCase())), // taxminiy; yurist tekshiradi
          report: citationReport(a.text, ev.rag.provided, { bands: ev.rag.bands, bandsBy: ev.rag.bandsBy, eventDate: c.eventDate }).slice(0, 4000),
          answer: a.text.slice(0, 6000),
        });
      } catch (e) { row.liveError = e.message; }
    }
    rows.push(row);
  }
  const avg = (f) => rows.length ? rows.reduce((s, r) => s + f(r), 0) / rows.length : 0;
  const summary = {
    mode: live ? 'live' : 'offline', at: new Date().toISOString(), cases: rows.length,
    retrievalRecall: +avg((r) => r.recall).toFixed(3),
    fullHits: rows.filter((r) => r.recall === 1).length,
    editionWarnings: `${rows.filter((r) => r.editionWarning === true).length}/${rows.filter((r) => r.editionWarning !== null).length}`,
    avgRetrievalMs: Math.round(avg((r) => r.ms)),
  };
  if (live) {
    const inT = rows.reduce((s, r) => s + (r.inTok || 0), 0), outT = rows.reduce((s, r) => s + (r.outTok || 0), 0);
    const pin = Number(process.env.HK_PRICE_IN_PER_M), pout = Number(process.env.HK_PRICE_OUT_PER_M);
    Object.assign(summary, {
      avgAnswerMs: Math.round(avg((r) => r.answerMs || 0)), inputTokens: inT, outputTokens: outT,
      estCostUsd: pin && pout ? +((inT * pin + outT * pout) / 1e6).toFixed(4) : 'narx berilmagan (HK_PRICE_IN_PER_M / HK_PRICE_OUT_PER_M)',
      badCitations: rows.reduce((s, r) => s + (r.badCitations || 0), 0), uncitedClaims: rows.reduce((s, r) => s + (r.uncitedClaims || 0), 0),
      errors: rows.filter((r) => r.liveError).length,
    });
  }
  fs.mkdirSync(new URL('eval/', ROOT), { recursive: true });
  const file = new URL(`eval/results-${summary.mode}-${summary.at.slice(0, 10)}.json`, ROOT);
  fs.writeFileSync(file, JSON.stringify({ summary, rows }, null, 1));
  console.log(JSON.stringify(summary, null, 1));
  for (const r of rows) if (r.recall < 1) console.log(`  ${r.id} (${r.kind}): topilmadi ${r.missing.join(', ') || '(bo‘sh bo‘lishi kerak edi)'}; olindi: ${r.codes.join(',') || '—'}`);
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) await main();
