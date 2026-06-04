import { z } from 'zod';

export const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(['BUYER', 'SELLER', 'CLOSED']).default('BUYER'),
  workspaceId: z.string().min(1, 'Workspace is required'),
});

export type LeadInput = z.infer<typeof leadSchema>;
