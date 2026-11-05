import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import featureApi from '../netlify/functions/features.mjs';
const ROOT=new URL('../',import.meta.url);
test('feature API defaults off; homepage fails closed with hidden cards',async()=>{
 const old=process.env.HK_INTERNATIONAL_ENABLED;delete process.env.HK_INTERNATIONAL_ENABLED;
 try{assert.equal((await (await featureApi(new Request('https://example.test/api/features'))).json()).international,false);
 process.env.HK_INTERNATIONAL_ENABLED='1';assert.equal((await (await featureApi(new Request('https://example.test/api/features'))).json()).international,true);
 }finally{if(old===undefined)delete process.env.HK_INTERNATIONAL_ENABLED;else process.env.HK_INTERNATIONAL_ENABLED=old}
 const html=await fs.readFile(new URL('public/index.html',ROOT),'utf8');assert.equal((html.match(/data-international hidden/g)||[]).length,2);
 const css=await fs.readFile(new URL('public/premium.css',ROOT),'utf8');assert.match(css,/\[data-international\]\[hidden\].*display:none!important/);
 const js=await fs.readFile(new URL('public/suite.js',ROOT),'utf8');assert.match(js,/flags\?\.international===true/);
});
test('disabled build excludes international from sitemap and service worker; repeated toggles work',async()=>{
 await fs.mkdir(new URL('.work-v119/',ROOT),{recursive:true});const temp=await fs.mkdtemp(new URL('.work-v119/feature-build-',ROOT));
 try{for(const p of ['scripts','netlify','data','public','package.json'])await fs.cp(new URL(p,ROOT),temp+'/'+p,{recursive:true});
 for(const flag of ['0','1','0']){
 execFileSync(process.execPath,['scripts/build-data.mjs'],{cwd:temp,env:{...process.env,HK_INTERNATIONAL_ENABLED:flag},stdio:'pipe'});
 const site=await fs.readFile(temp+'/public/sitemap.xml','utf8');assert.equal(site.includes('/international.html'),flag==='1');
 const sw=await fs.readFile(temp+'/public/sw.js','utf8');assert.ok(!sw.includes('international.html'));
 }
 }finally{await fs.rm(temp,{recursive:true,force:true})}
});
