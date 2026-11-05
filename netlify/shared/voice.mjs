export const voiceEnabled=()=>process.env.HK_VOICE_ENABLED==='1';
export const MAX_VOICE_BYTES=750000;
export const MAX_VOICE_SECONDS=30;
export const VOICE_MIMES=['audio/webm','audio/ogg','audio/wav'];
export function decodeVoice(body){
 if(body?.consent!==true)throw new Error('Audio yuborishga rozilik kerak.');
 if(!VOICE_MIMES.includes(body.mimeType))throw new Error('Audio formati qo‘llab-quvvatlanmaydi.');
 const data=body.audioBase64;
 if(typeof data!=='string'||data.length>Math.ceil(MAX_VOICE_BYTES/3)*4||!data.length||data.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(data))throw new Error('Audio hajmi yoki formati noto‘g‘ri.');
 const bytes=Buffer.from(data,'base64');
 if(bytes.length<16||bytes.length>MAX_VOICE_BYTES||bytes.toString('base64')!==data)throw new Error('Audio hajmi yoki formati noto‘g‘ri.');
 const valid=body.mimeType==='audio/webm'?bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):body.mimeType==='audio/ogg'?bytes.toString('ascii',0,4)==='OggS':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE';
 if(!valid)throw new Error('Audio sarlavhasi formatga mos emas.');
 return {bytes,lang:['uz','ru','en','de','fr'].includes(body.lang)?body.lang:'uz'};
}
