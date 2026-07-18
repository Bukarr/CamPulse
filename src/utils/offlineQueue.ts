import { openDB as openIdb } from 'idb';
import { OfflineReportQueueItem, OfflineAction } from '../types';

const DB_NAME = 'campulse-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'reports-queue';

/**
 * Initialize and open the IndexedDB database using 'idb' package
 */
async function getDB() {
  return openIdb(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });
      }
    },
  });
}

/**
 * Add a new report to the IndexedDB offline queue
 */
export async function addOfflineReport(report: OfflineReportQueueItem): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, report);
    console.log('[IndexedDB via idb] Successfully queued report offline:', report.tempId);
    // Dispatch custom storage/sync event so other parts of the app can react
    window.dispatchEvent(new Event('campulse-offline-queue-updated'));
  } catch (err) {
    console.error('[OfflineQueue] Failed to add offline report to IndexedDB via idb:', err);
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
    const db = await getDB();
    const idbQueue = await db.getAll(STORE_NAME) || [];
    const fallbackQueue = getLocalStorageFallback();
    // Merge them avoiding duplicate keys
    const mergedMap = new Map<string, OfflineReportQueueItem>();
    [...fallbackQueue, ...idbQueue].forEach(item => {
      mergedMap.set(item.tempId, item);
    });
    return Array.from(mergedMap.values());
  } catch (err) {
    console.warn('[OfflineQueue] Failed to read from IndexedDB via idb, returning fallback:', err);
    return getLocalStorageFallback();
  }
}

/**
 * Remove a report from the IndexedDB offline queue
 */
export async function removeOfflineReport(tempId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, tempId);
    console.log('[IndexedDB via idb] Deleted offline report:', tempId);
    removeLocalStorageFallbackItem(tempId);
    window.dispatchEvent(new Event('campulse-offline-queue-updated'));
  } catch (err) {
    console.error('[OfflineQueue] Failed to delete from IndexedDB via idb:', err);
    removeLocalStorageFallbackItem(tempId);
    window.dispatchEvent(new Event('campulse-offline-queue-updated'));
  }
}

/**
 * Clear the entire offline queue
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
    localStorage.removeItem('campulse-offline-queue');
    window.dispatchEvent(new Event('campulse-offline-queue-updated'));
  } catch (err) {
    console.error('[OfflineQueue] Failed to clear IndexedDB queue via idb:', err);
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
      const data = await res.json();
      const idMap = data.idMap || {};

      try {
        const actions = getOfflineActions();
        if (actions.length > 0) {
          let actionsUpdated = false;
          const updatedActions = actions.map(action => {
            if (action.reportId && idMap[action.reportId]) {
              console.log(`[OfflineQueue] Mapping action reportId from ${action.reportId} to ${idMap[action.reportId]}`);
              actionsUpdated = true;
              return {
                ...action,
                reportId: idMap[action.reportId]
              };
            }
            return action;
          });

          if (actionsUpdated) {
            localStorage.setItem('campulse-offline-actions', JSON.stringify(updatedActions));
            window.dispatchEvent(new Event('campulse-offline-queue-updated'));
          }
        }
      } catch (err) {
        console.error('[OfflineQueue] Failed to map temporary IDs in offline actions queue:', err);
      }

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

// --- OFFLINE ACTIONS QUEUE (ASSIGNMENTS & STATUS UPDATES) ---

export function getOfflineActions(): OfflineAction[] {
  try {
    const raw = localStorage.getItem('campulse-offline-actions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addOfflineAction(action: OfflineAction): void {
  try {
    const queue = getOfflineActions();
    queue.push(action);
    localStorage.setItem('campulse-offline-actions', JSON.stringify(queue));
    window.dispatchEvent(new Event('campulse-offline-queue-updated'));
  } catch (e) {
    console.error('[OfflineQueue] Failed to add offline action:', e);
  }
}

export function removeOfflineAction(id: string): void {
  try {
    const queue = getOfflineActions();
    const updated = queue.filter(item => item.id !== id);
    localStorage.setItem('campulse-offline-actions', JSON.stringify(updated));
    window.dispatchEvent(new Event('campulse-offline-queue-updated'));
  } catch (e) {
    console.error('[OfflineQueue] Failed to remove offline action:', e);
  }
}

export async function syncOfflineActions(token: string, onProgress?: (msg: string | null) => void): Promise<boolean> {
  const queue = getOfflineActions();
  if (queue.length === 0) return true;

  if (!navigator.onLine) {
    return false;
  }

  if (onProgress) {
    onProgress(`🛜 Connection restored! Syncing ${queue.length} offline update(s) with Ahmadu Bello University server...`);
  }

  let allSuccess = true;
  for (const action of queue) {
    try {
      let url = '';
      let method = '';
      if (action.type === 'assign') {
        url = `/api/reports/${action.reportId}/assign`;
        method = 'POST';
      } else if (action.type === 'status_change') {
        url = `/api/reports/${action.reportId}/status`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(action.payload)
      });

      if (res.ok) {
        removeOfflineAction(action.id);
      } else {
        allSuccess = false;
        console.error('[OfflineQueue] Failed syncing offline action:', action.id, res.status);
      }
    } catch (err) {
      console.error('[OfflineQueue] Action sync item failed:', err);
      allSuccess = false;
    }
  }

  if (onProgress) {
    if (allSuccess) {
      onProgress('🎉 Success! All cached offline actions have been synchronized!');
    } else {
      onProgress('⚠️ Some offline actions failed to sync. Queue is saved safely.');
    }
    setTimeout(() => onProgress(null), 4000);
  }

  return allSuccess;
}

