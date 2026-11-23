// TEST ONLY: quyidagi kalkulyatorlar, formulalar va sanalar soxta — huquqiy ma'lumot emas, data/ ga tushmaydi.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseFormula,evaluate,validateCalc,validateAll,validateHolidays,compute,readInputs,roundQ,formatQ,parseDecimal,Q,CalcError} from '../netlify/shared/calc.mjs';
import calcFn,{approvedCalcs} from '../netlify/functions/calc.mjs';
import features from '../netlify/functions/features.mjs';
const ARTS=new Set(['testdoc:1','testdoc:2']);
const TEST_ONLY=(over={})=>({id:'test-only-foiz',title:'TEST ONLY foiz',inputs:[{key:'summa',label:'Summa',type:'money',min:0,max:1000000000},{key:'foiz',label:'Foiz',type:'number',min:0,max:100}],formula:'summa * foiz / 100',rounding:{decimals:2,mode:'half_up'},unit:'so‘m',sourceRef:'testdoc:1',lawyerReview:'tasdiqlangan',...over});
const run=(f,vars={})=>formatQ(evaluate(parseFormula(f),Object.fromEntries(Object.entries(vars).map(([k,v])=>[k,parseDecimal(v)]))),6);
const err=(fn,re)=>assert.throws(fn,e=>e instanceof CalcError&&(!re||re.test(e.message)));
test('parser xavfsizligi: kod ijrosi imkonsiz, faqat ruxsat etilgan belgilar va funksiyalar',()=>{
 for(const f of ['process.exit(1)','this','x=1','a;b','`1`','[1]','{}','"a"',"'a'",'1e309','a.b','!1','1%2','2**3','constructor(1)','toString()','Function(1)','eval(1)','require(1)','__proto__(1)','globalThis','x y','min','round(1,2,3)','max()','(1','1)','1 2'])
  assert.throws(()=>{const ast=parseFormula(f);evaluate(ast,{});},CalcError,f);
 for(const v of ['__proto__','constructor','hasOwnProperty'])err(()=>evaluate(parseFormula(v),{}),/Noma’lum o‘zgaruvchi/);
 const src=fs.readFileSync(new URL('../netlify/shared/calc.mjs',import.meta.url),'utf8');assert.doesNotMatch(src.replace(/\/\/.*$/gm,''),/\beval\s*\(|new\s+Function|Function\s*\(|import\s*\(|require\s*\(/);
 assert.throws(()=>parseFormula('1+'.repeat(300)+'1'),CalcError);assert.throws(()=>parseFormula('('.repeat(40)+'1'+')'.repeat(40)),CalcError);
});
test('aniq arifmetika va yaxlitlash: suzuvchi nuqta xatosi yo‘q',()=>{
 assert.equal(run('0.1 + 0.2'),'0.300000');assert.equal(run('1.005 * 1000'),'1005.000000');assert.equal(run('a * 3 / 3',{a:'0.1'}),'0.100000');
 assert.equal(formatQ(roundQ(parseDecimal('2.345'),2,'half_up'),2),'2.35');assert.equal(formatQ(roundQ(parseDecimal('-2.345'),2,'half_up'),2),'-2.35');
 assert.equal(formatQ(roundQ(parseDecimal('2.349'),2,'floor'),2),'2.34');assert.equal(formatQ(roundQ(parseDecimal('-2.341'),2,'floor'),2),'-2.35');assert.equal(formatQ(roundQ(parseDecimal('2.341'),2,'ceil'),2),'2.35');
 assert.equal(run('round(10 / 3, 2)'),'3.330000');assert.equal(run('min(3, 1.5, 2) + max(1, 4)'),'5.500000');assert.equal(run('-(2 - 5)'),'3.000000');
 err(()=>run('1 / (2 - 2)'),/Nolga/);err(()=>Q(1n,0n),/Nolga/);
});
test('noto‘g‘ri kirishlar: tur, oraliq, noma’lum maydon, pul xonalari',()=>{
 const c=TEST_ONLY();
 assert.deepEqual(compute(c,{summa:'1 000 000,50',foiz:'12.5'}),{value:'125000.06',unit:'so‘m'});
 for(const raw of [{summa:'abc',foiz:'1'},{summa:'-1',foiz:'1'},{summa:'10',foiz:'101'},{summa:'10.123',foiz:'1'},{summa:'10'},{summa:'10',foiz:'1',boshqa:'1'},null,{summa:{},foiz:'1'},{summa:'1e5',foiz:'1'}])assert.throws(()=>readInputs(c,raw),CalcError,JSON.stringify(raw));
 const i=TEST_ONLY({inputs:[{key:'kun',label:'Kun',type:'integer'}],formula:'kun * 2',unit:'kun',rounding:{decimals:0,mode:'half_up'}});assert.throws(()=>compute(i,{kun:'1.5'}),CalcError);assert.equal(compute(i,{kun:'7'}).value,'14');
 const d=TEST_ONLY({inputs:[{key:'sana',label:'Sana',type:'date'},{key:'n',label:'Kun',type:'integer'}],formula:'sana + n',unit:'date',rounding:{decimals:0,mode:'floor'}});
 assert.deepEqual(compute(d,{sana:'2026-12-30',n:'3'}),{value:'2027-01-02',unit:'date'});assert.throws(()=>compute(d,{sana:'2026-02-30',n:'1'}),CalcError);
});
test('validatsiya: noma’lum maydon, noto‘g‘ri formula, mavjud bo‘lmagan modda, takroriy id rad etiladi',()=>{
 assert.ok(validateCalc(TEST_ONLY(),{articles:ARTS}));
 for(const [over,re] of [[{extra:1},/noma’lum maydon/],[{formula:'summa * '},/sintaksis/],[{formula:'summa * stavka'},/noma’lum o‘zgaruvchi/],[{sourceRef:'testdoc:999'},/bazadagi moddaga/],[{sourceRef:'mk 131'},/sourceRef/],[{lawyerReview:'tasdiqlandi'},/lawyerReview/],[{rounding:{decimals:9,mode:'half_up'}},/decimals/],[{rounding:{decimals:2,mode:'bank'}},/mode/],[{inputs:[{key:'min',label:'x',type:'number'}],formula:'1'},/key/],[{inputs:[{key:'a',label:'x',type:'matn'}],formula:'a'},/type/],[{inputs:[{key:'a',label:'x',type:'number',color:'red'}],formula:'a'},/noma’lum maydon/],[{id:'Katta ID'},/id/],[{formula:'addWorkdays(summa, foiz)'},/holidays/]])
  assert.throws(()=>validateCalc(TEST_ONLY(over),{articles:ARTS}),e=>e instanceof CalcError&&re.test(e.message),JSON.stringify(over));
 const missing=TEST_ONLY();delete missing.unit;assert.throws(()=>validateCalc(missing,{articles:ARTS}),/«unit» maydoni yo‘q/);
 assert.throws(()=>validateAll([TEST_ONLY(),TEST_ONLY()],{articles:ARTS}),/Takroriy id/);assert.throws(()=>validateAll({},{articles:ARTS}),/massiv/);
 assert.throws(()=>validateHolidays({schema:1,lawyerReview:'kutilmoqda',weekend:[7],days:[]}),/weekend/);
});
test('tasdiqlanmagan yozuv foydalanuvchiga ko‘rinmaydi; addWorkdays faqat tasdiqlangan jadval bilan',()=>{
 const list=[TEST_ONLY({id:'test-only-a'}),TEST_ONLY({id:'test-only-b',lawyerReview:'kutilmoqda'})];
 assert.deepEqual(validateAll(list,{articles:ARTS}).map(c=>c.id),['test-only-a']);
 assert.deepEqual(approvedCalcs({calculators:list}).map(c=>c.id),['test-only-a']);
 const h={schema:1,lawyerReview:'tasdiqlangan',sourceRef:'',weekend:[0,6],days:[{date:'2027-01-01',note:'TEST ONLY'}]};
 const w=TEST_ONLY({inputs:[{key:'sana',label:'Sana',type:'date'},{key:'n',label:'Kun',type:'integer'}],formula:'addWorkdays(sana, n)',unit:'date',rounding:{decimals:0,mode:'floor'}});
 assert.ok(validateAll([w],{articles:ARTS,holidays:h}).length);assert.throws(()=>validateAll([w],{articles:ARTS,holidays:{...h,lawyerReview:'kutilmoqda'}}),/holidays/);
 assert.equal(compute(w,{sana:'2026-12-31',n:'2'},{holidays:h}).value,'2027-01-05');assert.throws(()=>compute(w,{sana:'2026-12-31',n:'2'}),/tasdiqlanmagan/);
});
test('data/calc: egasi kiritgan yozuvlar sxemaga mos, build natijasida faqat tasdiqlanganlar',()=>{
 const real=JSON.parse(fs.readFileSync(new URL('../data/calc/calculators.json',import.meta.url),'utf8'));assert.ok(Array.isArray(real));
 const gen0=JSON.parse(fs.readFileSync(new URL('../netlify/shared/calc-approved.json',import.meta.url),'utf8'));
 assert.deepEqual(gen0.calculators.map(c=>c.id),real.filter(c=>c.lawyerReview==='tasdiqlangan').map(c=>c.id));assert.ok(gen0.calculators.every(c=>c.source?.url?.startsWith('https://lex.uz/')));
 const h=JSON.parse(fs.readFileSync(new URL('../data/calc/holidays.json',import.meta.url),'utf8'));assert.equal(h.lawyerReview,'kutilmoqda');assert.deepEqual(h.days,[]);validateHolidays(h);
 const gen=JSON.parse(fs.readFileSync(new URL('../netlify/shared/calc-approved.json',import.meta.url),'utf8'));assert.ok(gen.calculators.every(c=>c.lawyerReview==='tasdiqlangan'));assert.equal(gen.holidays,null);
 for(const f of ['data/calc/calculators.json','data/calc/holidays.json'])assert.doesNotMatch(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),/TEST ONLY/);
});
test('o‘chiq holat va API: 503; yoqilganda tasdiqlangan yozuv bo‘lmasa ro‘yxat bo‘sh, havola yashirin',async()=>{
 const old=process.env.HK_CALC_ENABLED;const req=(m,b)=>new Request('https://calc.test/api/calc',m==='POST'?{method:'POST',headers:{origin:'https://calc.test','content-type':'application/json'},body:JSON.stringify(b)}:{});
 try{delete process.env.HK_CALC_ENABLED;assert.equal((await calcFn(req('GET'),{})).status,503);assert.equal((await calcFn(req('POST',{id:'x',inputs:{}}),{ip:'c1'})).status,503);
  process.env.HK_CALC_ENABLED='1';const r=await calcFn(req('GET'),{});assert.equal(r.status,200);const d=await r.json();assert.deepEqual(d.calculators.map(c=>c.id),approvedCalcs().map(c=>c.id));assert.equal(d.note,'Hisob-kitob yo‘naltiruvchi, rasmiy xulosa emas.');
  assert.equal((await calcFn(req('POST',{id:'test-only-foiz',inputs:{}}),{ip:'c2'})).status,404);
  assert.equal((await (await features(new Request('https://calc.test/api/features'))).json()).calc,approvedCalcs().length>0);
 }finally{if(old===undefined)delete process.env.HK_CALC_ENABLED;else process.env.HK_CALC_ENABLED=old;}
 const html=fs.readFileSync(new URL('../public/calc.html',import.meta.url),'utf8');assert.match(html,/id="calc-section" hidden/);assert.match(html,/Hisob-kitob yo‘naltiruvchi, rasmiy xulosa emas\./);assert.match(html,/faqat o‘zbekcha/i);
 for(const f of ['sw.js','sitemap.xml'])assert.doesNotMatch(fs.readFileSync(new URL('../public/'+f,import.meta.url),'utf8'),/calc/);
 assert.ok(!fs.existsSync(new URL('../public/calc-approved.json',import.meta.url)));
});
