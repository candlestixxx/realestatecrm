import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  workspaceId: z.string().min(1, 'Workspace is required'),
  dueDate: z.string().optional().or(z.literal('')),
  dueTime: z.string().optional().or(z.literal('')),
  assignedToId: z.string().optional().or(z.literal('')),
  triggerEmail: z.boolean().optional(),
  triggerSMS: z.boolean().optional(),
  triggerCall: z.boolean().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;

export const taskActionSchema = z.object({
  taskId: z.string().min(1),
  leadId: z.string().optional().nullable(),
});

export type TaskActionInput = z.infer<typeof taskActionSchema>;

export const taskUpdateSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  dueDate: z.string().optional().or(z.literal('')),
  dueTime: z.string().optional().or(z.literal('')),
  leadId: z.string().optional().nullable(),
});

export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
