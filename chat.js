// Netlify serverless function for /api/chat
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { messages, mode } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Noto'g'ri so'rov" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const systemPrompt = mode === "student"
      ? "Siz O'zbekiston Respublikasi qonunchiligi bo'yicha chuqur huquqiy tahlilchi va yuridik fakultet domlasisiz. Huquqshunos talabalarga javob berasiz: normaning tuzilishi (gipoteza, dispozitsiya, sanksiya), moddalar tahlili, kazuslar va sud amaliyoti bilan ilmiy tilda tushuntiring. Rasmiy manba sifatida lex.uz ga tayaning."
      : "Siz O'zbekiston Respublikasi qonunchiligi bo'yicha yordamchi AI konsultantsiz. Fuqarolarga oddiy, tushunarli, amaliy tilda javob bering. Qadam-baqadam yo'l-yo'riq, qayerga murojaat qilish kerakligi va qonun nomlarini oddiy qilib tushuntiring. Zarur bo'lsa advokatga murojaat qilishni va lex.uz orqali tekshirishni eslatib o'ting.";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Demo javob qaytarish (agar API kalit ulanmagan bo'lsa)
      const userText = messages[messages.length - 1]?.content || "";
      return new Response(
        `Hurmatli foydalanuvchi! Sizning so'rovingiz: "${userText}".\n\nAI yordamchining to'liq javob berishi uchun Netlify muhitida GEMINI_API_KEY ni sozlang. Qonun hujjatlarini to'g'ridan-to'g'ri https://lex.uz orqali ham topishingiz mumkin.`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    // Google Gemini API orqali javob olish (streaming)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
    
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: contents
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response("AI xizmatida xatolik yuz berdi: " + err, { status: 500 });
    }

    // SSE oqimidan matnni ajratib olib uzatish
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    (async () => {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); // oxirgi tugallanmagan qatorni saqlash
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataStr);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  await writer.write(new TextEncoder().encode(text));
                }
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
