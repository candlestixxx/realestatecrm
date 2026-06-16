import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
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
  
  let access;
  try {
    access = await requireWorkspaceAccess(session);
  } catch (e) {
    return new Response('Unauthorized', { status: 401 });
  }

  const latestUserMessage = [...messages].reverse().find((message: any) => message.role === 'user')?.content ?? '';
  const workspaceContext = await buildChatContext({ workspaceSlug: access.workspaceSlug, query: latestUserMessage as string });

  const result = streamText({
    model: google('gemini-2.0-flash-001'),
    system:
      'You are Gemini, the ultra-capable real estate AI assistant for Excel Legacy Realty. Your goal is to help agents dominate their local market. ' +
      'You have deep access to the CRM data and can perform actions on behalf of the user. ' +
      'Be proactive, professional, and efficient. Use the context below to inform your responses.\n\n' +
      workspaceContext,
    messages: messages as CoreMessage[],
    tools: {
      getLeadCount: {
        description: 'Get the total number of leads in the current workspace.',
        parameters: z.object({
          status: z.string().optional().describe('Optional status to filter by.'),
        }),
        execute: async ({ status }: { status?: string }) => {
          const count = await prisma.lead.count({
            where: {
              workspaceId: access.workspaceId,
              ...(status && { status }),
            },
          });
          return { count, status: status || 'ALL' };
        },
      },
      createTask: {
        description: 'Create a new task for the agent.',
        parameters: z.object({
          title: z.string().describe('The title of the task.'),
          description: z.string().optional().describe('Detailed description.'),
          dueDate: z.string().optional().describe('ISO date string for the due date.'),
          leadId: z.string().optional().describe('Link to a specific lead ID.'),
        }),
        execute: async ({ title, description, dueDate, leadId }: { title: string; description?: string; dueDate?: string; leadId?: string }) => {
          const task = await prisma.task.create({
            data: {
              title,
              description,
              dueDate: dueDate ? new Date(dueDate) : null,
              workspaceId: access.workspaceId,
              assignedToId: access.userId,
              leadId,
            },
          });
          return { success: true, taskId: task.id, title: task.title };
        },
      },
      searchContacts: {
        description: 'Search for contacts by name or email.',
        parameters: z.object({
          query: z.string().describe('The name or email fragment to search for.'),
        }),
        execute: async ({ query }: { query: string }) => {
          const contacts = await prisma.contact.findMany({
            where: {
              workspaceId: access.workspaceId,
              OR: [
                { firstName: { contains: query } },
                { lastName: { contains: query } },
                { email: { contains: query } },
              ],
            },
            take: 5,
          });
          return { contacts };
        },
      },
      createLead: {
        description: 'Create a new lead/contact in the CRM.',
        parameters: z.object({
          firstName: z.string().describe('The first name of the contact.'),
          lastName: z.string().optional().describe('The last name of the contact.'),
          email: z.string().optional().describe('The email address of the contact.'),
          phone: z.string().optional().describe('The phone number of the contact.'),
          type: z.enum(['BUYER', 'SELLER']).optional().describe('Lead type (BUYER or SELLER).'),
          source: z.string().optional().describe('Where the lead came from.'),
          notes: z.string().optional().describe('Any initial notes or inquiry description.'),
          tags: z.string().optional().describe('Comma-separated hashtags to apply.'),
        }),
        execute: async ({ firstName, lastName, email, phone, type, source, notes, tags }: { 
          firstName: string; 
          lastName?: string; 
          email?: string; 
          phone?: string; 
          type?: 'BUYER' | 'SELLER'; 
          source?: string;
          notes?: string;
          tags?: string;
        }) => {
          // create contact
          const contact = await prisma.contact.create({
            data: {
              firstName,
              lastName: lastName || null,
              email: email || null,
              phone: phone || null,
              workspaceId: access.workspaceId,
            },
          });
          // create lead
          const lead = await prisma.lead.create({
            data: {
              status: 'NEW',
              score: 70,
              source: source || 'AI Assistant',
              type: type || 'BUYER',
              tags: tags || null,
              workspaceId: access.workspaceId,
              contactId: contact.id,
              userId: access.userId,
            },
          });
          if (notes) {
            await prisma.activity.create({
              data: {
                type: 'NOTE',
                content: `Note from AI Intake:\n"${notes}"`,
                workspaceId: access.workspaceId,
                userId: access.userId,
                leadId: lead.id,
              },
            });
          }
          return { success: true, leadId: lead.id, name: `${firstName} ${lastName || ''}`.trim() };
        },
      },
      explainFeature: {
        description: 'Provide an explanation of how a specific CRM feature works.',
        parameters: z.object({
          feature: z.enum(['SEGMENTS', 'WORKFLOWS', 'SYNC_QUEUE', 'INTELLIGENCE', 'DEAL_HUB']),
        }),
        execute: async ({ feature }: { feature: 'SEGMENTS' | 'WORKFLOWS' | 'SYNC_QUEUE' | 'INTELLIGENCE' | 'DEAL_HUB' }) => {
          const explanations = {
            SEGMENTS: 'Segments (Workspaces) allow you to isolate leads into targeted lists like "Past Clients" or "Hot Leads". Change segments in the top header.',
            WORKFLOWS: 'Workflows are multi-step processes for automating complex tasks like "Foreclosure Intake" or "Offer Drafting".',
            SYNC_QUEUE: 'The Sync Queue pulls fresh foreclosure data from Legal News and MyPlus into your CRM.',
            INTELLIGENCE: 'Lead Intelligence uses AI to scrape social media and public records to enrich your lead data.',
            DEAL_HUB: 'The Deal Hub is where you coordinate transactions with Title, Mortgage, and Inspectors in a shared portal.',
          };
          return { explanation: explanations[feature] };
        },
      },
    } as any,
  });

  return result.toAIStreamResponse();
}
