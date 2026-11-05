import test from 'node:test';
import assert from 'node:assert/strict';
process.env.HK_DEV_MEMORY_STORE='1';
import {PLANS,entitlement,monthKey,reserveKazus,guardKazusPlan,planStatus} from '../netlify/shared/plans.mjs';
import {resetMemoryStore,openStore} from '../netlify/shared/store.mjs';
import {createUser,createSession} from '../netlify/shared/auth.mjs';
import plans from '../netlify/functions/plans.mjs';
const now=Date.parse('2026-11-05T10:00:00Z');
const u={id:'pilot-user',email:'student@example.test',emailVerified:true,sessions:[]};
test('pilot plan grants come only from server config, expire, and use Tashkent month boundary',async()=>{
 delete process.env.HK_PILOT_ENTITLEMENTS;
 assert.equal((await entitlement(u,now)).id,'free');
 process.env.HK_PILOT_ENTITLEMENTS=JSON.stringify({[u.email]:{plan:'pro',expiresAt:'2026-12-01T00:00:00Z'}});
 assert.equal((await entitlement(u,now)).id,'pro');
 assert.equal((await entitlement(u,Date.parse('2026-12-02'))).id,'free');
 assert.equal(monthKey(Date.parse('2026-10-31T19:01:00Z')),'2026-11');
 process.env.HK_PILOT_ENTITLEMENTS='null';await assert.rejects(()=>entitlement(u,now));
 delete process.env.HK_PILOT_ENTITLEMENTS;
});
test('atomic quotas reject excess concurrent calls and reset at a new month',async()=>{
 resetMemoryStore();delete process.env.HK_PILOT_ENTITLEMENTS;
 const results=await Promise.all(Array.from({length:8},()=>reserveKazus(u,now)));
 assert.equal(results.filter(r=>r.allowed).length,2);
 assert.equal((await reserveKazus(u,Date.parse('2026-12-05'))).used,1);
});
test('existing anonymous flow remains available with plans off; plans on require auth and enforce length and quota',async()=>{
 resetMemoryStore();delete process.env.HK_KAZUS_PLANS_ENABLED;
 const req=new Request('https://example.test/api/kazus');
 assert.equal((await guardKazusPlan(req,6000)).maxOutputTokens,12000);
 process.env.HK_KAZUS_PLANS_ENABLED='1';
 assert.equal((await guardKazusPlan(req,100)).error.status,401);
 await createUser({...u});const token=await createSession({...u});
 const signed=new Request(req,{headers:{cookie:'hk_session='+token}});
 assert.equal((await guardKazusPlan(signed,3001)).error.status,413);
 assert.equal((await guardKazusPlan(signed,200)).maxOutputTokens,4000);
 await guardKazusPlan(signed,200);
 assert.equal((await guardKazusPlan(signed,200)).error.status,429);
 assert.equal((await planStatus(u)).remaining,0);
 delete process.env.HK_KAZUS_PLANS_ENABLED;
});
test('catalog never accepts payment or grants client-supplied plans',async()=>{
 const r=await plans(new Request('https://example.test/api/plans'));
 const d=await r.json();assert.equal(d.paymentEnabled,false);assert.equal(d.plans.length,3);
 assert.equal((await plans(new Request('https://example.test/api/plans',{method:'POST',body:JSON.stringify({plan:'pro'})}))).status,405);
 assert.equal((await plans(new Request('https://example.test/api/plans',{headers:{origin:'https://evil.test'}}))).status,403);
 assert.equal(PLANS[1].priceUZS,19000);
});

test('unverified or absent email verification never receives an email grant',async()=>{
 process.env.HK_PILOT_ENTITLEMENTS=JSON.stringify({[u.email]:{plan:'pro',expiresAt:'2026-12-01T00:00:00Z'}});
 try{for(const emailVerified of [false,undefined,'true',1])assert.equal((await entitlement({...u,emailVerified},now)).id,'free');
 assert.equal((await entitlement(u,now)).id,'pro');
 assert.equal((await entitlement(u,Date.parse('2026-12-01T00:00:00Z'))).id,'free');
 }finally{delete process.env.HK_PILOT_ENTITLEMENTS}
});

test('Blobs grants precede legacy env; expired or free records never revive fallback grants',async()=>{
 resetMemoryStore();const {writeGrant,entitlementKey}=await import('../netlify/shared/entitlements.mjs');
 process.env.HK_PILOT_ENTITLEMENTS=JSON.stringify({[u.email]:{plan:'pro',expiresAt:'2027-01-01T00:00:00Z'}});
 try{
  assert.equal((await entitlement(u,now)).id,'pro');
  await writeGrant({email:u.email,plan:'student',expiresAt:'2026-12-01T00:00:00Z'},{now});
  assert.equal((await entitlement(u,now)).id,'student');
  assert.equal((await entitlement({...u,emailVerified:false},now)).id,'free');
  assert.equal((await entitlement(u,Date.parse('2026-12-02'))).id,'free');
  await writeGrant({email:u.email,plan:'free',expiresAt:'2026-12-01T00:00:00Z'},{now});
  assert.equal((await entitlement(u,now)).id,'free');
  assert.equal((await (await openStore('entitlements')).get(entitlementKey(u.email))).schema,1);
 }finally{delete process.env.HK_PILOT_ENTITLEMENTS;resetMemoryStore()}
});
test('grant command validates email, plan and UTC expiry before any storage write',async()=>{
 const {writeGrant}=await import('../netlify/shared/entitlements.mjs');const {parseArgs}=await import('../scripts/grant-entitlement.mjs');
 let writes=0;const store={set:async()=>{writes++}};
 for(const change of [{email:'bad'},{plan:'admin'},{expiresAt:'2026-02-30T00:00:00Z'},{expiresAt:'2026-01-01T00:00:00Z'}])await assert.rejects(()=>writeGrant({email:u.email,plan:'pro',expiresAt:'2026-12-01T00:00:00Z',...change},{now,store}));
 assert.equal(writes,0);
 await writeGrant({email:' STUDENT@example.test ',plan:'pro',expiresAt:'2026-12-01T00:00:00Z'},{now,store});assert.equal(writes,1);
 assert.equal(parseArgs(['--email',u.email,'--plan','pro','--expiresAt','2026-12-01T00:00:00Z']).plan,'pro');
 assert.throws(()=>parseArgs(['--token','secret']));
});

test('free quota configuration is dynamic, validated and enforced by catalog and atomic counter',async()=>{
 const old=process.env.HK_FREE_REQUESTS;resetMemoryStore();
 try{for(const value of [undefined,'','0','-1','1.5','oops','Infinity']){if(value===undefined)delete process.env.HK_FREE_REQUESTS;else process.env.HK_FREE_REQUESTS=value;assert.equal(PLANS[0].requests,2)}
 process.env.HK_FREE_REQUESTS='5';assert.equal(PLANS[0].requests,5);
 assert.equal((await (await plans(new Request('https://example.test/api/plans'))).json()).plans[0].requests,5);
 const rs=await Promise.all(Array.from({length:7},()=>reserveKazus({...u,emailVerified:false},now)));assert.equal(rs.filter(r=>r.allowed).length,5);
 }finally{if(old===undefined)delete process.env.HK_FREE_REQUESTS;else process.env.HK_FREE_REQUESTS=old;resetMemoryStore()}
});

test('entitlement store failure cannot activate a legacy paid fallback',async()=>{
 const {setBlobsAdapterForTests}=await import('../netlify/shared/store.mjs');
 process.env.HK_PILOT_ENTITLEMENTS=JSON.stringify({[u.email]:{plan:'pro',expiresAt:'2027-01-01T00:00:00Z'}});
 setBlobsAdapterForTests({getStore(){throw Error('simulated offline storage')}});
 try{await assert.rejects(()=>entitlement(u,now));assert.equal((await entitlement({...u,emailVerified:false},now)).id,'free')}
 finally{setBlobsAdapterForTests(null);delete process.env.HK_PILOT_ENTITLEMENTS}
});
