// Sof yozuv almashtirish: huquqiy matnlar bazasini o‘zgartirmaydi.
export function latinToNew(text){
 return text.normalize('NFC').replace(/([oOgG])['‘’ʻʼ`]/g,(_,c)=>({o:'ö',O:'Ö',g:'ğ',G:'Ğ'}[c]))
  .replace(/sh|ch/gi,m=>m.toLowerCase()==='sh'?(m[0]==='S'?'Ş':'ş'):(m[0]==='C'?'Ç':'ç'))
  .replace(/(?<=[\p{L}])['‘’ʻ`](?=[\p{L}])/gu,'ʼ');
}
const CY={а:'a',б:'b',в:'v',г:'g',д:'d',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ç',ш:'ş',щ:'şç',ъ:'ʼ',ы:'i',ь:'',э:'e',ю:'yu',я:'ya',ў:'ö',қ:'q',ғ:'ğ',ҳ:'h',ё:'yo'};
export function cyrillicToNew(text){return text.normalize('NFC').replace(/[А-Яа-яЁёЎўҚқҒғҲҳ]/g,(c,i,s)=>{
 const low=c.toLowerCase();let v=low==='е'?(!i||/[\s\p{P}аеёиоуэюяъь]/u.test(s[i-1].toLowerCase())?'ye':'e'):CY[low];
 if(!v)return '';if(c===low)return v;return /[А-ЯЁЎҚҒҲ]/.test(s[i+1]||'')||(/[А-ЯЁЎҚҒҲ]/.test(s[i-1]||''))?v.toUpperCase():v[0]?.toUpperCase()+v.slice(1)||'';
});}
export function convertText(text,mode){if(typeof text!=='string'||text.length>50000)throw Error('Matn 50000 belgidan oshmasin.');if(mode==='latin')return latinToNew(text);if(mode==='cyrillic')return cyrillicToNew(text);throw Error('Ruscha matn uchun tarjima xizmatini tanlang.');}
const encoder=new TextEncoder();
export function zipStored(files){const parts=[],central=[];let offset=0;const u16=(v,n,x)=>v.setUint16(n,x,true),u32=(v,n,x)=>v.setUint32(n,x,true);for(const [name,text] of Object.entries(files)){
 const n=encoder.encode(name),data=encoder.encode(text);let crc=0xffffffff;for(const b of data){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}crc=(crc^0xffffffff)>>>0;
 const h=new Uint8Array(30+n.length),v=new DataView(h.buffer);u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x800);u32(v,14,crc);u32(v,18,data.length);u32(v,22,data.length);u16(v,26,n.length);h.set(n,30);parts.push(h,data);
 const c=new Uint8Array(46+n.length),w=new DataView(c.buffer);u32(w,0,0x02014b50);u16(w,4,20);u16(w,6,20);u16(w,8,0x800);u32(w,16,crc);u32(w,20,data.length);u32(w,24,data.length);u16(w,28,n.length);u32(w,42,offset);c.set(n,46);central.push(c);offset+=h.length+data.length;
 }const end=new Uint8Array(22),v=new DataView(end.buffer);u32(v,0,0x06054b50);u16(v,8,central.length);u16(v,10,central.length);u32(v,12,central.reduce((n,c)=>n+c.length,0));u32(v,16,offset);return new Blob([...parts,...central,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
export function textToDocx(text){const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');return zipStored({
 '[Content_Types].xml':'<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/document.xml':'<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').split(/\r?\n/).map(p=>'<w:p><w:r><w:t xml:space="preserve">'+escape(p)+'</w:t></w:r></w:p>').join('')+'<w:sectPr/></w:body></w:document>'});}
