@echo off
title CentTrade PRO - Full-Stack Next.js 16
echo ===================================================================
echo   CentTrade PRO — Full-Stack Next.js 16 (React 19 + TypeScript)
echo ===================================================================
echo.
echo Starting Full-Stack Next.js server on http://localhost:3000 ...
echo (Both Frontend and Backend API routes run simultaneously)
echo.

start "" http://localhost:3000
npm run dev
pause
