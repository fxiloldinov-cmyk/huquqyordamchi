# Pilot grantlari

Grantlar Netlify Blobs’dagi `entitlements` do‘konida email SHA-256 kaliti bo‘yicha saqlanadi. Faqat `emailVerified === true` hisobga grant qo‘llanadi. Tasdiqlash xizmati ulanmaguncha foydalanuvchi bepul tarifda qoladi.

Administrator mahalliy terminalida NETLIFY_SITE_ID va NETLIFY_AUTH_TOKEN ni muhit orqali ta’minlaydi. Kalitlarni fayl yoki buyruq argumentiga yozmang.

```sh
node scripts/grant-entitlement.mjs --email user@example.com --plan student --expiresAt 2026-12-01T00:00:00Z
```

Bu buyruq omborga yozadi. Uni ushbu tekshiruvda jonli omborga qarshi ishlatmadik. `free` grant bilan kelajak muddati berish eski pullik grantni bekor qiladi. Muddati o‘tgan yoki free yozuv bo‘lsa, eski muhit grantiga qaytilmaydi. Ombor xatosida grant qo‘llash to‘xtaydi.

`HK_PILOT_ENTITLEMENTS` eskirgan fallback. Faqat Blobs’da yozuv bo‘lmasa o‘qiladi. Migratsiya: har bir grantni skript bilan yozing, hisob tasdiqlanishini tekshiring, keyin eski JSONni olib tashlang. Yangi grant uchun deploy kerak emas.

Netlify rasmiy hujjatlariga ko‘ra 4 KB jami muhit limiti Lambda compatibility rejimida qolgan. Hozirgi Functions runtime uchun bu limit 2026-06-12 da olib tashlangan. Muhit qiymatini yangilash deploy talab qiladi. Aynan ushbu saytning ishlab chiqarish runtime holati tekshirilmadi.

Manbalar (2026-11-05):
- https://docs.netlify.com/build/functions/environment-variables/
- https://www.netlify.com/changelog/2026-06-12-serverless-functions-env-var-size-limit-removed/
