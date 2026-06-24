import { z } from 'zod';

export const activitySchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  formattedContent: z.string().optional().nullable(),
  type: z.enum(['NOTE', 'CALL', 'EMAIL', 'SMS', 'SHOWING', 'DOCUMENT', 'MEETING', 'STATUS_CHANGE', 'MARKET_SNAPSHOT', 'VALUATION_REPORT']).default('NOTE'),
  workspaceId: z.string().min(1, 'Workspace is required'),
  leadId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
});

export type ActivityInput = z.infer<typeof activitySchema>;

// Schema for delete/pin operations
export const activityActionSchema = z.object({
  activityId: z.string().min(1),
  leadId: z.string().optional().nullable(),
});

export type ActivityActionInput = z.infer<typeof activityActionSchema>;
