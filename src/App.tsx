import React, { useState, useEffect, Suspense, lazy, memo, useCallback, useMemo } from 'react';
import { Home, MessageSquare, Users as UsersIcon, Settings as SettingsIcon, Plus, Zap, Bell, ArrowLeft, RefreshCw, Globe } from 'lucide-react';
import { apiService, type User, type Notification } from './services/api';
import { supabaseApiService } from './services/supabaseApi';
import { AuthProvider } from './contexts/AuthContext';
import { useDataManager } from './hooks/useDataManager';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { useOfflineSupport } from './hooks/useOfflineSupport';
import { useLanguage, LanguageContext } from './hooks/useLanguage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationCenter } from './components/NotificationCenter';
import { SystemStatus } from './components/SystemStatus';
import eeuLogo from 'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const LoginForm = lazy(() => import('./components/LoginForm').then(m => ({ default: m.LoginForm })));
const AdminSetup = lazy(() => import('./components/AdminSetup').then(m => ({ default: m.AdminSetup })));
const Complaints = lazy(() => import('./components/Complaints').then(m => ({ default: m.Complaints })));
const Users = lazy(() => import('./components/Users').then(m => ({ default: m.Users })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const ComplaintDetails = lazy(() => import('./components/ComplaintDetails').then(m => ({ default: m.ComplaintDetails })));
const NewComplaint = lazy(() => import('./components/NewComplaint').then(m => ({ default: m.NewComplaint })));
const OutageManagement = lazy(() => import('./components/OutageManagement').then(m => ({ default: m.OutageManagement })));
const UserProfile = lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })));
const SystemAlerts = lazy(() => import('./components/SystemAlerts').then(m => ({ default: m.SystemAlerts })));

// Loading fallback component
const LoadingFallback = memo(({ text = "Loading..." }: { text?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
      <span className="text-gray-600">{text}</span>
    </div>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentView, setCurrentView] = useState<{
    type: 'main' | 'complaint-details' | 'new-complaint' | 'outage-management' | 'user-profile' | 'system-alerts';
    data?: any;
  }>({ type: 'main' });
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [currentBackend, setCurrentBackend] = useState<'google' | 'supabase'>(() => {
    return (localStorage.getItem('eeu_backend_preference') as 'google' | 'supabase') || 'supabase';
  });
  const [activeApiService, setActiveApiService] = useState(supabaseApiService);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Enhanced hooks for performance and functionality - simplified to prevent loops
  const languageHook = useLanguage();
  const { t, currentLanguage, setLanguage } = languageHook;
  
  // Simplified data manager to prevent infinite loops
  const { 
    backendStatus, 
    cacheStats, 
    lastSync, 
    forceRefresh, 
    performHealthCheck,
    refreshAll,
    backgroundSyncStatus,
    notifications: dataNotifications
  } = useDataManager(false); // Disable auto-refresh to prevent infinite loops

  // Simple sync completion callback without translation dependencies
  const syncCompletionCallback = useCallback((successCount: number, errorCount: number) => {
    if (successCount > 0) {
      const notification: Notification = {
        id: `sync_${Date.now()}`,
        title: 'Sync Completed',
        message: `Successfully synced ${successCount} items`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        timestamp: new Date(),
        isRead: false
      };
      setNotifications(prev => [notification, ...prev]);
    }
    if (errorCount > 0) {
      const notification: Notification = {
        id: `sync_error_${Date.now()}`,
        title: 'Sync Error',
        message: `Failed to sync ${errorCount} items`,
        type: 'error',
        priority: 'high',
        category: 'system',
        timestamp: new Date(),
        isRead: false
      };
      setNotifications(prev => [notification, ...prev]);
    }
  }, []); // No dependencies to prevent re-renders

  // Define logout function early to avoid reference errors - simplified
  const logout = useCallback(async () => {
    try {
      await activeApiService.logout();
      setUser(null);
      setCurrentTab('dashboard');
      setCurrentView({ type: 'main' });
      setNotifications([]); // Clear notifications on logout
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setCurrentTab('dashboard');
      setCurrentView({ type: 'main' });
      setNotifications([]);
    }
  }, [activeApiService]);

  // Backend switching functionality - memoized to prevent re-renders
  const handleBackendChange = useCallback((backend: 'google' | 'supabase') => {
    setCurrentBackend(backend);
    localStorage.setItem('eeu_backend_preference', backend);
    
    // Switch the active API service
    if (backend === 'supabase') {
      setActiveApiService(supabaseApiService);
    } else {
      setActiveApiService(apiService);
    }
    
    // Clear any existing sessions directly without calling logout API
    if (user) {
      setUser(null);
      setCurrentTab('dashboard');
      setCurrentView({ type: 'main' });
      setNotifications([]);
      // Clear any stored tokens
      localStorage.removeItem('eeu_auth_token');
    }
  }, [user]);

  const handleBackendHealthCheck = useCallback(async (backend: 'google' | 'supabase'): Promise<boolean> => {
    try {
      const service = backend === 'supabase' ? supabaseApiService : apiService;
      const response = await service.healthCheck();
      return response.success;
    } catch (error) {
      return false;
    }
  }, []);

  // Simplified offline support state - avoiding hook to prevent loops
  const [offlineSupport] = useState({
    isOnline: navigator.onLine,
    isBackendOnline: true,
    pendingActions: [] as any[],
    syncInProgress: false,
    lastSyncAttempt: null,
    syncErrors: [] as string[],
    offlineStorage: { complaints: [], users: [], outages: [], notifications: [] },
    addOfflineAction: () => {},
    syncPendingActions: async () => {},
    clearPendingActions: () => {},
    updateOfflineStorage: () => {},
    getOfflineData: () => [],
    exportOfflineData: () => '{}',
    importOfflineData: () => false
  });

  // Initialize the correct API service based on stored preference
  useEffect(() => {
    const initApiService = () => {
      if (currentBackend === 'supabase') {
        setActiveApiService(supabaseApiService);
      } else {
        setActiveApiService(apiService);
      }
    };
    initApiService();
  }, []); // Empty dependency to prevent loops

  // Update notifications when data notifications change - temporarily disabled
  // useEffect(() => {
  //   if (dataNotifications && dataNotifications.length > 0) {
  //     const existingIds = new Set(notifications.map(n => n.id));
  //     const newNotifications = dataNotifications.filter(n => !existingIds.has(n.id));
  //     if (newNotifications.length > 0) {
  //       setNotifications(prev => [...newNotifications, ...prev].slice(0, 100));
  //     }
  //   }
  // }, [dataNotifications]); // Temporarily disabled to prevent loops

  // Check for existing session and admin setup needs on app load
  useEffect(() => {
    const checkSessionAndSetup = async () => {
      try {
        const storedToken = localStorage.getItem('eeu_auth_token');
        if (storedToken) {
          try {
            const currentService = currentBackend === 'supabase' ? supabaseApiService : apiService;
            const response = await currentService.validateSession();
            if (response.success && response.data?.user) {
              setUser(response.data.user);
              setLoading(false);
              return;
            } else {
              // Invalid session, clear token
              currentService.clearToken();
            }
          } catch (sessionError) {
            console.warn('Session validation failed, clearing token:', sessionError instanceof Error ? sessionError.message : 'Unknown error');
          }
        }

        // If using Supabase backend and no valid session, check if admin setup is needed
        if (currentBackend === 'supabase') {
          try {
            console.log('Checking if admin setup is needed...');
            console.log('API Base URL:', supabaseApiService.getBaseUrl());
            
            // First test basic connectivity with a simple endpoint
            try {
              console.log('🧪 Testing basic endpoint connectivity...');
              const testResponse = await fetch(`${supabaseApiService.getBaseUrl()}/test`);
              console.log('🧪 Test response status:', testResponse.status);
              if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log('🧪 Test response data:', testData);
              } else {
                const errorText = await testResponse.text();
                console.warn('🧪 Test endpoint failed:', testResponse.status, testResponse.statusText, errorText);
              }
            } catch (testError) {
              console.error('🧪 Test endpoint error:', testError);
            }
            
            // Test debug endpoint first
            try {
              console.log('🧪 Testing debug endpoint...');
              const debugResponse = await supabaseApiService.testDebugEndpoint();
              console.log('🧪 Debug response:', debugResponse);
            } catch (debugError) {
              console.error('🧪 Debug endpoint error:', debugError);
            }

            // Test direct fetch to check-users endpoint to bypass API service
            try {
              console.log('🧪 Testing check-users endpoint directly...');
              const directResponse = await fetch(`${supabaseApiService.getBaseUrl()}/check-users`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                  // No Authorization header
                }
              });
              console.log('🧪 Direct check-users response status:', directResponse.status);
              if (directResponse.ok) {
                const directData = await directResponse.json();
                console.log('🧪 Direct check-users response data:', directData);
              } else {
                const errorText = await directResponse.text();
                console.warn('🧪 Direct check-users failed:', directResponse.status, directResponse.statusText, errorText);
              }
            } catch (directError) {
              console.error('🧪 Direct check-users error:', directError);
            }
            
            const response = await supabaseApiService.checkUsersExist();
            
            console.log('Raw user check response:', response);
            
            if (response.success && response.data) {
              console.log('User check result:', response.data);
              setNeedsAdminSetup(response.data.needsSetup);
            } else {
              console.warn('Failed to check users existence:', response.error);
              // If we can't check and there's no token, assume we might need admin setup
              if (!localStorage.getItem('eeu_auth_token')) {
                console.log('No token found, enabling admin setup');
                setNeedsAdminSetup(true);
              }
            }
          } catch (error) {
            console.error('Could not check admin setup status:', error);
            // If we can't check and there's no token, assume we might need admin setup
            if (!localStorage.getItem('eeu_auth_token')) {
              console.log('Error checking + no token, enabling admin setup');
              setNeedsAdminSetup(true);
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error during session check:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndSetup();
  }, []); // Empty dependency array - run only once on mount

  // Define navigation functions early
  const navigateTo = useCallback((view: string, data?: any) => {
    setCurrentView({ type: view as any, data });
  }, []);

  const goBack = useCallback(() => {
    setCurrentView({ type: 'main' });
  }, []);

  // Global data refresh function - memoized to prevent re-renders
  const refreshAllData = useCallback(async () => {
    try {
      await forceRefresh('all');
      setDataRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [forceRefresh]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const response = await activeApiService.login(email, password);
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || 'Login failed. Please check your credentials.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide specific error message for backend connection issues
      const isNetworkError = error instanceof Error && 
        (error.message.includes('Network error') || 
         error.message.includes('unable to connect') ||
         error.message.includes('timeout'));
      
      if (isNetworkError) {
        return { 
          success: false, 
          error: 'Backend connection failed - running in demo mode. Try: admin@eeu.gov.et / admin2025 or staff.addis@eeu.gov.et / staffAddis2025'
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  }, [activeApiService]);

  // Notification handlers - memoized to prevent re-renders
  const handleMarkNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }, []);

  const handleMarkAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  }, []);

  const handleDeleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleClearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleNotificationAction = useCallback((notification: Notification) => {
    // Handle notification actions based on type
    if (notification.actionUrl) {
      if (notification.category === 'complaint' && notification.data?.complaintId) {
        navigateTo('complaint-details', { id: notification.data.complaintId });
      } else if (notification.category === 'outage' && notification.data?.outageId) {
        navigateTo('outage-management', { id: notification.data.outageId });
      }
    }
    handleMarkNotificationAsRead(notification.id);
  }, [navigateTo, handleMarkNotificationAsRead]);

  // Show loading screen while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img 
            src={eeuLogo} 
            alt="EEU Logo" 
            className="w-16 h-16 object-contain mx-auto mb-4"
          />
          <div className="text-lg font-semibold text-gray-900 mb-2">Ethiopian Electric Utility</div>
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show admin setup if needed
    if (needsAdminSetup && currentBackend === 'supabase') {
      return (
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
          <LanguageContext.Provider value={languageHook}>
            <div className="min-h-screen bg-gray-50">
              <Suspense fallback={<LoadingFallback text="Loading setup..." />}>
                <AdminSetup onSetupComplete={() => {
                  setNeedsAdminSetup(false);
                  // Refresh to show login form
                  window.location.reload();
                }} />
              </Suspense>
            </div>
          </LanguageContext.Provider>
        </ErrorBoundary>
      );
    }

    // Show login form
    return (
      <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        <LanguageContext.Provider value={languageHook}>
          <AuthProvider value={{ user, login, logout, loading }}>
            <div className="min-h-screen bg-gray-50">
              <Suspense fallback={<LoadingFallback text={t('auth.loading')} />}>
                <LoginForm />
              </Suspense>
            </div>
          </AuthProvider>
        </LanguageContext.Provider>
      </ErrorBoundary>
    );
  }

  const tabs = useMemo(() => [
    { id: 'dashboard', label: t('dashboard.title'), icon: Home },
    { id: 'complaints', label: t('complaints.title'), icon: MessageSquare },
    { id: 'users', label: t('users.title'), icon: UsersIcon },
    { id: 'settings', label: t('settings.title'), icon: SettingsIcon }
  ], [t]);

  const renderContent = () => {
    // Handle specific views first
    if (currentView.type !== 'main') {
      switch (currentView.type) {
        case 'complaint-details':
          return (
            <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
              <ComplaintDetails complaint={currentView.data} onBack={goBack} onNavigate={navigateTo} />
            </Suspense>
          );
        case 'new-complaint':
          return (
            <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
              <NewComplaint onBack={goBack} onNavigate={navigateTo} />
            </Suspense>
          );
        case 'outage-management':
          return (
            <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
              <OutageManagement onBack={goBack} onNavigate={navigateTo} />
            </Suspense>
          );
        case 'user-profile':
          return (
            <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
              <UserProfile onBack={goBack} onNavigate={navigateTo} />
            </Suspense>
          );
        case 'system-alerts':
          return (
            <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
              <SystemAlerts onBack={goBack} onNavigate={navigateTo} />
            </Suspense>
          );
        default:
          return (
            <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
              <Dashboard onNavigate={navigateTo} />
            </Suspense>
          );
      }
    }

    // Handle main tab navigation
    switch (currentTab) {
      case 'dashboard':
        return (
          <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
            <Dashboard onNavigate={navigateTo} refreshKey={dataRefreshKey} />
          </Suspense>
        );
      case 'complaints':
        return (
          <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
            <Complaints onNavigate={navigateTo} refreshKey={dataRefreshKey} onDataChange={refreshAllData} />
          </Suspense>
        );
      case 'users':
        return (
          <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
            <Users onNavigate={navigateTo} refreshKey={dataRefreshKey} onDataChange={refreshAllData} />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
            <Settings 
              onNavigate={navigateTo} 
              currentBackend={currentBackend}
              onBackendChange={handleBackendChange}
              onBackendHealthCheck={handleBackendHealthCheck}
              currentLanguage={currentLanguage}
              onLanguageChange={setLanguage}
            />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingFallback text={t('common.loading')} />}>
            <Dashboard onNavigate={navigateTo} refreshKey={dataRefreshKey} />
          </Suspense>
        );
    }
  };

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <LanguageContext.Provider value={languageHook}>
        <AuthProvider value={{ user, login, logout, loading }}>
          <div className="min-h-screen bg-gray-50 pb-20" dir={languageHook.getDirection()}>
            {/* Offline Status Banner */}
            {!offlineSupport.isOnline && (
              <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm">
                <span className="mr-2">⚠️</span>
                {t('offline.banner')} - {offlineSupport.pendingActions.length} {t('offline.pendingActions')}
              </div>
            )}
            
            {/* Header */}
            <header className="bg-white shadow-sm border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentView.type !== 'main' && (
                    <button
                      onClick={goBack}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title={t('common.back')}
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  <img 
                    src={eeuLogo} 
                    alt="EEU Logo" 
                    className="w-10 h-10 object-contain"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-orange-500 font-semibold text-lg">EEU CMS</h1>
                      <SystemStatus 
                        backendStatus={backendStatus}
                        cacheSize={cacheStats.size}
                        lastSync={lastSync}
                        onRefresh={performHealthCheck}
                        backgroundSyncStatus={backgroundSyncStatus}
                      />
                      {!offlineSupport.isBackendOnline && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                          {t('offline.mode')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">Ethiopian Electric Utility</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Language Switcher */}
                  <button
                    onClick={() => setLanguage(currentLanguage === 'en' ? 'am' : 'en')}
                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                    title={t('settings.language')}
                  >
                    <Globe className="w-4 h-4 text-blue-600" />
                  </button>
                  
                  <button
                    onClick={refreshAllData}
                    className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                    title={t('common.refresh')}
                  >
                    <RefreshCw className="w-4 h-4 text-green-600" />
                  </button>
                  
                  {/* Enhanced Notification Center */}
                  <NotificationCenter
                    notifications={notifications}
                    onMarkAsRead={handleMarkNotificationAsRead}
                    onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                    onDelete={handleDeleteNotification}
                    onClearAll={handleClearAllNotifications}
                    onAction={handleNotificationAction}
                    enableSound={true}
                    enableBrowserNotifications={true}
                  />
              
                  
                  <button
                    onClick={() => navigateTo('new-complaint')}
                    className="p-2 bg-orange-100 hover:bg-orange-200 rounded-full transition-colors"
                    title={t('complaints.newComplaint')}
                  >
                    <Plus className="w-4 h-4 text-orange-600" />
                  </button>
                  
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button
                      onClick={() => navigateTo('outage-management')}
                      className="p-2 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                      title={t('outages.title')}
                    >
                      <Zap className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                  
                  <div className="text-right text-xs">
                    <p className="font-medium text-gray-900">{user?.name || t('common.user')}</p>
                    <p className="text-gray-500 capitalize">{user?.role || 'guest'}</p>
                    {offlineSupport.pendingActions.length > 0 && (
                      <p className="text-orange-500 text-xs">
                        {offlineSupport.pendingActions.length} {t('offline.pending')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigateTo('user-profile')}
                    className="w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
                    title={t('settings.profile')}
                  >
                    <span className="text-white font-semibold text-xs">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                    </span>
                  </button>
                </div>
              </div>
            </header>

            {/* Performance Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 text-xs p-2 border-b">
                <div className="flex justify-between items-center">
                  <span>Performance: Good</span>
                  <span>Cache: {cacheStats.size} items</span>
                  <span>Backend: {backendStatus}</span>
                  <span>Language: {currentLanguage}</span>
                </div>
              </div>
            )}

            {/* Content */}
            <main className="p-4">
              {renderContent()}
            </main>

            {/* Bottom Navigation - Only show on main views */}
            {currentView.type === 'main' && (
              <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
                <div className="flex items-center justify-around py-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setCurrentTab(tab.id);
                          setCurrentView({ type: 'main' });
                        }}
                        className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                          isActive 
                            ? 'text-orange-500 bg-orange-50' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            )}
          </div>
        </AuthProvider>
      </LanguageContext.Provider>
    </ErrorBoundary>
  );
}

export default App;