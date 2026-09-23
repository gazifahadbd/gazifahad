@echo off
setlocal
title Gazi Fahad Website
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  echo Download it from https://nodejs.org/ and then run this file again.
  pause
  exit /b 1
)

echo.
echo Starting the Gazi Fahad Website...
echo Open http://localhost:3000 in your browser.
echo Keep this window open while using the website.
echo.
node server.mjs

if errorlevel 1 (
  echo.
  echo The website could not start. Read README.md for troubleshooting.
  pause
)
endlocal
