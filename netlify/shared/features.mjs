export const internationalEnabled=()=>process.env.HK_INTERNATIONAL_ENABLED==='1';
// v11.13: uchala funksiya standart o‘chiq. O‘chiq bo‘lsa API 503, interfeysda havola/karta ko‘rinmaydi.
export const feedbackEnabled=()=>process.env.HK_FEEDBACK_ENABLED==='1';
export const classroomEnabled=()=>process.env.HK_CLASSROOM_ENABLED==='1';
export const calcEnabled=()=>process.env.HK_CALC_ENABLED==='1';
