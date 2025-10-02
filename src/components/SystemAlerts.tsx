import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { 
  ArrowLeft, 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Clock, 
  Search,
  Filter,
  Zap,
  Users,
  Settings,
  MessageSquare,
  X,
  RefreshCw
} from 'lucide-react';
import { apiService, type Notification } from '../services/api';
import eeuLogo from 'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png';

interface SystemAlertsProps {
  onBack: () => void;
  onNavigate?: (view: string, data?: any) => void;
}

export function SystemAlerts({ onBack, onNavigate }: SystemAlertsProps) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getNotifications();
      
      if (response.success && response.data?.notifications) {
        setAlerts(response.data.notifications);
      } else {
        throw new Error(response.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Notifications fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'high':
        return <Clock className="w-5 h-5" />;
      case 'medium':
        return <Info className="w-5 h-5" />;
      case 'low':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <Zap className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !alert.isRead) ||
                         (filter === 'action-required' && alert.actionRequired) ||
                         alert.priority === filter ||
                         alert.type === filter;
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const actionRequiredCount = alerts.filter(a => a.actionRequired).length;

  const markAsRead = (alertId: string) => {
    // Update local state immediately for better UX
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
    // TODO: Call API to mark as read on backend
    console.log('Marking as read:', alertId);
  };

  const dismissAlert = (alertId: string) => {
    // Remove from local state immediately for better UX
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    // TODO: Call API to dismiss/delete notification on backend
    console.log('Dismissing alert:', alertId);
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
    // TODO: Call API to mark all as read on backend
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="p-2" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">System Alerts</h1>
            <p className="text-sm text-gray-600">Monitor system notifications and alerts</p>
          </div>
        </div>
        <Button 
          size="sm" 
          className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={markAllAsRead}
          disabled={loading || unreadCount === 0}
        >
          <Bell className="w-4 h-4" />
          Mark All Read
        </Button>
      </div>

      {/* EEU Alert Banner */}
      <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <img 
              src={eeuLogo} 
              alt="EEU Logo" 
              className="w-10 h-10 object-contain"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Ethiopian Electric Utility</h3>
              <p className="text-sm text-gray-600">Real-time system monitoring and alerts</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-red-600">{unreadCount}</div>
              <div className="text-xs text-gray-600">Unread Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-red-700">
              {alerts.filter(a => a.priority === 'critical').length}
            </div>
            <div className="text-xs text-red-600">Critical</div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-yellow-700">{actionRequiredCount}</div>
            <div className="text-xs text-yellow-600">Action Required</div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Bell className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-blue-700">{alerts.length}</div>
            <div className="text-xs text-blue-600">Total Alerts</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter alerts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Alerts</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="action-required">Action Required</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchNotifications}
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="font-medium mb-2">No alerts found</h3>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`border-l-4 transition-all hover:shadow-md ${
                alert.priority === 'critical' ? 'border-l-red-500' :
                alert.priority === 'high' ? 'border-l-orange-500' :
                alert.priority === 'medium' ? 'border-l-yellow-500' :
                alert.priority === 'low' ? 'border-l-blue-500' :
                'border-l-gray-500'
              } ${!alert.isRead ? 'bg-gray-50' : ''}`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${getAlertColor(alert.priority).replace('text-', 'text-').replace('border-', '').replace('bg-', 'bg-')}`}>
                        {getAlertIcon(alert.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{alert.title}</h3>
                          {!alert.isRead && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(alert.type)}
                            <span className="capitalize">{alert.type}</span>
                          </div>
                          <span>•</span>
                          <span>Priority: {alert.priority}</span>
                          <span>•</span>
                          <span>{formatDate(alert.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {alert.actionRequired && (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                          Action Required
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  {(alert.actionRequired || !alert.isRead) && (
                    <div className="flex gap-2 pt-2">
                      {!alert.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                          className="border-green-500 text-green-700 hover:bg-green-50"
                        >
                          Mark as Read
                        </Button>
                      )}
                      {alert.actionRequired && (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => {
                            if (alert.relatedComplaintId) {
                              onNavigate?.('complaint-details', { id: alert.relatedComplaintId });
                            }
                          }}
                        >
                          Take Action
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Alert Settings */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">Alert Preferences</h4>
              <p className="text-sm text-blue-700">
                Customize your notification settings to receive the most relevant alerts for your role.
              </p>
            </div>
            <Button variant="outline" className="border-blue-500 text-blue-700 hover:bg-blue-100">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}