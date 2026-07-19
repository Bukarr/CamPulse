import { OfflineReportQueueItem } from '../types';

const DB_NAME = 'campulse-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'reports-queue';

/**
 * Initialize and open the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Open database failed:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Add a new report to the IndexedDB offline queue
 */
export async function addOfflineReport(report: OfflineReportQueueItem): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(report);

      request.onsuccess = () => {
        console.log('[IndexedDB] Successfully queued report offline:', report.tempId);
        // Dispatch custom storage/sync event so other parts of the app can react
        window.dispatchEvent(new Event('campulse-offline-queue-updated'));
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (err) {
    console.error('[OfflineQueue] Failed to add offline report to IndexedDB:', err);
    // Safe LocalStorage fallback if IndexedDB is blocked
    try {
      const fallbackQueue = getLocalStorageFallback();
      fallbackQueue.push(report);
      setLocalStorageFallback(fallbackQueue);
      window.dispatchEvent(new Event('campulse-offline-queue-updated'));
    } catch (e) {
      console.error('[OfflineQueue] LocalStorage fallback failed too:', e);
    }
  }
}

/**
 * Retrieve all queued offline reports from IndexedDB
 */
export async function getOfflineReports(): Promise<OfflineReportQueueItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const idbQueue = request.result || [];
        const fallbackQueue = getLocalStorageFallback();
        // Merge them avoiding duplicate keys
        const mergedMap = new Map<string, OfflineReportQueueItem>();
        [...fallbackQueue, ...idbQueue].forEach(item => {
          mergedMap.set(item.tempId, item);
        });
        resolve(Array.from(mergedMap.values()));
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (err) {
    console.warn('[OfflineQueue] Failed to read from IndexedDB, returning fallback:', err);
    return getLocalStorageFallback();
  }
}

/**
 * Remove a report from the IndexedDB offline queue
 */
export async function removeOfflineReport(tempId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(tempId);

      request.onsuccess = () => {
        console.log('[IndexedDB] Deleted offline report:', tempId);
        removeLocalStorageFallbackItem(tempId);
        window.dispatchEvent(new Event('campulse-offline-queue-updated'));
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (err) {
    console.error('[OfflineQueue] Failed to delete from IndexedDB:', err);
    removeLocalStorageFallbackItem(tempId);
    window.dispatchEvent(new Event('campulse-offline-queue-updated'));
  }
}

/**
 * Clear the entire offline queue
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        localStorage.removeItem('campulse-offline-queue');
        window.dispatchEvent(new Event('campulse-offline-queue-updated'));
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (err) {
    console.error('[OfflineQueue] Failed to clear IndexedDB queue:', err);
    localStorage.removeItem('campulse-offline-queue');
    window.dispatchEvent(new Event('campulse-offline-queue-updated'));
  }
}

/**
 * Flushes/synchronizes the current IndexedDB offline queue to the server
 */
export async function syncOfflineReports(reporterId: string, onProgress?: (msg: string | null) => void): Promise<boolean> {
  const queue = await getOfflineReports();
  if (queue.length === 0) return true;

  if (!navigator.onLine) {
    console.log('[OfflineQueue] Sync aborted: Navigator is offline.');
    return false;
  }

  if (onProgress) {
    onProgress(`🛜 Connection restored! Syncing ${queue.length} offline report(s) with central server...`);
  }

  try {
    const res = await fetch('/api/reports/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reports: queue,
        reporter_id: reporterId
      })
    });

    if (res.ok) {
      await clearOfflineQueue();
      if (onProgress) {
        onProgress('🎉 Success! All cached offline reports have been synchronized with the ABU server!');
        setTimeout(() => onProgress(null), 4000);
      }
      return true;
    } else {
      throw new Error('Server rejected the sync package');
    }
  } catch (err) {
    console.error('[OfflineQueue] Background synchronization failed:', err);
    if (onProgress) {
      onProgress('⚠️ Sync failed. Queue is saved safely and will retry when network is stable.');
      setTimeout(() => onProgress(null), 5000);
    }
    return false;
  }
}

// --- LOCALSTORAGE BACKUP FALLBACK UTILITIES ---

function getLocalStorageFallback(): OfflineReportQueueItem[] {
  try {
    const raw = localStorage.getItem('campulse-offline-queue');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalStorageFallback(queue: OfflineReportQueueItem[]): void {
  try {
    localStorage.setItem('campulse-offline-queue', JSON.stringify(queue));
  } catch (e) {
    console.error('[LocalStorage Fallback] Failed to set item:', e);
  }
}

function removeLocalStorageFallbackItem(tempId: string): void {
  try {
    const queue = getLocalStorageFallback();
    const updated = queue.filter(item => item.tempId !== tempId);
    setLocalStorageFallback(updated);
  } catch (e) {
    console.error('[LocalStorage Fallback] Failed to delete item:', e);
  }
}
