// Germaniya bo‘limi: statik qo‘llanmalar, faqat rasmiy manbalar, ogohlantirish, sitemap.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const PAGES=['index.html','anmeldung.html','yashash-ruxsati.html','talaba-ishi.html','ijara.html'];
const OFFICIAL=['www.gesetze-im-internet.de','www.minijob-zentrale.de','www.bmas.de'];

test('har bir sahifada canonical, ogohlantirish va mavjud ichki havolalar bor',()=>{
 for(const p of PAGES){
  const h=read('public/germaniya/'+p);
  assert.match(h,/<link rel="canonical" href="https:\/\/huquqyordamchiuz\.netlify\.app\/germaniya\//,p);
  assert.match(h,/yuridik maslahat emas/,p);
  assert.match(h,/href="germaniya\.css"/,p);
  for(const m of h.matchAll(/href="([a-z-]+\.html)"/g))assert.ok(PAGES.includes(m[1]),p+' → '+m[1]);
 }
});

test('qo‘llanmalardagi manbalar faqat rasmiy saytlarga olib boradi va tekshirilgan sanasi bor',()=>{
 for(const p of PAGES.slice(1)){
  const h=read('public/germaniya/'+p);
  const src=h.slice(h.indexOf('<h2>Manbalar</h2>'));
  const hosts=[...src.matchAll(/href="(https:[^"]+)"/g)].map(m=>new URL(m[1]).hostname);
  assert.ok(hosts.length>0,p);
  for(const host of hosts)assert.ok(OFFICIAL.includes(host),p+' → '+host);
  assert.match(src,/rasmiy sayt(?:lar)?dan tekshirildi/,p);
 }
});

test('bosh sahifada karta bor va sitemap’ga kiradi',()=>{
 assert.match(read('public/index.html'),/<a class="suite-card" href="\/germaniya\/">/);
 const sm=read('public/sitemap.xml');
 for(const u of ['/germaniya/','/germaniya/anmeldung.html','/germaniya/ijara.html'])assert.ok(sm.includes(u+'</loc>'),u);
});
