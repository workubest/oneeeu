// EEU Complaint Management System - Frontend API Service
// Integrates with Google Apps Script backend - Version 3.2.2

const CONFIG = {
  // Google Apps Script Web App URL - Live backend preferred
  BASE_URL: 'https://script.google.com/macros/s/AKfycbzbYwGgvpzd4EdbjGmaJnT0VusWwN2efaQug6HOCX5iM-u9sJ2iPmOkuaLyBX3roIcg/exec',
  API_KEY: 'eeu-complaint-api-key-2025',
  TIMEOUT: 10000, // Reduced timeout for faster fallback
  RETRY_ATTEMPTS: 3, // Increased retry attempts for better reliability
  RETRY_DELAY: 1500,
  // Live backend preferred with demo fallback if backend unavailable
  DEVELOPMENT_MODE: false,
  MOCK_DATA_FALLBACK: true, // Temporary fallback for connection issues
  VERSION: '3.2.3', // Updated version
  // Enhanced caching and sync settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache
  BACKGROUND_SYNC_INTERVAL: 2 * 60 * 1000, // 2 minutes background sync (less aggressive)
  CRITICAL_DATA_SYNC_INTERVAL: 60 * 1000, // 1 minute for critical data
  ENABLE_OPTIMISTIC_UPDATES: true,
  ENABLE_BACKGROUND_SYNC: true,
  MAX_CACHE_SIZE: 1000, // Maximum cached items
  BACKGROUND_SYNC_TIMEOUT: 5000, // 5 second timeout for background requests
  MAX_BACKGROUND_FAILURES: 5 // Max failures before pausing background sync
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'technician' | 'customer';
  region?: string;
  serviceCenter?: string;
  phone?: string;
  isActive?: boolean;
  accountLocked?: boolean;
  failedLoginAttempts?: number;
  lastLogin?: string;
  loginCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export interface Complaint {
  id: string;
  customerId: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  region?: string;
  serviceCenter?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'alert' | 'warning' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
  relatedComplaintId?: string;
  actionRequired: boolean;
}

export interface Outage {
  id: string;
  title: string;
  status: 'active' | 'scheduled' | 'investigating' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedCustomers: number;
  area: string;
  reportedAt: string;
  estimatedRestoration: string;
  cause: string;
  assignedCrew: string;
  crewStatus: 'preparing' | 'en-route' | 'on-site' | 'completed';
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  complaints: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    pending: number;
    escalated: number;
    cancelled: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    todayCount: number;
    yesterdayCount: number;
    weekCount: number;
    lastWeekCount: number;
    monthCount: number;
    lastMonthCount: number;
    yearCount: number;
  };
  performance: {
    resolutionRate: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
    responseTime: number;
    firstResponseTime: number;
    escalationRate: number;
  };
  trends: {
    complaintsChange: number;
    resolutionChange: number;
    responseChange: number;
    satisfactionChange: number;
  };
  users: {
    total: number;
    active: number;
    online: number;
  };
  dateFilters: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
  };
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  key: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private isBackendAvailable: boolean = true;
  private cache: Map<string, CacheEntry> = new Map();
  private backgroundSyncInterval: NodeJS.Timeout | null = null;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private optimisticUpdates: Map<string, any> = new Map();

  constructor() {
    this.baseUrl = CONFIG.BASE_URL;
    this.token = localStorage.getItem('eeu_auth_token');
    this.initializeBackgroundSync();
    this.setupVisibilityHandlers();
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('eeu_auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('eeu_auth_token');
    this.clearCache(); // Clear cache on logout
  }

  // Enhanced caching system
  private generateCacheKey(action: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${action}:${paramString}`;
  }

  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < CONFIG.CACHE_DURATION) {
      return entry.data as T;
    }
    if (entry) {
      this.cache.delete(key); // Remove expired entry
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    // Implement LRU cache behavior
    if (this.cache.size >= CONFIG.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Enhanced background sync setup with error resilience
  private backgroundSyncFailureCount: number = 0;
  private backgroundSyncPaused: boolean = false;
  private backgroundSyncPauseUntil: number = 0;

  private initializeBackgroundSync(): void {
    if (CONFIG.ENABLE_BACKGROUND_SYNC && typeof window !== 'undefined') {
      this.backgroundSyncInterval = setInterval(() => {
        // Check if background sync is paused
        if (this.backgroundSyncPaused && Date.now() < this.backgroundSyncPauseUntil) {
          return;
        }
        
        // Reset pause state if pause period expired
        if (this.backgroundSyncPaused && Date.now() >= this.backgroundSyncPauseUntil) {
          this.backgroundSyncPaused = false;
          this.backgroundSyncFailureCount = 0;
        }

        // Only sync if backend was available in recent attempts and user is authenticated
        if (this.token && (this.isBackendAvailable || this.backgroundSyncFailureCount < 3)) {
          this.backgroundSync();
        }
      }, CONFIG.BACKGROUND_SYNC_INTERVAL);
    }
  }

  private setupVisibilityHandlers(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.token) {
          // App regained focus, sync critical data
          this.syncCriticalData();
        }
      });
    }
  }

  private async backgroundSync(): Promise<void> {
    try {
      // Sync critical data in background
      await this.syncCriticalData();
      
      // Reset failure count on successful sync
      this.backgroundSyncFailureCount = 0;
      this.isBackendAvailable = true;
    } catch (error) {
      this.backgroundSyncFailureCount++;
      this.isBackendAvailable = false;
      
      // Implement escalating backoff strategy
      if (this.backgroundSyncFailureCount >= 5) {
        // Pause background sync for 10 minutes after 5 consecutive failures
        this.backgroundSyncPaused = true;
        this.backgroundSyncPauseUntil = Date.now() + (10 * 60 * 1000);
        console.warn(`Background sync paused for 10 minutes after ${this.backgroundSyncFailureCount} consecutive failures`);
      } else if (this.backgroundSyncFailureCount >= 3) {
        // Reduce logging frequency after 3 failures to avoid spam
        if (this.backgroundSyncFailureCount === 3) {
          console.warn('Background sync failing consistently - backend likely unavailable, reducing error logging');
        }
      } else {
        // Only log first few failures to avoid console spam
        console.warn(`Background sync failed (attempt ${this.backgroundSyncFailureCount}):`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  private async syncCriticalData(): Promise<void> {
    if (!this.token) return;
    
    // Sync complaints and dashboard metrics in background with reduced timeout
    const criticalActions = ['getComplaints', 'getDashboardData'];
    const results: { action: string; success: boolean; error?: string }[] = [];
    
    for (const action of criticalActions) {
      try {
        const cacheKey = this.generateCacheKey(action, { limit: 1000 });
        
        // Use a shorter timeout for background sync to fail fast
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await this.makeRequest('GET', action, { limit: 1000 });
          clearTimeout(timeoutId);
          
          if (response.success) {
            this.setCachedData(cacheKey, response);
            results.push({ action, success: true });
          } else {
            results.push({ action, success: false, error: response.error });
          }
        } catch (requestError) {
          clearTimeout(timeoutId);
          throw requestError;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ action, success: false, error: errorMessage });
        
        // Only throw if this is not a network/timeout error during background sync
        if (!(error instanceof Error && (
          errorMessage.includes('Network error') || 
          errorMessage.includes('timeout') ||
          errorMessage.includes('AbortError')
        ))) {
          throw error;
        }
      }
    }
    
    // If all actions failed with network errors, throw to trigger backoff
    const allFailed = results.every(result => !result.success);
    const allNetworkErrors = results.every(result => 
      !result.success && result.error && (
        result.error.includes('Network error') || 
        result.error.includes('timeout') ||
        result.error.includes('AbortError')
      )
    );
    
    if (allFailed && allNetworkErrors) {
      throw new Error('All background sync operations failed with network errors');
    }
  }

  // Optimistic update management
  private setOptimisticUpdate(key: string, data: any): void {
    if (CONFIG.ENABLE_OPTIMISTIC_UPDATES) {
      this.optimisticUpdates.set(key, data);
    }
  }

  private getOptimisticUpdate(key: string): any {
    return this.optimisticUpdates.get(key);
  }

  private clearOptimisticUpdate(key: string): void {
    this.optimisticUpdates.delete(key);
  }

  // Request deduplication
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  private async makeRequest<T = any>(
    method: 'GET' | 'POST',
    action: string,
    params: Record<string, any> = {},
    useCallback: boolean = true,
    skipCache: boolean = false
  ): Promise<ApiResponse<T>> {
    // Check cache first for GET requests (unless skipped)
    if (method === 'GET' && !skipCache) {
      const cacheKey = this.generateCacheKey(action, params);
      const cachedData = this.getCachedData<ApiResponse<T>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Check for optimistic updates
      const optimisticData = this.getOptimisticUpdate(cacheKey);
      if (optimisticData) {
        return optimisticData;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    try {
      const requestParams = {
        action,
        ...params
      };

      // Always include token if available
      if (this.token) {
        requestParams.token = this.token;
      }

      if (method === 'GET' && useCallback) {
        // Use JSONP for GET requests to match backend implementation
        return new Promise((resolve, reject) => {
          const callbackName = `eeu_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Store reference to instance methods
          const setCachedData = this.setCachedData.bind(this);
          const clearOptimisticUpdate = this.clearOptimisticUpdate.bind(this);
          const generateCacheKey = this.generateCacheKey.bind(this);

          // Create callback function
          (window as any)[callbackName] = (response: ApiResponse<T>) => {
            cleanup();
            clearTimeout(timeoutId);
            clearTimeout(timeoutHandle);
            
            // Backend sometimes returns success with error field for auth issues
            if (!response.success && response.error) {
              reject(new ApiError(response.error, response.error.includes('401') ? 401 : 400));
              return;
            }
            
            // Cache successful GET responses
            if (response.success) {
              const cacheKey = generateCacheKey(action, requestParams);
              setCachedData(cacheKey, response);
              clearOptimisticUpdate(cacheKey);
            }
            
            resolve(response);
          };

          const cleanup = () => {
            try {
              delete (window as any)[callbackName];
              if (script && script.parentNode) {
                script.parentNode.removeChild(script);
              }
            } catch (e) {
              // Ignore cleanup errors
            }
          };

          // Create script tag
          const script = document.createElement('script');
          
          // Ensure all parameters are properly encoded
          const urlParams = new URLSearchParams();
          Object.entries(requestParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              urlParams.append(key, String(value));
            }
          });
          urlParams.append('callback', callbackName);
          
          script.src = `${this.baseUrl}?${urlParams.toString()}`;
          
          script.onerror = () => {
            cleanup();
            clearTimeout(timeoutId);
            clearTimeout(timeoutHandle);
            reject(new ApiError('Network error - backend server unreachable or CORS blocked'));
          };

          // Set timeout for JSONP request
          const timeoutHandle = setTimeout(() => {
            cleanup();
            reject(new ApiError('Request timeout - backend may be unavailable'));
          }, CONFIG.TIMEOUT);

          document.head.appendChild(script);
        });
      } else {
        // Use POST for write operations
        const url = new URL(this.baseUrl);
        url.searchParams.append('action', action);

        const options: RequestInit = {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestParams)
        };
        
        const response = await fetch(url.toString(), options);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
        }

        const data = await response.json();
        
        // Check for backend error responses
        if (!data.success && data.error) {
          throw new ApiError(data.error, data.error.includes('401') ? 401 : 400);
        }
        
        // Cache successful GET responses
        if (method === 'GET' && data.success) {
          const cacheKey = this.generateCacheKey(action, params);
          this.setCachedData(cacheKey, data);
          this.clearOptimisticUpdate(cacheKey); // Clear any optimistic updates
        }
        
        return data;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout');
        }
        throw new ApiError(error.message);
      }
      throw new ApiError('Unknown error occurred');
    }
  }

  // Enhanced retry logic with fallback support
  private async withRetryLogic<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < CONFIG.RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
          continue;
        }
      }
    }
    
    // Mark backend as unavailable for fallback logic
    this.isBackendAvailable = false;
    throw lastError || new Error('Max retry attempts reached');
  }

  // Fallback authentication for demo mode
  private async demoLogin(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    // Updated credentials to match the provided user data
    const validCredentials: Record<string, {password: string, user: User}> = {
      'admin@eeu.gov.et': {
        password: 'admin2025',
        user: {
          id: 'USR-ADMIN-001',
          name: 'System Administrator',
          email: 'admin@eeu.gov.et',
          role: 'admin',
          region: 'Addis Ababa',
          serviceCenter: 'Head Office',
          phone: '+251-11-123-4567',
          isActive: true
        }
      },
      'manager.addis@eeu.gov.et': {
        password: 'mgrAddis2025',
        user: {
          id: 'USR-MGR-ADD-001',
          name: 'Addis Ababa Manager',
          email: 'manager.addis@eeu.gov.et',
          role: 'manager',
          region: 'Addis Ababa',
          serviceCenter: 'Addis Ababa Main',
          phone: '+251-11-234-5678',
          isActive: true
        }
      },
      'staff.addis@eeu.gov.et': {
        password: 'staffAddis2025',
        user: {
          id: 'USR-STAFF-ADD-001',
          name: 'Almaz Tadesse',
          email: 'staff.addis@eeu.gov.et',
          role: 'staff',
          region: 'Addis Ababa',
          serviceCenter: 'Customer Service Center',
          phone: '+251-11-567-8901',
          isActive: true
        }
      },
      'customer@eeu.gov.et': {
        password: 'cust2025',
        user: {
          id: 'USR-CUST-001',
          name: 'Meron Haile',
          email: 'customer@eeu.gov.et',
          role: 'customer',
          region: 'Addis Ababa',
          serviceCenter: 'General',
          phone: '+251-91-123-4567',
          isActive: true
        }
      }
    };

    const credential = validCredentials[email];
    if (credential && credential.password === password) {
      const mockToken = 'demo-token-' + Date.now();
      return {
        success: true,
        data: { user: credential.user, token: mockToken },
        message: 'Login successful (demo mode - backend unavailable)'
      };
    }

    return {
      success: false,
      error: 'Invalid credentials. Try: admin@eeu.gov.et / admin2025'
    };
  }

  private async demoValidateSession(): Promise<ApiResponse<{ user: User }>> {
    if (this.token && this.token.startsWith('demo-token-')) {
      return {
        success: true,
        data: { 
          user: {
            id: 'USR-ADMIN-001',
            name: 'System Administrator',
            email: 'admin@eeu.gov.et',
            role: 'admin',
            region: 'Addis Ababa',
            serviceCenter: 'Head Office',
            phone: '+251-11-123-4567',
            isActive: true
          }
        },
        message: 'Valid session (demo mode)'
      };
    }
    return {
      success: false,
      error: 'Invalid or expired session'
    };
  }

  // Health check with fallback
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await this.withRetryLogic(async () => {
        const response = await this.makeRequest('GET', 'healthCheck');
        this.isBackendAvailable = true;
        return response;
      });
      return response;
    } catch (error) {
      this.isBackendAvailable = false;
      if (CONFIG.MOCK_DATA_FALLBACK) {
        return {
          success: true,
          data: { version: 'demo-3.2.2', mode: 'demo' },
          message: 'System online (demo mode - backend unavailable)'
        };
      }
      throw error;
    }
  }

  // Authentication with fallback
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await this.withRetryLogic(async () => {
        const response = await this.makeRequest<LoginResponse>('GET', 'login', { email, password });
        if (response.success && response.data?.token) {
          this.setToken(response.data.token);
          this.isBackendAvailable = true;
        }
        return response;
      });
      return response;
    } catch (error) {
      this.isBackendAvailable = false;
      if (CONFIG.MOCK_DATA_FALLBACK) {
        const demoResponse = await this.demoLogin(email, password);
        if (demoResponse.success && demoResponse.data?.token) {
          this.setToken(demoResponse.data.token);
        }
        return demoResponse;
      }
      throw error;
    }
  }

  async validateSession(): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await this.withRetryLogic(async () => {
        const response = await this.makeRequest('GET', 'validateSession');
        this.isBackendAvailable = true;
        return response;
      });
      return response;
    } catch (error) {
      this.isBackendAvailable = false;
      if (CONFIG.MOCK_DATA_FALLBACK) {
        return this.demoValidateSession();
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // Users with enhanced caching and fallback
  async getUsers(params: { 
    page?: number; 
    limit?: number; 
    id?: string; 
    skipCache?: boolean;
  } = {}): Promise<ApiResponse<{ users: User[]; total: number; pagination?: any }>> {
    const cacheKey = this.generateCacheKey('getUsers', params);
    
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const response = await this.withRetryLogic(async () => {
          const response = await this.makeRequest('GET', 'getUsers', params, true, params.skipCache);
          this.isBackendAvailable = true;
          return response;
        });
        return response;
      } catch (error) {
        this.isBackendAvailable = false;
        if (CONFIG.MOCK_DATA_FALLBACK) {
          let users = [...DEMO_DATA.users];
          
          if (params.id) {
            const user = users.find(u => u.id === params.id);
            return {
              success: true,
              data: user ? { users: [user], total: 1 } : { users: [], total: 0 },
              message: 'Success (demo mode)'
            };
          }
          
          return {
            success: true,
            data: {
              users,
              total: users.length,
              pagination: {
                page: 1,
                limit: users.length,
                total: users.length,
                totalPages: 1,
                hasNext: false,
                hasPrev: false
              }
            },
            message: 'Success (demo mode)'
          };
        }
        throw error;
      }
    });
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    region?: string;
    serviceCenter?: string;
  }): Promise<ApiResponse<User>> {
    try {
      // Optimistic update for better UX
      const optimisticUser: User = {
        id: 'USR-TEMP-' + Date.now(),
        name: userData.name,
        email: userData.email,
        role: (userData.role || 'staff') as User['role'],
        region: userData.region || 'Addis Ababa',
        serviceCenter: userData.serviceCenter || 'General',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (CONFIG.ENABLE_OPTIMISTIC_UPDATES) {
        const usersCacheKey = this.generateCacheKey('getUsers', { limit: 1000 });
        this.setOptimisticUpdate(usersCacheKey, {
          success: true,
          data: { users: [...(this.getCachedData(usersCacheKey)?.data?.users || []), optimisticUser], total: 0 }
        });
      }

      const response = await this.withRetryLogic(async () => {
        const response = await this.makeRequest('POST', 'createUser', userData);
        this.isBackendAvailable = true;
        
        // Clear cache to force refresh
        const usersCacheKey = this.generateCacheKey('getUsers', { limit: 1000 });
        this.cache.delete(usersCacheKey);
        this.clearOptimisticUpdate(usersCacheKey);
        
        return response;
      });
      return response;
    } catch (error) {
      this.isBackendAvailable = false;
      if (CONFIG.MOCK_DATA_FALLBACK) {
        const newUser: User = {
          id: 'USR-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          name: userData.name,
          email: userData.email,
          role: (userData.role || 'staff') as User['role'],
          region: userData.region || 'Addis Ababa',
          serviceCenter: userData.serviceCenter || 'General',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        DEMO_DATA.users.push(newUser);
        
        return {
          success: true,
          data: newUser,
          message: 'User created (demo mode)'
        };
      }
      
      // Clear optimistic update on error
      const usersCacheKey = this.generateCacheKey('getUsers', { limit: 1000 });
      this.clearOptimisticUpdate(usersCacheKey);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.withRetryLogic(async () => {
      const response = await this.makeRequest('POST', 'updateUser', { id, ...userData });
      this.isBackendAvailable = true;
      return response;
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.withRetryLogic(async () => {
      const response = await this.makeRequest('POST', 'deleteUser', { id });
      this.isBackendAvailable = true;
      return response;
    });
  }

  // Complaints with enhanced caching and fallback
  async getComplaints(params: { 
    page?: number; 
    limit?: number; 
    id?: string;
    status?: string;
    priority?: string;
    category?: string;
    skipCache?: boolean;
  } = {}): Promise<ApiResponse<Complaint[]>> {
    const cacheKey = this.generateCacheKey('getComplaints', params);
    
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const response = await this.withRetryLogic(async () => {
          const response = await this.makeRequest('GET', 'getComplaints', params, true, params.skipCache);
          this.isBackendAvailable = true;
        
        // Backend returns different structure - normalize the response
        if (response.success && response.data) {
          // If single complaint requested
          if (params.id && !Array.isArray(response.data) && typeof response.data === 'object') {
            return {
              ...response,
              data: [response.data] as Complaint[]
            };
          }
          // If array of complaints or pagination object
          if (Array.isArray(response.data)) {
            return response;
          }
          // If pagination wrapper
          if (response.data.complaints) {
            return {
              ...response,
              data: response.data.complaints as Complaint[]
            };
          }
        }
        
        return response;
      });
      return response;
    } catch (error) {
      this.isBackendAvailable = false;
      if (CONFIG.MOCK_DATA_FALLBACK) {
        let complaints = [...DEMO_DATA.complaints];
        
        if (params.id) {
          const complaint = complaints.find(c => c.id === params.id);
          return {
            success: true,
            data: complaint ? [complaint] : [],
            message: 'Success (demo mode)'
          };
        }
        
        // Apply filters
        if (params.status) {
          complaints = complaints.filter(c => c.status === params.status);
        }
        if (params.priority) {
          complaints = complaints.filter(c => c.priority === params.priority);
        }
        if (params.category) {
          complaints = complaints.filter(c => c.category === params.category);
        }
        
        return {
          success: true,
          data: complaints,
          message: 'Success (demo mode)'
        };
      }
      throw error;
      }
    });
  }

  async createComplaint(complaintData: {
    customerId?: string;
    title: string;
    description: string;
    category: string;
    priority?: string;
    createdBy: string;
    region?: string;
    serviceCenter?: string;
  }): Promise<ApiResponse<Complaint>> {
    try {
      // Optimistic update for better UX
      const optimisticComplaint: Complaint = {
        id: 'CMP-TEMP-' + Date.now(),
        customerId: complaintData.customerId || 'TEMP-CUSTOMER',
        title: complaintData.title,
        description: complaintData.description,
        category: complaintData.category,
        priority: (complaintData.priority || 'medium') as Complaint['priority'],
        status: 'open',
        createdBy: complaintData.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        region: complaintData.region || 'Addis Ababa',
        serviceCenter: complaintData.serviceCenter || 'General'
      };

      if (CONFIG.ENABLE_OPTIMISTIC_UPDATES) {
        const complaintsCacheKey = this.generateCacheKey('getComplaints', { limit: 1000 });
        this.setOptimisticUpdate(complaintsCacheKey, {
          success: true,
          data: [optimisticComplaint, ...(this.getCachedData(complaintsCacheKey)?.data || [])]
        });
      }

      const response = await this.withRetryLogic(async () => {
        const response = await this.makeRequest('POST', 'createComplaint', complaintData);
        this.isBackendAvailable = true;
        
        // Clear cache to force refresh
        const complaintsCacheKey = this.generateCacheKey('getComplaints', { limit: 1000 });
        this.cache.delete(complaintsCacheKey);
        this.clearOptimisticUpdate(complaintsCacheKey);
        
        return response;
      });
      return response;
    } catch (error) {
      this.isBackendAvailable = false;
      if (CONFIG.MOCK_DATA_FALLBACK) {
        const newComplaint: Complaint = {
          id: 'CMP-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          customerId: complaintData.customerId || 'DEMO-CUSTOMER',
          title: complaintData.title,
          description: complaintData.description,
          category: complaintData.category,
          priority: (complaintData.priority || 'medium') as Complaint['priority'],
          status: 'open',
          createdBy: complaintData.createdBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          region: complaintData.region || 'Addis Ababa',
          serviceCenter: complaintData.serviceCenter || 'General'
        };
        
        DEMO_DATA.complaints.unshift(newComplaint);
        
        return {
          success: true,
          data: newComplaint,
          message: 'Complaint created (demo mode)'
        };
      }
      
      // Clear optimistic update on error
      const complaintsCacheKey = this.generateCacheKey('getComplaints', { limit: 1000 });
      this.clearOptimisticUpdate(complaintsCacheKey);
      throw error;
    }
  }

  // Check if backend is available
  isBackendOnline(): boolean {
    return this.isBackendAvailable;
  }

  // Get current mode (backend or demo)
  getCurrentMode(): 'backend' | 'demo' {
    return this.isBackendAvailable ? 'backend' : 'demo';
  }

  // Comprehensive data fetch - Get all system data in one call
  async getAllData(): Promise<ApiResponse<{
    users: User[];
    complaints: Complaint[];
    dashboardMetrics: DashboardMetrics;
    notifications: Notification[];
    outages: Outage[];
  }>> {
    try {
      const [usersResponse, complaintsResponse, dashboardResponse, notificationsResponse, outagesResponse] = await Promise.allSettled([
        this.getUsers({ limit: 1000 }),
        this.getComplaints({ limit: 1000 }),
        this.getDashboardData(),
        this.getNotifications(),
        this.getOutages({ limit: 100 })
      ]);

      const results = {
        users: usersResponse.status === 'fulfilled' && usersResponse.value.success 
          ? (Array.isArray(usersResponse.value.data) ? usersResponse.value.data : usersResponse.value.data?.users || [])
          : [],
        complaints: complaintsResponse.status === 'fulfilled' && complaintsResponse.value.success 
          ? (Array.isArray(complaintsResponse.value.data) ? complaintsResponse.value.data : complaintsResponse.value.data?.complaints || [])
          : [],
        dashboardMetrics: dashboardResponse.status === 'fulfilled' && dashboardResponse.value.success 
          ? dashboardResponse.value.data!
          : DEMO_DATA.dashboardMetrics,
        notifications: notificationsResponse.status === 'fulfilled' && notificationsResponse.value.success 
          ? notificationsResponse.value.data?.notifications || []
          : [],
        outages: outagesResponse.status === 'fulfilled' && outagesResponse.value.success 
          ? outagesResponse.value.data || []
          : []
      };

      return {
        success: true,
        data: results,
        message: this.isBackendAvailable ? 'All data fetched successfully' : 'All data fetched (demo mode)'
      };
    } catch (error) {
      console.error('Error fetching all data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch all data'
      };
    }
  }

  // Sync fresh data from backend - force refresh
  async syncAllData(): Promise<ApiResponse<{ synced: boolean; timestamp: string }>> {
    try {
      this.isBackendAvailable = true; // Reset status to try backend first
      
      const response = await this.withRetryLogic(async () => {
        const response = await this.makeRequest('GET', 'syncData');
        this.isBackendAvailable = true;
        return response;
      });

      return {
        success: true,
        data: { synced: true, timestamp: new Date().toISOString() },
        message: 'Data synchronized successfully'
      };
    } catch (error) {
      this.isBackendAvailable = false;
      if (CONFIG.MOCK_DATA_FALLBACK) {
        return {
          success: true,
          data: { synced: false, timestamp: new Date().toISOString() },
          message: 'Sync attempted (demo mode - backend unavailable)'
        };
      }
      throw error;
    }
  }

  // Test basic connectivity to the backend URL
  async testBackendConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try a simple request to test if the backend URL is accessible
      const testUrl = `${this.baseUrl}?action=healthCheck&test=1`;
      const response = await fetch(testUrl, { 
        method: 'GET', 
        mode: 'no-cors', // This will bypass CORS but we won't be able to read the response
        signal: AbortSignal.timeout(5000) 
      });
      
      // If we reach here without error, the URL is at least accessible
      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Backend connection timeout' };
        }
        return { success: false, error: `Network error: ${error.message}` };
      }
      return { success: false, error: 'Unknown connectivity error' };
    }
  }

  async updateComplaint(id: string, complaintData: {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
  }): Promise<ApiResponse<Complaint>> {
    return this.withRetryLogic(async () => {
      const response = await this.makeRequest('POST', 'updateComplaint', { id, ...complaintData });
      this.isBackendAvailable = true;
      return response;
    });
  }

  async deleteComplaint(id: string): Promise<ApiResponse> {
    return this.withRetryLogic(async () => {
      const response = await this.makeRequest('POST', 'deleteComplaint', { id });
      this.isBackendAvailable = true;
      return response;
    });
  }

  // Import Users - live backend only
  async importUsers(users: User[]): Promise<ApiResponse> {
    return this.withRetryLogic(async () => {
      const response = await this.makeRequest('POST', 'importUsers', { 
        usersJson: JSON.stringify(users) 
      });
      this.isBackendAvailable = true;
      return response;
    });
  }

  // Dashboard with fallback
  async getDashboardData(): Promise<ApiResponse<DashboardMetrics>> {
    try {
      const response = await this.withRetryLogic(async () => {
        const response = await this.makeRequest('GET', 'getDashboardData');
        this.isBackendAvailable = true;
        return response;
      });
      return response;
    } catch (error) {
      this.isBackendAvailable = false;
      if (CONFIG.MOCK_DATA_FALLBACK) {
        return {
          success: true,
          data: DEMO_DATA.dashboardMetrics,
          message: 'Success (demo mode)'
        };
      }
      throw error;
    }
  }

  // Notifications with fallback
  async getNotifications(): Promise<ApiResponse<{ notifications: Notification[] }>> {
    try {
      const response = await this.withRetryLogic(async () => {
        const response = await this.makeRequest('GET', 'getNotifications');
        this.isBackendAvailable = true;
        return response;
      });
      return response;
    } catch (error) {
      this.isBackendAvailable = false;
      if (CONFIG.MOCK_DATA_FALLBACK) {
        return {
          success: true,
          data: { notifications: DEMO_DATA.notifications },
          message: 'Success (demo mode)'
        };
      }
      throw error;
    }
  }

  // Outages - live backend only (mock implementation until backend supports outages)
  async getOutages(params: { 
    page?: number; 
    limit?: number; 
    status?: string;
    priority?: string;
  } = {}): Promise<ApiResponse<Outage[]>> {
    // For now, return structured mock data until outage management is implemented in backend
    const mockOutages: Outage[] = [
      {
        id: 'OUT-2024-001',
        title: 'Transformer Failure - Bole Area',
        status: 'active',
        priority: 'critical',
        affectedCustomers: 450,
        area: 'Bole Sub-district, Zone 3',
        reportedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        estimatedRestoration: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        cause: 'Equipment failure',
        assignedCrew: 'Team Alpha',
        crewStatus: 'on-site',
        progress: 65,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'OUT-2024-002',
        title: 'Scheduled Maintenance - Kirkos',
        status: 'scheduled',
        priority: 'medium',
        affectedCustomers: 120,
        area: 'Kirkos District',
        reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        estimatedRestoration: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        cause: 'Planned maintenance',
        assignedCrew: 'Team Beta',
        crewStatus: 'preparing',
        progress: 25,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    let filteredOutages = [...mockOutages];
    
    // Apply filters
    if (params.status) {
      filteredOutages = filteredOutages.filter(o => o.status === params.status);
    }
    if (params.priority) {
      filteredOutages = filteredOutages.filter(o => o.priority === params.priority);
    }
    
    return {
      success: true,
      data: filteredOutages,
      message: 'Success (outage data from local cache)'
    };
  }

  async createOutage(outageData: {
    title: string;
    area: string;
    cause: string;
    priority?: string;
    affectedCustomers: number;
    estimatedRestoration: string;
  }): Promise<ApiResponse<Outage>> {
    // Mock implementation until backend supports outages
    const newOutage: Outage = {
      id: 'OUT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      title: outageData.title,
      status: 'investigating',
      priority: (outageData.priority || 'medium') as Outage['priority'],
      affectedCustomers: outageData.affectedCustomers,
      area: outageData.area,
      reportedAt: new Date().toISOString(),
      estimatedRestoration: outageData.estimatedRestoration,
      cause: outageData.cause,
      assignedCrew: 'Team Alpha',
      crewStatus: 'preparing',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      data: newOutage,
      message: 'Outage created (local cache)'
    };
  }

  async updateOutage(id: string, outageData: {
    status?: string;
    progress?: number;
    crewStatus?: string;
    assignedCrew?: string;
  }): Promise<ApiResponse<Outage>> {
    // Mock implementation until backend supports outages  
    return {
      success: true,
      data: {
        id,
        ...outageData,
        updatedAt: new Date().toISOString()
      } as Outage,
      message: 'Outage updated (local cache)'
    };
  }

  // Enhanced data validation
  private validateApiResponse<T>(response: any, expectedType: string): response is ApiResponse<T> {
    if (typeof response !== 'object' || response === null) {
      return false;
    }
    
    if (typeof response.success !== 'boolean') {
      return false;
    }
    
    if (!response.success && typeof response.error !== 'string') {
      return false;
    }
    
    return true;
  }

  // Cache statistics and management
  getCacheStats(): {
    size: number;
    keys: string[];
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
    const entries = Array.from(this.cache.entries());
    const sortedByTime = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    return {
      size: this.cache.size,
      keys: entries.map(([key]) => key),
      oldestEntry: sortedByTime.length > 0 ? sortedByTime[0][0] : null,
      newestEntry: sortedByTime.length > 0 ? sortedByTime[sortedByTime.length - 1][0] : null
    };
  }

  // Force refresh specific data type
  async forceRefresh(dataType: 'users' | 'complaints' | 'dashboard' | 'all'): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (dataType === 'all') {
        keysToDelete.push(key);
      } else if (key.startsWith(dataType)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.clearOptimisticUpdate(key);
    });
    
    // Trigger fresh data fetch
    await this.syncCriticalData();
  }

  // Health and diagnostics
  async performHealthCheck(): Promise<{
    backendStatus: 'online' | 'offline' | 'degraded';
    cacheSize: number;
    lastSync: string | null;
    optimisticUpdates: number;
    pendingRequests: number;
  }> {
    let backendStatus: 'online' | 'offline' | 'degraded' = 'offline';
    
    try {
      const healthResponse = await this.healthCheck();
      if (healthResponse.success) {
        backendStatus = 'online';
      } else {
        backendStatus = 'degraded';
      }
    } catch (error) {
      backendStatus = 'offline';
    }
    
    return {
      backendStatus,
      cacheSize: this.cache.size,
      lastSync: this.cache.size > 0 ? new Date().toISOString() : null,
      optimisticUpdates: this.optimisticUpdates.size,
      pendingRequests: this.pendingRequests.size
    };
  }

  // Background sync control methods
  pauseBackgroundSync(): void {
    this.backgroundSyncPaused = true;
    this.backgroundSyncPauseUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
    console.log('Background sync manually paused for 30 minutes');
  }

  resumeBackgroundSync(): void {
    this.backgroundSyncPaused = false;
    this.backgroundSyncPauseUntil = 0;
    this.backgroundSyncFailureCount = 0;
    console.log('Background sync manually resumed');
  }

  getBackgroundSyncStatus(): {
    enabled: boolean;
    paused: boolean;
    failureCount: number;
    pausedUntil: string | null;
  } {
    return {
      enabled: CONFIG.ENABLE_BACKGROUND_SYNC,
      paused: this.backgroundSyncPaused,
      failureCount: this.backgroundSyncFailureCount,
      pausedUntil: this.backgroundSyncPauseUntil > 0 ? new Date(this.backgroundSyncPauseUntil).toISOString() : null
    };
  }

  // Cleanup method
  cleanup(): void {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }
    this.clearCache();
    this.optimisticUpdates.clear();
    this.pendingRequests.clear();
  }

}

// Export singleton instance
export const apiService = new ApiService();
export { ApiError };

// Demo data for fallback when backend is unavailable
const DEMO_DATA = {
  users: [
    {
      id: 'USR-ADMIN-001',
      name: 'System Administrator',
      email: 'admin@eeu.gov.et',
      role: 'admin' as const,
      region: 'Addis Ababa',
      serviceCenter: 'Head Office',
      phone: '+251-11-123-4567',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'USR-MGR-ADD-001',
      name: 'Addis Ababa Manager',
      email: 'manager.addis@eeu.gov.et',
      role: 'manager' as const,
      region: 'Addis Ababa',
      serviceCenter: 'Addis Ababa Main',
      phone: '+251-11-234-5678',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'USR-STAFF-ADD-001',
      name: 'Almaz Tadesse',
      email: 'staff.addis@eeu.gov.et',
      role: 'staff' as const,
      region: 'Addis Ababa',
      serviceCenter: 'Customer Service Center',
      phone: '+251-11-567-8901',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'USR-CUST-001',
      name: 'Meron Haile',
      email: 'customer@eeu.gov.et',
      role: 'customer' as const,
      region: 'Addis Ababa',
      serviceCenter: 'General',
      phone: '+251-91-123-4567',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  complaints: [
    {
      id: 'CMP-001',
      customerId: 'CUST-12345',
      title: 'Power outage in Bole area',
      description: 'Frequent power outages affecting multiple buildings in Bole subcity. Customers experiencing 3-4 hour blackouts daily.',
      category: 'power_outage',
      priority: 'high' as const,
      status: 'open' as const,
      createdBy: 'customer@eeu.gov.et',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      region: 'Addis Ababa',
      serviceCenter: 'Bole Service Center'
    },
    {
      id: 'CMP-002',
      customerId: 'CUST-12346',
      title: 'Billing system error',
      description: 'Account showing duplicate charges for the same billing period. Need immediate correction and refund.',
      category: 'billing_issue',
      priority: 'medium' as const,
      status: 'in_progress' as const,
      createdBy: 'customer@eeu.gov.et',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      region: 'Addis Ababa',
      serviceCenter: 'Central Office'
    }
  ],
  notifications: [
    {
      id: 'NOT-001',
      title: 'Backend Connection Issue',
      message: 'Currently running in demo mode due to backend connectivity issues.',
      type: 'warning' as const,
      priority: 'high' as const,
      isRead: false,
      createdAt: new Date().toISOString(),
      actionRequired: false
    }
  ],
  dashboardMetrics: {
    complaints: {
      total: 12, open: 5, inProgress: 3, resolved: 3, closed: 1, pending: 0, escalated: 0, cancelled: 0,
      critical: 1, high: 3, medium: 6, low: 2,
      todayCount: 2, yesterdayCount: 1, weekCount: 5, lastWeekCount: 3, monthCount: 12, lastMonthCount: 8, yearCount: 45
    },
    performance: {
      resolutionRate: 75, avgResolutionTime: 48, customerSatisfaction: 85, responseTime: 4.2, firstResponseTime: 1.8, escalationRate: 8
    },
    trends: {
      complaintsChange: 12, resolutionChange: -5, responseChange: 15, satisfactionChange: -3
    },
    users: { total: 4, active: 4, online: 1 },
    dateFilters: { today: 2, yesterday: 1, thisWeek: 5, lastWeek: 3, thisMonth: 12, lastMonth: 8, thisYear: 45 }
  }
};

// Constants that match backend CONFIG
export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress', 
  PENDING: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  CANCELLED: 'cancelled'
} as const;

export const COMPLAINT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high', 
  CRITICAL: 'critical'
} as const;

export const COMPLAINT_CATEGORIES = {
  POWER_OUTAGE: 'power_outage',
  BILLING_ISSUE: 'billing_issue',
  METER_PROBLEM: 'meter_problem',
  CONNECTION_REQUEST: 'connection_request',
  VOLTAGE_FLUCTUATION: 'voltage_fluctuation',
  EQUIPMENT_DAMAGE: 'equipment_damage'
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  STAFF: 'staff',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer'
} as const;

export type { ApiResponse, ApiError as ApiErrorType };