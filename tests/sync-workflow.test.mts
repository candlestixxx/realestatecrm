import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildIntegrationReadiness,
  buildMyPlusChimeChecklist,
} from '../src/lib/integrations/sync-workflow';

test('buildMyPlusChimeChecklist requires the native Lofty provider, not Zapier', () => {
  const checklist = buildMyPlusChimeChecklist();

  assert.ok(checklist.some((step) => /Data Integrations/i.test(step.label)));
  assert.ok(checklist.some((step) => /Lofty/i.test(step.description)));
  assert.ok(checklist.some((step) => /not Zapier/i.test(step.description)));
});

test('buildIntegrationReadiness blocks testing until Lofty key and MyPlus integration are confirmed', () => {
  const readiness = buildIntegrationReadiness({
    hasLoftyApiKey: false,
    myplusIntegrationConfirmed: false,
  });

  assert.equal(readiness.readyForLeadTesting, false);
  assert.deepEqual(readiness.blockers, [
    'Fresh Lofty API key is missing or not verified.',
    'MyPlus Chime/Lofty native integration has not been confirmed active.',
  ]);
});

test('buildIntegrationReadiness allows 21-lead testing after both integration prerequisites pass', () => {
  const readiness = buildIntegrationReadiness({
    hasLoftyApiKey: true,
    myplusIntegrationConfirmed: true,
  });

  assert.equal(readiness.readyForLeadTesting, true);
  assert.deepEqual(readiness.blockers, []);
  assert.match(readiness.nextAction, /Start Next Sync/i);
});
