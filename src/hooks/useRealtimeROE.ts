/**
 * useRealtimeROE - Real-time ROE Event Streaming Hook
 *
 * Provides real-time updates for:
 * - New reality branch creation
 * - RI changes
 * - Horizon events
 * - Builders harmonization triggers
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealityBranch {
  id: string;
  created_at: string;
  resonance_index: number;
  probability_field_id: string | null;
}

interface HorizonEvent {
  id: string;
  created_at: string;
  event_type: string;
  resonance_index: number | null;
}

interface RealtimeROEState {
  latestBranch: RealityBranch | null;
  latestEvent: HorizonEvent | null;
  latestRI: number | null;
  isConnected: boolean;
  notifications: ROENotification[];
}

interface ROENotification {
  id: string;
  type: 'branch_created' | 'ri_updated' | 'harmonization' | 'event';
  timestamp: string;
  message: string;
  data: any;
}

export function useRealtimeROE(userId: string | null) {
  const [state, setState] = useState<RealtimeROEState>({
    latestBranch: null,
    latestEvent: null,
    latestRI: null,
    isConnected: false,
    notifications: []
  });

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    let branchChannel: RealtimeChannel | null = null;
    let eventChannel: RealtimeChannel | null = null;

    function setupRealtimeSubscriptions() {
      // Subscribe to reality branches
      branchChannel = supabase
        .channel(`reality_branches:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reality_branches',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newBranch = payload.new as RealityBranch;

            setState(prev => ({
              ...prev,
              latestBranch: newBranch,
              latestRI: newBranch.resonance_index,
              notifications: [
                {
                  id: `notif_${Date.now()}`,
                  type: 'branch_created',
                  timestamp: newBranch.created_at,
                  message: `New reality branch created (RI: ${newBranch.resonance_index.toFixed(2)})`,
                  data: newBranch
                },
                ...prev.notifications.slice(0, 9)
              ]
            }));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'reality_branches',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const updatedBranch = payload.new as RealityBranch;

            setState(prev => {
              if (prev.latestRI !== updatedBranch.resonance_index) {
                return {
                  ...prev,
                  latestRI: updatedBranch.resonance_index,
                  notifications: [
                    {
                      id: `notif_${Date.now()}`,
                      type: 'ri_updated',
                      timestamp: new Date().toISOString(),
                      message: `RI updated to ${updatedBranch.resonance_index.toFixed(2)}`,
                      data: updatedBranch
                    },
                    ...prev.notifications.slice(0, 9)
                  ]
                };
              }
              return prev;
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setState(prev => ({ ...prev, isConnected: true }));
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setState(prev => ({ ...prev, isConnected: false }));
          }
        });

      // Subscribe to horizon events
      eventChannel = supabase
        .channel(`roe_horizon_events:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'roe_horizon_events',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newEvent = payload.new as HorizonEvent;

            let notifType: ROENotification['type'] = 'event';
            let message = `Event: ${newEvent.event_type}`;

            if (newEvent.event_type.includes('harmonization')) {
              notifType = 'harmonization';
              message = 'System harmonization triggered';
            }

            setState(prev => ({
              ...prev,
              latestEvent: newEvent,
              notifications: [
                {
                  id: `notif_${Date.now()}`,
                  type: notifType,
                  timestamp: newEvent.created_at,
                  message,
                  data: newEvent
                },
                ...prev.notifications.slice(0, 9)
              ]
            }));
          }
        )
        .subscribe();

      setChannel(branchChannel);
    }

    setupRealtimeSubscriptions();

    return () => {
      if (branchChannel) {
        supabase.removeChannel(branchChannel);
      }
      if (eventChannel) {
        supabase.removeChannel(eventChannel);
      }
    };
  }, [userId]);

  function clearNotifications() {
    setState(prev => ({ ...prev, notifications: [] }));
  }

  function dismissNotification(id: string) {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  }

  return {
    ...state,
    clearNotifications,
    dismissNotification
  };
}
