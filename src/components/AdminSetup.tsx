import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { supabaseApiService } from '../services/supabaseApi';
import eeuLogo from 'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png';

interface AdminSetupProps {
  onSetupComplete: () => void;
}

export function AdminSetup({ onSetupComplete }: AdminSetupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    region: 'Addis Ababa',
    serviceCenter: 'Head Office'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting to create admin account with:', {
        name: formData.name,
        email: formData.email,
        region: formData.region,
        serviceCenter: formData.serviceCenter
      });

      const result = await supabaseApiService.setupAdmin({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        region: formData.region,
        serviceCenter: formData.serviceCenter
      });

      console.log('Admin setup response:', result);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSetupComplete();
        }, 2000);
      } else {
        const errorMessage = result.error || 'Failed to create admin account';
        console.error('Admin setup failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please check your connection and try again.';
      console.error('Admin setup error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <img 
                src={eeuLogo} 
                alt="EEU Logo" 
                className="w-16 h-16 object-contain mx-auto mb-4"
              />
              <CardTitle className="text-green-600">Setup Complete!</CardTitle>
              <CardDescription>
                Your admin account has been created successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Alert>
                <AlertDescription>
                  You can now log in with your admin credentials. 
                  Redirecting to login page...
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center">
            <img 
              src={eeuLogo} 
              alt="Ethiopian Electric Utility" 
              className="w-20 h-20 object-contain mb-2"
            />
            <h1 className="text-2xl font-bold text-orange-500">EEU CMS</h1>
            <p className="text-gray-700 font-medium">Ethiopian Electric Utility</p>
            <p className="text-sm text-gray-600">የኢትዮጵያ ኤሌክትሪክ ኃይል ኮርፖሬሽን</p>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-green-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 font-medium">First Time Setup</p>
            <p className="text-xs text-gray-600">Create the first administrator account</p>
          </div>
        </div>

        {/* Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Admin Account</CardTitle>
            <CardDescription>
              Set up the first administrator account for your EEU system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 p-2 rounded text-xs">
                  <strong>Debug Info:</strong><br />
                  Backend: Supabase<br />
                  API Base: {supabaseApiService.getBaseUrl()}<br />
                  Token: {supabaseApiService.getToken() ? 'Present' : 'None'}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@eeu.gov.et"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+251-11-123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    type="text"
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceCenter">Service Center</Label>
                  <Input
                    id="serviceCenter"
                    type="text"
                    value={formData.serviceCenter}
                    onChange={(e) => handleInputChange('serviceCenter', e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <Alert>
                  <AlertDescription className="text-red-600">
                    <strong>Setup Failed:</strong> {error}
                    {error.includes('Database error') && (
                      <div className="mt-2 text-xs">
                        <strong>Possible solutions:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>Ensure Supabase database tables are created</li>
                          <li>Check the database setup guide</li>
                          <li>Verify Supabase credentials are correct</li>
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Admin Account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <div className="text-xs text-gray-500">
            This will create the first administrator account for the system
          </div>
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer hover:text-gray-800">Troubleshooting</summary>
            <div className="mt-2 text-left bg-gray-50 p-2 rounded">
              <p><strong>If setup fails:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Check that Supabase database tables exist</li>
                <li>Verify your internet connection</li>
                <li>Try refreshing the page</li>
                <li>Check browser console for errors</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}