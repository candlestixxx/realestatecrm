import { z } from 'zod';

export const activitySchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  type: z.enum(['NOTE', 'CALL', 'EMAIL', 'SMS', 'MEETING', 'STATUS_CHANGE']).default('NOTE'),
  workspaceId: z.string().min(1, 'Workspace is required'),
  leadId: z.string().optional(),
  dealId: z.string().optional(),
  contactId: z.string().optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;
