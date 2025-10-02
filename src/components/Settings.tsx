import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { NotificationSettings } from './NotificationSettings';
import { SecurityPrivacy } from './SecurityPrivacy';
import { BackendSetupInstructions } from './BackendSetupInstructions';
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Bell, 
  Mail, 
  Globe, 
  Palette, 
  HelpCircle,
  ArrowRight,
  Check,
  Info,
  Shield,
  FileText
} from 'lucide-react';
import eeuLogo from 'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png';

interface SettingsProps {
  onNavigate?: (view: string, data?: any) => void;
  currentBackend?: 'google' | 'supabase';
  onBackendChange?: (backend: 'google' | 'supabase') => void;
  onBackendHealthCheck?: (backend: 'google' | 'supabase') => Promise<boolean>;
}

export function Settings({ 
  onNavigate, 
  currentBackend = 'google', 
  onBackendChange, 
  onBackendHealthCheck 
}: SettingsProps = {}) {
  const { user, logout } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [language, setLanguage] = useState('English');
  const [appearance, setAppearance] = useState('System');
  const [currentView, setCurrentView] = useState<'main' | 'notifications' | 'security' | 'backend-setup'>('main');

  const accountSettings = [
    {
      icon: User,
      title: 'Edit Profile',
      description: 'Update your personal information',
      action: () => console.log('Edit profile')
    },
    {
      icon: Lock,
      title: 'Security & Privacy',
      description: 'Password, 2FA, and privacy settings',
      action: () => setCurrentView('security')
    }
  ];

  const notificationSettings = [
    {
      icon: Bell,
      title: 'Notification Settings',
      description: 'Customize notification preferences',
      action: () => setCurrentView('notifications')
    }
  ];

  const generalSettings = [
    {
      icon: Globe,
      title: 'Language',
      description: 'Change your preferred language',
      value: language,
      options: ['English', 'አማርኛ (Amharic)'],
      onChange: setLanguage
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Choose your interface theme',
      value: appearance,
      options: ['Light', 'Dark', 'System'],
      onChange: setAppearance
    }
  ];

  const supportSettings = [
    {
      icon: HelpCircle,
      title: 'Backend Setup',
      description: 'Configure Google Apps Script integration',
      action: () => setCurrentView('backend-setup')
    },
    {
      icon: Info,
      title: 'About EEU CMS',
      description: 'App information and version details',
      action: () => console.log('About')
    },
    {
      icon: FileText,
      title: 'Help & Support',
      description: 'FAQs, user manual, contact support',
      action: () => console.log('Help & Support')
    }
  ];

  // Conditional rendering based on current view
  if (currentView === 'notifications') {
    return <NotificationSettings onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'security') {
    return <SecurityPrivacy onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'backend-setup') {
    return <BackendSetupInstructions onClose={() => setCurrentView('main')} />;
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      {/* User Profile */}
      <Card className="bg-gradient-to-br from-orange-50 to-green-50 border-orange-200">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-orange-200">
                <AvatarImage src="" alt={user?.name} />
                <AvatarFallback className="text-lg bg-orange-500 text-white">
                  {user?.name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <Badge className="mt-2 capitalize bg-orange-500 text-white">
                {user?.role}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">Ethiopian Electric Utility</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">ACCOUNT</h3>
        <div className="space-y-2">
          {accountSettings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between" onClick={setting.action}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{setting.title}</h4>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Notification Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">NOTIFICATIONS</h3>
        <div className="space-y-2">
          {notificationSettings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between" onClick={setting.action}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{setting.title}</h4>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* General Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">GENERAL</h3>
        <div className="space-y-2">
          {generalSettings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{setting.title}</h4>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{setting.value}</span>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Support */}
      <div>
        <div className="space-y-2">
          {supportSettings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between" onClick={setting.action}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{setting.title}</h4>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* About EEU Section */}
      <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <img 
              src={eeuLogo} 
              alt="EEU Logo" 
              className="w-12 h-12 object-contain"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Ethiopian Electric Utility</h3>
              <p className="text-sm text-gray-600">የኢትዮጵያ ኤሌክትሪክ ኃይል ኮርፖሬሽን</p>
              <p className="text-xs text-gray-500 mt-1">"Powering Ethiopia's Future"</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <div className="pt-4">
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={logout}
        >
          Sign Out
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 pb-4 space-y-1">
        <p>EEU CMS Version 1.0.0</p>
        <p>© 2024 Ethiopian Electric Utility</p>
        <p>Designed by WORKU MESAFINT ADDIS [504530]</p>
      </div>
    </div>
  );
}