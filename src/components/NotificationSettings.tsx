import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { 
  ArrowLeft, 
  Bell, 
  MessageSquare, 
  AlertCircle, 
  Volume2,
  Vibrate,
  Clock,
  Mail,
  Smartphone
} from 'lucide-react';
import eeuLogo from 'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png';

interface NotificationSettingsProps {
  onBack: () => void;
}

export function NotificationSettings({ onBack }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    newComplaints: true,
    complaintUpdates: true,
    systemAlerts: false,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: false,
    weekendNotifications: true
  });

  const updateSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const notificationTypes = [
    {
      icon: MessageSquare,
      title: 'New Complaints',
      description: 'Get notified when new complaints are submitted',
      key: 'newComplaints' as keyof typeof settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Bell,
      title: 'Complaint Updates',
      description: 'Status changes and progress updates',
      key: 'complaintUpdates' as keyof typeof settings,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: AlertCircle,
      title: 'System Alerts',
      description: 'Critical system notifications and outages',
      key: 'systemAlerts' as keyof typeof settings,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const deliveryMethods = [
    {
      icon: Smartphone,
      title: 'Push Notifications',
      description: 'Mobile app notifications',
      key: 'pushNotifications' as keyof typeof settings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Mail,
      title: 'Email Notifications',
      description: 'Receive updates via email',
      key: 'emailNotifications' as keyof typeof settings,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: MessageSquare,
      title: 'SMS Notifications',
      description: 'Text message alerts',
      key: 'smsNotifications' as keyof typeof settings,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  const preferences = [
    {
      icon: Volume2,
      title: 'Sound',
      description: 'Play notification sound',
      key: 'soundEnabled' as keyof typeof settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Vibrate,
      title: 'Vibration',
      description: 'Vibrate on notifications',
      key: 'vibrationEnabled' as keyof typeof settings,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Clock,
      title: 'Quiet Hours',
      description: 'Disable notifications 10PM - 7AM',
      key: 'quietHours' as keyof typeof settings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="p-2" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Notification Settings</h1>
            <p className="text-sm text-gray-600">Customize your notification preferences</p>
          </div>
        </div>
      </div>

      {/* EEU Branding */}
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
              <p className="text-sm text-gray-600">Stay informed about EEU services</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">NOTIFICATION TYPES</h3>
        <div className="space-y-2">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card key={type.key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${type.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${type.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{type.title}</h4>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[type.key]}
                      onCheckedChange={() => updateSetting(type.key)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Delivery Methods */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">DELIVERY METHODS</h3>
        <div className="space-y-2">
          {deliveryMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Card key={method.key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${method.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${method.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{method.title}</h4>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[method.key]}
                      onCheckedChange={() => updateSetting(method.key)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Preferences */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">PREFERENCES</h3>
        <div className="space-y-2">
          {preferences.map((pref) => {
            const Icon = pref.icon;
            return (
              <Card key={pref.key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${pref.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${pref.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{pref.title}</h4>
                        <p className="text-sm text-gray-600">{pref.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[pref.key]}
                      onCheckedChange={() => updateSetting(pref.key)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
          Save Notification Settings
        </Button>
      </div>

      {/* Footer Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="text-center">
            <Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-blue-900 mb-1">Stay Connected</h4>
            <p className="text-sm text-blue-700">
              Get real-time updates about EEU services and your account activity
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}