@echo off
REM start-all.bat -- start all 12 realestatecrm services at BelowNormal priority
REM Logs redirect to each service's server.log / server-err.log

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo [1/12] Main CRM (3000)...
cd /d "%ROOT%"
start "crm-3000" /belownormal /min cmd /c "node node_modules\next\dist\bin\next start -p 3000 > server.log 2> server-err.log"

echo [2/12] Live Audio (8090)...
start "audio-8090" /belownormal /min cmd /c "node scripts\live-audio-server.mjs > live-audio.log 2> live-audio-err.log"

echo [3/12] LeadG (3001)...
cd /d "%ROOT%\apps\leadg"
start "leadg-3001" /belownormal /min cmd /c "set PORT=3001 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3001 && node .next\standalone\server.js > server.log 2> server-err.log"

echo [4/12] Foreclosure (3002)...
cd /d "%ROOT%\apps\foreclosureworkflow"
start "foreclosure-3002" /belownormal /min cmd /c "set NODE_ENV=production && set PORT=3002 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3002 && node start-3002.js > server.out.log 2> server.err5.log"

echo [5/12] ContentPlanner Web (3003)...
cd /d "%ROOT%\apps\contentplanner\apps\web"
start "cp-web-3003" /belownormal /min cmd /c "node ..\..\node_modules\next\dist\bin\next start -p 3003 > server.log 2> server-err.log"

echo [6/12] ContentPlanner API (3031)...
cd /d "%ROOT%\apps\contentplanner\packages\api"
start "cp-api-3031" /belownormal /min cmd /c "cmd /c start-api.bat > server.log 2> server-err.log"

echo [7/12] Media Workflow (3004)...
cd /d "%ROOT%\apps\media-workflow"
start "media-3004" /belownormal /min cmd /c "set PORT=3004 && node dist\src\index.js > server.log 2> server-err.log"

echo [8/12] LegacyLeads Web (3005)...
cd /d "%ROOT%\apps\legacyleads\frontend"
start "ll-web-3005" /belownormal /min cmd /c "set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3005 && node node_modules\next\dist\bin\next start -p 3005 > server.log 2> server-err.log"

echo [9/12] LegacyLeads API (3006)...
cd /d "%ROOT%\apps\legacyleads\backend"
start "ll-api-3006" /belownormal /min cmd /c "set PORT=3006 && npx tsx src/index.ts > server.log 2> server-err.log"

echo [10/12] AI CRM (3007)...
cd /d "%ROOT%\apps\aicrm"
start "aicrm-3007" /belownormal /min cmd /c "node node_modules\next\dist\bin\next start -p 3007 > server.log 2> server-err.log"

echo [11/12] Lead Caller (3008)...
cd /d "%ROOT%\apps\leadcaller"
start "leadcaller-3008" /belownormal /min cmd /c "node node_modules\next\dist\bin\next start -p 3008 > server.log 2> server-err.log"

echo [12/12] Prototype API (3009)...
cd /d "%ROOT%\apps\prototype\server"
start "prototype-3009" /belownormal /min cmd /c "set PORT=3009 && node dist\index.js > server.log 2> server-err.log"

cd /d "%ROOT%"
echo.
echo All 12 services launching at BelowNormal priority.
