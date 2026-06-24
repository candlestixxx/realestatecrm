# Deployment

## Setup Instructions

1. Install dependencies (ensure you handle legacy peer dependencies for @ai-sdk):
   `npm ci --legacy-peer-deps`

2. Generate Prisma client:
   `npx prisma generate`

3. Setup environment variables (copy `.env.example` to `.env`).

## Required Environment Setup

Ensure the following critical infrastructure variables are configured in your production environment:

### Database & Background Services
- `DATABASE_URL`: Connection string to your production PostgreSQL / SQLite instance.
- `REDIS_HOST`: The host URL for the Redis server powering BullMQ.
- `REDIS_PORT`: (e.g. 6379)
- `REDIS_PASSWORD`: Password for Redis auth.

### AI Engine (VoiceForge Core)
- `OPENAI_API_KEY`: Required for the base agentic chat, conversation orchestration, and fallback TTS/STT.
- `ELEVENLABS_API_KEY`: Required for premium, ultra-low latency voice rendering during live calls.
- `PLAYHT_API_KEY` (Optional fallback voice provider)
- `CARTESIA_API_KEY` (Optional fallback voice provider)

### Telephony & Orchestration (Twilio)
- `TWILIO_ACCOUNT_SID`: Master Twilio account ID.
- `TWILIO_AUTH_TOKEN`: Twilio authorization token.
- `BASE_URL`: Publicly accessible absolute URL of the production server (e.g., `https://crm.yourdomain.com`). This is absolutely required for Twilio webhooks to route back inbound/outbound status updates.
- `TRANSFER_NUMBER`: The default fallback human representative number used for `transferCall` tool escalations.

### Hosted Vector Search (Optional)
If deploying with Pinecone as your hosted vector provider:
- `PINECONE_API_KEY`
- `PINECONE_NAMESPACE`

## Production Execution
1. The web server process:
   `npm run build && npm start &`
2. The asynchronous campaign queue worker:
   `npm run worker &` (This processes background tasks, emails, SMS drips, and batched automated AI calls).
