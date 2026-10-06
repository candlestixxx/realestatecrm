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

# OpenAI (for AI features)
OPENAI_API_KEY="sk-..."

# ElevenLabs (for voice features)
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

