import { useState, useEffect, useCallback } from 'react';

const SYNC_QUEUE_KEY = 'transporter_pro_sync_queue';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    if (stored) {
      try {
        setSyncQueue(JSON.parse(stored));
      } catch {
        setSyncQueue([]);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add item to sync queue (for offline storage)
  const addToQueue = useCallback((type, data) => {
    const item = {
      id: Date.now().toString(),
      type, // 'delivery_update', 'damage_report', 'signature'
      data,
      timestamp: new Date().toISOString()
    };
    setSyncQueue(prev => [...prev, item]);
    return item.id;
  }, []);

  // Remove item from queue (after successful sync)
  const removeFromQueue = useCallback((id) => {
    setSyncQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setSyncQueue([]);
    localStorage.removeItem(SYNC_QUEUE_KEY);
  }, []);

  // Process sync queue when online
  const processQueue = useCallback(async (syncFn) => {
    if (!isOnline || syncQueue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const processed = [];

    for (const item of syncQueue) {
      try {
        await syncFn(item);
        processed.push(item.id);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
        // Keep in queue for retry
      }
    }

    // Remove successfully processed items
    processed.forEach(removeFromQueue);
    setIsSyncing(false);

    return processed.length;
  }, [isOnline, syncQueue, isSyncing, removeFromQueue]);

  return {
    isOnline,
    syncQueue,
    queueLength: syncQueue.length,
    isSyncing,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue
  };
};

// Hook for storing data locally when offline
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error storing value:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};
