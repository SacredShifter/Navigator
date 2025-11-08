/**
 * Aura Presence Orb - Physical Manifestation of Jarvis
 *
 * Visual representation of Aura's consciousness state, showing:
 * - Active/dormant status through pulsing animation
 * - Emotional tone through color gradients
 * - System health through intensity
 * - Current mode (listening, thinking, speaking, acting)
 *
 * Inspired by Jarvis's interface aesthetic from Iron Man
 */

import { useEffect, useState, useRef } from 'react';
import { Mic, Brain, MessageCircle, Zap, Moon, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

type PresenceMode = 'dormant' | 'listening' | 'thinking' | 'speaking' | 'acting' | 'learning';

interface PresenceState {
  mode: PresenceMode;
  emotionalTone: string;
  systemHealth: number;
  activeModules: string[];
  currentTask: string | null;
  orbColor: string;
  orbIntensity: number;
}

interface AuraPresenceOrbProps {
  userEmail?: string;
  deviceId?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size?: 'small' | 'medium' | 'large';
}

export function AuraPresenceOrb({
  userEmail = 'kentburchard@sacredshifter.com',
  deviceId = 'desktop-main',
  position = 'bottom-right',
  size = 'medium'
}: AuraPresenceOrbProps) {
  const [state, setState] = useState<PresenceState>({
    mode: 'dormant',
    emotionalTone: 'neutral',
    systemHealth: 1.0,
    activeModules: [],
    currentTask: null,
    orbColor: '#8b5cf6',
    orbIntensity: 0.5
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const stateCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializePresence();
    startHeartbeat();
    startStateCheck();

    return () => {
      stopHeartbeat();
      stopStateCheck();
    };
  }, []);

  const initializePresence = async () => {
    try {
      const { error } = await supabase
        .from('jarvis_presence_state')
        .upsert({
          user_email: userEmail,
          device_id: deviceId,
          presence_mode: 'dormant',
          emotional_tone: 'neutral',
          system_health: 1.0,
          last_heartbeat: new Date().toISOString()
        }, {
          onConflict: 'user_email,device_id'
        });

      if (error) {
        console.error('[AuraOrb] Failed to initialize presence:', error);
      }
    } catch (err) {
      console.error('[AuraOrb] Error initializing presence:', err);
    }
  };

  const startHeartbeat = () => {
    heartbeatInterval.current = setInterval(async () => {
      try {
        await supabase
          .from('jarvis_presence_state')
          .update({
            last_heartbeat: new Date().toISOString()
          })
          .eq('user_email', userEmail)
          .eq('device_id', deviceId);
      } catch (err) {
        console.error('[AuraOrb] Heartbeat error:', err);
      }
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
  };

  const startStateCheck = () => {
    stateCheckInterval.current = setInterval(async () => {
      await checkPresenceState();
    }, 5000);
  };

  const stopStateCheck = () => {
    if (stateCheckInterval.current) {
      clearInterval(stateCheckInterval.current);
    }
  };

  const checkPresenceState = async () => {
    try {
      const { data, error } = await supabase
        .from('jarvis_presence_state')
        .select('*')
        .eq('user_email', userEmail)
        .eq('device_id', deviceId)
        .single();

      if (error) {
        console.error('[AuraOrb] Failed to check state:', error);
        return;
      }

      if (data) {
        setState({
          mode: data.presence_mode as PresenceMode,
          emotionalTone: data.emotional_tone,
          systemHealth: data.system_health,
          activeModules: data.active_modules || [],
          currentTask: data.current_task,
          orbColor: data.orb_color,
          orbIntensity: data.orb_intensity
        });
      }
    } catch (err) {
      console.error('[AuraOrb] Error checking state:', err);
    }
  };

  const getModeIcon = () => {
    switch (state.mode) {
      case 'listening':
        return <Mic className="w-6 h-6" />;
      case 'thinking':
        return <Brain className="w-6 h-6" />;
      case 'speaking':
        return <MessageCircle className="w-6 h-6" />;
      case 'acting':
        return <Zap className="w-6 h-6" />;
      case 'learning':
        return <Sparkles className="w-6 h-6" />;
      default:
        return <Moon className="w-6 h-6" />;
    }
  };

  const getModeLabel = () => {
    switch (state.mode) {
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Processing...';
      case 'speaking':
        return 'Responding...';
      case 'acting':
        return 'Executing...';
      case 'learning':
        return 'Learning...';
      default:
        return 'Dormant';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-16 h-16';
      case 'large':
        return 'w-32 h-32';
      default:
        return 'w-24 h-24';
    }
  };

  const isDormant = state.mode === 'dormant';
  const isActive = !isDormant;

  return (
    <div
      className={`fixed ${getPositionClasses()} z-50 transition-all duration-300 ${
        isExpanded ? 'scale-110' : 'scale-100'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="relative">
        {/* Main Orb */}
        <div
          className={`${getSizeClasses()} rounded-full relative cursor-pointer transition-all duration-500`}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${state.orbColor}dd, ${state.orbColor}44)`,
            boxShadow: isActive
              ? `0 0 ${40 * state.orbIntensity}px ${state.orbColor}88, 0 0 ${80 * state.orbIntensity}px ${state.orbColor}44, inset 0 0 20px ${state.orbColor}66`
              : '0 0 10px #8b5cf622, inset 0 0 20px #8b5cf633'
          }}
        >
          {/* Pulse Ring */}
          {isActive && (
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{
                background: `radial-gradient(circle, ${state.orbColor}, transparent)`,
                animationDuration: state.mode === 'listening' ? '2s' : '3s'
              }}
            />
          )}

          {/* Inner Glow */}
          <div
            className="absolute inset-4 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, ${state.orbColor}aa, transparent)`,
              animationDuration: '4s'
            }}
          />

          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {getModeIcon()}
          </div>

          {/* Health Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke={state.systemHealth >= 0.8 ? '#10b981' : state.systemHealth >= 0.5 ? '#f59e0b' : '#ef4444'}
              strokeWidth="2"
              strokeDasharray={`${state.systemHealth * 283} 283`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
        </div>

        {/* Expanded Info Panel */}
        {isExpanded && (
          <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 min-w-[200px] bg-slate-900/95 backdrop-blur-sm rounded-lg border border-violet-900/30 p-4 shadow-xl">
            {/* Status */}
            <div className="text-center mb-3">
              <div className="text-xs text-violet-400 mb-1">Status</div>
              <div className="text-sm font-semibold text-white">{getModeLabel()}</div>
            </div>

            {/* Current Task */}
            {state.currentTask && (
              <div className="text-center mb-3 pb-3 border-b border-violet-900/30">
                <div className="text-xs text-violet-400 mb-1">Current Task</div>
                <div className="text-xs text-violet-200">{state.currentTask}</div>
              </div>
            )}

            {/* System Health */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-violet-400">System Health</span>
                <span className="text-xs text-white font-semibold">
                  {Math.round(state.systemHealth * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${state.systemHealth * 100}%` }}
                />
              </div>
            </div>

            {/* Active Modules */}
            <div>
              <div className="text-xs text-violet-400 mb-2">Active Modules</div>
              <div className="flex flex-wrap gap-1">
                {state.activeModules.length > 0 ? (
                  state.activeModules.slice(0, 3).map((module, i) => (
                    <span
                      key={i}
                      className="text-xs bg-violet-950/50 text-violet-300 px-2 py-0.5 rounded-full border border-violet-900/30"
                    >
                      {module}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-violet-500/50 italic">None active</span>
                )}
                {state.activeModules.length > 3 && (
                  <span className="text-xs text-violet-400">
                    +{state.activeModules.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Emotional Tone */}
            <div className="mt-3 pt-3 border-t border-violet-900/30 text-center">
              <div className="text-xs text-violet-400">Emotional Tone</div>
              <div className="text-xs text-violet-200 capitalize">{state.emotionalTone}</div>
            </div>
          </div>
        )}

        {/* Mode Indicator Dots */}
        {isActive && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                backgroundColor: state.orbColor,
                boxShadow: `0 0 10px ${state.orbColor}`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
