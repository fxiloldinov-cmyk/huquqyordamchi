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
<header class="header"><div class="wrap header-inner"><a class="brand" href="/"><span class="brand-icon">§</span><span>Huquq<span class="brand-accent">Yordamchi</span><small>QONUNNI TUSHUNISH OSONROQ</small></span></a><nav aria-label="Asosiy menyu" class="static-nav"><a href="/#qidiruv">Aqlli qidiruv</a><a href="/#hujjatlar">Namunalar</a><a href="/vaziyat/">Vaziyatlar</a><a href="/#kodekslar">Kodekslar</a></nav><div class="header-actions"><a class="btn btn-primary btn-sm" href="/#chat">AI yordamchi</a></div></div></header>
<main id="main"><div class="wrap narrow section">
${body}
</div></main>
<footer><div class="wrap footer-main"><a class="brand" href="/"><span class="brand-icon">§</span><span>HuquqYordamchi<small>QONUNNI TUSHUNISH OSONROQ</small></span></a><p>Mustaqil huquqiy axborot loyihasi.<br>Rasmiy matnlar — <a href="https://lex.uz" target="_blank" rel="noopener">Lex.uz</a>.</p><div><a href="/vaziyat/">Barcha vaziyatlar</a><a href="/#hujjatlar">Hujjat namunalari</a><a href="/#kazus">Kazus ustaxonasi</a></div></div><div class="wrap footer-bottom">© ${today.slice(0,4)} HuquqYordamchi · Umumiy ma’lumot advokatning ish bo‘yicha maslahatini almashtirmaydi.</div></footer>
</body></html>
`;
}

const crumbs=items=>({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map(([name,path],i)=>({'@type':'ListItem',position:i+1,name,item:SITE+path}))});
const vaziyatDir=new URL('../public/vaziyat/',import.meta.url);
await rm(vaziyatDir,{recursive:true,force:true});
await mkdir(vaziyatDir,{recursive:true});

const pages=[];
for(const s of data.situations){
 const slug=slugOf(s),path=`/vaziyat/${slug}/`;
 const title=`${s.title}: tartib, muddat va qonun asosi | HuquqYordamchi`;
 const description=clip(`${s.desc}. ${s.intro}`,158);
 const others=data.situations.filter(x=>x.id!==s.id).slice(0,6);
 const body=`<nav class="crumbs" aria-label="Yo‘l"><a href="/">Bosh sahifa</a> › <a href="/vaziyat/">Vaziyatlar</a> › <span>${esc(s.title)}</span></nav>
<article class="static-article">
<span class="eyebrow">${esc(s.tag)}</span>
<h1>${esc(s.title)}</h1>
<p class="detail-intro">${esc(s.intro)}</p>
<div class="verify-note">⚠️ Bu umumiy ma’lumot, yurist tomonidan tasdiqlanmagan. Modda raqamlari, muddatlar va summalarni <a href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> dagi amaldagi tahrir bilan tekshiring.</div>
<h2>Qadamma-qadam nima qilish kerak</h2>
<ol class="steps-list">${s.steps.map(([b,t])=>`<li><b>${esc(b)}</b><p>${esc(t)}</p></li>`).join('')}</ol>
<div class="laws-card"><h2>Asosiy qonunchilik hujjatlari</h2><ul>${s.laws.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${(s.sourceUrls||[]).length?`<p>${s.sourceUrls.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">Rasmiy matn (lex.uz) ↗</a>`).join(' · ')}</p>`:''}</div>
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
<p class="detail-intro">Ishdan bo‘shatish, aliment, meros, jarima, sifatsiz tovar va boshqa kundalik holatlarda nima qilish, qayerga murojaat qilish va qaysi qonunga tayanish haqida qisqa yo‘riqnomalar.</p>
<ul class="static-hub">${data.situations.map(s=>`<li><a href="/vaziyat/${slugOf(s)}/"><b>${esc(s.title)}</b></a><p>${esc(s.desc)} · <span>${esc(s.tag)}</span></p></li>`).join('')}</ul>`;
await writeFile(new URL('index.html',vaziyatDir),page({path:'/vaziyat/',title:'Huquqiy vaziyatlar: ish, oila, meros, jarima, iste’molchi | HuquqYordamchi',description:'O‘zbekiston qonunchiligi bo‘yicha kundalik vaziyatlar: ishdan bo‘shatish, maosh, aliment, meros, YHXX jarimasi, sifatsiz tovar, ijara va kredit — qadamlar va qonun asoslari.',body:hubBody,jsonld:[crumbs([['Bosh sahifa','/'],['Vaziyatlar','/vaziyat/']])]}));

const urls=['/','/vaziyat/',...pages];
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
