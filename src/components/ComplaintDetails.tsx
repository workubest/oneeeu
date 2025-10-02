import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  User, 
  FileText,
  Camera,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageSquare,
  Settings,
  Zap,
  Calendar,
  Users
} from 'lucide-react';
import eeuLogo from 'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png';

interface ComplaintDetailsProps {
  complaintId: string;
  onBack: () => void;
}

export function ComplaintDetails({ complaintId, onBack }: ComplaintDetailsProps) {
  const [newNote, setNewNote] = useState('');
  const [status, setStatus] = useState('in-progress');

  // Mock complaint data - in real app this would come from API
  const complaint = {
    id: 'EEU-2024-001234',
    title: 'Power Outage in Bole Sub-district',
    description: 'Complete power outage affecting residential area. Multiple households without electricity since 6:00 AM. Street lights and traffic signals also affected.',
    type: 'Power Outage',
    priority: 'high',
    status: 'in-progress',
    createdAt: '2024-01-15T06:30:00Z',
    updatedAt: '2024-01-15T10:15:00Z',
    assignedTo: 'Mekdes Tadesse',
    estimatedResolution: '2024-01-15T14:00:00Z',
    customer: {
      name: 'Dawit Assefa',
      phone: '+251911234567',
      email: 'dawit.a@gmail.com',
      serviceAccount: 'EEU-ACC-567890',
      address: 'Bole, Addis Ababa'
    },
    location: {
      coordinates: { lat: 9.0192, lng: 38.7525 },
      affectedHouseholds: 45,
      area: 'Bole Sub-district, Zone 3'
    },
    technician: {
      name: 'Yohannes Bekele',
      phone: '+251922345678',
      status: 'en-route'
    },
    attachments: [
      { id: 1, name: 'outage_photo_1.jpg', type: 'image' },
      { id: 2, name: 'transformer_damage.jpg', type: 'image' }
    ]
  };

  const timeline = [
    {
      id: 1,
      timestamp: '2024-01-15T06:30:00Z',
      action: 'Complaint Submitted',
      user: 'Dawit Assefa',
      details: 'Initial complaint submitted via mobile app',
      type: 'created'
    },
    {
      id: 2,
      timestamp: '2024-01-15T07:15:00Z',
      action: 'Complaint Assigned',
      user: 'Tigist Haile',
      details: 'Assigned to technical team for investigation',
      type: 'assigned'
    },
    {
      id: 3,
      timestamp: '2024-01-15T08:30:00Z',
      action: 'Field Team Dispatched',
      user: 'Mekdes Tadesse',
      details: 'Technician Yohannes Bekele dispatched to location',
      type: 'dispatch'
    },
    {
      id: 4,
      timestamp: '2024-01-15T10:15:00Z',
      action: 'Status Update',
      user: 'Yohannes Bekele',
      details: 'Identified transformer failure. Replacement parts ordered.',
      type: 'update'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'created': return <FileText className="w-4 h-4" />;
      case 'assigned': return <Users className="w-4 h-4" />;
      case 'dispatch': return <Zap className="w-4 h-4" />;
      case 'update': return <MessageSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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

  const addNote = () => {
    if (newNote.trim()) {
      // Add note logic here
      console.log('Adding note:', newNote);
      setNewNote('');
    }
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
            <h1 className="text-xl font-semibold text-gray-900">{complaint.title}</h1>
            <p className="text-sm text-gray-600">#{complaint.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <img 
            src={eeuLogo} 
            alt="EEU Logo" 
            className="w-8 h-8 object-contain"
          />
        </div>
      </div>

      {/* Status and Priority */}
      <div className="flex gap-3">
        <Badge className={`${getStatusColor(complaint.status)} border`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          {complaint.status.replace('-', ' ')}
        </Badge>
        <Badge className={`${getPriorityColor(complaint.priority)} border`}>
          <AlertCircle className="w-3 h-3 mr-1" />
          {complaint.priority} priority
        </Badge>
        <Badge variant="outline" className="border-orange-200 text-orange-700">
          <Zap className="w-3 h-3 mr-1" />
          {complaint.type}
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => setStatus('resolved')}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark Resolved
        </Button>
        <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
          <Phone className="w-4 h-4 mr-2" />
          Call Customer
        </Button>
      </div>

      {/* Complaint Details */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-600" />
            Complaint Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
              {complaint.description}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-700">Created</label>
              <p className="text-gray-900">{formatDate(complaint.createdAt)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Last Updated</label>
              <p className="text-gray-900">{formatDate(complaint.updatedAt)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Assigned To</label>
              <p className="text-gray-900">{complaint.assignedTo}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">ETA Resolution</label>
              <p className="text-green-700 font-medium">{formatDate(complaint.estimatedResolution)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-green-600" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 border-2 border-orange-200">
              <AvatarFallback className="bg-orange-100 text-orange-700">
                {complaint.customer.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium">{complaint.customer.name}</h4>
              <p className="text-sm text-gray-600">Account: {complaint.customer.serviceAccount}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>{complaint.customer.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>{complaint.customer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{complaint.customer.address}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Location & Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900">Affected Area</h4>
            <p className="text-sm text-blue-700">{complaint.location.area}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-700">Affected Households</label>
              <p className="text-lg font-semibold text-red-600">{complaint.location.affectedHouseholds}</p>
            </div>
            <div>
              <label className="font-medium text-gray-700">Coordinates</label>
              <p className="text-gray-900 font-mono text-xs">
                {complaint.location.coordinates.lat}, {complaint.location.coordinates.lng}
              </p>
            </div>
          </div>
          
          <Button variant="outline" className="w-full border-blue-500 text-blue-700 hover:bg-blue-50">
            <MapPin className="w-4 h-4 mr-2" />
            View on Map
          </Button>
        </CardContent>
      </Card>

      {/* Field Technician */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-600" />
            Field Technician
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10 border-2 border-purple-200">
                <AvatarFallback className="bg-purple-100 text-purple-700">
                  {complaint.technician.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{complaint.technician.name}</h4>
                <p className="text-sm text-gray-600">{complaint.technician.phone}</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {complaint.technician.status}
            </Badge>
          </div>
          
          <Button variant="outline" className="w-full border-purple-500 text-purple-700 hover:bg-purple-50">
            <Phone className="w-4 h-4 mr-2" />
            Contact Technician
          </Button>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div key={item.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    {getTimelineIcon(item.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{item.action}</h4>
                    <span className="text-xs text-gray-500">{formatDate(item.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{item.details}</p>
                  <p className="text-xs text-gray-500">by {item.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Note */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-600" />
            Add Technician Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add technical notes, observations, or updates..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button 
              onClick={addNote}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              disabled={!newNote.trim()}
            >
              Add Note
            </Button>
            <Button variant="outline" size="sm" className="px-3">
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Update Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-orange-600" />
            Update Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            Update Complaint Status
          </Button>
        </CardContent>
      </Card>

      {/* Attachments */}
      {complaint.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-gray-600" />
              Attachments ({complaint.attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {complaint.attachments.map((attachment) => (
                <div key={attachment.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium truncate">{attachment.name}</span>
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