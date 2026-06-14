import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';

const leadSchema = z.object({
  firstName: z.string().describe("The lead's first name"),
  lastName: z.string().describe("The lead's last name. If none is found, return empty string."),
  email: z.string().nullable().describe("The lead's email address. Null if not found."),
  phone: z.string().nullable().describe("The lead's phone number. Null if not found."),
  type: z.enum(['BUYER', 'SELLER']).describe('Is this lead looking to buy property, or sell property? Default is BUYER.'),
  source: z.string().describe('The source or portal they came from (e.g. Zillow, Realtor.com, Homes.com, Website, etc.). Default is "AI Intake".'),
  notes: z.string().describe('Extract all other details, inquiry messages, home requirements, property addresses, budgets or text as a detailed summary note.'),
  address: z.string().nullable().describe('Specific address of the property mentioned, or null.'),
  tags: z.string().describe('A comma-separated list of short hashtags representing this lead (e.g. "zillow, hot, buy").'),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    await requireWorkspaceAccess(session);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text content is required for AI intake.' }, { status: 400 });
    }

    const { object: parsedData } = await generateObject({
      model: google('gemini-2.0-flash-001'),
      system: 'You are an expert real estate AI data extraction agent. Extract structured lead details from the given text message or email.',
      prompt: `Analyze the following text and extract details as JSON matching the schema.\nText:\n"""\n${text}\n"""`,
      schema: leadSchema,
    });

    return NextResponse.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error('Failed to parse lead via AI:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
