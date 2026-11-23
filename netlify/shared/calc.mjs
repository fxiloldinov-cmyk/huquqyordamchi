// Kalkulyator skeleti (HK_CALC_ENABLED). Huquqiy mazmun (formula, stavka, manba) faqat yurist tomonidan data/calc/ ga kiritiladi.
// Formula tili: sonlar, kirish o‘zgaruvchilari, + - * /, qavslar, min/max/round, addWorkdays(sana, n).
// eval/new Function ishlatilmaydi: o‘z tokenizator va rekursiv parser, natija — AST. Hisob aniq kasrlarda (BigInt),
// shuning uchun pul hisobida suzuvchi nuqta xatosi yo‘q; yakuniy yaxlitlash `rounding` qoidasi bo‘yicha.
export const ROUND_MODES=['half_up','floor','ceil'],INPUT_TYPES=['number','integer','money','date'],REVIEW=['kutilmoqda','tasdiqlangan'];
export const CALC_KEYS=['id','title','inputs','formula','rounding','unit','sourceRef','lawyerReview'],INPUT_KEYS=['key','label','type','min','max'];
const MAX_FORMULA=500,MAX_DEPTH=30,MAX_TOKENS=200,MAX_DIGITS=30;
export class CalcError extends Error{}
const bad=m=>{throw new CalcError(m)};
// ---- Aniq kasr ----
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b];}return a||1n;};
export const Q=(n,d=1n)=>{if(d===0n)bad('Nolga bo‘lish.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};};
const add=(a,b)=>Q(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>Q(a.n*b.d-b.n*a.d,a.d*b.d),mul=(a,b)=>Q(a.n*b.n,a.d*b.d),div=(a,b)=>b.n===0n?bad('Nolga bo‘lish.'):Q(a.n*b.d,a.d*b.n);
const cmp=(a,b)=>{const x=a.n*b.d-b.n*a.d;return x<0n?-1:x>0n?1:0;};
export function parseDecimal(s){const t=String(s).trim();const m=t.match(/^(-?)(\d{1,30})(?:\.(\d{1,10}))?$/);if(!m||(m[2]+(m[3]||'')).length>MAX_DIGITS)bad('Son formati noto‘g‘ri.');const frac=m[3]||'';return Q(BigInt((m[1]||'')+m[2]+frac),10n**BigInt(frac.length));}
const isInt=q=>q.d===1n;
export function roundQ(q,decimals=0,mode='half_up'){
 const s=10n**BigInt(decimals),v=mul(q,Q(s));let r;
 if(mode==='floor')r=v.n>=0n?v.n/v.d:-((-v.n+v.d-1n)/v.d);
 else if(mode==='ceil')r=v.n>=0n?(v.n+v.d-1n)/v.d:-((-v.n)/v.d);
 else{const a=v.n<0n?-v.n:v.n;const h=(2n*a+v.d)/(2n*v.d);r=v.n<0n?-h:h;}
 return Q(r,s);
}
export function formatQ(q,decimals=0){const r=roundQ(q,decimals);const neg=r.n<0n;const s=10n**BigInt(decimals);const a=(neg?-r.n:r.n)*(s/r.d);const i=(a/s).toString(),f=decimals?'.'+(a%s).toString().padStart(decimals,'0'):'';return (neg&&a!==0n?'-':'')+i+f;}
// ---- Sana: 1970-01-01 dan kunlar (butun son) ----
const DAY=86400000;
export const dateToDay=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))bad('Sana YYYY-MM-DD bo‘lsin.');const t=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==s)bad('Sana noto‘g‘ri.');return Q(BigInt(t/DAY));};
export const dayToDate=q=>new Date(Number(q.n/q.d)*DAY).toISOString().slice(0,10);
// ---- Tokenizator va parser ----
function tokens(src){
 if(typeof src!=='string'||!src.trim()||src.length>MAX_FORMULA)bad(`Formula 1–${MAX_FORMULA} belgi bo‘lsin.`);
 const out=[];const re=/\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|([-+*/(),]))/y;let i=0;
 while(i<src.length){if(/^\s*$/.test(src.slice(i)))break;re.lastIndex=i;const m=re.exec(src);if(!m)bad(`Formulada ruxsat etilmagan belgi: «${src.slice(i).trim()[0]}».`);out.push(m[1]!=null?{t:'num',v:m[1]}:m[2]!=null?{t:'id',v:m[2]}:{t:m[3]});i=re.lastIndex;if(out.length>MAX_TOKENS)bad('Formula juda uzun.');}
 return out;
}
export const FUNCS={min:[1,10],max:[1,10],round:[1,2],addWorkdays:[2,2]};
export function parseFormula(src){
 const tk=tokens(src);let p=0;const peek=()=>tk[p],take=t=>{const x=tk[p];if(!x||(t&&x.t!==t))bad('Formula sintaksisi noto‘g‘ri.');p++;return x;};
 const expr=d=>{if(d>MAX_DEPTH)bad('Formula juda chuqur.');let l=term(d);while(peek()&&(peek().t==='+'||peek().t==='-')){const op=take().t;l={op,a:l,b:term(d)};}return l;};
 const term=d=>{let l=unary(d);while(peek()&&(peek().t==='*'||peek().t==='/')){const op=take().t;l={op,a:l,b:unary(d)};}return l;};
 const unary=d=>{if(peek()?.t==='-'){take();return {op:'neg',a:unary(d+1)};}return primary(d);};
 const primary=d=>{const x=take();
  if(x.t==='num')return {num:parseDecimal(x.v)};
  if(x.t==='(' ){const e=expr(d+1);take(')');return e;}
  if(x.t==='id'){if(peek()?.t==='('){if(!Object.hasOwn(FUNCS,x.v))bad(`Noma’lum funksiya: ${x.v}.`);take('(');const args=[];if(peek()?.t!==')'){args.push(expr(d+1));while(peek()?.t===','){take();args.push(expr(d+1));}}take(')');const [lo,hi]=FUNCS[x.v];if(args.length<lo||args.length>hi)bad(`${x.v} argumentlari soni noto‘g‘ri.`);return {fn:x.v,args};}if(Object.hasOwn(FUNCS,x.v))bad(`${x.v} — funksiya, qavs kerak.`);return {v:x.v};}
  bad('Formula sintaksisi noto‘g‘ri.');};
 const ast=expr(0);if(p!==tk.length)bad('Formula oxirida ortiqcha belgi bor.');return ast;
}
export const variablesOf=(ast,out=new Set())=>{if(ast.v)out.add(ast.v);for(const k of ['a','b'])if(ast[k])variablesOf(ast[k],out);for(const x of ast.args||[])variablesOf(x,out);return out;};
export const functionsOf=(ast,out=new Set())=>{if(ast.fn)out.add(ast.fn);for(const k of ['a','b'])if(ast[k])functionsOf(ast[k],out);for(const x of ast.args||[])functionsOf(x,out);return out;};
// holidays: {weekend:[0..6], days:[{date}]} — faqat tasdiqlangan holidays.json uzatiladi.
function addWorkdays(start,n,holidays){
 if(!holidays)bad('Ish kunlari jadvali (holidays.json) tasdiqlanmagan.');if(!isInt(n)||n.n<0n||n.n>3660n)bad('Kunlar soni 0–3660 butun son bo‘lsin.');
 const off=new Set((holidays.days||[]).map(d=>d.date)),weekend=new Set(holidays.weekend||[]);let day=Number(start.n/start.d),left=Number(n.n);
 while(left>0){day++;const iso=new Date(day*DAY).toISOString().slice(0,10);if(!weekend.has(new Date(day*DAY).getUTCDay())&&!off.has(iso))left--;}
 return Q(BigInt(day));
}
export function evaluate(ast,vars,{holidays=null}={}){
 const ev=n=>{
  if(n.num)return n.num;
  if(n.v){if(!Object.hasOwn(vars,n.v))bad(`Noma’lum o‘zgaruvchi: ${n.v}.`);return vars[n.v];}
  if(n.op==='neg'){const a=ev(n.a);return Q(-a.n,a.d);}
  if(n.op){const a=ev(n.a),b=ev(n.b);return n.op==='+'?add(a,b):n.op==='-'?sub(a,b):n.op==='*'?mul(a,b):div(a,b);}
  const args=n.args.map(ev);
  if(n.fn==='min')return args.reduce((x,y)=>cmp(x,y)<=0?x:y);
  if(n.fn==='max')return args.reduce((x,y)=>cmp(x,y)>=0?x:y);
  if(n.fn==='round'){const d=args[1]||Q(0n);if(!isInt(d)||d.n<0n||d.n>6n)bad('round: kasr xonalari 0–6.');return roundQ(args[0],Number(d.n));}
  if(n.fn==='addWorkdays')return addWorkdays(args[0],args[1],holidays);
  bad('Noma’lum amal.');
 };
 return ev(ast);
}
// ---- Sxema tekshiruvi ----
const plainObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
const extra=(o,keys,where)=>{for(const k of Object.keys(o))if(!keys.includes(k))bad(`${where}: noma’lum maydon «${k}».`);};
export function validateHolidays(h){
 if(!plainObj(h))bad('holidays.json obyekt bo‘lsin.');extra(h,['schema','lawyerReview','sourceRef','weekend','days'],'holidays.json');
 if(h.schema!==1)bad('holidays.json: schema 1 bo‘lsin.');if(!REVIEW.includes(h.lawyerReview))bad('holidays.json: lawyerReview noto‘g‘ri.');
 if(!Array.isArray(h.weekend)||h.weekend.some(d=>!Number.isInteger(d)||d<0||d>6))bad('holidays.json: weekend 0–6 sonlar ro‘yxati.');
 if(!Array.isArray(h.days))bad('holidays.json: days ro‘yxat bo‘lsin.');
 for(const d of h.days){if(!plainObj(d))bad('holidays.json: kun obyekt bo‘lsin.');extra(d,['date','note'],'holidays.json kun');dateToDay(d.date);if(d.note!=null&&(typeof d.note!=='string'||d.note.length>120))bad('holidays.json: note 120 belgigacha.');}
 return h;
}
export function validateCalc(c,{articles,holidaysApproved=false}={}){
 if(!plainObj(c))bad('Kalkulyator obyekt bo‘lsin.');const w=`Kalkulyator «${c.id}»`;extra(c,CALC_KEYS,w);
 for(const k of CALC_KEYS)if(!(k in c))bad(`${w}: «${k}» maydoni yo‘q.`);
 if(typeof c.id!=='string'||!/^[a-z0-9-]{2,40}$/.test(c.id))bad('id: kichik lotin harflari, raqam va chiziqcha (2–40).');
 if(typeof c.title!=='string'||!c.title.trim()||c.title.length>120)bad(`${w}: title 1–120 belgi.`);
 if(typeof c.unit!=='string'||c.unit.length>20)bad(`${w}: unit 20 belgigacha.`);
 if(!REVIEW.includes(c.lawyerReview))bad(`${w}: lawyerReview «kutilmoqda» yoki «tasdiqlangan».`);
 if(typeof c.sourceRef!=='string'||!/^[a-z0-9]+:\d+(?:-\d+)?$/.test(c.sourceRef))bad(`${w}: sourceRef «hujjat:modda» shaklida bo‘lsin (masalan, mk:131).`);
 if(!articles?.has(c.sourceRef))bad(`${w}: sourceRef ${c.sourceRef} bazadagi moddaga mos kelmadi.`);
 if(!plainObj(c.rounding))bad(`${w}: rounding obyekt bo‘lsin.`);extra(c.rounding,['decimals','mode'],w+' rounding');
 if(!Number.isInteger(c.rounding.decimals)||c.rounding.decimals<0||c.rounding.decimals>4)bad(`${w}: rounding.decimals 0–4.`);if(!ROUND_MODES.includes(c.rounding.mode))bad(`${w}: rounding.mode ${ROUND_MODES.join('/')}.`);
 if(!Array.isArray(c.inputs)||!c.inputs.length||c.inputs.length>10)bad(`${w}: inputs 1–10 ta.`);
 const keys=new Set();
 for(const i of c.inputs){if(!plainObj(i))bad(`${w}: kirish obyekt bo‘lsin.`);extra(i,INPUT_KEYS,w+' input');
  if(typeof i.key!=='string'||!/^[a-z][a-z0-9_]{0,30}$/.test(i.key)||Object.hasOwn(FUNCS,i.key)||keys.has(i.key))bad(`${w}: input key noto‘g‘ri yoki takroriy.`);keys.add(i.key);
  if(typeof i.label!=='string'||!i.label.trim()||i.label.length>120)bad(`${w}: input label 1–120 belgi.`);if(!INPUT_TYPES.includes(i.type))bad(`${w}: input type ${INPUT_TYPES.join('/')}.`);
  for(const b of ['min','max'])if(i[b]!=null){if(i.type==='date')dateToDay(i[b]);else if(typeof i[b]!=='number'||!Number.isFinite(i[b]))bad(`${w}: ${b} son bo‘lsin.`);}
 }
 const ast=parseFormula(c.formula);
 for(const v of variablesOf(ast))if(!keys.has(v))bad(`${w}: formulada noma’lum o‘zgaruvchi ${v}.`);
 if(functionsOf(ast).has('addWorkdays')&&!holidaysApproved)bad(`${w}: addWorkdays uchun tasdiqlangan holidays.json kerak.`);
 return ast;
}
export function validateAll(list,{articles,holidays}={}){
 if(!Array.isArray(list))bad('calculators.json ro‘yxat (massiv) bo‘lsin.');const ids=new Set();const h=holidays?validateHolidays(holidays):null;
 for(const c of list){validateCalc(c,{articles,holidaysApproved:h?.lawyerReview==='tasdiqlangan'});if(ids.has(c.id))bad(`Takroriy id: ${c.id}.`);ids.add(c.id);}
 return list.filter(c=>c.lawyerReview==='tasdiqlangan');
}
// Foydalanuvchi kiritgan qiymatlar: tur, chegaralar; pul — 2 xonagacha.
export function readInputs(calc,raw){
 if(!plainObj(raw))bad('Kirish qiymatlari obyekt bo‘lsin.');const vars={};
 for(const k of Object.keys(raw))if(!calc.inputs.some(i=>i.key===k))bad(`Noma’lum maydon: ${k}.`);
 for(const i of calc.inputs){const v=raw[i.key];if(v==null||v==='')bad(`«${i.label}» kiritilmagan.`);
  let q;if(i.type==='date'){q=dateToDay(v);if(i.min&&cmp(q,dateToDay(i.min))<0||i.max&&cmp(q,dateToDay(i.max))>0)bad(`«${i.label}» ruxsat etilgan oraliqda emas.`);}
  else{if(typeof v!=='string'&&typeof v!=='number')bad(`«${i.label}» son bo‘lsin.`);const s=String(v).replace(/\s/g,'').replace(',','.');q=parseDecimal(s);
   if(i.type==='integer'&&!isInt(q))bad(`«${i.label}» butun son bo‘lsin.`);if(i.type==='money'&&/\.\d{3,}$/.test(s))bad(`«${i.label}»: tiyin 2 xonagacha.`);
   if(i.min!=null&&cmp(q,parseDecimal(String(i.min)))<0||i.max!=null&&cmp(q,parseDecimal(String(i.max)))>0)bad(`«${i.label}» ${i.min??'…'}–${i.max??'…'} oralig‘ida bo‘lsin.`);}
  vars[i.key]=q;}
 return vars;
}
export function compute(calc,raw,{holidays=null}={}){
 const vars=readInputs(calc,raw);const v=evaluate(parseFormula(calc.formula),vars,{holidays});
 if(calc.unit==='date')return {value:dayToDate(roundQ(v,0,'floor')),unit:'date'};
 return {value:formatQ(roundQ(v,calc.rounding.decimals,calc.rounding.mode),calc.rounding.decimals),unit:calc.unit};
}
