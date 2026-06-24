# VoiceForge Platform Monitoring

To ensure the standalone VoiceForge platform runs smoothly in production, comprehensive monitoring is critical. Given the real-time nature of voice interactions, latency and queue health are top priorities.

## Key Performance Indicators (KPIs)

### 1. Conversational Latency
- **LLM Response Time:** Track the time from webhook payload receipt to the start of the GPT-4o stream return. Goal: < 800ms.
- **TTS Generation Time:** Track the latency of audio buffer creation (ElevenLabs/OpenAI TTS). Goal: < 500ms.
- **Total Turnaround Time (TAT):** Track the end-to-end time from user silence (STT detection) to AI response audio. Goal: < 1500ms.

### 2. Campaign Queue Health (BullMQ/Redis)
- **Queue Depth:** Monitor the number of pending jobs in `campaigns`, `calls`, `emails`, and `sms` queues.
- **Processing Rate (Throughput):** Track jobs processed per minute against concurrency limits.
- **Failed Jobs:** Monitor job failure rates to catch issues with Twilio credentials or database locks.

### 3. Business Telephony Metrics
- **Call Connect Rate:** Percentage of outbound calls answered vs. dropped/voicemail.
- **Agent Transfer Rate:** The frequency of successful `transferCall` tool invocations to a human agent.
- **Average Call Duration:** Length of active conversations before hang-up or transfer.
- **Call Outcome Tracking:** Track structured JSON outcomes assigned by the Conversation Engine post-call (e.g., Interested, Voicemail Left, Not Interested).

## Application Performance Monitoring (APM) Setup

### Integration with Datadog / New Relic
1. **Instrument the Web Server:** Install the respective APM Node.js package (e.g., `dd-trace`) and require it at the absolute top of the server entry point (or inject it via Node command arguments: `node --require dd-trace/init ...`).
2. **Instrument BullMQ:** Explicitly configure monitoring for background queues. Most APMs provide plugins for Redis and ioredis to track long-running queue processes.

### Integration with Sentry (Error Tracking)
1. Install `@sentry/nextjs`.
2. Configure `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts` to capture handled/unhandled exceptions.
3. Wrap background worker execution blocks in Sentry transaction scopes to trace failing jobs (e.g., failed Twilio outbound attempts).

## Native Health Endpoint
A lightweight, publicly accessible health check endpoint is available at:
`GET /api/health`

This returns a JSON object outlining the connectivity status of the Database, Redis, Twilio, and OpenAI instances. Use this endpoint for simple uptime pinging (e.g., via Pingdom or UptimeRobot).
