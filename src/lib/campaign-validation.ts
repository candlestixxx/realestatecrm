import { z } from 'zod';

const step = z.object({
  id: z.string().min(1), type: z.enum(['EMAIL', 'SMS', 'CALL', 'TASK']),
  delayValue: z.number().int().min(0).max(10000),
  delayUnit: z.enum(['SECOND', 'MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR']),
  subject: z.string().optional(), content: z.string(),
}).passthrough();

export function validateCampaignSteps(json: string) {
  try {
    const data = JSON.parse(json);
    const items = Array.isArray(data) ? data : data.items;
    return z.array(step).max(200).safeParse(items).success;
  } catch {
    return false;
  }
}
