// Telegram bot AI javobini saytning /api/chat funksiyasidan oladi (RAG + manba tekshiruvi), o'zi Gemini'ga murojaat qilmaydi.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const bot=fs.readFileSync('telegram_bot/bot.py','utf8');

test('bot: javob saytdan, manbasiz Gemini/Google qidiruvi yo‘q', () => {
 assert.match(bot,/SITE_URL \+ "\/api\/chat"/);
 assert.match(bot,/"Origin": SITE_URL/);
 assert.doesNotMatch(bot,/google_search|GoogleSearch|GEMINI_API_KEY|genai/);
 assert.doesNotMatch(fs.readFileSync('telegram_bot/requirements.txt','utf8'),/google-genai/);
 assert.match(bot,/redact_pii\(question\)/); // shaxsiy ma'lumot saytga ham yashirilib boradi
});

test('bot: yashirin HK:SRC belgisi Telegramda ko‘rinmaydi', () => {
 const re=/\u2063HK:[A-Z]+:[^\u2063]*\u2063?/g;
 assert.match(bot,/_HIDDEN_MARKERS = re\.compile\("\\u2063HK:\[A-Z\]\+:\[\^\\u2063\]\*\\u2063\?"\)/);
 assert.equal(('Javob.\n'+'\u2063HK:SRC:%7B%22a%22%3A1%7D\u2063').replace(re,'').trim(),'Javob.');
});
