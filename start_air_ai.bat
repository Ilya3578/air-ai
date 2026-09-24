@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo       Air-AI - запуск приложения
echo ========================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js не найден. Установите Node.js LTS с https://nodejs.org/ и повторите запуск.
  pause
  exit /b 1
)
if not exist node_modules\express (
  echo Устанавливаю необходимые компоненты...
  call npm install
  if errorlevel 1 (
    echo Не удалось установить зависимости. Проверьте подключение к интернету.
    pause
    exit /b 1
  )
)
start "Air-AI browser" http://localhost:3000
node server.js
pause
