export const RUBRIC = [
 {id:'issue',title:'Masala',prompt:'Tomonlar, talab va nizoli huquqiy savol aniqmi?'},
 {id:'rule',title:'Norma',prompt:'Rasmiy manba, modda, tegishli tahrir va istisnolar tekshirildimi?'},
 {id:'application',title:'Qo‘llash',prompt:'Har bir hal qiluvchi fakt norma shartlari bilan bog‘landimi?'},
 {id:'alternative',title:'Muqobil dalil',prompt:'Qarshi dalil va yetishmayotgan fakt xulosaga qanday ta’sir qiladi?'},
 {id:'conclusion',title:'Xulosa',prompt:'Shartli xulosa, cheklov va keyingi qadam ko‘rsatildimi?'}
];
const topics=[
 ['mehnat','Ish haqi','Xodim ikki oy ish haqi olmaganini aytdi. Ish beruvchi hisob-kitob xatosini sabab qilib ko‘rsatmoqda. Shartnoma va to‘lov hujjatlari hali olinmagan.'],
 ['mehnat','Bo‘shatish','Xodim vazifasini buzganligi uchun bo‘shatilgan. U buyruq bilan tanishmaganini aytdi. Dalillar va rasmiy hujjatlar mavjud emas.'],
 ['mehnat','Sinov muddati','Sinovdagi xodimning shartnomasi bekor qilindi. Shartnoma, ogohlantirish sanasi va sabablar nizoli.'],
 ['mehnat','Ortiqcha ish','Xodim kechki soatlarda ishlagan, lekin tabelda bu vaqt yo‘q. Rahbar topshirig‘i og‘zaki berilgan.'],
 ['mehnat','Ta’til','Xodim ta’til so‘radi. Ish beruvchi ish ko‘pligini aytib rad etdi. Ta’til jadvali va oldingi ta’tillar noma’lum.'],
 ['oila','Aliment','Ota-ona alohida yashaydi. Bola xarajatlarini qoplash haqida nizo bor. Daromad va avvalgi kelishuv aniqlanmagan.'],
 ['oila','Bola yashash joyi','Ota va ona bola kim bilan yashashi yuzasidan kelisha olmadi. Bolaning yoshi, holati va mavjud sharoitlar o‘rganilmagan.'],
 ['oila','Mol-mulk','Er-xotin nikoh davomida olingan uy yuzasidan nizolashmoqda. Mablag‘ manbasi va mulk hujjatlari to‘liq emas.'],
 ['oila','Otalik','Fuqaro otalikni belgilashni so‘ramoqchi. Tomonlar munosabati va dalillar yuzasidan qarama-qarshi ma’lumotlar bor.'],
 ['oila','Nikoh kelishuvi','Tomonlar mulkiy shartning mazmunini turlicha tushunmoqda. Shart matni, shakli va tuzilgan sana tekshirilmagan.'],
 ['fuqarolik','Qarz','Fuqaro tanishiga qarz berganini aytmoqda. Tilxatda summa bor, lekin qaytarish muddati yo‘q. Qarzdor qisman to‘laganini da’vo qilmoqda.'],
 ['fuqarolik','Ijara','Ijarachi uydan chiqib ketdi. Uy egasi depozitni zarar sababli ushlab qolmoqda. Qabul-topshirish dalolatnomasi noma’lum.'],
 ['fuqarolik','Meros','Bir nechta voris meros mulki yuzasidan tortishmoqda. Vasiyat va murojaat sanalari haqida to‘liq ma’lumot yo‘q.'],
 ['fuqarolik','Tovar sifati','Xaridor jihoz ishlamay qolganini aytdi. Sotuvchi foydalanish qoidalari buzilganini bildirdi. Kafolat va tekshiruv hujjatlari olinmagan.'],
 ['fuqarolik','Onlayn xarid','Onlayn buyurtma tavsifga mos kelmagan. Xaridor qaytarishni so‘radi; sotuvchi yozishmalarni boshqacha izohlamoqda.'],
 ['fuqarolik','Xizmat','Buyurtmachi xizmat natijasini qabul qilmagan. Ijrochi ish bajarilganini aytdi. Texnik topshiriq va topshirish dalillari nizoli.'],
 ['fuqarolik','Zarar','Qo‘shni xonadondan suv oqib zarar yetgan. Oqish sababi va ta’mirlash xarajati mustaqil tekshirilmagan.'],
 ['fuqarolik','Vakolat','Vakil bitim imzolagan. Ishonchnoma doirasi va bitim sanasidagi amal qilishi yuzasidan nizo bor.'],
 ['fuqarolik','Bekor qilish','Tomon kechikish sababli shartnomadan chiqmoqchi. Ogohlantirish, shartlar va qisman ijro tafsilotlari yetishmaydi.'],
 ['fuqarolik','To‘lov valyutasi','Tomonlar to‘lov shartini turlicha talqin qilmoqda. Shartnoma tili, valyuta bandi va bank hujjatlari tekshirilmagan.'],
 ['jinoyat','Firibgarlik yoki qarz','Fuqaro pul olib qaytarmagan. Arizachi aldanganini aytmoqda; ikkinchi tomon buni qarz nizosi demoqda. Dastlabki niyat dalillari yetishmaydi.'],
 ['jinoyat','Ishtirokchilik','Uch shaxsning hodisadagi roli turlicha tasvirlangan. Kelishuv, harakatlar va xabardorlik bo‘yicha dalillar qarama-qarshi.'],
 ['jinoyat','Sababiy bog‘lanish','Hodisa oqibatida zarar kelib chiqqan. Qaysi harakat zarar keltirgani va shaxsning munosabati aniqlashtirilishi kerak.'],
 ['mamuriy','Jarimaga e’tiroz','Fuqaro jarima haqida kech xabar topganini aytdi. Qaror nusxasi, yetkazilgan sana va e’tiroz sabablari olinmagan.'],
 ['mamuriy','Ruxsat','Idora va tadbirkor faoliyatga ruxsat zarurligida kelishmayapti. Faoliyat turi va qaror matni noma’lum.'],
 ['fuqarolik-protsessual','Sudlov','Tomonlar turli hududlarda yashaydi. Da’vo qaysi sudga berilishi va nizoning aniq predmeti bo‘yicha savol tug‘ildi.'],
 ['fuqarolik-protsessual','Dalil','Tomon elektron yozishmani dalil qilmoqchi. Qarshi tomon uning to‘liqligi va haqiqiyligiga e’tiroz bildirgan.'],
 ['fuqarolik-protsessual','Sud topshirig‘i','Guvoh boshqa hududda yashaydi. Sud dalil olish yo‘lini tanlashi kerak. Ishtirok imkoniyati va texnik sharoitlar aniqlanmagan.'],
 ['jinoyat-protsessual','Himoya','Shaxs protsessual harakatda himoyachi qatnashmaganini aytmoqda. Maqomi, vaqt va bayonnoma tekshirilmagan.'],
 ['konstitutsiyaviy','Murojaat','Fuqaro idoraga murojaatiga mazmunli javob olmaganini aytmoqda. Murojaat turi, kelib tushgan sana va javob matni mavjud emas.']
];
export const SCENARIOS=topics.map(([fan,title,text],i)=>({id:`coach-${i+1}`,fan,title,text,fictional:true,lawyerReview:'kutilmoqda',expectedLegalAnswer:null}));
export function structureCheck(input){const fields=['facts','parties','issue','rule','application','alternative','conclusion'].map(id=>{const value=String(input[id]??'').trim();return{id,filled:value.length>0,characters:value.length}});return{method:'Faqat maydon to‘ldirilganligi; mazmun va huquqiy to‘g‘rilik tekshirilmaydi.',legalAccuracyAssessed:false,officialGrade:false,filled:fields.filter(x=>x.filled).length,total:fields.length,fields};}
