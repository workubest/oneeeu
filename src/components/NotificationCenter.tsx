import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle, Clock, Filter, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'complaint' | 'outage' | 'user' | 'maintenance';
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  data?: any;
  expiresAt?: Date;
  persistent?: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onAction?: (notification: Notification) => void;
  maxDisplayCount?: number;
  enableSound?: boolean;
  enableBrowserNotifications?: boolean;
  className?: string;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onAction,
  maxDisplayCount = 50,
  enableSound = true,
  enableBrowserNotifications = true,
  className = ""
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['type'] | Notification['category']>('all');
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(enableBrowserNotifications);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousNotificationCount = useRef(notifications.length);

  // Initialize audio for notifications
  useEffect(() => {
    if (soundEnabled) {
      audioRef.current = new Audio();
      // Use a simple beep sound data URL
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhEIFOvF7WEEUY...';
    }
  }, [soundEnabled]);

  // Request browser notification permission
  useEffect(() => {
    if (browserNotificationsEnabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, [browserNotificationsEnabled]);

  // Handle new notifications
  useEffect(() => {
    const newNotificationCount = notifications.length;
    const hasNewNotifications = newNotificationCount > previousNotificationCount.current;
    
    if (hasNewNotifications) {
      const newNotifications = notifications.slice(0, newNotificationCount - previousNotificationCount.current);
      
      newNotifications.forEach(notification => {
        // Play sound for urgent/high priority notifications
        if (soundEnabled && ['urgent', 'high'].includes(notification.priority)) {
          audioRef.current?.play().catch(console.error);
        }
        
        // Show browser notification
        if (browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.priority === 'urgent'
          });
        }
        
        // Show toast notification
        const toastType = notification.type === 'error' ? 'error' : 
                         notification.type === 'success' ? 'success' : 
                         notification.type === 'warning' ? 'warning' : 'info';
        
        toast[toastType](notification.title, {
          description: notification.message,
          action: notification.actionLabel && onAction ? {
            label: notification.actionLabel,
            onClick: () => onAction(notification)
          } : undefined
        });
      });
    }
    
    previousNotificationCount.current = newNotificationCount;
  }, [notifications, soundEnabled, browserNotificationsEnabled, onAction]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter || notification.category === filter;
  }).slice(0, maxDisplayCount);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const handleSelectNotification = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedNotifications);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    } else {
      setSelectedNotifications(new Set());
    }
  };

  const handleBulkAction = (action: 'read' | 'delete') => {
    selectedNotifications.forEach(id => {
      if (action === 'read') {
        onMarkAsRead(id);
      } else {
        onDelete(id);
      }
    });
    setSelectedNotifications(new Set());
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {/* Filter Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setFilter('all')}
                  >
                    All Notifications
                  </Button>
                  <Button
                    variant={filter === 'unread' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setFilter('unread')}
                  >
                    Unread ({unreadCount})
                  </Button>
                  <Separator />
                  {['info', 'success', 'warning', 'error'].map(type => (
                    <Button
                      key={type}
                      variant={filter === type ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start capitalize"
                      onClick={() => setFilter(type as Notification['type'])}
                    >
                      {getNotificationIcon(type as Notification['type'])}
                      <span className="ml-2">{type}</span>
                    </Button>
                  ))}
                  <Separator />
                  {['system', 'complaint', 'outage', 'user', 'maintenance'].map(category => (
                    <Button
                      key={category}
                      variant={filter === category ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start capitalize"
                      onClick={() => setFilter(category as Notification['category'])}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Bulk Actions */}
            {selectedNotifications.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkAction('read')}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark as Read ({selectedNotifications.size})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('delete')}>
                    <X className="h-4 w-4 mr-2" />
                    Delete ({selectedNotifications.size})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mark All as Read */}
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {filteredNotifications.length > 0 && (
          <div className="p-2 border-b">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedNotifications.size === filteredNotifications.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">
                {selectedNotifications.size > 0 
                  ? `${selectedNotifications.size} selected`
                  : 'Select all'
                }
              </span>
            </div>
          </div>
        )}

        <ScrollArea className="h-96">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredNotifications.map(notification => (
                <Card
                  key={notification.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      onMarkAsRead(notification.id);
                    }
                    if (notification.actionUrl && onAction) {
                      onAction(notification);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedNotifications.has(notification.id)}
                      onCheckedChange={(checked) => handleSelectNotification(notification.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                        <Badge variant="outline" className="text-xs">
                          {notification.category}
                        </Badge>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      
                      <h4 className="font-medium text-sm mb-1 line-clamp-1">
                        {notification.title}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(notification.timestamp)}
                        </div>
                        
                        {notification.actionLabel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onAction) onAction(notification);
                            }}
                          >
                            {notification.actionLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                  Sound
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={browserNotificationsEnabled}
                    onCheckedChange={setBrowserNotificationsEnabled}
                  />
                  Browser
                </label>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}