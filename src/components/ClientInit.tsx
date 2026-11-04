'use client';

import { useEffect } from 'react';
import { setupOfflineSync } from '@/lib/offline-sync';
import { SkipToContent } from '@/components/accessibility';

/**
 * Global client-side utilities: offline sync, accessibility, PWA support.
 * Mount in the root layout via <ClientInit />
 */
export default function ClientInit() {
  useEffect(() => {
    setupOfflineSync();
  }, []);

  return <SkipToContent />;
}
