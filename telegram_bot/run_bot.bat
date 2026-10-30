@echo off
cd /d "%~dp0"
chcp 65001 >nul
echo ====================================================
echo   HuquqYordamchi - Telegram Botini Ishga Tushirish
echo ====================================================
echo.

if not exist .env (
    echo [!] .env fayli topilmadi. Yaratilmoqda...
    echo TELEGRAM_BOT_TOKEN=> .env
    echo GEMINI_API_KEY=>> .env
)

echo Kutubxonalar tekshirilmoqda...
pip install -r requirements.txt

echo.
echo Bot ishga tushirilmoqda...
python bot.py
pause
