export type DelayUnit = 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export function addCampaignDelay(date: Date, value: number, unit: DelayUnit): Date {
  if (!Number.isInteger(value) || value < 0 || value > 10000) {
    throw new Error('Step delays must be whole numbers from 0 to 10000.');
  }
  const result = new Date(date);
  if (unit === 'MONTH' || unit === 'YEAR') {
    // Jan 31 + one month must stay in February, and Feb 29 + a year in February.
    const day = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + value * (unit === 'YEAR' ? 12 : 1));
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(day, lastDay));
  } else {
    const milliseconds = { SECOND: 1000, MINUTE: 60000, HOUR: 3600000, DAY: 86400000, WEEK: 604800000 }[unit];
    if (!milliseconds) throw new Error('Unsupported campaign delay unit.');
    result.setTime(result.getTime() + value * milliseconds);
  }
  if (!Number.isFinite(result.getTime())) throw new Error('Campaign date is out of range.');
  return result;
}
