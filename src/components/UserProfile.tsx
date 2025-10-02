import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  FileText,
  Camera,
  Save,
  Edit,
  Building,
  Clock,
  CheckCircle
} from 'lucide-react';
import eeuLogo from 'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png';

interface UserProfileProps {
  onBack: () => void;
  onNavigate?: (view: string, data?: any) => void;
}

export function UserProfile({ onBack, onNavigate }: UserProfileProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+251911234567',
    department: 'Customer Service',
    position: 'Senior Technical Support',
    location: 'Addis Ababa, Ethiopia',
    employeeId: 'EEU-EMP-2024-001',
    joinDate: '2023-03-15',
    bio: 'Experienced customer service representative specializing in electrical service complaints and technical support for residential customers.'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save profile changes logic here
    console.log('Saving profile changes:', formData);
    setIsEditing(false);
    // Show success message
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'manager': return 'bg-green-100 text-green-800 border-green-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'customer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            <h1 className="text-xl font-semibold text-gray-900">User Profile</h1>
            <p className="text-sm text-gray-600">Manage your personal information</p>
          </div>
        </div>
        <Button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={isEditing 
            ? "bg-green-500 hover:bg-green-600 text-white" 
            : "bg-orange-500 hover:bg-orange-600 text-white"
          }
          size="sm"
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* EEU Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <img 
              src={eeuLogo} 
              alt="EEU Logo" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h3 className="font-medium text-gray-900">Ethiopian Electric Utility</h3>
              <p className="text-sm text-gray-600">Employee Profile Management</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Photo & Basic Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-orange-200">
                <AvatarImage src="" alt={formData.name} />
                <AvatarFallback className="text-xl bg-orange-500 text-white">
                  {getInitials(formData.name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button 
                  size="sm" 
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-orange-500 hover:bg-orange-600"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">{formData.name}</h2>
              <div className="flex items-center gap-2 justify-center">
                <Badge className={`${getRoleColor(user?.role || 'staff')} border`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </Badge>
                <Badge variant="outline" className="border-green-200 text-green-700">
                  <Building className="w-3 h-3 mr-1" />
                  {formData.department}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{formData.position}</p>
              <p className="text-xs text-gray-500">Employee ID: {formData.employeeId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-orange-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <User className="w-4 h-4 text-gray-500" />
                <span>{formData.name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{formData.email}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            {isEditing ? (
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{formData.phone}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            {isEditing ? (
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{formData.location}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-green-600" />
            Work Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              {isEditing ? (
                <Input
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                />
              ) : (
                <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{formData.department}</p>
              )}
            </div>
            <div>
              <Label>Position</Label>
              {isEditing ? (
                <Input
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                />
              ) : (
                <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{formData.position}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employee ID</Label>
              <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded font-mono">{formData.employeeId}</p>
            </div>
            <div>
              <Label>Join Date</Label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900">{formatDate(formData.joinDate)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Professional Bio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <textarea
              className="w-full p-3 border rounded-lg resize-none"
              rows={4}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Write a brief description about your role and expertise..."
            />
          ) : (
            <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg leading-relaxed">
              {formData.bio}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Account Status</span>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Last Login</span>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-3 h-3" />
              Today, 8:30 AM
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Two-Factor Auth</span>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Enabled
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Profile Completion</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
              <span className="text-xs text-gray-600">85%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="border-orange-500 text-orange-700 hover:bg-orange-50">
          <Shield className="w-4 h-4 mr-2" />
          Security Settings
        </Button>
        <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
          <User className="w-4 h-4 mr-2" />
          Privacy Settings
        </Button>
      </div>

      {/* Cancel Edit */}
      {isEditing && (
        <Button 
          variant="outline" 
          onClick={() => setIsEditing(false)}
          className="w-full"
        >
          Cancel Changes
        </Button>
      )}
    </div>
  );
}