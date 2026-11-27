import {publicSourceMetadata,sourceOrigin,lawContentHash} from '../netlify/shared/source-integrity.mjs';
import {internationalEnabled} from '../netlify/shared/features.mjs';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
const data=JSON.parse(await readFile(new URL('../data/legal.json',import.meta.url),'utf8'));
// Bazadagi rasmiy matn holati (lex.uz ID → tahrir sanasi): kodeks kartochkalarida ko'rsatiladi.
const lawBase={};
for(const f of ['kon','mk','ok','fk1','fk2','fpk','jk','jpk','mjtk','sk','ujk','ipk','ist','jik','msk','plenum05','yhq','ypx975','iiv502']){try{const l=JSON.parse(await readFile(new URL(`../data/laws/${f}.json`,import.meta.url),'utf8'));if(l.lexId&&l.asOf)lawBase[l.lexId]=l.asOf;}catch{}}
await writeFile(new URL('../public/legal-data.js',import.meta.url),'// Generated from data/legal.json — run npm run build after edits.\nglobalThis.HK_LEGAL = '+JSON.stringify(data)+';\nglobalThis.HK_LAWBASE = '+JSON.stringify(lawBase)+';\n');

// ---- SEO: har bir vaziyat uchun statik sahifa, ro'yxat sahifasi, sitemap.xml va robots.txt ----
// Netlify build paytida URL ni o'zi beradi; lokal buildda asosiy manzil ishlatiladi.
const SITE=(process.env.SITE_URL||process.env.URL||'https://huquqyordamchiuz.netlify.app').replace(/\/+$/,'');
const slugOf=s=>s.slug||s.id.replace(/_/g,'-');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent'}).format(new Date());
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clip=(t,n)=>{t=String(t).replace(/\s+/g,' ').trim();return t.length<=n?t:t.slice(0,t.lastIndexOf(' ',n-1)).replace(/[,;:.\s]+$/,'')+'…';};
const ld=o=>`<script type="application/ld+json">${JSON.stringify(o).replace(/</g,'\\u003c')}</script>`;

function page({path,title,description,body,jsonld=[]}){
 const url=SITE+path;
 return `<!doctype html>
<html lang="uz">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#123a66">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="HuquqYordamchi"><meta property="og:locale" content="uz_UZ">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${SITE}/assets/legal-hero.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg"><link rel="stylesheet" href="/styles.css">
<script>try{const t=localStorage.getItem('hk-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch{}</script>
${jsonld.map(ld).join('\n')}
</head>
<body>
<div class="utility"><div class="wrap"><span>O‘zbekiston qonunchiligi bo‘yicha mustaqil axborot loyihasi</span><span class="util-right"><span class="lang-switch notranslate" translate="no" role="group" aria-label="Til / Язык / Language"><button type="button" data-lang="uz" aria-pressed="true"><span class="ls-long">O‘zbekcha</span><span class="ls-short">UZ</span></button><button type="button" data-lang="cy" aria-pressed="false"><span class="ls-long">Ўзбекча</span><span class="ls-short">ЎЗ</span></button><button type="button" data-lang="ru" aria-pressed="false"><span class="ls-long">Русский</span><span class="ls-short">RU</span></button><button type="button" data-lang="en" aria-pressed="false"><span class="ls-long">English</span><span class="ls-short">EN</span></button></span><a class="util-src" href="https://lex.uz" target="_blank" rel="noopener">Rasmiy manba: Lex.uz ↗</a></span></div></div>
<header class="header"><div class="wrap header-inner"><a class="brand" href="/"><span class="brand-icon"><svg class="hidoya" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="30" fill="#1d2b3a"/><circle class="hidoya-ring" cx="32" cy="32" r="25.5" fill="none" stroke="#b48c49" stroke-width="1.6"/><path d="M22 18v28M42 18v28M22 32h20M32 32l-6 14M32 32l6 14" fill="none" stroke="#e8dcc0" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>Huquq<span class="brand-accent">Yordamchi</span><small>QONUNNI TUSHUNISH OSONROQ</small></span></a><nav aria-label="Asosiy menyu" class="static-nav"><a href="/#qidiruv">Aqlli qidiruv</a><a href="/#hujjatlar">Namunalar</a><a href="/vaziyat/">Vaziyatlar</a><a href="/#kodekslar">Kodekslar</a></nav><div class="header-actions"><a class="btn btn-primary btn-sm" href="/#chat">AI yordamchi</a></div></div></header>
<main id="main"><div class="wrap narrow section">
${body}
</div></main>
<footer><div class="wrap footer-main"><a class="brand" href="/"><span class="brand-icon"><svg class="hidoya" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="30" fill="#1d2b3a"/><circle class="hidoya-ring" cx="32" cy="32" r="25.5" fill="none" stroke="#b48c49" stroke-width="1.6"/><path d="M22 18v28M42 18v28M22 32h20M32 32l-6 14M32 32l6 14" fill="none" stroke="#e8dcc0" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>HuquqYordamchi<small>QONUNNI TUSHUNISH OSONROQ</small></span></a><p>Mustaqil huquqiy axborot loyihasi.<br>Rasmiy matnlar — <a href="https://lex.uz" target="_blank" rel="noopener">Lex.uz</a>.</p><div><a href="/vaziyat/">Barcha vaziyatlar</a><a href="/#hujjatlar">Hujjat namunalari</a><a href="/#kazus">Kazus ustaxonasi</a><a href="/oferta/">Ommaviy oferta</a><a href="#" data-cookie-settings>Cookie sozlamalari</a></div></div><div class="wrap footer-bottom">© ${today.slice(0,4)} HuquqYordamchi · Umumiy ma’lumot advokatning ish bo‘yicha maslahatini almashtirmaydi.</div></footer>
<script src="/consent.js"></script><script src="/i18n.js"></script>
</body></html>
`;
}

// Manba havolasi yorlig'i: lex.uz ID → hujjat nomi (kodekslar ro'yxati + qo'shimcha nomlar).
const LEX_NAMES=Object.fromEntries([...data.codes.map(c=>[c[3],c[1]]),...Object.entries(data.sourceLabels||{})]);
function sourceLabel(u){const m=/lex\.uz\/(?:[a-z]{2}\/)?docs\/(-?\d+)/.exec(u);if(m)return `${LEX_NAMES[m[1]]||'Rasmiy matn'} (lex.uz)`;if(/gov\.uz/.test(u))return 'Rasmiy tushuntirish (gov.uz)';return 'Rasmiy manba';}
const crumbs=items=>({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map(([name,path],i)=>({'@type':'ListItem',position:i+1,name,item:SITE+path}))});
const vaziyatDir=new URL('../public/vaziyat/',import.meta.url);
await rm(vaziyatDir,{recursive:true,force:true});
await mkdir(vaziyatDir,{recursive:true});

const pages=[];
for(const s of data.situations){
 const slug=slugOf(s),path=`/vaziyat/${slug}/`;
 const title=`${s.title}: tartib, muddat va qonun asosi | HuquqYordamchi`;
 const description=clip(`${s.desc}. ${s.intro}`,158);
 // Avval shu guruhdagi vaziyatlar, keyin boshqalari — ichki havolalar mavzuga yaqin bo'lsin.
 const others=[...data.situations.filter(x=>x.id!==s.id&&x.group===s.group),...data.situations.filter(x=>x.group!==s.group)].slice(0,6);
 const body=`<nav class="crumbs" aria-label="Yo‘l"><a href="/">Bosh sahifa</a> › <a href="/vaziyat/">Vaziyatlar</a> › <span>${esc(s.title)}</span></nav>
<article class="static-article">
<span class="eyebrow">${esc(s.tag)}</span>
<h1>${esc(s.title)}</h1>
<p class="detail-intro">${esc(s.intro)}</p>
<div class="verify-note">⚠️ Bu umumiy ma’lumot, yurist tomonidan tasdiqlanmagan. Modda raqamlari, muddatlar va summalarni <a href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> dagi amaldagi tahrir bilan tekshiring.</div>
<h2>Qadamma-qadam nima qilish kerak</h2>
<ol class="steps-list">${s.steps.map(([b,t])=>`<li><b>${esc(b)}</b><p>${esc(t)}</p></li>`).join('')}</ol>
<div class="laws-card"><h2>Asosiy qonunchilik hujjatlari</h2><ul>${s.laws.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${(s.sourceUrls||[]).length?`<p>${s.sourceUrls.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(sourceLabel(u))} ↗</a>`).join(' · ')}</p>`:''}${s.reviewedAt?`<p class="muted-note">Manbalar bilan solishtirilgan sana: ${esc(s.reviewedAt)}</p>`:''}</div>
<h2>Ko‘p beriladigan savollar</h2>
<ul class="static-qs">${s.qs.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>
<p><a class="btn btn-primary" href="/#chat">Savolingizni AI yordamchiga bering →</a> <a class="btn btn-ghost" href="/#hujjatlar">Ariza namunasini tayyorlash</a></p>
</article>
<aside class="static-related"><h2>Boshqa vaziyatlar</h2><ul>${others.map(o=>`<li><a href="/vaziyat/${slugOf(o)}/">${esc(o.title)}</a> — ${esc(o.desc)}</li>`).join('')}</ul></aside>`;
 const jsonld=[crumbs([['Bosh sahifa','/'],['Vaziyatlar','/vaziyat/'],[s.title,path]]),
  {'@context':'https://schema.org','@type':'Article',headline:s.title,description,inLanguage:'uz',dateModified:today,url:SITE+path,image:SITE+'/assets/legal-hero.png',author:{'@type':'Organization',name:'HuquqYordamchi',url:SITE+'/'},publisher:{'@type':'Organization',name:'HuquqYordamchi',url:SITE+'/'},about:s.tag}];
 await mkdir(new URL(`${slug}/`,vaziyatDir),{recursive:true});
 await writeFile(new URL(`${slug}/index.html`,vaziyatDir),page({path,title,description,body,jsonld}));
 pages.push(path);
}

const hubBody=`<nav class="crumbs" aria-label="Yo‘l"><a href="/">Bosh sahifa</a> › <span>Vaziyatlar</span></nav>
<span class="eyebrow">KUNDALIK HAYOT UCHUN</span>
<h1>Huquqiy vaziyatlar bo‘yicha yo‘l-yo‘riq</h1>
<p class="detail-intro">Ishdan bo‘shatish, ta’til, aliment, otalik, qarz, MIB, YTH, pensiya va boshqa kundalik holatlarda nima qilish, qayerga murojaat qilish va qaysi qonunga tayanish haqida qisqa yo‘riqnomalar.</p>
<div class="static-groups">${[...new Set(data.situations.map(s=>s.group||'Boshqa'))].map(g=>`<h2>${esc(g)}</h2>
<ul class="static-hub">${data.situations.filter(s=>(s.group||'Boshqa')===g).map(s=>`<li><a href="/vaziyat/${slugOf(s)}/"><b>${esc(s.title)}</b></a><p>${esc(s.desc)} · <span>${esc(s.tag)}</span></p></li>`).join('')}</ul>`).join('\n')}</div>`;
await writeFile(new URL('index.html',vaziyatDir),page({path:'/vaziyat/',title:'Huquqiy vaziyatlar: ish, oila, meros, jarima, iste’molchi | HuquqYordamchi',description:`O‘zbekiston qonunchiligi bo‘yicha kundalik vaziyatlar: mehnat, oila, qarz, uy-joy, MIB, onlayn xarid, YTH, pensiya va nafaqa — qadamlar va qonun asoslari.`,body:hubBody,jsonld:[crumbs([['Bosh sahifa','/'],['Vaziyatlar','/vaziyat/']])]}));

// ---- Ommaviy oferta ----
const oferta=JSON.parse(await readFile(new URL('../data/oferta.json',import.meta.url),'utf8'));
const req=oferta.requisites;
const ofertaBody=`<nav class="crumbs" aria-label="Yo‘l"><a href="/">Bosh sahifa</a> › <span>${esc(oferta.title)}</span></nav>
<article class="static-article oferta">
<span class="eyebrow">HUQUQIY HUJJAT</span>
<h1>${esc(oferta.title)}</h1>
<p class="detail-intro">${esc(oferta.subtitle)}. <span class="muted-note">${esc(oferta.edition)}</span></p>
${oferta.sections.map(s=>`<section><h2>${esc(s.h)}</h2>${s.p.map(t=>`<p>${esc(t)}</p>`).join('')}</section>`).join('\n')}
<section class="oferta-req"><h2>Ijrochi rekvizitlari</h2><dl><dt>Ijrochi</dt><dd>${esc(req.name)}</dd><dt>STIR</dt><dd>${esc(req.tin)}</dd><dt>Manzil</dt><dd>${esc(req.address)}</dd><dt>Elektron pochta</dt><dd>${esc(req.email)}</dd><dt>Telefon</dt><dd>${esc(req.phone)}</dd></dl></section>
<div class="laws-card"><h2>Huquqiy asoslar</h2><ul>${oferta.sources.map(([t,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a></li>`).join('')}</ul></div>
</article>`;
await mkdir(new URL('../public/oferta/',import.meta.url),{recursive:true});
await writeFile(new URL('../public/oferta/index.html',import.meta.url),page({path:'/oferta/',title:'Ommaviy oferta — HuquqYordamchi xizmatlaridan foydalanish shartlari',description:'HuquqYordamchi veb-sayti va xizmatlaridan foydalanish shartlari: shartnoma predmeti, taraflarning majburiyatlari, javobgarlik, shaxsga doir ma’lumotlar va nizolarni hal qilish.',body:ofertaBody,jsonld:[crumbs([['Bosh sahifa','/'],[oferta.title,'/oferta/']])]}));

const germaniya=['/germaniya/',...['anmeldung','yashash-ruxsati','talaba-ishi','ijara'].map(s=>`/germaniya/${s}.html`)];
const urls=['/','/alphabet.html','/vaziyat/',...pages,'/oferta/',...germaniya,...(internationalEnabled()?['/international.html']:[])];
await writeFile(new URL('../public/sitemap.xml',import.meta.url),`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u=>`  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
await writeFile(new URL('../public/robots.txt',import.meta.url),`User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`);
// Bosh sahifadagi canonical, og:url va JSON-LD manzillari sayt domeniga moslanadi (boshqa domenga ishora qilsa, Google sahifani indekslamaydi)
const indexUrl=new URL('../public/index.html',import.meta.url);
const indexHtml=await readFile(indexUrl,'utf8');
const oldOrigin=(/<link rel="canonical" href="(https?:\/\/[^"/]+)\//.exec(indexHtml)||[])[1];
if(oldOrigin&&oldOrigin!==SITE)await writeFile(indexUrl,indexHtml.replaceAll(oldOrigin+'/',SITE+'/'));
console.log(`SEO: ${pages.length} ta vaziyat sahifasi, sitemap (${urls.length} URL), robots.txt — ${SITE}`);

// ---- Manba holati: data/laws dagi matn data/source-status.json dagi tekshirilgan xeshga mos bo‘lishi shart ----
// Aks holda runtime butun hujjatni "local-content-changed" deb javobdan chiqaradi — buni deploy’dan oldin, buildda aytamiz.
{
  const { readdir } = await import('node:fs/promises');
  const status = JSON.parse(await readFile(new URL('../data/source-status.json', import.meta.url), 'utf8'));
  const lawDir = new URL('../data/laws/', import.meta.url), stale = [];
  for (const f of (await readdir(lawDir)).filter(f => f.endsWith('.json') && f !== 'manifest.json')) {
    const law = JSON.parse(await readFile(new URL(f, lawDir), 'utf8')), audit = status.documents?.[law.doc];
    if (audit && (audit.localAsOf !== law.asOf || audit.localContentSha256 !== lawContentHash(law))) stale.push(law.doc);
  }
  if (stale.length) { console.error(`Manba holati eskirgan: ${stale.join(', ')}. Matn o‘zgargan, lekin data/source-status.json yangilanmagan — "npm run audit:sources" ni ishga tushiring yoki review:approve orqali tasdiqlang.`); process.exit(1); }
}

// ---- Kalkulyatorlar (v11.13): data/calc tekshiriladi, faqat lawyerReview="tasdiqlangan" yozuvlar funksiyaga o‘tadi ----
// Xato bo‘lsa build to‘xtaydi. Natija netlify/shared/calc-approved.json (qo‘lda tahrirlanmaydi; public/ va SW keshiga tushmaydi).
{
  const { readdir } = await import('node:fs/promises');
  const { validateAll } = await import('../netlify/shared/calc.mjs');
  const lawDir = new URL('../data/laws/', import.meta.url), articles = new Set(), meta = {};
  for (const f of (await readdir(lawDir)).filter(f => f.endsWith('.json') && f !== 'manifest.json')) {
    const law = JSON.parse(await readFile(new URL(f, lawDir), 'utf8')), doc = f.replace(/\.json$/, '');
    for (const a of law.articles || []) { articles.add(`${doc}:${a.art}`); meta[`${doc}:${a.art}`] = { url: law.url || null, doc: law.name, title: a.title || '' }; }
  }
  const calcs = JSON.parse(await readFile(new URL('../data/calc/calculators.json', import.meta.url), 'utf8'));
  const holidays = JSON.parse(await readFile(new URL('../data/calc/holidays.json', import.meta.url), 'utf8'));
  let approved;
  try { approved = validateAll(calcs, { articles, holidays }); } catch (e) { console.error('data/calc xatosi:', e.message); process.exit(1); }
  const out = { _generated: 'scripts/build-data.mjs — qo‘lda tahrirlamang; manba: data/calc/', calculators: approved.map(c => ({ ...c, source: meta[c.sourceRef] })), holidays: holidays.lawyerReview === 'tasdiqlangan' ? holidays : null };
  await writeFile(new URL('../netlify/shared/calc-approved.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
  console.log(`Kalkulyatorlar: ${calcs.length} ta yozuv, ${approved.length} ta tasdiqlangan`);
}

// ---- Baza qamrovi: raqamlar data/ dagi haqiqiy fayllardan hisoblanadi (public/coverage.json, #qamrov) ----
{
  const { readdir } = await import('node:fs/promises');
  const { courtStatus } = await import('../netlify/shared/court.mjs');
  const manifest = JSON.parse(await readFile(new URL('../data/laws/manifest.json', import.meta.url), 'utf8'));
  const lawDir = new URL('../data/laws/', import.meta.url);
  let archive = [];
  try { archive = await readdir(new URL('archive/', lawDir)); } catch {}
  const docs = [];
  for (const f of (await readdir(lawDir)).filter(f => f.endsWith('.json') && f !== 'manifest.json').sort()) {
    const law = JSON.parse(await readFile(new URL(f, lawDir), 'utf8'));
    const key = Object.keys(manifest).find(k => manifest[k].file === f);
    const m = manifest[key] || {};
    docs.push({ doc: key || f.replace('.json', ''), name: law.name, kind: ['yhq','ypx975','iiv502'].includes(key)?'qoida':law.kind === 'band' ? 'plenum' : 'qonun', unit: law.kind === 'band' ? 'band' : 'modda',
      units: law.articles.length, repealed: (law.repealed || []).length, asOf: law.asOf, publishedAt:law.publishedAt||null, effectiveFrom:law.effectiveFrom||null, ...publicSourceMetadata(law), scope:law.provenance?.scope||'indexed-text', importedAt: law.importedAt || m.importedAt || null,
      monitoring:sourceOrigin(law.url)==='lex-document-link'?'weekly-page-audit':'manual',contentUpdate:'legal-review-required', autoUpdate: m.autoUpdate !== false && law.kind !== 'band', url: law.url, archivedEditions: await readdir(new URL(`archive/${key}/`,lawDir)).then(a=>a.filter(f=>f.endsWith('.json.gz')).length).catch(()=>0) });
  }
  const court = courtStatus();
  // data/pending: egasi bergan, lekin lex.uz havolasi hali yo‘q hujjatlar — AI ularga tayanmaydi.
  const pending = [];
  try { for (const f of (await readdir(new URL('../data/pending/', import.meta.url))).filter(f => f.endsWith('.json'))) { const p = JSON.parse(await readFile(new URL('../data/pending/' + f, import.meta.url), 'utf8')); pending.push({ name: p.name, why: `Egasi nusxasi bor (${p.articles.length} band), lekin lex.uz havolasi hali yo‘q — tekshirilmaguncha javoblarda ishlatilmaydi.${p.proposedEffectiveFrom ? ` Taklif qilingan sana: ${p.proposedEffectiveFrom}; rasmiy tasdiqlanmagan.` : ''}` }); } } catch {}
  const coverage = {
    generatedAt: today, site: SITE,
    totals: { documents: docs.length, laws: docs.filter(d => d.kind === 'qonun').length, plenums: docs.filter(d => d.kind === 'plenum').length,
      articles: docs.filter(d => d.kind === 'qonun').reduce((s, d) => s + d.units, 0), bands: docs.filter(d => d.kind === 'plenum').reduce((s, d) => s + d.units, 0),
      courtDecisions: court.decisions, situations: data.situations.length, reviewedSituations: data.situations.filter(s => s.reviewedAt).length },
    lastImport: docs.map(d => d.importedAt).filter(Boolean).sort().at(-1) || null,
    docs,
    notConnected: [
      ...(!docs.some(d=>d.doc==='yhq')?[{name:'Yo‘l harakati qoidalari',why:'YHQ matni bazaga kiritilmagan. Egasi Word/HTML eksportini beradi.'}]:[]),
      ...pending,
      {name:'YHQ ilovalari',why:'Yo‘l belgisi va chiziq rasmlari, jadvallar hamda barcha ilovalar to‘liq indekslanmagan. Ular bo‘yicha xulosa chiqarilmaydi.'},
      ...court.notConnected.map(s => ({ name: s.name, why: s.note })),
      { name: 'TSUL elektron kutubxonasi', why: 'Rasmiy API va ruxsat yo‘q; kitob matni avtomatik olinmaydi.' },
      { name: 'Qonunlarning tarixiy tahrirlari', why: 'Bazada import qilingan nusxa saqlanadi; uning bugun amalda ekanligi alohida tekshiriladi; voqea sanasidagi eski tahrir matni yo‘q (faqat o‘zgartish izohlari va importda saqlangan arxiv nusxalar; ular avtomatik ravishda tarixiy amaldagi matn deb olinmaydi).' },
      { name: 'Boshqa qonun va qarorlar', why: 'Bazada yuqoridagi hujjatlar bor; qolgan normativ hujjatlar faqat lex.uz havolasi orqali.' },
    ],
    note: 'Nashr, kuchga kirish, import va tekshiruv sanalari alohida. Nashr sanasi tengligi matn yoki huquqiy xulosani tasdiqlamaydi. Haftalik kuzatuv kodi mavjud; bajarilish holati GitHub Actions jurnalidan tekshiriladi. Yangilanishlar tekshiruv navbatiga tushadi.',
  };
  await writeFile(new URL('../public/coverage.json', import.meta.url), JSON.stringify(coverage, null, 1));
  console.log(`Qamrov: ${coverage.totals.documents} hujjat, ${coverage.totals.articles} modda, ${coverage.totals.bands} band, ${court.decisions} sud qarori`);
}

// ---- Service worker versiyasi: statik fayllar mazmunidan (o'zgarsa — yangi kesh, foydalanuvchiga yangilash taklifi) ----
{
  const { readdir } = await import('node:fs/promises');
  const { createHash } = await import('node:crypto');
  const pub = new URL('../public/', import.meta.url);
  const files = (await readdir(pub)).filter(f => /\.(js|css|html|json|webmanifest)$/.test(f) && f !== 'sw.js').sort();
  const h = createHash('sha256');
  for (const f of files) h.update(f).update(await readFile(new URL(f, pub)));
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const swUrl = new URL('sw.js', pub), sw = await readFile(swUrl, 'utf8');
  const version = `hk-v${pkg.version}-${h.digest('hex').slice(0, 10)}`;
  await writeFile(swUrl, sw.replace(/const SW_VERSION = '[^']*';/, `const SW_VERSION = '${version}';`));
  console.log(`Service worker: ${version}`);
}
