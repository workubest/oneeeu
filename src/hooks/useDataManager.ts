import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, type User, type Complaint, type DashboardMetrics, type Notification, type Outage } from '../services/api';

interface DataState {
  users: User[];
  complaints: Complaint[];
  dashboardMetrics: DashboardMetrics | null;
  notifications: Notification[];
  outages: Outage[];
  loading: boolean;
  error: string | null;
  lastSync: string | null;
  backendStatus: 'online' | 'offline' | 'degraded' | 'unknown';
  cacheStats: {
    size: number;
    keys: string[];
  };
  backgroundSyncStatus: {
    enabled: boolean;
    paused: boolean;
    failureCount: number;
    pausedUntil: string | null;
  };
}

interface UseDataManagerReturn extends DataState {
  refreshAll: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshComplaints: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshOutages: () => Promise<void>;
  syncData: () => Promise<void>;
  forceRefresh: (dataType?: 'users' | 'complaints' | 'dashboard' | 'all') => Promise<void>;
  performHealthCheck: () => Promise<void>;
  clearCache: () => void;
  pauseBackgroundSync: () => void;
  resumeBackgroundSync: () => void;
}

export function useDataManager(autoRefresh: boolean = false): UseDataManagerReturn {
  const [state, setState] = useState<DataState>({
    users: [],
    complaints: [],
    dashboardMetrics: null,
    notifications: [],
    outages: [],
    loading: true,
    error: null,
    lastSync: null,
    backendStatus: 'unknown',
    cacheStats: { size: 0, keys: [] },
    backgroundSyncStatus: { enabled: true, paused: false, failureCount: 0, pausedUntil: null }
  });

  const lastRefreshTime = useRef<number>(0);
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Enhanced data fetching with rate limiting and cache management
  const refreshAll = useCallback(async (skipCache: boolean = false) => {
    const now = Date.now();
    
    // Rate limiting: don't refresh more than once every 5 seconds unless forced
    if (!skipCache && now - lastRefreshTime.current < 5000) {
      return;
    }
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      lastRefreshTime.current = now;
      
      const response = await apiService.getAllData();
      
      if (response.success && response.data) {
        const cacheStats = apiService.getCacheStats();
        
        setState(prev => ({
          ...prev,
          users: response.data!.users,
          complaints: response.data!.complaints,
          dashboardMetrics: response.data!.dashboardMetrics,
          notifications: response.data!.notifications,
          outages: response.data!.outages,
          loading: false,
          error: null,
          lastSync: new Date().toISOString(),
          backendStatus: apiService.isBackendOnline() ? 'online' : 'offline',
          cacheStats: { size: cacheStats.size, keys: cacheStats.keys }
        }));
      } else {
        throw new Error(response.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Data refresh error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh data',
        backendStatus: 'offline'
      }));
    }
  }, []);

  // Individual refresh functions with enhanced error handling
  const refreshUsers = useCallback(async (skipCache: boolean = false) => {
    try {
      const response = await apiService.getUsers({ limit: 1000, skipCache });
      if (response.success) {
        const usersData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.users || [];
        setState(prev => ({ 
          ...prev, 
          users: usersData,
          lastSync: new Date().toISOString(),
          backendStatus: apiService.isBackendOnline() ? 'online' : 'offline'
        }));
      }
    } catch (error) {
      console.error('Users refresh error:', error);
      setState(prev => ({ ...prev, backendStatus: 'offline' }));
    }
  }, []);

  const refreshComplaints = useCallback(async (skipCache: boolean = false) => {
    try {
      const response = await apiService.getComplaints({ limit: 1000, skipCache });
      if (response.success) {
        const complaintsData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.complaints || [];
        setState(prev => ({ 
          ...prev, 
          complaints: complaintsData,
          lastSync: new Date().toISOString(),
          backendStatus: apiService.isBackendOnline() ? 'online' : 'offline'
        }));
      }
    } catch (error) {
      console.error('Complaints refresh error:', error);
      setState(prev => ({ ...prev, backendStatus: 'offline' }));
    }
  }, []);

  const refreshDashboard = useCallback(async (skipCache: boolean = false) => {
    try {
      const response = await apiService.getDashboardData();
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          dashboardMetrics: response.data!,
          lastSync: new Date().toISOString(),
          backendStatus: apiService.isBackendOnline() ? 'online' : 'offline'
        }));
      }
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      setState(prev => ({ ...prev, backendStatus: 'offline' }));
    }
  }, []);

  const refreshNotifications = useCallback(async (skipCache: boolean = false) => {
    try {
      const response = await apiService.getNotifications();
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          notifications: response.data?.notifications || [],
          lastSync: new Date().toISOString(),
          backendStatus: apiService.isBackendOnline() ? 'online' : 'offline'
        }));
      }
    } catch (error) {
      console.error('Notifications refresh error:', error);
      setState(prev => ({ ...prev, backendStatus: 'offline' }));
    }
  }, []);

  const refreshOutages = useCallback(async (skipCache: boolean = false) => {
    try {
      const response = await apiService.getOutages({ limit: 100 });
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          outages: response.data || [],
          lastSync: new Date().toISOString(),
          backendStatus: apiService.isBackendOnline() ? 'online' : 'offline'
        }));
      }
    } catch (error) {
      console.error('Outages refresh error:', error);
      setState(prev => ({ ...prev, backendStatus: 'offline' }));
    }
  }, []);

  // Sync data with backend
  const syncData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await apiService.syncAllData();
      await refreshAll(true); // Force refresh from backend
    } catch (error) {
      console.error('Data sync error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sync data',
        backendStatus: 'offline'
      }));
    }
  }, [refreshAll]);

  // Force refresh specific data types
  const forceRefresh = useCallback(async (dataType: 'users' | 'complaints' | 'dashboard' | 'all' = 'all') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      if (dataType === 'all') {
        await apiService.forceRefresh('all');
        await refreshAll(true);
      } else {
        await apiService.forceRefresh(dataType);
        switch (dataType) {
          case 'users':
            await refreshUsers(true);
            break;
          case 'complaints':
            await refreshComplaints(true);
            break;
          case 'dashboard':
            await refreshDashboard(true);
            break;
        }
      }
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Force refresh error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh data',
        backendStatus: 'offline'
      }));
    }
  }, [refreshAll, refreshUsers, refreshComplaints, refreshDashboard]);

  // Perform health check
  const performHealthCheck = useCallback(async () => {
    try {
      const healthData = await apiService.performHealthCheck();
      const backgroundSyncStatus = apiService.getBackgroundSyncStatus();
      
      setState(prev => ({
        ...prev,
        backendStatus: healthData.backendStatus,
        cacheStats: {
          size: healthData.cacheSize,
          keys: [] // Don't expose all keys for security
        },
        lastSync: healthData.lastSync,
        backgroundSyncStatus
      }));
    } catch (error) {
      console.error('Health check error:', error);
      setState(prev => ({ 
        ...prev, 
        backendStatus: 'offline',
        backgroundSyncStatus: apiService.getBackgroundSyncStatus()
      }));
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    apiService.clearCache();
    setState(prev => ({
      ...prev,
      cacheStats: { size: 0, keys: [] }
    }));
  }, []);

  // Background sync control
  const pauseBackgroundSync = useCallback(() => {
    apiService.pauseBackgroundSync();
    setState(prev => ({
      ...prev,
      backgroundSyncStatus: apiService.getBackgroundSyncStatus()
    }));
  }, []);

  const resumeBackgroundSync = useCallback(() => {
    apiService.resumeBackgroundSync();
    setState(prev => ({
      ...prev,
      backgroundSyncStatus: apiService.getBackgroundSyncStatus()
    }));
  }, []);

  // Initial data load - run only once
  useEffect(() => {
    refreshAll();
  }, []); // Empty dependency to prevent loops

  // Auto-refresh if enabled - disabled to prevent loops
  useEffect(() => {
    // Temporarily disabled auto-refresh to prevent infinite loops
    // if (autoRefresh) {
    //   const interval = setInterval(() => {
    //     if (apiService.isBackendOnline()) {
    //       refreshAll();
    //     }
    //   }, 30000); // 30 seconds

    //   return () => clearInterval(interval);
    // }
  }, []);

  // Periodic health check - simplified
  useEffect(() => {
    // Initial health check
    performHealthCheck();
    
    // Set up periodic health checks - disabled to prevent loops
    // healthCheckInterval.current = setInterval(() => {
    //   performHealthCheck();
    // }, 60000); // Every 60 seconds

    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }
    };
  }, []); // Empty dependency to prevent loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }
    };
  }, []);

  return {
    ...state,
    refreshAll: (skipCache?: boolean) => refreshAll(skipCache),
    refreshUsers: (skipCache?: boolean) => refreshUsers(skipCache),
    refreshComplaints: (skipCache?: boolean) => refreshComplaints(skipCache),
    refreshDashboard: (skipCache?: boolean) => refreshDashboard(skipCache),
    refreshNotifications: (skipCache?: boolean) => refreshNotifications(skipCache),
    refreshOutages: (skipCache?: boolean) => refreshOutages(skipCache),
    syncData,
    forceRefresh,
    performHealthCheck,
    clearCache,
    pauseBackgroundSync,
    resumeBackgroundSync
  };
}