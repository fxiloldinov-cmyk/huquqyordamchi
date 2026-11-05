import {inflateRawSync} from 'node:zlib';
// Faqat asosiy Word matni; arxiv diskka ochilmaydi, havolalar yuklanmaydi.
export function readDocx(bytes){
 if(bytes.length>1500000||bytes.length<22)throw Error('DOCX hajmi noto‘g‘ri (eng ko‘pi 1,5 MB).');
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50){end=i;break}
 if(end<0||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6))throw Error('DOCX arxivi o‘qilmadi.');
 const count=bytes.readUInt16LE(end+10);let p=bytes.readUInt32LE(end+16),xml=null,total=0;
 if(count>2000)throw Error('DOCX ichida juda ko‘p fayl bor.');
 for(let i=0;i<count;i++){
  if(p+46>bytes.length||bytes.readUInt32LE(p)!==0x02014b50)throw Error('DOCX katalogi buzilgan.');
  const flags=bytes.readUInt16LE(p+8),method=bytes.readUInt16LE(p+10),packed=bytes.readUInt32LE(p+20),size=bytes.readUInt32LE(p+24),nl=bytes.readUInt16LE(p+28),extra=bytes.readUInt16LE(p+30),comment=bytes.readUInt16LE(p+32),start=bytes.readUInt32LE(p+42);
  if(p+46+nl+extra+comment>bytes.length)throw Error('DOCX katalogi qisqa.');
  const name=bytes.subarray(p+46,p+46+nl).toString('utf8');total+=size;if(total>12000000)throw Error('DOCX ochilgandagi hajm juda katta.');
  if(name==='word/document.xml'){
   if(xml!==null||flags&1||![0,8].includes(method)||size>2000000||start+30>bytes.length||bytes.readUInt32LE(start)!==0x04034b50)throw Error('DOCX asosiy matni qo‘llanmaydi.');
   const from=start+30+bytes.readUInt16LE(start+26)+bytes.readUInt16LE(start+28);if(from+packed>bytes.length)throw Error('DOCX matni qisqa.');
   const raw=bytes.subarray(from,from+packed),out=method===8?inflateRawSync(raw,{maxOutputLength:2000000}):raw;
   if(out.length!==size)throw Error('DOCX hajmi mos kelmadi.');xml=new TextDecoder('utf-8',{fatal:true}).decode(out);
  }p+=46+nl+extra+comment;
 }
 if(!xml||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('DOCX matni topilmadi yoki qo‘llanmaydigan XML.');
 const decode=s=>s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,x)=>{if(x[0]==='#'){const n=x[1].toLowerCase()==='x'?parseInt(x.slice(2),16):Number(x.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):''}return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[x.toLowerCase()]});
 let text='';for(const m of xml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:(tab|br|cr)\b[^>]*\/?>|<\/w:p\s*>/g))text+=m[1]!==undefined?decode(m[1]):m[2]==='tab'?'\t':'\n';
 text=text.replace(/\n$/,'');if(!text.trim()||text.length>50000)throw Error('Word matni bo‘sh yoki 50000 belgidan uzun.');return text;
}
