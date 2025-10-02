import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Zap, 
  Wrench, 
  TrendingUp, 
  Users, 
  ArrowRight,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { apiService, type DashboardMetrics, type Complaint } from '../services/api';
import { useDataManager } from '../hooks/useDataManager';

interface DashboardProps {
  onNavigate?: (view: string, data?: any) => void;
  refreshKey?: number;
}

export function Dashboard({ onNavigate, refreshKey = 0 }: DashboardProps = {}) {
  const { 
    dashboardMetrics: metrics, 
    complaints, 
    loading, 
    error, 
    refreshAll,
    refreshDashboard,
    lastSync,
    backendStatus,
    forceRefresh 
  } = useDataManager();
  
  const recentComplaints = complaints.slice(0, 5);

  // Refresh data when refreshKey changes - now with enhanced caching
  useEffect(() => {
    if (refreshKey > 0) {
      // Force refresh for latest data
      forceRefresh('dashboard');
    }
  }, [refreshKey, forceRefresh]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No dashboard data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.complaints.total}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-red-600">{metrics.complaints.open}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.complaints.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{metrics.complaints.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Resolution Rate</span>
                <span className="text-sm text-gray-600">{metrics.performance.resolutionRate}%</span>
              </div>
              <Progress value={metrics.performance.resolutionRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Customer Satisfaction</span>
                <span className="text-sm text-gray-600">{metrics.performance.customerSatisfaction}%</span>
              </div>
              <Progress value={metrics.performance.customerSatisfaction} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Complaints */}
      {recentComplaints.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Complaints</CardTitle>
              <button 
                onClick={() => onNavigate?.('complaints')}
                className="text-orange-500 text-sm hover:text-orange-600"
              >
                View All <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentComplaints.map((complaint) => (
                <div 
                  key={complaint.id} 
                  onClick={() => onNavigate?.('complaint-details', complaint)}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{complaint.title}</p>
                    <p className="text-sm text-gray-600">ID: {complaint.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={complaint.priority === 'critical' ? 'destructive' : 'secondary'}>
                      {complaint.priority}
                    </Badge>
                    <Badge variant="outline">
                      {complaint.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}