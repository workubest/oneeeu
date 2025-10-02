import React from 'react';
import { Badge } from './ui/badge';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

interface SystemStatusProps {
  backendStatus: 'online' | 'offline' | 'degraded' | 'unknown';
  cacheSize?: number;
  lastSync?: string | null;
  onRefresh?: () => void;
  showDetails?: boolean;
  backgroundSyncStatus?: {
    enabled: boolean;
    paused: boolean;
    failureCount: number;
    pausedUntil: string | null;
  };
}

export function SystemStatus({ 
  backendStatus, 
  cacheSize = 0, 
  lastSync, 
  onRefresh,
  showDetails = false,
  backgroundSyncStatus
}: SystemStatusProps) {
  const getStatusConfig = () => {
    // Adjust status based on background sync issues
    let adjustedStatus = backendStatus;
    let titleSuffix = '';
    
    if (backgroundSyncStatus?.paused && backgroundSyncStatus.failureCount >= 5) {
      adjustedStatus = 'degraded';
      titleSuffix = ' (Background sync paused due to repeated failures)';
    } else if (backgroundSyncStatus?.failureCount >= 3) {
      titleSuffix = ' (Background sync experiencing issues)';
    }

    switch (adjustedStatus) {
      case 'online':
        return {
          icon: Wifi,
          label: 'Live',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          title: `Connected to live backend${titleSuffix}`
        };
      case 'offline':
        return {
          icon: WifiOff,
          label: 'Demo',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          title: `Backend unavailable - using demo data${titleSuffix}`
        };
      case 'degraded':
        return {
          icon: AlertTriangle,
          label: 'Issues',
          variant: 'destructive' as const,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
          title: `Backend connection degraded${titleSuffix}`
        };
      default:
        return {
          icon: RefreshCw,
          label: '...',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          title: `Connection status unknown${titleSuffix}`
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (!showDetails) {
    return (
      <Badge 
        variant={config.variant}
        className={`flex items-center gap-1 px-2 py-1 text-xs cursor-pointer ${config.className}`}
        title={config.title}
        onClick={onRefresh}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <Badge 
          variant={config.variant}
          className={`flex items-center gap-1 px-2 py-1 text-xs ${config.className}`}
          title={config.title}
        >
          <Icon className="w-3 h-3" />
          {config.label}
        </Badge>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
      
      {showDetails && (
        <div className="text-xs text-gray-600 space-y-1">
          <div>Cache: {cacheSize} items</div>
          {lastSync && (
            <div>
              Last sync: {new Date(lastSync).toLocaleTimeString()}
            </div>
          )}
          {backgroundSyncStatus && (
            <div className="space-y-1 pt-1 border-t border-gray-200">
              <div>Background: {backgroundSyncStatus.enabled ? 'Enabled' : 'Disabled'}</div>
              {backgroundSyncStatus.paused && (
                <div className="text-orange-600">
                  Paused until {backgroundSyncStatus.pausedUntil ? 
                    new Date(backgroundSyncStatus.pausedUntil).toLocaleTimeString() : 'manual resume'}
                </div>
              )}
              {backgroundSyncStatus.failureCount > 0 && (
                <div className="text-red-600">
                  Failures: {backgroundSyncStatus.failureCount}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}