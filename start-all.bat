@echo off
REM start-all.bat -- start all 9 realestatecrm services
REM Logs redirect to each service's server.log / server-err.log

set ROOT=C:\Users\hyper\workspace\realestatecrm

echo [1/9] Main CRM (3000)...
cd /d "%ROOT%"
start "crm-3000" cmd /c "node node_modules\next\dist\bin\next start -p 3000 > server.log 2> server-err.log"

echo [2/9] Live Audio (8090)...
start "audio-8090" cmd /c "node scripts\live-audio-server.mjs > live-audio.log 2> live-audio-err.log"

echo [3/9] LeadG (3001)...
cd /d "%ROOT%\apps\leadg"
start "leadg-3001" cmd /c "set PORT=3001 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3001 && node .next\standalone\server.js > server.log 2> server-err.log"

echo [4/9] Foreclosure (3002)...
cd /d "%ROOT%\apps\foreclosureworkflow"
start "foreclosure-3002" cmd /c "set NODE_ENV=production && set PORT=3002 && set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3002 && node start-3002.js > server.out.log 2> server.err5.log"

echo [5/9] ContentPlanner Web (3003)...
cd /d "%ROOT%\apps\contentplanner\apps\web"
start "cp-web-3003" cmd /c "node ..\..\node_modules\next\dist\bin\next start -p 3003 > server.log 2> server-err.log"

echo [6/9] ContentPlanner API (3031)...
cd /d "%ROOT%\apps\contentplanner\packages\api"
start "cp-api-3031" cmd /c "cmd /c start-api.bat > server.log 2> server-err.log"

echo [7/9] Media Workflow (3004)...
cd /d "%ROOT%\apps\media-workflow"
start "media-3004" cmd /c "set PORT=3004 && node dist\src\index.js > server.log 2> server-err.log"

echo [8/9] LegacyLeads Web (3005)...
cd /d "%ROOT%\apps\legacyleads\frontend"
start "ll-web-3005" cmd /c "set NEXTAUTH_SECRET=dev_secret_change_me && set NEXTAUTH_URL=http://localhost:3005 && node node_modules\next\dist\bin\next start -p 3005 > server.log 2> server-err.log"

echo [9/9] LegacyLeads API (3006)...
cd /d "%ROOT%\apps\legacyleads\backend"
start "ll-api-3006" cmd /c "set PORT=3006 && npx tsx src/index.ts > server.log 2> server-err.log"

echo.
echo All 9 services launching.
