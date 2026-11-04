import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addCampaignDelay } from '../src/lib/campaign-schedule.ts';

test('calendar month and year delays clamp to valid dates', () => {
  assert.equal(addCampaignDelay(new Date('2027-01-31T12:00:00Z'), 1, 'MONTH').toISOString(), '2027-02-28T12:00:00.000Z');
  assert.equal(addCampaignDelay(new Date('2028-02-29T12:00:00Z'), 1, 'YEAR').toISOString(), '2029-02-28T12:00:00.000Z');
});

test('day and week delays are sequential and reject invalid input', () => {
  const start = new Date('2026-11-04T12:00:00Z');
  assert.equal(addCampaignDelay(addCampaignDelay(start, 1, 'WEEK'), 2, 'DAY').toISOString(), '2026-11-13T12:00:00.000Z');
  for (const value of [-1, 0.5, NaN, Infinity, 10001]) {
    assert.throws(() => addCampaignDelay(start, value, 'DAY'));
  }
});
