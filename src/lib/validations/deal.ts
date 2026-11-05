import { z } from 'zod';
import { DEAL_STAGE_IDS } from '@/lib/deal-stages';

export const dealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  value: z.coerce.number().min(0, 'Value must be positive').optional().or(z.literal('')),
  stage: z.string().min(1, 'Stage is required').refine((s) => DEAL_STAGE_IDS.includes(s), {
    message: 'Invalid deal stage',
  }),
  workspaceId: z.string().min(1, 'Workspace is required'),
  contactId: z.string().min(1, 'Contact is required'),
});

export type DealInput = z.infer<typeof dealSchema>;
