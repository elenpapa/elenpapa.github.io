@echo off
REM Why this exists:
REM Windows double-click launcher that starts backoffice (if not already running)
REM and opens the editor in the default browser.
setlocal

cd /d "%~dp0"
set "URL=http://127.0.0.1:4310"
set "LOG_FILE=%~dp0.backoffice-launch.log"

where npm >nul 2>nul
if errorlevel 1 (
  echo [Backoffice] npm was not found. Please install Node.js.
  pause
  exit /b 1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":4310 .*LISTENING"') do (
  start "" "%URL%"
  exit /b 0
)

start "" /B cmd /c "npm run backoffice >> \"%LOG_FILE%\" 2>&1"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$deadline=(Get-Date).AddSeconds(30); while((Get-Date)-lt $deadline){ try { $ok=Test-NetConnection -ComputerName 127.0.0.1 -Port 4310 -WarningAction SilentlyContinue -InformationLevel Quiet } catch { $ok=$false }; if($ok){ Start-Process '%URL%'; exit 0 }; Start-Sleep -Seconds 1 }; Start-Process '%URL%'"

exit /b 0
