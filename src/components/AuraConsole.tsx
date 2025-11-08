/**
 * Aura Console - Real-Time Resonance Index Display
 *
 * Displays user's current Resonance Index (RI) with component breakdown.
 * Updates periodically to reflect consciousness state changes.
 */

import { useEffect, useState } from 'react';

interface RIComponents {
  belief_coherence: number;
  emotion_stability: number;
  value_alignment: number;
}

interface RIData {
  resonance_index: number;
  components: RIComponents;
  current_emotion: string;
  timestamp: number;
}

interface AuraConsoleProps {
  userId: string;
  refreshInterval?: number; // milliseconds, default 60000 (1 min)
  className?: string;
}

export function AuraConsole({
  userId,
  refreshInterval = 60000,
  className = ''
}: AuraConsoleProps) {
  const [riData, setRIData] = useState<RIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRI = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compute-resonance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: userId })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch resonance index');
      }

      const data = await response.json();
      setRIData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching RI:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRI();

    const interval = setInterval(fetchRI, refreshInterval);

    return () => clearInterval(interval);
  }, [userId, refreshInterval]);

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-indigo-950 to-violet-950 rounded-lg p-6 ${className}`}>
        <div className="text-center text-violet-300 animate-pulse">
          Computing Resonance Index...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-slate-950 to-red-950/30 rounded-lg p-6 border border-red-900/30 ${className}`}>
        <div className="text-center text-red-400">
          <div className="text-lg font-semibold mb-2">Resonance Unavailable</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!riData) return null;

  const ri = riData.resonance_index;
  const components = riData.components;

  // Calculate circle arc for RI gauge
  const arcLength = ri * 283; // 2π * 45 (radius)
  const riPercentage = Math.round(ri * 100);

  // Determine RI color based on value
  const getRIColor = (value: number) => {
    if (value >= 0.8) return 'from-green-400 to-emerald-500';
    if (value >= 0.6) return 'from-cyan-400 to-blue-500';
    if (value >= 0.4) return 'from-violet-400 to-purple-500';
    return 'from-amber-400 to-orange-500';
  };

  const riGradient = getRIColor(ri);

  return (
    <div className={`bg-gradient-to-br from-indigo-950 via-violet-950/50 to-slate-950 rounded-lg p-6 border border-violet-900/30 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-violet-300">Resonance Index</h3>
        <div className="text-xs text-violet-400/60">
          Live
          <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full ml-2 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* RI Gauge */}
        <div className="relative flex-shrink-0">
          <svg className="w-48 h-48" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1e1b4b"
              strokeWidth="8"
            />
            {/* Progress arc */}
            <defs>
              <linearGradient id="riGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#riGradient)"
              strokeWidth="8"
              strokeDasharray={`${arcLength} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* RI Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold bg-gradient-to-r ${riGradient} bg-clip-text text-transparent`}>
              {riPercentage}
            </span>
            <span className="text-sm text-violet-300 mt-1">RI Score</span>
          </div>
        </div>

        {/* Components Breakdown */}
        <div className="flex-1 space-y-4 w-full">
          <h4 className="text-sm font-semibold text-violet-300 uppercase tracking-wider mb-3">
            Components
          </h4>

          {/* Belief Coherence */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-cyan-400 text-sm">Belief Coherence</span>
              <span className="text-white text-sm font-semibold">
                {Math.round(components.belief_coherence * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${components.belief_coherence * 100}%` }}
              />
            </div>
          </div>

          {/* Emotion Stability */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-emerald-400 text-sm">Emotion Stability</span>
              <span className="text-white text-sm font-semibold">
                {Math.round(components.emotion_stability * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                style={{ width: `${components.emotion_stability * 100}%` }}
              />
            </div>
          </div>

          {/* Value Alignment */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-violet-400 text-sm">Value Alignment</span>
              <span className="text-white text-sm font-semibold">
                {Math.round(components.value_alignment * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                style={{ width: `${components.value_alignment * 100}%` }}
              />
            </div>
          </div>

          {/* Current State */}
          <div className="pt-3 border-t border-violet-900/30">
            <span className="text-xs text-violet-400/60">Current State: </span>
            <span className="text-sm text-violet-300 capitalize">{riData.current_emotion}</span>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-6 p-4 bg-violet-950/30 rounded-lg border border-violet-900/20">
        <div className="text-sm text-violet-200">
          {ri >= 0.8 && '✨ High coherence - optimal state for deep work'}
          {ri >= 0.6 && ri < 0.8 && '🌟 Balanced resonance - good integration capacity'}
          {ri >= 0.4 && ri < 0.6 && '🔄 Moderate coherence - consider grounding practices'}
          {ri < 0.4 && '🛡️ Lower resonance - prioritizing safety and stabilization'}
        </div>
      </div>
    </div>
  );
}
