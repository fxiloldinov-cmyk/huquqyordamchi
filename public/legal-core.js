// Pure shared search helpers. Works in a classic browser script and Node imports.
(function(root){
 const letters={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:"'",ь:'',э:'e',ю:'yu',я:'ya',ў:"o'",қ:'q',ғ:"g'",ҳ:'h'};
 function norm(value){return String(value||'').toLowerCase().replace(/(^|[^а-яёўқғҳ])е/g,'$1ye').replace(/[а-яёўқғҳ]/g,c=>letters[c]??c).replace(/[‘’ʻʼ`´ʻ]/g,"'").replace(/\s+/g,' ').trim();}
 // Kirill → lotin (o‘zbek alifbosi), katta-kichik harf saqlanadi: lex.uz RSS sarlavhalarini ko‘rsatish uchun
 const CYR=/[а-яёўқғҳ]/i,UP=/[А-ЯЁЎҚҒҲ]/,VOW='аоуэиўеёюя';
 function toLatin(value){const s=String(value||'');let out='';for(let i=0;i<s.length;i++){const c=s[i],lo=c.toLowerCase();if(!(lo in letters)){out+=c;continue}const p=(s[i-1]||'').toLowerCase();let t=lo==='е'&&(!CYR.test(p)||VOW.includes(p)||p==='ъ'||p==='ь')?'ye':lo==='ъ'?'’':letters[lo].replace("'",'‘');if(c!==lo&&t){const caps=UP.test(s[i+1]||'')||(UP.test(s[i-1]||'')&&!CYR.test(s[i+1]||''));t=caps?t.toUpperCase():t[0].toUpperCase()+t.slice(1)}out+=t}return out}
 function lawName(s){return norm(s).replace(/^o'zbekiston respublikasi(ning)?\s+/,'').replace(/[()]/g,'').replace(/[-–]/g,' ').replace(/\s+/g,' ').trim();}
 function resolveDoc(name,docs=root.HK_LEGAL?.docs||{}){const n=lawName(name);return Object.entries(docs).find(([key,d])=>[d.name,key,...(d.aliases||[])].some(a=>lawName(a)===n))?.[0]||null;}
 function article(value){return norm(value).replace(/[¹²³⁴⁵⁶⁷⁸⁹]/g,c=>'-'+('¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)+1)).replace(/(\d)\^(\d)/g,'$1-$2').replace(/[–—]/g,'-').replace(/[^0-9-]/g,'');}
 function safeUrl(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
 root.HKCore={norm,toLatin,resolveDoc,article,safeUrl};
})(globalThis);
