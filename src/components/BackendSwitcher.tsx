import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  Database, 
  Zap, 
  Shield, 
  Activity, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

interface BackendOption {
  id: 'google' | 'supabase';
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'online' | 'offline' | 'checking';
  features: string[];
  pros: string[];
  cons: string[];
}

interface BackendSwitcherProps {
  currentBackend: 'google' | 'supabase';
  onBackendChange: (backend: 'google' | 'supabase') => void;
  onHealthCheck: (backend: 'google' | 'supabase') => Promise<boolean>;
}

export function BackendSwitcher({ 
  currentBackend, 
  onBackendChange, 
  onHealthCheck 
}: BackendSwitcherProps) {
  const [backends, setBackends] = useState<BackendOption[]>([
    {
      id: 'google',
      name: 'Google Apps Script',
      description: 'Current implementation with Google Sheets storage',
      icon: <Database className="h-5 w-5" />,
      status: 'checking',
      features: ['Google Sheets Integration', 'JSONP Support', 'Demo Fallback', 'Optimistic Updates'],
      pros: ['Quick setup', 'No server costs', 'Google ecosystem'],
      cons: ['Rate limits', 'Slower responses', 'Limited scalability']
    },
    {
      id: 'supabase',
      name: 'Supabase Backend',
      description: 'Enhanced backend with PostgreSQL and real-time features',
      icon: <Zap className="h-5 w-5" />,
      status: 'checking',
      features: ['PostgreSQL Database', 'Real-time Updates', 'Built-in Auth', 'Edge Functions'],
      pros: ['Real-time updates', 'Better performance', 'Scalable', 'Built-in security'],
      cons: ['Requires setup', 'More complex', 'Potential costs']
    }
  ]);

  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setIsChecking(true);
    
    const updatedBackends = await Promise.all(
      backends.map(async (backend) => {
        try {
          const isOnline = await onHealthCheck(backend.id);
          return {
            ...backend,
            status: isOnline ? 'online' as const : 'offline' as const
          };
        } catch (error) {
          return {
            ...backend,
            status: 'offline' as const
          };
        }
      })
    );

    setBackends(updatedBackends);
    setIsChecking(false);
  };

  const handleBackendSwitch = async (backendId: 'google' | 'supabase') => {
    if (backendId === currentBackend) return;

    // Check if target backend is online
    const targetBackend = backends.find(b => b.id === backendId);
    if (targetBackend?.status === 'offline') {
      alert(`Cannot switch to ${targetBackend.name} - backend is offline`);
      return;
    }

    onBackendChange(backendId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Activity className="h-4 w-4 text-orange-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-orange-900">Backend Configuration</h3>
          <p className="text-sm text-gray-600">Choose between Google Apps Script and Supabase backend</p>
        </div>
        <Button 
          onClick={checkBackendHealth} 
          disabled={isChecking}
          variant="outline"
          size="sm"
        >
          {isChecking ? (
            <>
              <Activity className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Activity className="h-4 w-4 mr-2" />
              Check Status
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {backends.map((backend) => (
          <Card 
            key={backend.id}
            className={`relative transition-all duration-200 ${
              currentBackend === backend.id 
                ? 'ring-2 ring-orange-500 border-orange-200' 
                : 'hover:shadow-md'
            }`}
          >
            {currentBackend === backend.id && (
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-orange-500 text-white">Active</Badge>
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {backend.icon}
                  <div>
                    <CardTitle className="text-lg">{backend.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(backend.status)}
                      {getStatusBadge(backend.status)}
                    </div>
                  </div>
                </div>
              </div>
              <CardDescription className="text-sm">
                {backend.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Features</h5>
                <div className="flex flex-wrap gap-1">
                  {backend.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <h6 className="text-xs font-medium text-green-700 mb-1 flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Advantages
                  </h6>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {backend.pros.map((pro, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h6 className="text-xs font-medium text-orange-700 mb-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Considerations
                  </h6>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {backend.cons.map((con, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1 h-1 bg-orange-500 rounded-full mr-2"></div>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={currentBackend === backend.id}
                    onCheckedChange={() => handleBackendSwitch(backend.id)}
                    disabled={backend.status === 'offline' || isChecking}
                  />
                  <span className="text-sm text-gray-700">
                    {currentBackend === backend.id ? 'Active' : 'Switch to this backend'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert className="border-orange-200 bg-orange-50">
        <Shield className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Backend Comparison:</strong> The Google Apps Script backend provides quick setup and demo capabilities, 
          while the Supabase backend offers real-time features, better performance, and enhanced security. 
          Both backends maintain data compatibility for seamless switching.
        </AlertDescription>
      </Alert>

      {currentBackend === 'supabase' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Supabase Features Active:</strong> Real-time complaint updates, enhanced authentication, 
            PostgreSQL database with ACID compliance, and improved API performance are now available.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Multi-tenant Support</p>
                <p className="text-xs text-gray-600">Both backends support role-based access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Response Time</p>
                <p className="text-xs text-gray-600">
                  Google: ~2-3s | Supabase: ~200-500ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Data Storage</p>
                <p className="text-xs text-gray-600">
                  Google: Sheets | Supabase: PostgreSQL
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}