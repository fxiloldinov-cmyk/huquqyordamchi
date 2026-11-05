import test from 'node:test';import assert from 'node:assert/strict';import {VoiceSession} from '../public/voice-core.js';
class Recorder{
 static instances=[];static isTypeSupported(x){return x==='audio/webm'}
 constructor(stream,opts){this.state='inactive';this.mimeType=opts.mimeType;Recorder.instances.push(this)}
 start(){this.state='recording'}
 stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['MOCK_AUDIO'])});this.onstop?.()}
}
function setup(extra={}){let stops=0,requests=0;const stream={getTracks:()=>[{stop:()=>{stops++}}]};let blobs=[],errors=[],timer;const s=new VoiceSession({mediaDevices:{getUserMedia:async()=>{requests++;return stream}},Recorder,onBlob:b=>blobs.push(b),onError:e=>errors.push(e),timer:(f,ms)=>{timer={f,ms};return 1},untimer:()=>{},...extra});return{s,stream,blobs,errors,get stops(){return stops},get requests(){return requests},get timer(){return timer}}}
test('recording requires start, releases microphone after stop, and emits a blob without network',async()=>{const x=setup();assert.equal(x.requests,0);await x.s.start();assert.equal(x.requests,1);assert.equal(x.timer.ms,30000);x.s.stop();assert.equal(x.stops,1);assert.equal(x.blobs.length,1);assert.equal(x.s.chunks.length,0)});
test('cancel during permission prompt closes a late microphone stream and discards audio',async()=>{let resolve;const x=setup({mediaDevices:{getUserMedia:()=>new Promise(r=>{resolve=r})}});const pending=x.s.start();x.s.cancel();resolve(x.stream);await pending;assert.equal(x.stops,1);assert.equal(x.blobs.length,0);assert.equal(x.s.recorder,null)});
test('cancel during recording and oversize discard captured chunks',async()=>{const x=setup();await x.s.start();x.s.cancel();assert.equal(x.blobs.length,0);assert.equal(x.stops,1);const y=setup({maxBytes:2});await y.s.start();y.s.recorder.ondataavailable({data:new Blob(['too big'])});assert.deepEqual(y.errors,['size']);assert.equal(y.blobs.length,0);assert.equal(y.stops,1)});
test('time limit stops recording and recorder construction failure releases tracks',async()=>{const x=setup();await x.s.start();x.timer.f();assert.equal(x.stops,1);assert.equal(x.blobs.length,1);class Broken extends Recorder{constructor(){throw Error('device')}}const y=setup({Recorder:Broken});await assert.rejects(()=>y.s.start());assert.equal(y.stops,1)});
