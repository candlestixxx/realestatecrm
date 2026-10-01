/**
 * Offline Sync Manager
 * Handles offline data persistence and sync recovery using IndexedDB + online/offline events.
 */

interface PendingMutation {
  id: string;
  endpoint: string;
  method: string;
  body: any;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'realestatecrm-offline';
const STORE_NAME = 'pending-mutations';
const MAX_RETRIES = 5;

class OfflineSyncManager {
  private db: IDBDatabase | null = null;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(online: boolean) => void> = new Set();

  async init(): Promise<void> {
    if (typeof window === 'undefined' || this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        this.setupEventListeners();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncPending();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.isOnline));
  }

  get online(): boolean {
    return this.isOnline;
  }

  /**
   * Queues a mutation for offline sync if offline.
   * If online, executes immediately.
   */
  async mutate(endpoint: string, method: string, body: any): Promise<Response | PendingMutation> {
    if (this.isOnline) {
      try {
        return await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch {
        // Network failed despite "online" — queue for later
      }
    }

    return this.queueMutation(endpoint, method, body);
  }

  private async queueMutation(endpoint: string, method: string, body: any): Promise<PendingMutation> {
    const mutation: PendingMutation = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      endpoint,
      method,
      body,
      timestamp: Date.now(),
      retries: 0,
    };

    if (this.db) {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).add(mutation);
    }

    return mutation;
  }

  /**
   * Syncs all pending mutations to the server.
   */
  async syncPending(): Promise<{ synced: number; failed: number }> {
    if (!this.db || !this.isOnline) return { synced: 0, failed: 0 };

    const tx = this.db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise(resolve => {
      request.onsuccess = async () => {
        const mutations: PendingMutation[] = request.result;
        let synced = 0;
        let failed = 0;

        for (const mutation of mutations) {
          if (mutation.retries >= MAX_RETRIES) {
            await this.removeMutation(mutation.id);
            failed++;
            continue;
          }

          try {
            const resp = await fetch(mutation.endpoint, {
              method: mutation.method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mutation.body),
            });

            if (resp.ok) {
              await this.removeMutation(mutation.id);
              synced++;
            } else {
              mutation.retries++;
              await this.updateMutation(mutation);
              failed++;
            }
          } catch {
            mutation.retries++;
            await this.updateMutation(mutation);
            failed++;
          }
        }

        resolve({ synced, failed });
      };
    });
  }

  private async removeMutation(id: string): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  }

  private async updateMutation(mutation: PendingMutation): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(mutation);
  }

  /**
   * Gets count of pending offline mutations.
   */
  async pendingCount(): Promise<number> {
    if (!this.db) return 0;
    return new Promise(resolve => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  }
}

export const offlineSync = new OfflineSyncManager();

/**
 * Initialize offline sync (called from ClientInit on app mount).
 */
export async function setupOfflineSync(): Promise<void> {
  await offlineSync.init();
}
