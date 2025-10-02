import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { 
  ArrowLeft, 
  Zap, 
  MapPin, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Settings,
  Phone,
  Calendar,
  Activity,
  RefreshCw
} from 'lucide-react';
import { apiService, type Outage } from '../services/api';
import eeuLogo from 'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png';

interface OutageManagementProps {
  onBack: () => void;
  onNavigate?: (view: string, data?: any) => void;
}

export function OutageManagement({ onBack, onNavigate }: OutageManagementProps) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [outages, setOutages] = useState<Outage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchOutages();
  }, []);

  const fetchOutages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getOutages({ limit: 100 });
      
      if (response.success) {
        const outagesData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.outages || [];
        setOutages(outagesData);
      } else {
        throw new Error(response.error || 'Failed to fetch outages');
      }
    } catch (err) {
      console.error('Outages fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load outages');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOutage = async (outageId: string, updates: any) => {
    try {
      setUpdateLoading(outageId);
      const response = await apiService.updateOutage(outageId, updates);
      
      if (response.success && response.data) {
        setOutages(prev => prev.map(o => 
          o.id === outageId ? response.data : o
        ));
      } else {
        throw new Error(response.error || 'Failed to update outage');
      }
    } catch (err) {
      console.error('Update outage error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update outage');
    } finally {
      setUpdateLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'investigating': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Zap className="w-3 h-3" />;
      case 'scheduled': return <Calendar className="w-3 h-3" />;
      case 'investigating': return <Search className="w-3 h-3" />;
      case 'resolved': return <CheckCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCrewStatusColor = (status: string) => {
    switch (status) {
      case 'on-site': return 'bg-green-100 text-green-800';
      case 'en-route': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOutages = outages.filter(outage => {
    const matchesFilter = filter === 'all' || outage.status === filter;
    const matchesSearch = outage.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         outage.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         outage.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalAffected = outages
    .filter(o => o.status === 'active' || o.status === 'investigating')
    .reduce((sum, outage) => sum + outage.affectedCustomers, 0);

  const activeOutages = outages.filter(o => o.status === 'active').length;
  const investigatingOutages = outages.filter(o => o.status === 'investigating').length;

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="p-2" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Outage Management</h1>
            <p className="text-sm text-gray-600">Monitor and manage power outages</p>
          </div>
        </div>
        <Button size="sm" className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4" />
          Report Outage
        </Button>
      </div>

      {/* EEU Status Banner */}
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
              <p className="text-sm text-gray-600">Real-time power outage monitoring and response</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-red-600">{totalAffected.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Customers Affected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 text-red-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-red-700">{activeOutages}</div>
            <div className="text-xs text-red-600">Active Outages</div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Search className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-yellow-700">{investigatingOutages}</div>
            <div className="text-xs text-yellow-600">Investigating</div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-semibold text-green-700">
              {outages.filter(o => o.status === 'resolved').length}
            </div>
            <div className="text-xs text-green-600">Resolved Today</div>
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
              placeholder="Search outages by ID, area, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outages</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
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
              onClick={fetchOutages}
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Outages List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOutages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="font-medium mb-2">No outages found</h3>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredOutages.map((outage) => (
            <Card key={outage.id} className="border-l-4 border-l-red-400 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{outage.title}</h3>
                        <Badge className={`text-xs ${getStatusColor(outage.status)} border gap-1`}>
                          {getStatusIcon(outage.status)}
                          {outage.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">#{outage.id}</p>
                    </div>
                    <Badge className={`text-xs ${getPriorityColor(outage.priority)} border`}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {outage.priority}
                    </Badge>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{outage.area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{outage.affectedCustomers.toLocaleString()} customers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">Reported: {formatDate(outage.reportedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">ETA: {formatDate(outage.estimatedRestoration)}</span>
                    </div>
                  </div>

                  {/* Crew Information */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">{outage.assignedCrew}</span>
                        <Badge className={`text-xs ${getCrewStatusColor(outage.crewStatus)}`}>
                          {outage.crewStatus.replace('-', ' ')}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs text-gray-600">{outage.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${outage.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cause */}
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Cause: </span>
                    <span className="text-gray-600">{outage.cause}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-orange-500 text-orange-700 hover:bg-orange-50"
                      onClick={() => {
                        // TODO: Navigate to outage details view
                        console.log('View details for:', outage.id);
                      }}
                    >
                      View Details
                    </Button>
                    <Select 
                      value={outage.status} 
                      onValueChange={(value) => handleUpdateOutage(outage.id, { status: value })}
                      disabled={updateLoading === outage.id}
                    >
                      <SelectTrigger className="flex-1 border-green-500 text-green-700 hover:bg-green-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Emergency Contact */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Emergency Response</h4>
              <p className="text-sm text-red-700">
                For critical outages affecting hospitals or emergency services, contact the emergency response team immediately.
              </p>
            </div>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Phone className="w-4 h-4 mr-2" />
              Emergency
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}