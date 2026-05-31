# 06 — Deployment Checklist

## Pre-Deployment

- [ ] All tests passing: `npm test`
- [ ] Lint clean: `npx eslint src/`
- [ ] Production build: `npm run build`
- [ ] `.env.local` has all required keys (Lofty, OpenAI, Pinecone, etc.)
- [ ] Lofty API key verified with `token` prefix
- [ ] Prisma schema migrated: `npx prisma migrate deploy`
- [ ] Database seeded: `npx prisma db seed`

## Environment Variables Required

```
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<random-64-chars>

# Lofty CRM
LOFTY_API_KEY=<JWT token from Lofty Settings>
LOFTY_API_BASE=https://api.lofty.com/v1.0

# MyPlus Leads
MYPLUS_USERNAME=<portal username>
MYPLUS_PASSWORD=<portal password>

# AI / RAG
OPENAI_API_KEY=sk-...
RAG_EMBEDDING_MODEL=text-embedding-3-small
RAG_VECTOR_PROVIDER=pinecone

# Pinecone
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_HOST=https://...
PINECONE_NAMESPACE=excel-legacy-workspace

# Analytics
NEXT_PUBLIC_GA_ID=G-HCMP10SZR
NEXT_PUBLIC_FB_PIXEL=3479529585645081
```

## Auth & Security

- [ ] Middleware protecting /dashboard/*, /api/*, /crm/*, /workflows/*
- [ ] SessionProvider wrapping app layout
- [ ] Credentials auth configured
- [ ] Role hierarchy enforced (Owner > Broker > Associate Broker > Realtor Agent > Office Manager > Admin)
- [ ] Workspace scoping on all queries

## Integrations

- [ ] Lofty API key working with `token` prefix
- [ ] MyPlus portal access confirmed
- [ ] Lofty data integration authorized in MyPlus
- [ ] Vector sync configured (Pinecone or local fallback)
- [ ] Analytics IDs injected (GA + Facebook Pixel)

## Michigan Compliance

- [ ] LARA licensing compliance in backend guardrails
- [ ] Fair Housing language review on all outbound content
- [ ] MCL 339.2512e compliance for agent communications
- [ ] Human review gate before MLS/portal publication

## Post-Deployment

- [ ] Verify Lofty API search works from production
- [ ] Verify MyPlus portal login works
- [ ] Test lead sync end-to-end (one lead)
- [ ] Verify vector search works
- [ ] Check analytics firing (GA + FB Pixel)
- [ ] Monitor error logs for first 24 hours

## Rollback Plan

1. Revert to previous deployment
2. Restore database from backup
3. Revoke and regenerate API keys if compromised
