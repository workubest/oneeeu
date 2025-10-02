import React, { useState } from 'react';
import { 
  Zap, Globe, Wifi, WifiOff, Search, Bell, BarChart3, 
  Smartphone, Shield, RefreshCw, Download, Settings 
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useLanguage } from '../hooks/useLanguage';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { AdvancedSearch } from './AdvancedSearch';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { NotificationCenter } from './NotificationCenter';
import type { Notification } from '../services/api';

interface FeatureShowcaseProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function FeatureShowcase({ onNavigate }: FeatureShowcaseProps) {
  const { t, currentLanguage, setLanguage } = useLanguage();
  const performanceMonitor = usePerformanceMonitor('FeatureShowcase', true);
  const [selectedFeature, setSelectedFeature] = useState('performance');
  const [demoNotifications, setDemoNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'System Performance Update',
      message: 'Application performance has been optimized with new caching system.',
      type: 'success',
      priority: 'medium',
      category: 'system',
      timestamp: new Date(),
      isRead: false
    },
    {
      id: '2',
      title: 'Offline Mode Activated',
      message: 'Your changes are being saved locally and will sync when connection is restored.',
      type: 'info',
      priority: 'high',
      category: 'system',
      timestamp: new Date(),
      isRead: false
    }
  ]);

  const features = [
    {
      id: 'performance',
      title: 'Performance Monitoring',
      description: 'Real-time application performance tracking and optimization',
      icon: Zap,
      color: 'orange',
      capabilities: [
        'Real-time render performance tracking',
        'Memory usage monitoring',
        'Component re-render optimization',
        'Async operation measurement',
        'Performance scoring system'
      ]
    },
    {
      id: 'multilingual',
      title: 'Multi-language Support',
      description: 'English and Amharic language support with cultural formatting',
      icon: Globe,
      color: 'blue',
      capabilities: [
        'English and Amharic translations',
        'Cultural date/time formatting',
        'Number and currency localization',
        'Right-to-left text support ready',
        'Dynamic language switching'
      ]
    },
    {
      id: 'offline',
      title: 'Offline Support',
      description: 'Continue working without internet with smart synchronization',
      icon: WifiOff,
      color: 'green',
      capabilities: [
        'Offline data storage',
        'Queue pending actions',
        'Smart synchronization',
        'Conflict resolution',
        'Export/import offline data'
      ]
    },
    {
      id: 'search',
      title: 'Advanced Search',
      description: 'Powerful search with filters, facets, and saved searches',
      icon: Search,
      color: 'purple',
      capabilities: [
        'Multi-field search capabilities',
        'Advanced filtering options',
        'Search result faceting',
        'Saved search patterns',
        'Real-time search suggestions'
      ]
    },
    {
      id: 'notifications',
      title: 'Smart Notifications',
      description: 'Real-time notifications with multiple delivery channels',
      icon: Bell,
      color: 'red',
      capabilities: [
        'In-app notification center',
        'Browser push notifications',
        'Sound alerts for urgent items',
        'Notification categorization',
        'Bulk notification management'
      ]
    },
    {
      id: 'analytics',
      title: 'Advanced Analytics',
      description: 'Comprehensive insights and interactive dashboards',
      icon: BarChart3,
      color: 'indigo',
      capabilities: [
        'Interactive chart visualizations',
        'Real-time metrics tracking',
        'Performance trend analysis',
        'Regional data breakdown',
        'Export capabilities'
      ]
    }
  ];

  const performanceMetrics = performanceMonitor.getMetricsSummary();

  const handleDemoSearch = async (criteria: any) => {
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      items: [
        { id: 1, title: 'Power Outage Report', type: 'complaint', status: 'open' },
        { id: 2, title: 'Billing Issue Resolution', type: 'complaint', status: 'resolved' },
        { id: 3, title: 'Service Request Update', type: 'request', status: 'pending' }
      ],
      total: 3,
      hasMore: false
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          🚀 Enhanced EEU CMS Features
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Experience the next generation of complaint management with advanced performance monitoring, 
          multi-language support, offline capabilities, and intelligent analytics.
        </p>
      </div>

      {/* Performance Stats Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Performance: {performanceMetrics.performanceScore}
            </Badge>
            <Badge variant="outline">
              Language: {currentLanguage === 'en' ? 'English' : 'አማርኛ'}
            </Badge>
            <Badge variant="outline">
              Renders: {performanceMonitor.reRenderCount}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(currentLanguage === 'en' ? 'am' : 'en')}
            >
              <Globe className="w-4 h-4 mr-1" />
              {currentLanguage === 'en' ? 'አማርኛ' : 'English'}
            </Button>
            <NotificationCenter
              notifications={demoNotifications}
              onMarkAsRead={(id) => {
                setDemoNotifications(prev => 
                  prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
              }}
              onMarkAllAsRead={() => {
                setDemoNotifications(prev => 
                  prev.map(n => ({ ...n, isRead: true }))
                );
              }}
              onDelete={(id) => {
                setDemoNotifications(prev => prev.filter(n => n.id !== id));
              }}
              onClearAll={() => setDemoNotifications([])}
            />
          </div>
        </div>
      </Card>

      <Tabs value={selectedFeature} onValueChange={setSelectedFeature}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {features.map(feature => (
            <TabsTrigger key={feature.id} value={feature.id} className="text-xs">
              <feature.icon className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{feature.title.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {features.map(feature => (
          <TabsContent key={feature.id} value={feature.id} className="space-y-4">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full bg-${feature.color}-100`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Key Capabilities:</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {feature.capabilities.map((capability, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className={`w-2 h-2 rounded-full bg-${feature.color}-500`} />
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Feature-specific demos */}
            {feature.id === 'search' && (
              <Card className="p-6">
                <h4 className="font-medium mb-4">Advanced Search Demo</h4>
                <AdvancedSearch
                  placeholder="Search complaints, users, or outages..."
                  filters={[
                    {
                      id: 'status',
                      label: 'Status',
                      type: 'select',
                      options: [
                        { value: 'open', label: 'Open' },
                        { value: 'in-progress', label: 'In Progress' },
                        { value: 'resolved', label: 'Resolved' }
                      ]
                    },
                    {
                      id: 'priority',
                      label: 'Priority',
                      type: 'multiselect',
                      options: [
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'urgent', label: 'Urgent' }
                      ]
                    },
                    {
                      id: 'dateCreated',
                      label: 'Date Created',
                      type: 'date'
                    }
                  ]}
                  sortOptions={[
                    { value: 'created', label: 'Date Created' },
                    { value: 'updated', label: 'Last Updated' },
                    { value: 'priority', label: 'Priority' }
                  ]}
                  onSearch={handleDemoSearch}
                  enableSavedSearches={true}
                  showFacets={true}
                />
              </Card>
            )}

            {feature.id === 'analytics' && (
              <AnalyticsDashboard
                isLoading={false}
                onRefresh={() => console.log('Refreshing analytics...')}
                onExport={(format) => console.log(`Exporting as ${format}...`)}
                timeRange="7d"
                onTimeRangeChange={(range) => console.log(`Time range changed to ${range}`)}
              />
            )}

            {feature.id === 'performance' && (
              <Card className="p-6">
                <h4 className="font-medium mb-4">Real-time Performance Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-orange-600 text-sm font-medium">Avg Render Time</div>
                    <div className="text-2xl font-bold text-orange-700">
                      {performanceMetrics.avgRenderTime.toFixed(1)}ms
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-blue-600 text-sm font-medium">Total Re-renders</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {performanceMetrics.totalReRenders}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-green-600 text-sm font-medium">Memory Usage</div>
                    <div className="text-2xl font-bold text-green-700">
                      {(performanceMetrics.memoryDelta / 1024 / 1024).toFixed(1)}MB
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-purple-600 text-sm font-medium">Performance Score</div>
                    <div className="text-2xl font-bold text-purple-700 capitalize">
                      {performanceMetrics.performanceScore}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {feature.id === 'multilingual' && (
              <Card className="p-6">
                <h4 className="font-medium mb-4">Language Support Demo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Sample Translations</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dashboard:</span>
                        <span className="font-medium">{t('dashboard.title')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Complaints:</span>
                        <span className="font-medium">{t('complaints.title')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Settings:</span>
                        <span className="font-medium">{t('settings.title')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Loading:</span>
                        <span className="font-medium">{t('common.loading')}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Formatted Content</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{new Date().toLocaleDateString(currentLanguage === 'am' ? 'am-ET' : 'en-US')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Number:</span>
                        <span className="font-medium">{(1234.56).toLocaleString(currentLanguage === 'am' ? 'am-ET' : 'en-US')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Currency:</span>
                        <span className="font-medium">{(999.99).toLocaleString(currentLanguage === 'am' ? 'am-ET' : 'en-US', { style: 'currency', currency: 'ETB' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Call to Action */}
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Ready to Experience the Enhanced EEU CMS?
          </h3>
          <p className="text-gray-600">
            All these features are now integrated into your Ethiopian Electric Utility 
            complaint management system for improved performance and user experience.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => onNavigate?.('dashboard')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Configure Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}