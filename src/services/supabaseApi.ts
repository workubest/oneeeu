// EEU Complaint Management System - Supabase API Service
// Enhanced backend with real-time capabilities and better scalability

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const CONFIG = {
  BASE_URL: `https://${projectId}.supabase.co/functions/v1/make-server-3ab915fe`,
  SUPABASE_URL: `https://${projectId}.supabase.co`,
  SUPABASE_ANON_KEY: publicAnonKey,
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  VERSION: '3.3.0-supabase',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  BACKGROUND_SYNC_INTERVAL: 2 * 60 * 1000, // 2 minutes
  ENABLE_REAL_TIME: true,
  ENABLE_OPTIMISTIC_UPDATES: true,
  ENABLE_BACKGROUND_SYNC: true
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

export class SupabaseApiService {
  private baseUrl: string;
  private token: string | null = null;
  private supabase: any;
  private cache: Map<string, CacheEntry> = new Map();
  private backgroundSyncInterval: NodeJS.Timeout | null = null;
  private isBackendOnline: boolean = true;
  private realTimeSubscriptions: Map<string, any> = new Map();
  
  constructor() {
    this.baseUrl = CONFIG.BASE_URL;
    this.token = localStorage.getItem('eeu_auth_token');
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    this.initializeBackgroundSync();
    this.setupRealtimeSubscriptions();
  }

  // API service getters
  getBaseUrl(): string {
    return this.baseUrl;
  }

  getToken(): string | null {
    return this.token;
  }

  // Token management
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('eeu_auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('eeu_auth_token');
    this.clearCache();
    this.cleanupSubscriptions();
  }

  // Cache management
  private generateCacheKey(endpoint: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${endpoint}:${paramString}`;
  }

  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < CONFIG.CACHE_DURATION) {
      return entry.data as T;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Real-time subscriptions
  private setupRealtimeSubscriptions(): void {
    if (!CONFIG.ENABLE_REAL_TIME) return;
    
    // Subscribe to complaints changes
    const complaintsSubscription = this.supabase
      .channel('complaints-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'complaints' },
        (payload: any) => {
          console.log('Real-time complaint update:', payload);
          this.invalidateCache('complaints');
          // Emit custom event for components to listen to
          window.dispatchEvent(new CustomEvent('complaints-updated', { detail: payload }));
        }
      )
      .subscribe();

    this.realTimeSubscriptions.set('complaints', complaintsSubscription);
  }

  private cleanupSubscriptions(): void {
    this.realTimeSubscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
      this.realTimeSubscriptions.delete(key);
    });
  }

  private invalidateCache(prefix: string): void {
    Array.from(this.cache.keys())
      .filter(key => key.startsWith(prefix))
      .forEach(key => this.cache.delete(key));
  }

  // Background sync
  private initializeBackgroundSync(): void {
    if (CONFIG.ENABLE_BACKGROUND_SYNC && typeof window !== 'undefined') {
      this.backgroundSyncInterval = setInterval(() => {
        if (this.token && this.isBackendOnline) {
          this.backgroundSync();
        }
      }, CONFIG.BACKGROUND_SYNC_INTERVAL);
    }
  }

  private async backgroundSync(): Promise<void> {
    try {
      // Sync critical data silently
      await Promise.allSettled([
        this.getComplaints({ limit: 1000 }),
        this.getDashboardData()
      ]);
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }

  // HTTP request handling
  private async makePublicRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      };

      console.log('🌐 Making public request to:', endpoint);

      const options: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      let url = `${this.baseUrl}/${endpoint}`;

      if (method === 'GET' && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        url += `?${searchParams.toString()}`;
      } else if (method !== 'GET') {
        options.body = JSON.stringify(params);
      }

      console.log('🌐 Public request URL:', url);
      console.log('🌐 Public request options:', { ...options, signal: '[AbortSignal]' });

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      console.log('🌐 Public request response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🌐 Public request failed:', response.status, errorText);
        throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
      }

      const data = await response.json();
      console.log('🌐 Public request success:', data);
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      console.error('🌐 Public request error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      
      throw error;
    }
  }

  private async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    params: Record<string, any> = {},
    skipCache: boolean = false
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.generateCacheKey(endpoint, params);
    
    // Check cache for GET requests
    if (method === 'GET' && !skipCache) {
      const cachedData = this.getCachedData<ApiResponse<T>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const options: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      let url = `${this.baseUrl}/${endpoint}`;

      if (method === 'GET' && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        url += `?${searchParams.toString()}`;
      } else if (method !== 'GET') {
        options.body = JSON.stringify(params);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
      }

      const data = await response.json();
      this.isBackendOnline = true;

      // Cache successful GET responses
      if (method === 'GET' && data.success) {
        this.setCachedData(cacheKey, data);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      this.isBackendOnline = false;
      
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

  // Retry logic
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
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
    
    throw lastError || new Error('Max retry attempts reached');
  }

  // API methods
  async healthCheck(): Promise<ApiResponse> {
    return this.withRetry(() => this.makeRequest('GET', 'health'));
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.withRetry(() => 
      this.makeRequest<LoginResponse>('POST', 'login', { email, password })
    );
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async signup(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    region?: string;
    serviceCenter?: string;
  }): Promise<ApiResponse<User>> {
    return this.withRetry(() => this.makeRequest('POST', 'signup', userData));
  }

  async setupAdmin(adminData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    region?: string;
    serviceCenter?: string;
  }): Promise<ApiResponse<{ user: User; message: string }>> {
    return this.withRetry(() => this.makePublicRequest('POST', 'setup-admin', adminData));
  }

  async checkUsersExist(): Promise<ApiResponse<{ usersExist: boolean; userCount: number; needsSetup: boolean }>> {
    return this.withRetry(() => this.makePublicRequest('GET', 'check-users'));
  }

  async testDebugEndpoint(): Promise<ApiResponse<any>> {
    return this.withRetry(() => this.makePublicRequest('GET', 'debug'));
  }

  async validateSession(): Promise<ApiResponse<{ user: User }>> {
    return this.withRetry(() => this.makeRequest('GET', 'validate-session'));
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  async getUsers(params: { 
    page?: number; 
    limit?: number; 
    id?: string; 
    skipCache?: boolean;
  } = {}): Promise<ApiResponse<{ users: User[]; total: number; pagination?: any }>> {
    return this.withRetry(() => 
      this.makeRequest('GET', 'users', params, params.skipCache)
    );
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    region?: string;
    serviceCenter?: string;
  }): Promise<ApiResponse<User>> {
    const response = await this.withRetry(() => 
      this.makeRequest('POST', 'users', userData)
    );
    
    // Invalidate users cache
    this.invalidateCache('users');
    
    return response;
  }

  async updateUser(id: string, updateData: {
    name?: string;
    email?: string;
    role?: string;
    region?: string;
    serviceCenter?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<User>> {
    const response = await this.withRetry(() => 
      this.makeRequest('PUT', `users/${id}`, updateData)
    );
    
    // Invalidate users cache
    this.invalidateCache('users');
    
    return response;
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const response = await this.withRetry(() => 
      this.makeRequest('DELETE', `users/${id}`)
    );
    
    // Invalidate users cache
    this.invalidateCache('users');
    
    return response;
  }

  async getComplaints(params: { 
    page?: number; 
    limit?: number; 
    status?: string;
    priority?: string;
    skipCache?: boolean;
  } = {}): Promise<ApiResponse<{ complaints: Complaint[]; total: number }>> {
    return this.withRetry(() => 
      this.makeRequest('GET', 'complaints', params, params.skipCache)
    );
  }

  async createComplaint(complaintData: {
    title: string;
    description: string;
    category: string;
    priority?: string;
  }): Promise<ApiResponse<Complaint>> {
    const response = await this.withRetry(() => 
      this.makeRequest('POST', 'complaints', complaintData)
    );
    
    // Invalidate complaints cache
    this.invalidateCache('complaints');
    this.invalidateCache('dashboard');
    
    return response;
  }

  async updateComplaint(id: string, updateData: {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
    assignedTo?: string;
  }): Promise<ApiResponse<Complaint>> {
    const response = await this.withRetry(() => 
      this.makeRequest('PUT', `complaints/${id}`, updateData)
    );
    
    // Invalidate complaints cache
    this.invalidateCache('complaints');
    this.invalidateCache('dashboard');
    
    return response;
  }

  async deleteComplaint(id: string): Promise<ApiResponse> {
    const response = await this.withRetry(() => 
      this.makeRequest('DELETE', `complaints/${id}`)
    );
    
    // Invalidate complaints cache
    this.invalidateCache('complaints');
    this.invalidateCache('dashboard');
    
    return response;
  }

  async getComplaint(id: string): Promise<ApiResponse<Complaint>> {
    return this.withRetry(() => this.makeRequest('GET', `complaints/${id}`));
  }

  async getDashboardData(): Promise<ApiResponse<DashboardMetrics>> {
    return this.withRetry(() => this.makeRequest('GET', 'dashboard'));
  }

  async getNotifications(): Promise<ApiResponse<{ notifications: Notification[]; total: number }>> {
    return this.withRetry(() => this.makeRequest('GET', 'notifications'));
  }

  async createNotification(notificationData: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    relatedComplaintId?: string;
    actionRequired?: boolean;
  }): Promise<ApiResponse<Notification>> {
    const response = await this.withRetry(() => 
      this.makeRequest('POST', 'notifications', notificationData)
    );
    
    // Invalidate notifications cache
    this.invalidateCache('notifications');
    
    return response;
  }

  async updateNotification(id: string, updateData: {
    isRead?: boolean;
  }): Promise<ApiResponse<Notification>> {
    const response = await this.withRetry(() => 
      this.makeRequest('PUT', `notifications/${id}`, updateData)
    );
    
    // Invalidate notifications cache
    this.invalidateCache('notifications');
    
    return response;
  }

  async deleteNotification(id: string): Promise<ApiResponse> {
    const response = await this.withRetry(() => 
      this.makeRequest('DELETE', `notifications/${id}`)
    );
    
    // Invalidate notifications cache
    this.invalidateCache('notifications');
    
    return response;
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<Notification>> {
    return this.updateNotification(id, { isRead: true });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    try {
      // Get all unread notifications first
      const notificationsRes = await this.getNotifications();
      if (!notificationsRes.success || !notificationsRes.data?.notifications) {
        return { success: false, error: 'Failed to fetch notifications' };
      }

      const unreadNotifications = notificationsRes.data.notifications.filter(n => !n.isRead);
      
      // Mark each as read
      const markReadPromises = unreadNotifications.map(notification =>
        this.updateNotification(notification.id, { isRead: true })
      );

      await Promise.allSettled(markReadPromises);

      return { success: true, message: 'All notifications marked as read' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read' 
      };
    }
  }

  async getOutages(params: { limit?: number } = {}): Promise<ApiResponse<Outage[]>> {
    return this.withRetry(() => this.makeRequest('GET', 'outages', params));
  }

  async createOutage(outageData: {
    title: string;
    status?: string;
    priority?: string;
    affectedCustomers?: number;
    area: string;
    cause: string;
    assignedCrew?: string;
    estimatedRestoration?: string;
  }): Promise<ApiResponse<Outage>> {
    const response = await this.withRetry(() => 
      this.makeRequest('POST', 'outages', outageData)
    );
    
    // Invalidate outages cache
    this.invalidateCache('outages');
    this.invalidateCache('dashboard');
    
    return response;
  }

  async updateOutage(id: string, updateData: {
    title?: string;
    status?: string;
    priority?: string;
    affectedCustomers?: number;
    area?: string;
    cause?: string;
    assignedCrew?: string;
    crewStatus?: string;
    progress?: number;
    estimatedRestoration?: string;
  }): Promise<ApiResponse<Outage>> {
    const response = await this.withRetry(() => 
      this.makeRequest('PUT', `outages/${id}`, updateData)
    );
    
    // Invalidate outages cache
    this.invalidateCache('outages');
    this.invalidateCache('dashboard');
    
    return response;
  }

  async deleteOutage(id: string): Promise<ApiResponse> {
    const response = await this.withRetry(() => 
      this.makeRequest('DELETE', `outages/${id}`)
    );
    
    // Invalidate outages cache
    this.invalidateCache('outages');
    this.invalidateCache('dashboard');
    
    return response;
  }

  // Compatibility methods for existing frontend
  async getAllData(): Promise<ApiResponse<{
    users: User[];
    complaints: Complaint[];
    dashboardMetrics: DashboardMetrics;
    notifications: Notification[];
    outages: Outage[];
  }>> {
    try {
      const [usersRes, complaintsRes, dashboardRes, notificationsRes, outagesRes] = await Promise.all([
        this.getUsers({ limit: 1000 }),
        this.getComplaints({ limit: 1000 }),
        this.getDashboardData(),
        this.getNotifications(),
        this.getOutages({ limit: 100 })
      ]);

      if (!usersRes.success || !complaintsRes.success || !dashboardRes.success) {
        throw new Error('Failed to fetch some data');
      }

      return {
        success: true,
        data: {
          users: usersRes.data?.users || [],
          complaints: complaintsRes.data?.complaints || [],
          dashboardMetrics: dashboardRes.data!,
          notifications: notificationsRes.data?.notifications || [],
          outages: outagesRes.data || []
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      };
    }
  }

  async syncAllData(): Promise<void> {
    this.clearCache();
    await this.backgroundSync();
  }

  async forceRefresh(dataType: string): Promise<void> {
    this.invalidateCache(dataType);
  }

  async performHealthCheck(): Promise<{
    backendStatus: 'online' | 'offline' | 'degraded';
    cacheSize: number;
    lastSync: string;
  }> {
    try {
      await this.healthCheck();
      return {
        backendStatus: 'online',
        cacheSize: this.cache.size,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      return {
        backendStatus: 'offline',
        cacheSize: this.cache.size,
        lastSync: new Date().toISOString()
      };
    }
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  getBackendOnlineStatus(): boolean {
    return this.isBackendOnline;
  }

  getBackgroundSyncStatus(): {
    enabled: boolean;
    paused: boolean;
    failureCount: number;
    pausedUntil: string | null;
  } {
    return {
      enabled: CONFIG.ENABLE_BACKGROUND_SYNC,
      paused: false,
      failureCount: 0,
      pausedUntil: null
    };
  }

  pauseBackgroundSync(): void {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }
  }

  resumeBackgroundSync(): void {
    if (!this.backgroundSyncInterval) {
      this.initializeBackgroundSync();
    }
  }

  // Real-time event subscription
  onComplaintsUpdate(callback: (payload: any) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('complaints-updated', handler as EventListener);
    
    return () => {
      window.removeEventListener('complaints-updated', handler as EventListener);
    };
  }

  // Cleanup
  destroy(): void {
    this.pauseBackgroundSync();
    this.cleanupSubscriptions();
    this.clearCache();
  }
}

export const supabaseApiService = new SupabaseApiService();