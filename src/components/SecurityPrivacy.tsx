import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  ArrowLeft, 
  Lock, 
  Shield, 
  Key, 
  Eye, 
  EyeOff,
  FileText,
  Database,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  User
} from 'lucide-react';
import eeuLogo from 'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png';

interface SecurityPrivacyProps {
  onBack: () => void;
}

export function SecurityPrivacy({ onBack }: SecurityPrivacyProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const securityFeatures = [
    {
      icon: Smartphone,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      enabled: twoFactorEnabled,
      onChange: setTwoFactorEnabled,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      recommended: true
    }
  ];

  const privacySettings = [
    {
      icon: Database,
      title: 'Data Sharing',
      description: 'Allow EEU to improve services using anonymized data',
      enabled: dataSharing,
      onChange: setDataSharing,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: User,
      title: 'Usage Analytics',
      description: 'Help improve the app through usage analytics',
      enabled: analyticsEnabled,
      onChange: setAnalyticsEnabled,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const privacyResources = [
    {
      icon: FileText,
      title: 'Privacy Policy',
      description: 'Read our complete privacy policy',
      action: () => console.log('Open Privacy Policy'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Shield,
      title: 'Data Protection',
      description: 'Learn how we protect your information',
      action: () => console.log('Open Data Protection'),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  const handlePasswordChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    // Handle password change logic here
    console.log('Changing password...');
    alert('Password changed successfully');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
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
            <h1 className="text-xl font-semibold text-gray-900">Security & Privacy</h1>
            <p className="text-sm text-gray-600">Protect your account and manage data privacy</p>
          </div>
        </div>
      </div>

      {/* EEU Security Banner */}
      <Card className="bg-gradient-to-r from-orange-50 to-green-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <img 
              src={eeuLogo} 
              alt="EEU Logo" 
              className="w-10 h-10 object-contain"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">EEU Security Commitment</h3>
              <p className="text-sm text-gray-600">
                Your data security is our priority. All information is encrypted and protected.
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-600" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleSavePassword}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
          >
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Security Features */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">SECURITY FEATURES</h3>
        <div className="space-y-2">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{feature.title}</h4>
                          {feature.recommended && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={feature.onChange}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Privacy Settings */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">PRIVACY SETTINGS</h3>
        <div className="space-y-2">
          {privacySettings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${setting.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${setting.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{setting.title}</h4>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={setting.enabled}
                      onCheckedChange={setting.onChange}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Privacy Resources */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">PRIVACY RESOURCES</h3>
        <div className="space-y-2">
          {privacyResources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between" onClick={resource.action}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${resource.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${resource.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{resource.title}</h4>
                        <p className="text-sm text-gray-600">{resource.description}</p>
                      </div>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Security Status */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Account Secure</h4>
              <p className="text-sm text-green-700">
                Your account follows EEU security best practices
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}