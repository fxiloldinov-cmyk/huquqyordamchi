import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
const data=JSON.parse(await readFile(new URL('../data/legal.json',import.meta.url),'utf8'));
await writeFile(new URL('../public/legal-data.js',import.meta.url),'// Generated from data/legal.json — run npm run build after edits.\nglobalThis.HK_LEGAL = '+JSON.stringify(data)+';\n');

// ---- SEO: har bir vaziyat uchun statik sahifa, ro'yxat sahifasi, sitemap.xml va robots.txt ----
// Netlify build paytida URL ni o'zi beradi; lokal buildda asosiy manzil ishlatiladi.
const SITE=(process.env.SITE_URL||process.env.URL||'https://huquqyordamchi.netlify.app').replace(/\/+$/,'');
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
<header class="header"><div class="wrap header-inner"><a class="brand" href="/"><span class="brand-icon"><svg class="hidoya" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="7" y="5" width="50" height="54" rx="3" fill="#123a66"/><path d="M17 59V33C17 22 25 15 32 11c7 4 15 11 15 22v26z" fill="#f5f7fa"/><path class="hidoya-star" d="M32 22l2.6 7.4L42 32l-7.4 2.6L32 42l-2.6-7.4L22 32l7.4-2.6z" fill="#c9a24b"/></svg></span><span>Huquq<span class="brand-accent">Yordamchi</span><small>QONUNNI TUSHUNISH OSONROQ</small></span></a><nav aria-label="Asosiy menyu" class="static-nav"><a href="/#qidiruv">Aqlli qidiruv</a><a href="/#hujjatlar">Namunalar</a><a href="/vaziyat/">Vaziyatlar</a><a href="/#kodekslar">Kodekslar</a></nav><div class="header-actions"><a class="btn btn-primary btn-sm" href="/#chat">AI yordamchi</a></div></div></header>
<main id="main"><div class="wrap narrow section">
${body}
</div></main>
<footer><div class="wrap footer-main"><a class="brand" href="/"><span class="brand-icon"><svg class="hidoya" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="7" y="5" width="50" height="54" rx="3" fill="#123a66"/><path d="M17 59V33C17 22 25 15 32 11c7 4 15 11 15 22v26z" fill="#f5f7fa"/><path class="hidoya-star" d="M32 22l2.6 7.4L42 32l-7.4 2.6L32 42l-2.6-7.4L22 32l7.4-2.6z" fill="#c9a24b"/></svg></span><span>HuquqYordamchi<small>QONUNNI TUSHUNISH OSONROQ</small></span></a><p>Mustaqil huquqiy axborot loyihasi.<br>Rasmiy matnlar — <a href="https://lex.uz" target="_blank" rel="noopener">Lex.uz</a>.</p><div><a href="/vaziyat/">Barcha vaziyatlar</a><a href="/#hujjatlar">Hujjat namunalari</a><a href="/#kazus">Kazus ustaxonasi</a><a href="/oferta/">Ommaviy oferta</a></div></div><div class="wrap footer-bottom">© ${today.slice(0,4)} HuquqYordamchi · Umumiy ma’lumot advokatning ish bo‘yicha maslahatini almashtirmaydi.</div></footer>
<script src="/i18n.js"></script>
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

const urls=['/','/vaziyat/',...pages,'/oferta/'];
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
console.log(`SEO: ${pages.length} ta vaziyat sahifasi, sitemap (${urls.length} URL), robots.txt — ${SITE}`);
