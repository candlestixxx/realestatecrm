import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addCampaignDelay } from '../src/lib/campaign-schedule.ts';
import { DEFAULT_CAMPAIGNS } from '../src/lib/default-campaigns.ts';
import { validateCampaignSteps } from '../src/lib/campaign-validation.ts';

test('calendar month and year delays clamp to valid dates', () => {
  assert.equal(addCampaignDelay(new Date('2027-01-31T12:00:00Z'), 1, 'MONTH').toISOString(), '2027-02-28T12:00:00.000Z');
  assert.equal(addCampaignDelay(new Date('2028-02-29T12:00:00Z'), 1, 'YEAR').toISOString(), '2029-02-28T12:00:00.000Z');
});

test('shared buyer and seller defaults have complete valid schedules', () => {
  assert.equal(DEFAULT_CAMPAIGNS.length, 4);
  assert.equal(new Set(DEFAULT_CAMPAIGNS.map(plan => plan.key)).size, 4);
  for (const plan of DEFAULT_CAMPAIGNS) {
    assert.equal(plan.scope, 'COMPANY');
    assert.equal(validateCampaignSteps(JSON.stringify(plan.steps)), true);
    let due = new Date('2026-11-04T12:00:00Z');
    for (const step of plan.steps) {
      due = addCampaignDelay(due, step.delayValue, step.delayUnit as Parameters<typeof addCampaignDelay>[2]);
      assert.ok(Number.isFinite(due.getTime()));
      assert.ok(step.content.length > 0);
    }
  }
  assert.equal(validateCampaignSteps('{broken'), false);
  assert.equal(validateCampaignSteps(JSON.stringify([{ ...DEFAULT_CAMPAIGNS[0].steps[0], delayValue: -1 }])), false);
});

test('day and week delays are sequential and reject invalid input', () => {
  const start = new Date('2026-11-04T12:00:00Z');
  assert.equal(addCampaignDelay(addCampaignDelay(start, 1, 'WEEK'), 2, 'DAY').toISOString(), '2026-11-13T12:00:00.000Z');
  for (const value of [-1, 0.5, NaN, Infinity, 10001]) {
    assert.throws(() => addCampaignDelay(start, value, 'DAY'));
  }
});
