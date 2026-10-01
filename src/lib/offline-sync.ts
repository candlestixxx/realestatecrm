'use client';

/**
 * Offline Sync Service
 * Queues mutations while offline and replays them when connection is restored.
 * Uses IndexedDB for durable offline queue storage.
 */

interface QueuedMutation {
  id: string;
  method: string;
  url: string;
  body: any;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'OfflineSyncDB';
const STORE_NAME = 'mutationQueue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueMutation(method: string, url: string, body: any): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const mutation: QueuedMutation = {
    id: `mut-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    method, url, body,
    timestamp: Date.now(),
    retries: 0,
  };
  tx.objectStore(STORE_NAME).add(mutation);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueue(): Promise<QueuedMutation[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const req = tx.objectStore(STORE_NAME).getAll();
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

export async function replayQueue(): Promise<{ succeeded: number; failed: number }> {
  const queue = await getQueue();
  let succeeded = 0, failed = 0;

  for (const mutation of queue) {
    try {
      const resp = await fetch(mutation.url, {
        method: mutation.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation.body),
      });
      if (resp.ok) {
        await removeFromQueue(mutation.id);
        succeeded++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { succeeded, failed };
}

async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export function setupOfflineSync(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    console.log('[OfflineSync] Connection restored, replaying queue...');
    const result = await replayQueue();
    console.log(`[OfflineSync] Replayed ${result.succeeded} mutations, ${result.failed} failed`);
  });

  // Auto-replay every 30s when online
  setInterval(async () => {
    if (navigator.onLine) {
      const queue = await getQueue();
      if (queue.length > 0) {
        await replayQueue();
      }
    }
  }, 30000);
}
