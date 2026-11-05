# Deployment Guide

## Local Development

### Prerequisites

- Node.js 20+
- npm
- Git (with submodule support)

### Setup

`ash
# Clone with submodules
git clone --recurse-submodules https://github.com/candlestixxx/realestatecrm.git
cd realestatecrm

# If already cloned without submodules:
git submodule update --init --recursive

# Install dependencies
npm install

# Configure environment
cp .env.example .env
`

### Environment Variables

Edit .env with your values:

`nv
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# DeepSeek (PRIMARY LLM — all chat/parse/qualify/copy calls default to deepseek-v4-flash; override with DEEPSEEK_MODEL=deepseek-v4-pro)
DEEPSEEK_API_KEY="sk-..."

# OpenAI (embeddings for src/lib/rag.ts + voice STT/TTS fallback — DeepSeek has no embeddings/audio endpoints)
OPENAI_API_KEY="sk-..."

# ElevenLabs (legacy voice provider — superseded by OpenAI TTS fallback)
ELEVENLABS_API_KEY="..."

# Pinecone (optional, for vector search)
PINECONE_API_KEY="..."
PINECONE_NAMESPACE=""
`

### Database Setup

`ash
npx prisma generate      # Generate Prisma client
npx prisma db push       # Create/update SQLite schema
npx prisma db seed       # Load demo data
`

### Run

`ash
npm run dev              # Starts on http://localhost:3000
`

## Production Deployment

### Build

`ash
npm run build
`

### Environment for Production

`nv
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="<strong-random-secret>"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
`

### Process Management (PM2)

`ash
npm install -g pm2
pm2 start npm --name "realestatecrm" -- start
pm2 save
pm2 startup
`

### Nginx Reverse Proxy

`
ginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \System.Management.Automation.Internal.Host.InternalHost;
        proxy_set_header X-Real-IP \;
        proxy_set_header X-Forwarded-For \;
        proxy_set_header X-Forwarded-Proto \;
        proxy_cache_bypass \;
    }
}
`

### Docker (Alternative)

`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
`

`ash
docker build -t realestatecrm .
docker run -p 3000:3000 --env-file .env realestatecrm
`

## Database

- **Development:** SQLite (dev.db in project root)
- **Production:** SQLite (simple) or migrate to PostgreSQL for multi-user scale
- **Backups:** Copy dev.db / prod.db file

To switch to PostgreSQL:
1. Update prisma/schema.prisma datasource: provider = "postgresql"
2. Set DATABASE_URL to your Postgres connection string
3. Run 
px prisma db push

## Submodules

Each sub-project in pps/ is an independent git repo. To update:

`ash
git submodule update --remote --merge
`

To commit submodule pointer changes:

`ash
git add apps/<submodule>
git commit -m "chore: update <submodule> pointer"
`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| prisma db push hangs | Run with --accept-data-loss and 120s+ timeout |
| Port 3000 in use | 
px kill-port 3000 or change port in package.json |
| Submodule not found | git submodule update --init --recursive |
| Prisma client errors | 
px prisma generate after schema changes |
| NextAuth errors | Ensure NEXTAUTH_SECRET and NEXTAUTH_URL are set |

## Build and Run Scripts (2026-06-10)

### Build All Components
```powershell
# Build main CRM + all 5 submodules (pass/fail summary)
powershell -ExecutionPolicy Bypass -File build-all.ps1

# Skip npm install (faster for incremental builds)
powershell -ExecutionPolicy Bypass -File build-all.ps1 -SkipInstall
```

### Start All Services
```powershell
# Start all 8 services with correct ports and env vars
powershell -ExecutionPolicy Bypass -File start-all.ps1
```

### Check Status
```powershell
# Quick health check of all services
powershell -ExecutionPolicy Bypass -File check-status.ps1
```

### System Tray (GUI)
```powershell
# Interactive tray with Start/Stop/Restart/Quit per service
npm run tray
```

### Service Ports
| Port | Service | Notes |
|------|---------|-------|
| 3000 | Main CRM | Next.js production |
| 3001 | LeadG | Next.js production |
| 3002 | Foreclosure | NODE_ENV=production, NEXTAUTH_SECRET required |
| 3003 | ContentPlanner | npx next start |
| 3004 | Media Workflow | Node.js dist/index.js |
| 3005 | LegacyLeads Web | Next.js production |
| 3006 | LegacyLeads API | npx tsx (global tsx required) |
| 8090 | Live Audio WS | WebSocket server |

### Log Locations
- Script-managed logs: `logs/` directory at project root
- Service-specific: `apps/*/server*.log` and `apps/*/*.err*.log` 
- System tray logs: same service directories


## Production Deployment (Hetzner)

### Server Details
- **Domain**: `excellegacyrealtygroup.site`
- **IP**: `5.161.250.43`
- **SSH**: `ssh hetzner` (as `root`)
- **Deploy path**: `/var/www/excellegacyrealtygroup/`
- **PM2 process**: `excellegacyrealtygroup` (port 3210)
- **SSL**: Let's Encrypt via certbot (auto-renewing, expires 2027-01-14)
- **Nginx**: `/etc/nginx/sites-available/excellegacyrealtygroup.site`

### DNS Configuration
| Type | Name | Value |
|------|------|-------|
| A | @ | 5.161.250.43 |
| CNAME | www | excellegacyrealtygroup.site |

### Deploy Process
```bash
# 1. Build locally (900s timeout required)
cmd /c "npm run build > build-out.txt 2>&1"

# 2. Package (use deploy/package-v3.py)
python deploy/package-v3.py

# 3. Upload
scp deploy-v3.tar.gz hetzner:/tmp/deploy-v3.tar.gz

# 4. Extract and restart
ssh hetzner "cd /var/www/excellegacyrealtygroup && rm -rf .next standalone server.js middleware.ts && tar xzf /tmp/deploy-v3.tar.gz && ln -sfn client node_modules/@prisma/client-2c3a283f134fdcb6 && pm2 restart excellegacyrealtygroup"

# 5. Test
ssh hetzner "bash /tmp/test-fixes.sh"
```

### Critical Deployment Notes
- **Prisma Turbopack symlink**: After every deploy, recreate:
  `ln -sfn client node_modules/@prisma/client-2c3a283f134fdcb6`
- **DATABASE_URL**: Must be `file:./prisma/dev.db` (NOT `file:./dev.db`)
- **Auth credentials**: `admin@excellegacyrealtygroup.site` / `admin123` (hardcoded in `src/lib/auth.ts`)
- **Build timeout**: Always use 900s for `npm run build` (600s not enough)

### Health Checks
```bash
curl -sk https://excellegacyrealtygroup.site/           # ? 200/307
curl -sk https://excellegacyrealtygroup.site/api/auth/session  # ? 200
ssh hetzner "pm2 logs excellegacyrealtygroup --lines 10 --nostream"
```

### Current Production State (verified 2026-10-21, v0.58.52)

| Service | PM2 process | Port | Public path |
|---|---|---|---|
| Main CRM | `excellegacyrealtygroup` | 3210 | `/` |
| LeadG | `leadg` | 3211 | `/leadg/` |
| Foreclosure | `foreclosure` | 3212 | `/foreclosure/` |
| ContentPlanner | `contentplanner` | 3213 | `/contentplanner/` |
| Media Workflow | `media-workflow` | 3214 | `/media-workflow/` |
| LegacyLeads | `legacyleads` | 3215 | `/legacyleads/` |
| ContentPlanner API | `contentplanner-api` | 3216 | `/contentplanner-api/` (WebSocket proxied) |
| LegacyLeads API | `legacyleads-api` | 3217 | `/legacyleads-api/` (new; DB provisioned on first deploy) |

- **ContentPlanner DB**: Postgres (`contentplanner` user+DB; password in `/root/.contentplanner-pgpass`) — schema is postgresql, NOT SQLite.
- **ContentPlanner service JWT**: main CRM proxies `/api/contentplanner/*` with a short-lived HS256 token; secret in `/root/.contentplanner-svc-secret`. Deploy scripts must preserve it alongside `DATABASE_URL`/`DEEPSEEK*`/`AUTH_JWT_SECRET`.
- **Deploy scripts preserve integration keys**: all `deploy-*.sh` preserve `DEEPSEEK*` lines (and voice/messaging keys) — never redeploy with a script that wipes env.

### LegacyLeads API (:3217) first deploy
The backend previously had no deploy path (prod ran no backend process).
Pipeline (all committed): `deploy/package-legacyleads-api.py` (packs src + lockfile + tsconfig + `migrations/`, no node_modules) → `scp deploy-legacyleads-api.tar.gz hetzner:/tmp/` → `ssh hetzner 'bash /var/www/legacyleads-api/deploy-legacyleads-api.sh'` → `ssh hetzner 'bash add-legacyleads-api-nginx.sh'` (run from `deploy/`).
The deploy script provisions idempotently: `legacyleads` Postgres role/DB (password in `/root/.legacyleads-pgpass`, chmod 600), PostGIS extension, migrations `01` + `02_listings`, `.env` (PORT=3217, local Redis), PM2 `legacyleads-api` from compiled `dist/`.
Heads-up: the `listings` table starts EMPTY (no MLS ingestion gateway yet) — `/listings` returns `{data: [], count: 0}` until ingestion lands.
Status 2026-11-02: backend LIVE on :3217 (PM2 `legacyleads-api`), nginx `/legacyleads-api/` Live, frontend rebuilt with `NEXT_PUBLIC_API_URL` and redeployed — end-to-end path verified to `{data: [], count: 0}`.
Frontend wiring: rebuild `apps/legacyleads/frontend` with `NEXT_PUBLIC_API_URL=https://excellegacyrealtygroup.site/legacyleads-api` so the browser client hits the new route instead of `localhost:3006` (already supported by `src/app/lib/api.ts`; no code change needed).

- **NEXTAUTH_URL** must be `https://excellegacyrealtygroup.site` (NOT `localhost:3000`).
- **Redis** runs on `127.0.0.1:6379` (systemd `redis-server`, active). Required by:
  - `media-workflow` — `src/utils/MessageBroker.ts` (Redis Pub/Sub for background pipeline jobs).
  - `legacyleads` backend — `src/queue.ts` (BullMQ job queue for AI sync / skip-trace).
  - (Main CRM rate-limiting is in-memory — no Redis needed.)

### Deploy (main CRM, nondestructive backup-and-swap)

> PowerShell quoting trap: invoking the ssh command in double quotes lets
> PowerShell expand `$(date +%s)` LOCALLY (Get-Date error) and sends an empty
> `BK=` to the server — the old build is then NOT backed up. Always
> single-quote the remote command, or compute the timestamp before ssh.
> Never pipe script files to ssh via PowerShell (`Get-Content x.sh | ssh ...`):
> the pipe reintroduces CRLF and bash chokes. `scp` the script up, then run
> `ssh hetzner 'bash /tmp/script.sh'`.
```bash
# local: rebuild + package
npm run build
python deploy/package-v3.py
scp deploy-v3.tar.gz hetzner:/tmp/deploy-v3.tar.gz

# server: move old build aside, extract, restart
ssh hetzner 'cd /var/www/excellegacyrealtygroup && BK=/tmp/ercm-backup-$(date +%s) && mkdir -p $BK && mv .next node_modules server.js middleware.ts package.json static public post-deploy.sh $BK/ 2>/dev/null; tar xzf /tmp/deploy-v3.tar.gz && ln -sfn client node_modules/@prisma/client-2c3a283f134fdcb6 && pm2 restart excellegacyrealtygroup --update-env'
```

### Campaign defaults (0.61.6)
On Hetzner with Node 24+, run DATABASE_URL pointing to the production SQLite database and node scripts/load-default-campaigns.mjs from the source checkout. This adds four company plans to each workspace without enrolling contacts or overwriting edited defaults. Future workspaces initialize on Campaigns page access. Server instrumentation scans due email/SMS tasks every minute. Live email/SMS provider configuration is required. ERROR or stranded IN_PROGRESS sends require operator review before reopening to avoid duplicate sends.
