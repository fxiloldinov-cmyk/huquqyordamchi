// Mikrofon hayot sikli. Disk yoki tarmoq operatsiyasi yo‘q.
export class VoiceSession{
 constructor({mediaDevices,Recorder,onBlob=()=>{},onState=()=>{},onError=()=>{},timer=setTimeout,untimer=clearTimeout,maxBytes=750000,maxMs=30000}){Object.assign(this,{mediaDevices,Recorder,onBlob,onState,onError,timer,untimer,maxBytes,maxMs});this.epoch=0;this.stream=null;this.recorder=null;this.chunks=[];this.size=0;}
 static mime(Recorder){return ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg','audio/wav'].find(x=>Recorder?.isTypeSupported?.(x))||null;}
 release(){if(this.timeout)this.untimer(this.timeout);this.timeout=null;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;}
 async start(){
  this.cancel();const ticket=this.epoch;const mime=VoiceSession.mime(this.Recorder);if(!mime)throw Error('unsupported');
  this.onState('permission');let stream;
  try{stream=await this.mediaDevices.getUserMedia({audio:true,video:false});if(ticket!==this.epoch){stream.getTracks().forEach(t=>t.stop());return;}
   this.stream=stream;const recorder=new this.Recorder(stream,{mimeType:mime,audioBitsPerSecond:32000});this.recorder=recorder;this.chunks=[];this.size=0;
   recorder.ondataavailable=e=>{if(ticket!==this.epoch||!e.data?.size)return;this.size+=e.data.size;if(this.size>this.maxBytes){this.cancel();this.onError('size');return;}this.chunks.push(e.data)};
   recorder.onerror=()=>{if(ticket!==this.epoch)return;this.cancel();this.onError('record')};
   recorder.onstop=()=>{if(ticket!==this.epoch)return;this.release();this.recorder=null;const blob=new Blob(this.chunks,{type:recorder.mimeType||mime});this.chunks=[];this.size=0;if(!blob.size){this.onError('empty');return}this.onBlob(blob);this.onState('recorded')};
   recorder.start(250);this.onState('recording');this.timeout=this.timer(()=>this.stop(),this.maxMs);
  }catch(e){if(ticket!==this.epoch)return;this.cancel();throw e;}
 }
 stop(){if(this.recorder?.state==='recording')this.recorder.stop();this.release();}
 cancel(){this.epoch++;const rec=this.recorder;this.recorder=null;if(rec?.state==='recording')rec.stop();this.release();this.chunks=[];this.size=0;}
}
