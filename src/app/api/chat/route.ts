import { openai } from '@ai-sdk/openai';
import { streamText, tool, CoreMessage } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { buildChatContext } from '@/lib/rag';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const latestUserMessage = [...(messages as CoreMessage[])].reverse().find((message) => message.role === 'user')?.content ?? '';
  const workspaceContext = await buildChatContext({ workspaceSlug: access.workspaceSlug, query: latestUserMessage as string });

  const result = await streamText({
    model: openai('gpt-4o'),
    system:
      'You are Jules, a highly intelligent and luxurious real estate AI assistant operating inside the Excel Legacy Realty CRM. Your primary function is to assist agents with their daily workflows, analyze their pipelines, and answer questions concisely and professionally. You must always maintain a high-end, consultative tone. Use the provided workspace context as trusted CRM memory and cite it when relevant.\n\n' +
      workspaceContext,
    messages: messages as CoreMessage[],
    tools: {
      getLeadCount: tool({
        description: 'Get the total number of leads in the current workspace, optionally filtered by status.',
        parameters: z.object({
          status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED']).optional().describe('Filter by lead status.'),
        }),
        execute: async (args: { status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'CONVERTED' }) => {
          const status = args.status;
          const count = await prisma.lead.count({
            where: {
              workspace: { id: access.workspaceId },
              ...(status && { status }),
            },
          });
          return { count, status: status || 'ALL' };
        },
      }),
      getRecentDeals: tool({
        description: 'Get a list of the most recent deals in the current workspace.',
        parameters: z.object({
          limit: z.number().optional().default(5).describe('The number of deals to return (default 5).'),
        }),
        execute: async (args: { limit?: number }) => {
          const limitValue = args.limit ?? 5;
          const deals = await prisma.deal.findMany({
            where: { workspace: { id: access.workspaceId } },
            orderBy: { createdAt: 'desc' },
            take: limitValue,
            select: { id: true, title: true, value: true, stage: true }
          });
          return { deals };
        },
      }),
    },
  });

  return result.toAIStreamResponse();
}
