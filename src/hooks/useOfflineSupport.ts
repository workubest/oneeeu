import { useState, useEffect, useCallback, useRef } from 'react';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: 'complaint' | 'user' | 'outage';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineState {
  isOnline: boolean;
  isBackendOnline: boolean;
  pendingActions: OfflineAction[];
  syncInProgress: boolean;
  lastSyncAttempt: string | null;
  syncErrors: string[];
  offlineStorage: {
    complaints: any[];
    users: any[];
    outages: any[];
    notifications: any[];
  };
}

interface UseOfflineSupportReturn extends OfflineState {
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  syncPendingActions: () => Promise<void>;
  clearPendingActions: () => void;
  updateOfflineStorage: (resource: keyof OfflineState['offlineStorage'], data: any[]) => void;
  getOfflineData: (resource: keyof OfflineState['offlineStorage']) => any[];
  exportOfflineData: () => string;
  importOfflineData: (jsonData: string) => boolean;
}

const OFFLINE_STORAGE_KEY = 'eeu_offline_data';
const PENDING_ACTIONS_KEY = 'eeu_pending_actions';

export function useOfflineSupport(
  apiService: any,
  onSyncComplete?: (successCount: number, errorCount: number) => void
): UseOfflineSupportReturn {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isBackendOnline: true,
    pendingActions: [],
    syncInProgress: false,
    lastSyncAttempt: null,
    syncErrors: [],
    offlineStorage: {
      complaints: [],
      users: [],
      outages: [],
      notifications: []
    }
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize offline data from localStorage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(OFFLINE_STORAGE_KEY);
      const storedActions = localStorage.getItem(PENDING_ACTIONS_KEY);

      if (storedData) {
        const offlineStorage = JSON.parse(storedData);
        setState(prev => ({ ...prev, offlineStorage }));
      }

      if (storedActions) {
        const pendingActions = JSON.parse(storedActions);
        setState(prev => ({ ...prev, pendingActions }));
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Attempt to sync when coming back online
      if (state.pendingActions.length > 0) {
        syncPendingActions();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.pendingActions.length]);

  // Persist offline data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(state.offlineStorage));
      localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(state.pendingActions));
    } catch (error) {
      console.error('Failed to persist offline data:', error);
    }
  }, [state.offlineStorage, state.pendingActions]);

  // Check backend connectivity periodically
  useEffect(() => {
    const checkBackendConnectivity = async () => {
      try {
        const response = await apiService.healthCheck();
        setState(prev => ({ 
          ...prev, 
          isBackendOnline: response.success 
        }));
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          isBackendOnline: false 
        }));
      }
    };

    // Initial check
    checkBackendConnectivity();

    // Check every 30 seconds
    const interval = setInterval(checkBackendConnectivity, 30000);

    return () => clearInterval(interval);
  }, [apiService]);

  const addOfflineAction = useCallback((
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>
  ) => {
    const newAction: OfflineAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    setState(prev => ({
      ...prev,
      pendingActions: [...prev.pendingActions, newAction]
    }));

    // If online, try to sync immediately
    if (state.isOnline && state.isBackendOnline) {
      setTimeout(() => syncPendingActions(), 1000);
    }
  }, [state.isOnline, state.isBackendOnline]);

  const syncPendingActions = useCallback(async () => {
    if (state.syncInProgress || !state.isOnline || !state.isBackendOnline) {
      return;
    }

    setState(prev => ({ 
      ...prev, 
      syncInProgress: true, 
      syncErrors: [],
      lastSyncAttempt: new Date().toISOString()
    }));

    const actionsToSync = [...state.pendingActions];
    const successfulActions: string[] = [];
    const failedActions: OfflineAction[] = [];
    const syncErrors: string[] = [];

    for (const action of actionsToSync) {
      try {
        let response;

        switch (action.type) {
          case 'create':
            switch (action.resource) {
              case 'complaint':
                response = await apiService.createComplaint(action.data);
                break;
              case 'user':
                response = await apiService.createUser(action.data);
                break;
              case 'outage':
                response = await apiService.createOutage(action.data);
                break;
            }
            break;

          case 'update':
            switch (action.resource) {
              case 'complaint':
                response = await apiService.updateComplaint(action.data.id, action.data);
                break;
              case 'user':
                response = await apiService.updateUser(action.data.id, action.data);
                break;
              case 'outage':
                response = await apiService.updateOutage(action.data.id, action.data);
                break;
            }
            break;

          case 'delete':
            switch (action.resource) {
              case 'complaint':
                response = await apiService.deleteComplaint(action.data.id);
                break;
              case 'user':
                response = await apiService.deleteUser(action.data.id);
                break;
              case 'outage':
                response = await apiService.deleteOutage(action.data.id);
                break;
            }
            break;
        }

        if (response?.success) {
          successfulActions.push(action.id);
        } else {
          throw new Error(response?.error || `Failed to ${action.type} ${action.resource}`);
        }
      } catch (error) {
        const updatedAction = {
          ...action,
          retryCount: action.retryCount + 1
        };

        if (updatedAction.retryCount < updatedAction.maxRetries) {
          failedActions.push(updatedAction);
        } else {
          syncErrors.push(
            `Failed to ${action.type} ${action.resource} after ${action.maxRetries} attempts: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }
    }

    setState(prev => ({
      ...prev,
      pendingActions: failedActions,
      syncInProgress: false,
      syncErrors
    }));

    // Schedule retry for failed actions
    if (failedActions.length > 0) {
      retryTimeoutRef.current = setTimeout(() => {
        syncPendingActions();
      }, 30000); // Retry after 30 seconds
    }

    // Notify about sync completion
    if (onSyncComplete) {
      onSyncComplete(successfulActions.length, syncErrors.length);
    }
  }, [state.syncInProgress, state.isOnline, state.isBackendOnline, state.pendingActions, apiService, onSyncComplete]);

  const clearPendingActions = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingActions: [],
      syncErrors: []
    }));
  }, []);

  const updateOfflineStorage = useCallback((
    resource: keyof OfflineState['offlineStorage'], 
    data: any[]
  ) => {
    setState(prev => ({
      ...prev,
      offlineStorage: {
        ...prev.offlineStorage,
        [resource]: data
      }
    }));
  }, []);

  const getOfflineData = useCallback((
    resource: keyof OfflineState['offlineStorage']
  ) => {
    return state.offlineStorage[resource] || [];
  }, [state.offlineStorage]);

  const exportOfflineData = useCallback(() => {
    const exportData = {
      offlineStorage: state.offlineStorage,
      pendingActions: state.pendingActions,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.offlineStorage, state.pendingActions]);

  const importOfflineData = useCallback((jsonData: string): boolean => {
    try {
      const importData = JSON.parse(jsonData);
      
      if (importData.version && importData.offlineStorage) {
        setState(prev => ({
          ...prev,
          offlineStorage: importData.offlineStorage,
          pendingActions: importData.pendingActions || []
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import offline data:', error);
      return false;
    }
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    addOfflineAction,
    syncPendingActions,
    clearPendingActions,
    updateOfflineStorage,
    getOfflineData,
    exportOfflineData,
    importOfflineData
  };
}