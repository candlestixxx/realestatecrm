import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMyPlusSearchUrl,
  buildSearchQuery,
  buildSyncPlan,
} from '../src/lib/integrations/myplus.ts';
import {
  mapLoftyLead,
  parseLoftyLeadSearchResponse,
} from '../src/lib/integrations/lofty.ts';

test('buildSearchQuery trims missing last names', () => {
  assert.equal(buildSearchQuery('Danette', ''), 'Danette');
});

test('buildMyPlusSearchUrl encodes full lead names for portal search', () => {
  assert.equal(
    buildMyPlusSearchUrl('Ronald J. Legendre'),
    'https://portal.myplusleads.com/leads?search=Ronald%20J.%20Legendre',
  );
});

test('buildSyncPlan gives the exact one-at-a-time MyPlus Lofty handoff checklist', () => {
  const plan = buildSyncPlan('Danette', 'Colbert');

  assert.match(plan.step1_search, /Danette Colbert/);
  assert.match(plan.step2_action, /Data Integration Logs|provider surface/i);
  assert.match(plan.step2_action, /Lofty/i);
  assert.match(plan.step2_action, /not Zapier/i);
  assert.match(plan.step3_verify, /Lofty - Synchronized/i);
});

test('parseLoftyLeadSearchResponse supports Lofty v1.0 envelope and lead variants', () => {
  const parsed = parseLoftyLeadSearchResponse({
    code: 0,
    message: 'success',
    data: {
      leads: [
        {
          id: 123,
          first_name: 'Danette',
          last_name: 'Colbert',
          phones: [{ number: '586-555-0100' }],
          tags: ['PREFORECLOSURE'],
          source: 'MyPlus',
          agent_id: 'agent-1',
          created_at: '2026-05-29T00:00:00.000Z',
        },
      ],
    },
  });

  assert.deepEqual(parsed, [
    {
      id: '123',
      firstName: 'Danette',
      lastName: 'Colbert',
      email: null,
      phone: '586-555-0100',
      tags: ['PREFORECLOSURE'],
      source: 'MyPlus',
      agentId: 'agent-1',
      createdAt: '2026-05-29T00:00:00.000Z',
    },
  ]);
});

test('parseLoftyLeadSearchResponse throws the Lofty error message when token is invalid', () => {
  assert.throws(
    () => parseLoftyLeadSearchResponse({ code: 200058, message: 'User in token does not exist.' }),
    /User in token does not exist/,
  );
});

test('mapLoftyLead reads primary email and phone arrays when Lofty returns nested contact fields', () => {
  assert.deepEqual(
    mapLoftyLead({
      leadId: 'abc',
      firstName: 'Leon',
      lastName: 'Phongsavath',
      emails: ['leon@example.com'],
      phones: ['586-555-0200'],
      tagList: ['Legal News'],
    }),
    {
      id: 'abc',
      firstName: 'Leon',
      lastName: 'Phongsavath',
      email: 'leon@example.com',
      phone: '586-555-0200',
      tags: ['Legal News'],
      source: 'MyPlus',
      agentId: null,
      createdAt: '',
    },
  );
});
