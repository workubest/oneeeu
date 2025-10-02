import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Users, MessageSquare, Zap, Clock, 
  BarChart3, PieChart, Activity, MapPin, Calendar, Filter,
  Download, Share, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface AnalyticsData {
  totalComplaints: number;
  activeComplaints: number;
  resolvedComplaints: number;
  averageResolutionTime: number;
  outages: number;
  activeUsers: number;
  responseRate: number;
  customerSatisfaction: number;
  trends: {
    date: string;
    complaints: number;
    resolutions: number;
    outages: number;
  }[];
  categoriesData: {
    category: string;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  regionsData: {
    region: string;
    complaints: number;
    outages: number;
    users: number;
  }[];
  performanceMetrics: {
    firstResponseTime: number;
    resolutionAccuracy: number;
    reopenRate: number;
    escalationRate: number;
  };
}

interface AnalyticsDashboardProps {
  data?: AnalyticsData;
  onRefresh?: () => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  isLoading?: boolean;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AnalyticsDashboard({
  data,
  onRefresh,
  onExport,
  isLoading = false,
  timeRange = '7d',
  onTimeRangeChange
}: AnalyticsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showDetails, setShowDetails] = useState<string[]>(['overview']);

  // Mock data if none provided
  const analyticsData = useMemo<AnalyticsData>(() => {
    if (data) return data;
    
    return {
      totalComplaints: 1247,
      activeComplaints: 89,
      resolvedComplaints: 1158,
      averageResolutionTime: 2.3,
      outages: 12,
      activeUsers: 156,
      responseRate: 94.5,
      customerSatisfaction: 87.2,
      trends: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        complaints: Math.floor(Math.random() * 50) + 20,
        resolutions: Math.floor(Math.random() * 45) + 15,
        outages: Math.floor(Math.random() * 5)
      })),
      categoriesData: [
        { category: 'Power Outage', count: 456, percentage: 36.6, trend: 'up' },
        { category: 'Billing Issue', count: 312, percentage: 25.0, trend: 'down' },
        { category: 'Service Request', count: 234, percentage: 18.8, trend: 'stable' },
        { category: 'Technical Issue', count: 156, percentage: 12.5, trend: 'up' },
        { category: 'Maintenance', count: 89, percentage: 7.1, trend: 'stable' }
      ],
      regionsData: [
        { region: 'Addis Ababa', complaints: 423, outages: 5, users: 45 },
        { region: 'Amhara', complaints: 298, outages: 3, users: 32 },
        { region: 'Oromia', complaints: 345, outages: 4, users: 38 },
        { region: 'Tigray', complaints: 181, outages: 0, users: 21 },
        { region: 'SNNPR', complaints: 156, outages: 2, users: 20 }
      ],
      performanceMetrics: {
        firstResponseTime: 1.2,
        resolutionAccuracy: 92.8,
        reopenRate: 5.4,
        escalationRate: 12.3
      }
    };
  }, [data]);

  const toggleDetails = (section: string) => {
    setShowDetails(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    return `${(hours / 24).toFixed(1)}d`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendValue,
    color = "orange" 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<any>;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    color?: string;
  }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
      {trend && trendValue && (
        <div className="mt-4 flex items-center">
          {getTrendIcon(trend)}
          <span className={`ml-1 text-sm ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trendValue}
          </span>
          <span className="text-sm text-gray-500 ml-1">vs last period</span>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into system performance and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Select onValueChange={(format) => onExport?.(format as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">Export PDF</SelectItem>
              <SelectItem value="excel">Export Excel</SelectItem>
              <SelectItem value="csv">Export CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="regional">Regional</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Complaints"
              value={analyticsData.totalComplaints.toLocaleString()}
              icon={MessageSquare}
              trend="up"
              trendValue="+12.5%"
              color="orange"
            />
            <StatCard
              title="Active Complaints"
              value={analyticsData.activeComplaints}
              subtitle={`${((analyticsData.activeComplaints / analyticsData.totalComplaints) * 100).toFixed(1)}% of total`}
              icon={Activity}
              trend="down"
              trendValue="-3.2%"
              color="blue"
            />
            <StatCard
              title="Resolution Rate"
              value={`${((analyticsData.resolvedComplaints / analyticsData.totalComplaints) * 100).toFixed(1)}%`}
              icon={TrendingUp}
              trend="up"
              trendValue="+2.1%"
              color="green"
            />
            <StatCard
              title="Avg Resolution Time"
              value={formatDuration(analyticsData.averageResolutionTime)}
              icon={Clock}
              trend="down"
              trendValue="-15min"
              color="purple"
            />
          </div>

          {/* Complaint Categories */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Complaint Categories</h3>
              <button
                onClick={() => toggleDetails('categories')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {showDetails.includes('categories') ? 
                  <EyeOff className="w-4 h-4" /> : 
                  <Eye className="w-4 h-4" />
                }
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {analyticsData.categoriesData.map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTrendIcon(category.trend)}
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{category.count}</span>
                      <Badge variant="outline">{category.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              {showDetails.includes('categories') && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.categoriesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {analyticsData.categoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>

          {/* Performance Indicators */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Performance Indicators</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                  <span className="text-sm text-gray-600">{analyticsData.customerSatisfaction}%</span>
                </div>
                <Progress value={analyticsData.customerSatisfaction} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Response Rate</span>
                  <span className="text-sm text-gray-600">{analyticsData.responseRate}%</span>
                </div>
                <Progress value={analyticsData.responseRate} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Resolution Accuracy</span>
                  <span className="text-sm text-gray-600">{analyticsData.performanceMetrics.resolutionAccuracy}%</span>
                </div>
                <Progress value={analyticsData.performanceMetrics.resolutionAccuracy} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">First Response Time</span>
                  <span className="text-sm text-gray-600">{formatDuration(analyticsData.performanceMetrics.firstResponseTime)}</span>
                </div>
                <Progress value={(24 - analyticsData.performanceMetrics.firstResponseTime) / 24 * 100} className="h-2" />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Complaint & Resolution Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="complaints" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    name="New Complaints"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolutions" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Resolutions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="outages" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Outages"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>First Response Time</span>
                  <span className="font-semibold">{formatDuration(analyticsData.performanceMetrics.firstResponseTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Resolution Accuracy</span>
                  <span className="font-semibold">{analyticsData.performanceMetrics.resolutionAccuracy}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Reopen Rate</span>
                  <span className="font-semibold">{analyticsData.performanceMetrics.reopenRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Escalation Rate</span>
                  <span className="font-semibold">{analyticsData.performanceMetrics.escalationRate}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">System Health</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Active Users</span>
                  <Badge variant="outline">{analyticsData.activeUsers}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Outages</span>
                  <Badge variant={analyticsData.outages > 0 ? "destructive" : "default"}>
                    {analyticsData.outages}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>System Uptime</span>
                  <Badge variant="default">99.8%</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Regional Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {analyticsData.regionsData.map((region) => (
                  <div key={region.region} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{region.region}</h4>
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Complaints</span>
                        <p className="font-semibold">{region.complaints}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Outages</span>
                        <p className="font-semibold">{region.outages}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Users</span>
                        <p className="font-semibold">{region.users}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.regionsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="complaints" fill="#f97316" name="Complaints" />
                    <Bar dataKey="outages" fill="#ef4444" name="Outages" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}