import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      twilio: 'unknown',
      openai: 'unknown'
    }
  }

  // Check Database
  try {
    await prisma.$queryRaw`SELECT 1`
    health.services.database = 'connected'
  } catch (error) {
    health.services.database = 'disconnected'
    health.status = 'degraded'
  }

  // Check Redis config (BullMQ availability)
  if (process.env.REDIS_HOST) {
    health.services.redis = 'configured'
  } else {
    health.services.redis = 'missing_config'
    health.status = 'degraded'
  }

  // Check Telephony config
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    health.services.twilio = 'configured'
  } else {
    health.services.twilio = 'missing_config'
    health.status = 'degraded'
  }

  // Check OpenAI config
  if (process.env.OPENAI_API_KEY) {
    health.services.openai = 'configured'
  } else {
    health.services.openai = 'missing_config'
    health.status = 'degraded'
  }

  return NextResponse.json(health, {
    status: health.status === 'ok' ? 200 : 503
  })
}
