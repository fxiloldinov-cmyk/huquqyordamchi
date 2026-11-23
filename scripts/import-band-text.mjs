// PDF’dan olingan matnni (pdfjs eksporti, "===== PAGE n =====" bo‘limlari) bandlarga ajratadi.
// Ishlatish: node scripts/import-band-text.mjs data/sources/iiv-502-owner.txt data/laws/iiv502.json --doc iiv502 --name "…" --from "1-bob" --to "1-ILOVA" [--lex-id -123] [--as-of 2026-11-06] [--effective 2027-01-07] [--pdf data/sources/iiv-502-owner.pdf]
// Ilovalardagi blankalar (rasm) indekslanmaydi va taxminan talqin qilinmaydi.
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';
const sha=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
// Sahifa raqami, QMMB pastki yozuvi va sana qatorini olib tashlaydi; "332\n1\n-moddasi" → "332¹-moddasi".
export function cleanLines(text){
 const SUP='⁰¹²³⁴⁵⁶⁷⁸⁹',sup=d=>[...d].map(c=>SUP[c]).join('');
 const raw=text.replace(/\r/g,'').split('\n').map(l=>l.trim());const out=[];const nextText=i=>{while(++i<raw.length&&!raw[i]);return raw[i]||''};
 for(let i=0;i<raw.length;i++){const l=raw[i];
  if(!l||/^=====\s*PAGE/.test(l)||/^PAGES \d+$|^INFO \{/.test(l)||/^QMMB:/.test(l)||/^\d{2}\.\d{2}\.\d{4}-y\.$/.test(l)&&/^QMMB:/.test(raw[i-1]||''))continue;
  if(/^\d{1,2}$/.test(l)&&/^QMMB:/.test(raw[i+1]||''))continue;
  if(out.length&&/\d$/.test(out.at(-1))&&(/^[1-9]$/.test(l)||/^\d{2}$/.test(l)&&/^[-,]/.test(nextText(i)))){out[out.length-1]+=sup(l);continue;}
  if(out.length&&/\d[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/.test(out.at(-1))&&/^[-,]/.test(l)){out[out.length-1]+=l;continue;}
  out.push(l);}
 return out;
}
const join=lines=>lines.reduce((s,l)=>!s?l:/[a-z]-$/i.test(s)||/\d-$/.test(s)?s+l:s+' '+l,'').replace(/(\S[ʻʼ‘’]) (?=[a-zʻ])/g,'$1').replace(/\s{2,}/g,' ').trim();
// Ro‘yxat bandlari (";" yoki ":" bilan tugab, kichik harfdan boshlanuvchi) alohida qism bo‘ladi.
const splitParts=t=>t.split(/(?<=[;:])\s+(?=[a-zʻ“"«(])/).map(p=>p.trim()).filter(Boolean);
export function parseBands(text,{from,to}){
 const lines=cleanLines(text);const a=lines.findIndex(l=>l.startsWith(from));let z=lines.findIndex((l,i)=>i>a&&l.startsWith(to));
 if(a<0||z<0)throw new Error(`Chegara topilmadi: ${from} … ${to}`);
 // Ilova sarlavhasi (sahifa raqami + "…yo‘riqnomaga") oxirgi bandga qo‘shilmasin.
 for(let k=z-1;k>z-9&&k>a;k--)if(/^\d{1,3}$/.test(lines[k])){z=k;break;}
 const articles=[];let bob=null,par=null,cur=null,next=1,head=null;
 const flush=()=>{if(cur){cur.parts=splitParts(join(cur.lines));delete cur.lines;cur.title=cur.parts[0].replace(/^\d+\.\s*/,'').split(/(?<=[.:;])\s/)[0].slice(0,160);articles.push(cur);cur=null;}};
 for(const l of lines.slice(a,z)){
  if(/^\d+-bob\.\s/.test(l)){flush();bob=l;par=null;head='bob';continue;}
  if(/^\d+-§\s/.test(l)){flush();par=l;head='par';continue;}
  const m=l.match(/^(\d{1,3})\.\s+\S/);
  if(m&&+m[1]===next){flush();cur={art:m[1],title:'',bolim:null,bob,par,lines:[l],changes:[]};next++;head=null;continue;}
  if(head==='bob'){bob+=' '+l;continue;}
  if(head==='par'){par+=' '+l;continue;}
  if(!cur)throw new Error('Band tashqarisidagi matn: '+l.slice(0,80));
  cur.lines.push(l);
 }
 flush();
 return articles;
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){
 const [src,out,...rest]=process.argv.slice(2);const opt={};for(let i=0;i<rest.length;i+=2)opt[rest[i].replace(/^--/,'')]=rest[i+1];
 if(!src||!out||!opt.doc||!opt.name||!opt.from||!opt.to)throw new Error('src, out, --doc, --name, --from va --to kerak');
 const articles=parseBands(readFileSync(src,'utf8'),opt);
 const law={doc:opt.doc,kind:'band',name:opt.name,lexId:opt['lex-id']||null,url:opt['lex-id']?'https://lex.uz/docs/'+opt['lex-id']:null,asOf:opt['as-of']||null,publishedAt:opt['as-of']||null,effectiveFrom:opt.effective||null,importedAt:new Date().toISOString().slice(0,10),publication:opt.publication||null,script:'source',repealed:[],articles,
  provenance:{file:src.replace(/\\/g,'/'),sha256:sha(src),...(opt.pdf?{pdf:opt.pdf.replace(/\\/g,'/'),pdfSha256:sha(opt.pdf)}:{}),method:'owner_upload_pdf',scope:'main_text',bounds:{from:opt.from,to:opt.to},annexImagesInterpreted:false}};
 writeFileSync(out,JSON.stringify(law,null,1)+'\n');console.log(`${opt.doc}: ${articles.length} band → ${out}`);
}
