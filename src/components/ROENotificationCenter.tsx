/**
 * ROE Notification Center - Real-time Event Notifications
 *
 * Displays real-time notifications for ROE events:
 * - Branch creation
 * - RI updates
 * - Harmonization triggers
 * - System events
 */

import { useRealtimeROE } from '../hooks/useRealtimeROE';
import { Bell, X, Activity, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

interface ROENotificationCenterProps {
  userId: string | null;
  className?: string;
}

export function ROENotificationCenter({ userId, className = '' }: ROENotificationCenterProps) {
  const { notifications, isConnected, dismissNotification, clearNotifications } = useRealtimeROE(userId);

  if (!userId) return null;

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'branch_created':
        return <Activity className="w-4 h-4 text-blue-400" />;
      case 'ri_updated':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'harmonization':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Zap className="w-4 h-4 text-purple-400" />;
    }
  }

  function getNotificationColor(type: string) {
    switch (type) {
      case 'branch_created':
        return 'border-blue-500/50 bg-blue-900/20';
      case 'ri_updated':
        return 'border-green-500/50 bg-green-900/20';
      case 'harmonization':
        return 'border-yellow-500/50 bg-yellow-900/20';
      default:
        return 'border-purple-500/50 bg-purple-900/20';
    }
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className={`${className}`}>
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No new notifications</p>
              <p className="text-xs mt-1">
                {isConnected ? 'Listening for ROE events...' : 'Connecting...'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getNotificationColor(notification.type)} hover:bg-slate-700/30 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{notification.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Status */}
        <div className="p-3 bg-slate-900/50 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <span className="text-slate-500">{notifications.length} active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
