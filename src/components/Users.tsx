import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Users as UsersIcon, 
  Mail, 
  Shield,
  Clock,
  CheckCircle,
  Phone,
  AlertCircle,
  RefreshCw,
  Edit,
  Trash2,
  UserPlus,
  Save,
  X
} from 'lucide-react';
import { apiService, type User as ApiUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface UsersProps {
  onNavigate?: (view: string, data?: any) => void;
  refreshKey?: number;
  onDataChange?: () => void;
}

export function Users({ onNavigate, refreshKey = 0, onDataChange }: UsersProps = {}) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as ApiUser['role'],
    region: '',
    serviceCenter: '',
    phone: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getUsers({ limit: 100 });
      
      if (response.success) {
        // Handle both array and object responses
        const usersData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.users || [];
        setUsers(usersData);
      } else {
        throw new Error(response.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Create user
  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await apiService.createUser(formData);
      
      if (response.success && response.data) {
        setUsers(prev => [response.data, ...prev]);
        setSuccessMessage('User created successfully');
        setShowCreateForm(false);
        resetForm();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Create user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!editingUser || !formData.name || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't update password if not provided
      }
      
      const response = await apiService.updateUser(editingUser.id, updateData);
      
      if (response.success && response.data) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? response.data : u));
        setSuccessMessage('User updated successfully');
        setEditingUser(null);
        resetForm();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.error || 'Failed to update user');
      }
    } catch (err) {
      console.error('Update user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(userId);
      const response = await apiService.deleteUser(userId);
      
      if (response.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setSuccessMessage('User deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Form helpers
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      region: '',
      serviceCenter: '',
      phone: ''
    });
  };

  const startEdit = (user: ApiUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password for security
      role: user.role,
      region: user.region || '',
      serviceCenter: user.serviceCenter || '',
      phone: user.phone || ''
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    resetForm();
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'manager':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'technician':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'customer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean | undefined) => {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (isActive: boolean | undefined) => {
    return isActive ? CheckCircle : AlertCircle;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
              <span className="ml-2">Loading users...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchUsers}
                  className="ml-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600">Manage EEU staff and customer accounts</p>
        </div>
        {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
          <Button 
            size="sm" 
            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="technician">Technician</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-orange-600" />
              Create New User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+251911234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={(value: ApiUser['role']) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="Enter region"
                  />
                </div>
                <div>
                  <Label htmlFor="serviceCenter">Service Center</Label>
                  <Input
                    id="serviceCenter"
                    value={formData.serviceCenter}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceCenter: e.target.value }))}
                    placeholder="Enter service center"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateUser} className="bg-green-500 hover:bg-green-600 text-white gap-2">
                <Save className="w-4 h-4" />
                Create User
              </Button>
              <Button variant="outline" onClick={() => { setShowCreateForm(false); resetForm(); }}>
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit User Form */}
      {editingUser && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit className="w-4 h-4 text-blue-600" />
              Edit User: {editingUser.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+251911234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={(value: ApiUser['role']) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-region">Region</Label>
                  <Input
                    id="edit-region"
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="Enter region"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-serviceCenter">Service Center</Label>
                  <Input
                    id="edit-serviceCenter"
                    value={formData.serviceCenter}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceCenter: e.target.value }))}
                    placeholder="Enter service center"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateUser} className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
                <Save className="w-4 h-4" />
                Update User
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="font-medium mb-2">No users found</h3>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const StatusIcon = getStatusIcon(user.isActive);
            
            return (
              <Card key={user.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-300 hover:border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <Avatar className="w-12 h-12 border-2 border-orange-200">
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                          <Badge className={`text-xs ${getStatusColor(user.isActive)} gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{user.email}</span>
                        </div>

                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Phone className="w-4 h-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={`text-xs ${getRoleColor(user.role || '')}`}>
                            <Shield className="w-3 h-3 mr-1" />
                            {user.role}
                          </Badge>
                          
                          {user.region && (
                            <span className="text-xs text-gray-500">{user.region} • {user.serviceCenter}</span>
                          )}
                        </div>
                        
                        {user.createdAt && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            <Clock className="w-3 h-3" />
                            <span>Created {formatDate(user.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => startEdit(user)}
                          title="Edit User"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        {currentUser?.role === 'admin' && user.id !== currentUser.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteLoading === user.id}
                            title="Delete User"
                          >
                            {deleteLoading === user.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* EEU Stats Summary */}
      <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-600" />
            EEU User Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="text-lg font-semibold text-green-600">
                {filteredUsers.filter(u => u.isActive).length}
              </div>
              <div className="text-xs text-gray-600">Active Users</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <div className="text-lg font-semibold text-red-600">
                {filteredUsers.filter(u => !u.isActive).length}
              </div>
              <div className="text-xs text-gray-600">Inactive Users</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <div className="text-lg font-semibold text-orange-600">
                {filteredUsers.filter(u => u.role === 'staff' || u.role === 'manager' || u.role === 'admin').length}
              </div>
              <div className="text-xs text-gray-600">EEU Staff</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-lg font-semibold text-blue-600">
                {filteredUsers.filter(u => u.role === 'customer').length}
              </div>
              <div className="text-xs text-gray-600">Customers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}