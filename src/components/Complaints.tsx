import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Calendar,
  User,
  MapPin,
  RefreshCw,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { apiService, type Complaint as ApiComplaint } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useDataManager } from '../hooks/useDataManager';

interface ComplaintsProps {
  onNavigate?: (view: string, data?: any) => void;
  refreshKey?: number;
  onDataChange?: () => void;
}

export function Complaints({ onNavigate, refreshKey = 0, onDataChange }: ComplaintsProps = {}) {
  const { user } = useAuth();
  const { 
    complaints, 
    loading, 
    error: dataError, 
    refreshComplaints, 
    forceRefresh,
    backendStatus 
  } = useDataManager();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Combined error state
  const error = dataError || localError;

  // Refresh complaints when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      forceRefresh('complaints');
    }
  }, [refreshKey, forceRefresh]);

  // Legacy fetch function - now handled by data manager
  const fetchComplaints = async () => {
    // This is now handled by the data manager
    await refreshComplaints(true); // Force refresh
  };

  // Delete complaint
  const handleDeleteComplaint = async (complaintId: string) => {
    if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(complaintId);
      const response = await apiService.deleteComplaint(complaintId);
      
      if (response.success) {
        setSuccessMessage('Complaint deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Refresh complaints data through data manager
        await refreshComplaints(true);
        onDataChange?.(); // Trigger global data refresh
      } else {
        throw new Error(response.error || 'Failed to delete complaint');
      }
    } catch (err) {
      console.error('Delete complaint error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to delete complaint');
      setTimeout(() => setLocalError(null), 5000);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Update complaint status quickly
  const handleQuickStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      const response = await apiService.updateComplaint(complaintId, { status: newStatus });
      
      if (response.success) {
        setSuccessMessage(`Complaint status updated to ${newStatus}`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Refresh complaints data through data manager
        await refreshComplaints(true);
        onDataChange?.(); // Trigger global data refresh
      } else {
        throw new Error(response.error || 'Failed to update complaint');
      }
    } catch (err) {
      console.error('Update complaint error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to update complaint');
      setTimeout(() => setLocalError(null), 5000);
    }
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
      case 'in-progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Complaints</h1>
          <p className="text-sm text-gray-600">Manage customer complaints and service requests</p>
        </div>
        <Button 
          size="sm" 
          className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => onNavigate?.('new-complaint')}
        >
          <Plus className="w-4 h-4" />
          New Complaint
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Complaints List */}
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
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="font-medium text-red-900 mb-2">Unable to load complaints</h3>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredComplaints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="font-medium mb-2">No complaints found</h3>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredComplaints.map((complaint) => (
            <Card 
              key={complaint.id} 
              className="hover:shadow-md transition-shadow border-l-4 border-l-orange-300 hover:border-l-orange-500"
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1" onClick={() => onNavigate?.('complaint-details', complaint)}>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{complaint.title}</h3>
                        <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                          {complaint.id}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {complaint.description}
                      </p>
                    </div>
                    
                    {/* Actions Menu - Only for admin/manager/staff */}
                    {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {/* Quick Status Update */}
                        <Select 
                          value={complaint.status} 
                          onValueChange={(value) => handleQuickStatusUpdate(complaint.id, value)}
                        >
                          <SelectTrigger className="w-auto h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Delete Button - Admin only */}
                        {user?.role === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => handleDeleteComplaint(complaint.id)}
                            disabled={deleteLoading === complaint.id}
                          >
                            {deleteLoading === complaint.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status and Priority */}
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs gap-1 ${getStatusColor(complaint.status)}`}>
                      {getStatusIcon(complaint.status)}
                      {complaint.status.replace('_', ' ').replace('-', ' ')}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{complaint.customerId || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{complaint.region || complaint.serviceCenter || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(complaint.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Created by {complaint.createdBy}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {filteredComplaints.filter(c => c.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-orange-600">
                {filteredComplaints.filter(c => c.status === 'in-progress').length}
              </div>
              <div className="text-xs text-gray-600">In Progress</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {filteredComplaints.filter(c => c.status === 'resolved').length}
              </div>
              <div className="text-xs text-gray-600">Resolved</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">
                {filteredComplaints.filter(c => c.status === 'rejected').length}
              </div>
              <div className="text-xs text-gray-600">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}