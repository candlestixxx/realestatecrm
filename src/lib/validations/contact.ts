import { z } from 'zod';

export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace is required'),
});

export type ContactInput = z.infer<typeof contactSchema>;
