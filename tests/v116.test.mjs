// v11.6: Jinoyat-ijroiya kodeksi, Ma'muriy sud ishlarini yuritish kodeksi, Plenum 5-son (meros), lotincha JPK.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rag = await import('../netlify/shared/rag.mjs');
const legal = JSON.parse(fs.readFileSync(new URL('../data/legal.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(new URL('../data/laws/manifest.json', import.meta.url), 'utf8'));

test('JIK va MSK bazada to‘liq: bo‘shliqlar faqat kuchini yo‘qotgan moddalar; JPK lotin yozuvida', () => {
  const { jik, msk, jpk, plenum05 } = rag.LAWS;
  for (const [law, lo, hi, id] of [[jik, 1, 197, '-163629'], [msk, 1, 288, '-3527353']]) {
    const nums = law.articles.map(a => a.art).filter(x => /^\d+$/.test(x)).map(Number), have = new Set(nums.map(String));
    assert.equal(Math.min(...nums), lo); assert.equal(Math.max(...nums), hi);
    for (let x = lo; x <= hi; x++) assert.ok(have.has(String(x)) || law.repealed.includes(String(x)), `${law.doc} ${x}`);
    assert.ok(law.articles.every(a => a.parts.length && a.title), law.doc + ': matnsiz modda');
    assert.equal(law.url, 'https://lex.uz/docs/' + id); assert.match(law.asOf, /^20\d\d-\d\d-\d\d$/);
  }
  assert.equal(jpk.script, 'latn'); assert.ok(jpk.articles.length >= 760);
  assert.equal(plenum05.kind, 'band'); assert.equal(plenum05.asOf, '2011-07-20'); assert.equal(plenum05.url, 'https://lex.uz/docs/-2414320');
  assert.match(plenum05.articles.find(a => a.art === '3').parts.join(' '), /1113-moddasi/);
  for (const d of ['jik', 'msk', 'plenum05', 'jpk']) assert.deepEqual(manifest[d].problems, [], d);
  assert.equal(manifest.plenum05.autoUpdate, false);
  const codes = legal.codes.map(c => c[0]); assert.ok(codes.includes('JIK') && codes.includes('MSK'));
});

test('jazoni ijro etish va ma’muriy sud savollari JIK/MSK ga yo‘naladi, boshqa kodeks aralashmaydi', () => {
  const udo = rag.retrieve('Mahkum muddatidan oldin shartli ozod qilinishi uchun nima kerak?', { k: 6 });
  assert.deepEqual(udo.codes, ['jik']); assert.ok(udo.provided.jik.has('163'));
  assert.ok(rag.retrieve('Koloniyada mahkumga uchrashuv berilmayapti', { k: 6 }).provided.jik.has('77'));
  const ms = rag.retrieve('Hokimlik qarori ustidan ma\'muriy sudga shikoyat qilish muddati qancha?', { k: 6 });
  assert.deepEqual(ms.codes, ['msk']); assert.ok(ms.provided.msk.has('184') || ms.provided.msk.has('185'));
  assert.deepEqual(rag.retrieve('Soliq inspeksiyasining harakati ustidan ma\'muriy sudga ariza', { k: 6 }).codes, ['msk'], 'FPK aralashmaydi');
  assert.equal([...rag.retrieve('JIK 87-modda', { k: 2 }).provided.jik][0], '87');
  assert.equal([...rag.retrieve('MSK 26-modda', { k: 2 }).provided.msk][0], '26');
  assert.match(rag.retrieve('JIK 87-modda', { k: 1 }).block, /\[JIK 87-modda\./);
  // eski yo'nalishlar buzilmagan
  assert.deepEqual(rag.retrieve('Jinoyat ishi bo‘yicha ushlab turildim', { k: 6 }).codes, ['jpk']);
  assert.deepEqual(rag.retrieve('Ishdan noqonuniy bo‘shatildim', { k: 6 }).codes, ['mk']);
});

test('meros savoliga FK moddalari bilan birga Plenum 5-son bandlari beriladi; mehnat savoliga berilmaydi', () => {
  const r = rag.retrieve('Otam vafot etdi, meros qanday bo‘linadi? Vasiyat yo‘q', { k: 6 });
  assert.deepEqual(r.codes, ['fk']); assert.ok(r.provided.fk.has('1135') || r.provided.fk.has('1134'));
  assert.ok(r.bandsBy.plenum05.size >= 1); assert.equal(r.bandsBy.plenum26.size, 0);
  assert.match(r.block, /\[Plenum 5-son, \d+-band\]/); assert.match(r.block, /5-son qarori/);
  assert.equal(rag.retrieve('Ishdan noqonuniy bo‘shatildim', { k: 6 }).bandsBy.plenum05.size, 0);
  assert.equal(rag.retrieve('Kvartira sotib oldim, sotuvchi kalitni bermayapti', { k: 6 }).bandsBy.plenum05.size, 0, 'meros mavzusi bo‘lmasa Plenum 5 berilmaydi');
  const ex = rag.retrieve('Plenumning 5-son qarori 3-bandi', { k: 6 });
  assert.equal([...ex.bandsBy.plenum05][0], '3'); assert.ok(ex.provided.fk.has('1113'), 'band ichida tilga olingan modda ham beriladi');
});

test('bandRefsAll Plenum raqamini aniqlaydi va bandlarni aralashtirmaydi; hisobot har bir Plenum bo‘yicha', () => {
  assert.deepEqual(rag.bandRefsAll('Plenumning 5-son qarori 3-bandi va 26-son qarori 22-bandi'), { plenum26: ['22'], plenum05: ['3'] });
  assert.deepEqual(rag.bandRefsAll('Oliy sud Plenumining 2011-yil 20-iyuldagi 5-son qarorining 12-bandi'), { plenum26: [], plenum05: ['12'] });
  assert.deepEqual(rag.bandRefsAll('Plenum qarorining 6, 7 va 9-bandlari'), { plenum26: ['6', '7', '9'], plenum05: [] });
  assert.deepEqual(rag.bandRefs('Plenumning 26-son qarori 22-bandi'), ['22']);
  const r = rag.retrieve('Otam vafot etdi, meros qanday bo‘linadi? Vasiyat yo‘q', { k: 6 });
  const b = [...r.bandsBy.plenum05][0];
  const rep = rag.citationReport(`Plenumning 5-son qarori ${b}-bandi. Plenumning 5-son qarori 99-bandi.`, r.provided, { bands: r.bands, bandsBy: r.bandsBy });
  assert.match(rep, new RegExp(`Plenum 5-son qarori: tahlilga berilgan bandlar — ${b}-band`));
  assert.match(rep, /❌ Plenum 5-son qarorida bunday band yo‘q: 99-band/);
});
