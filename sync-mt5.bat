@echo off
title JFZLA CentTrade - MT5 Cloud Synchronizer
color 0A
cd /d "%~dp0"
echo ========================================================
echo   CentTrade MT5 Live Synchronizer ke Cloud (Vercel)
echo ========================================================
echo Menyambungkan ke MetaTrader 5 dan mengunggah ke cloud...
echo.

npx tsx scripts/sync-local-to-neon.ts

echo.
echo Selesai! Tekan tombol apa saja untuk menutup jendela ini...
pause >nul
