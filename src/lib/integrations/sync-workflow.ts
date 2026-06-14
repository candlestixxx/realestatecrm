export type MyPlusChecklistStep = {
  id: string;
  label: string;
  description: string;
};

export type IntegrationReadinessInput = {
  hasLoftyApiKey: boolean;
  myplusIntegrationConfirmed: boolean;
};

export type IntegrationReadiness = {
  readyForLeadTesting: boolean;
  blockers: string[];
  checklist: MyPlusChecklistStep[];
  nextAction: string;
};

export function buildMyPlusChimeChecklist(): MyPlusChecklistStep[] {
  return [
    {
      id: 'lofty-key',
      label: 'Fresh Lofty API key',
      description:
        'Copy a fresh API key from Lofty Settings and verify it against the Lofty v1.0 leads endpoint before using it for sync confirmation.',
    },
    {
      id: 'myplus-data-integrations',
      label: 'MyPlus Data Integrations',
      description:
        'In MyPlus, open Settings → Options/Preferences → Data Integrations and confirm the Chime/Lofty provider is active.',
    },
    {
      id: 'native-lofty-provider',
      label: 'Native Lofty provider selected',
      description:
        'For each lead sync, use the MyPlus native Lofty option (not Zapier), then confirm the sync modal if prompted.',
    },
    {
      id: 'sync-history',
      label: 'Visible sync history',
      description:
        'After a sync, verify MyPlus shows a "Lofty - Synchronized" history/log entry before marking the queue item synced.',
    },
  ];
}

export function buildIntegrationReadiness(input: IntegrationReadinessInput): IntegrationReadiness {
  const blockers: string[] = [];

  if (!input.hasLoftyApiKey) {
    blockers.push('Fresh Lofty API key is missing or not verified.');
  }

  if (!input.myplusIntegrationConfirmed) {
    blockers.push('MyPlus Chime/Lofty native integration has not been confirmed active.');
  }

  return {
    readyForLeadTesting: blockers.length === 0,
    blockers,
    checklist: buildMyPlusChimeChecklist(),
    nextAction:
      blockers.length === 0
        ? 'Open the sync queue and click Start Next Sync to process the 21 foreclosure leads one at a time.'
        : 'Clear the integration blockers, then enqueue and test the 21 foreclosure leads.',
  };
}
