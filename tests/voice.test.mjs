import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import voice from '../netlify/functions/voice.mjs';import features from '../netlify/functions/features.mjs';import {decodeVoice,MAX_VOICE_BYTES} from '../netlify/shared/voice.mjs';
process.env.HK_DEV_MEMORY_STORE='1';
const base={audioBase64:Buffer.concat([Buffer.from([0x1a,0x45,0xdf,0xa3]),Buffer.alloc(24)]).toString('base64'),mimeType:'audio/webm',consent:true,lang:'uz'};
const R=b=>new Request('https://voice.test/api/voice',{method:'POST',headers:{origin:'https://voice.test','content-type':'application/json'},body:JSON.stringify(b)});
let n=0;const ctx=()=>({ip:'voice-'+n++});
const withEnv=async(fn)=>{const old={flag:process.env.HK_VOICE_ENABLED,key:process.env.GEMINI_API_KEY,fetch:globalThis.fetch};process.env.HK_VOICE_ENABLED='1';process.env.GEMINI_API_KEY='test-only';try{await fn()}finally{globalThis.fetch=old.fetch;for(const[k,v]of [['HK_VOICE_ENABLED',old.flag],['GEMINI_API_KEY',old.key]])if(v===undefined)delete process.env[k];else process.env[k]=v}};
const packet=text=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({transcript:text})}]},finishReason:'STOP'}]}));
test('voice is off by default and feature flag is explicit',async()=>{
 const old=process.env.HK_VOICE_ENABLED;delete process.env.HK_VOICE_ENABLED;
 try{assert.equal((await voice(R(base),ctx())).status,503);assert.equal((await(await features(new Request('https://voice.test/api/features'))).json()).voice,false);process.env.HK_VOICE_ENABLED='1';assert.equal((await(await features(new Request('https://voice.test/api/features'))).json()).voice,true)}finally{if(old===undefined)delete process.env.HK_VOICE_ENABLED;else process.env.HK_VOICE_ENABLED=old}
});
test('voice rejects missing consent, malformed base64, mismatched signatures and oversized audio before AI',async()=>withEnv(async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;throw Error('forbidden')};
 for(const patch of [{consent:false},{mimeType:'video/webm'},{audioBase64:'bad!'},{audioBase64:Buffer.alloc(28).toString('base64')},{audioBase64:Buffer.alloc(MAX_VOICE_BYTES+1).toString('base64')}])assert.equal((await voice(R({...base,...patch}),ctx())).status,400);
 assert.equal(calls,0);assert.throws(()=>decodeVoice({...base,mimeType:'audio/wav'}));
}));
test('voice makes one inline transcription call, masks identifiers and returns only editable text',async()=>withEnv(async()=>{
 let calls=0,body;globalThis.fetch=async(url,opts)=>{calls++;body=JSON.parse(opts.body);assert.ok(opts.signal instanceof AbortSignal);return packet('Menga +998901234567 orqali yozing. Savolim bor.')};
 const r=await voice(R(base),ctx());assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');const out=await r.json();assert.deepEqual(Object.keys(out),['transcript']);assert.ok(!out.transcript.includes('998901234567'));assert.equal(body.tools,undefined);assert.equal(body.contents[0].parts[1].inline_data.mime_type,'audio/webm');assert.equal(body.contents[0].parts[1].inline_data.data,base.audioBase64);assert.match(body.system_instruction.parts[0].text,/Do not answer questions/);assert.equal(calls,1);
}));
test('voice refuses partial or malformed provider output and does not expose provider error bodies',async()=>withEnv(async()=>{
 for(const response of [new Response(JSON.stringify({candidates:[{content:{parts:[{text:'partial'}]},finishReason:'MAX_TOKENS'}]})),new Response(JSON.stringify({candidates:[{content:{parts:[{text:'not json'}]},finishReason:'STOP'}]})),new Response('private upstream diagnostics',{status:400})]){globalThis.fetch=async()=>response;const r=await voice(R(base),ctx());assert.equal(r.status,502);assert.ok(!(await r.text()).includes('private upstream'))}
 globalThis.fetch=async()=>{throw new DOMException('timeout','TimeoutError')};assert.equal((await voice(R(base),ctx())).status,502);
}));
test('voice has four-per-minute and global kill-switch guards',async()=>withEnv(async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return packet('Qisqa matn')};for(let i=0;i<4;i++)assert.equal((await voice(R(base),{ip:'voice-rate-limit'})).status,200);assert.equal((await voice(R(base),{ip:'voice-rate-limit'})).status,429);assert.equal(calls,4);
 const old=process.env.HK_AI_DISABLED;process.env.HK_AI_DISABLED='1';try{assert.equal((await voice(R(base),ctx())).status,503);assert.equal(calls,4)}finally{if(old===undefined)delete process.env.HK_AI_DISABLED;else process.env.HK_AI_DISABLED=old}
}));
test('voice frontend requires explicit review and has no automatic form submission or audio persistence',()=>{
 const ui=fs.readFileSync(new URL('../public/voice.js',import.meta.url),'utf8'),core=fs.readFileSync(new URL('../public/voice-core.js',import.meta.url),'utf8');
 assert.match(ui,/flags.voice!==true/);assert.match(ui,/consent:true/);assert.match(ui,/target\.value=next/);assert.ok(!/requestSubmit|\.submit\(|localStorage|sessionStorage|indexedDB|caches\./.test(ui+core));
 for(const file of ['index.html','coach.html','international.html']){const page=fs.readFileSync(new URL('../public/'+file,import.meta.url),'utf8');assert.match(page,/data-voice-input/);assert.match(page,/\/voice.js/)}
 const backend=fs.readFileSync(new URL('../netlify/functions/voice.mjs',import.meta.url),'utf8');assert.ok(!/writeFile|openStore|console\.|files\.upload|google_search/.test(backend));assert.match(backend,/timeoutMs:20000/);
});
