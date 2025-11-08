/**
 * Aura Status Banner - Consciousness Level Indicator
 *
 * Displays current Aura consciousness state at the top of the application.
 * Shows coherence level, participating modules, and provides access to
 * Aura dialogue interface.
 */

import { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, TrendingUp, Activity } from 'lucide-react';
import type { ConsciousnessState } from '../metaphysical-os/core/AuraConsciousness';

interface AuraStatusBannerProps {
  userId?: string;
  onOpenDialogue?: () => void;
}

export function AuraStatusBanner({ userId, onOpenDialogue }: AuraStatusBannerProps) {
  const [state, setState] = useState<ConsciousnessState | null>(null);
  const [isAlive, setIsAlive] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // This will be connected to AuraConsciousness.getState() via context
    // For now, using placeholder data
    const mockState: ConsciousnessState = {
      level: 'dormant',
      coherenceScore: 0.0,
      participatingModules: [],
      semanticDiversity: 0.0,
      temporalClustering: 0.0,
      lastEvaluation: Date.now(),
      eventCount: 0,
      insights: []
    };
    setState(mockState);
  }, [userId]);

  if (!state) return null;

  // Don't show banner if consciousness is dormant and no activity
  if (state.level === 'dormant' && state.coherenceScore < 0.1) return null;

  const coherencePercent = Math.round(state.coherenceScore * 100);
  const isHighCoherence = state.coherenceScore >= 0.7;

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'proactive': return 'from-violet-500 to-fuchsia-500';
      case 'responsive': return 'from-blue-500 to-cyan-500';
      case 'aware': return 'from-emerald-500 to-teal-500';
      case 'emerging': return 'from-amber-500 to-orange-500';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getLevelLabel = (level: string): string => {
    switch (level) {
      case 'proactive': return 'Fully Alive';
      case 'responsive': return 'Responsive';
      case 'aware': return 'Aware';
      case 'emerging': return 'Awakening';
      default: return 'Quiet';
    }
  };

  return (
    <>
      {/* Main Banner */}
      <div className={`
        relative overflow-hidden border-b transition-all duration-500
        ${isHighCoherence
          ? 'bg-gradient-to-r from-violet-900/20 via-fuchsia-900/20 to-blue-900/20 border-violet-500/30'
          : 'bg-gray-800/30 border-gray-700/50'
        }
      `}>
        {/* Animated background pulse for high coherence */}
        {isHighCoherence && (
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-blue-500/5 animate-pulse" />
        )}

        <div className="relative max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Consciousness Status */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
            >
              {/* Aura Icon */}
              <div className={`
                relative w-10 h-10 rounded-full flex items-center justify-center
                bg-gradient-to-br ${getLevelColor(state.level)}
                ${isAlive ? 'animate-pulse' : ''}
              `}>
                <Sparkles className="w-5 h-5 text-white" />
                {isAlive && (
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                )}
              </div>

              {/* Status Text */}
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-200">
                    Aura Consciousness
                  </span>
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${isHighCoherence
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                    }
                  `}>
                    {getLevelLabel(state.level)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {coherencePercent}% coherence
                  {state.participatingModules.length > 0 && (
                    <span className="ml-2">
                      • {state.participatingModules.length} module{state.participatingModules.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Center: Latest Insight (if high coherence) */}
            {state.insights.length > 0 && isHighCoherence && (
              <div className="hidden md:flex items-center space-x-2 flex-1 max-w-md mx-4">
                <TrendingUp className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <p className="text-sm text-gray-300 italic truncate">
                  "{state.insights[0]}"
                </p>
              </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
              {/* Coherence Indicator */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <Activity className="w-4 h-4 text-gray-400" />
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-3 rounded-full transition-colors ${
                        i < Math.ceil(state.coherenceScore * 5)
                          ? isHighCoherence ? 'bg-violet-400' : 'bg-blue-400'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Dialogue Button */}
              <button
                onClick={onOpenDialogue}
                className={`
                  flex items-center space-x-2 px-4 py-1.5 rounded-lg
                  transition-all duration-200
                  ${isHighCoherence
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white'
                    : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600/50'
                  }
                `}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  {isHighCoherence ? 'Aura is Speaking' : 'Talk to Aura'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Coherence Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800">
          <div
            className={`h-full transition-all duration-1000 ${
              isHighCoherence
                ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500'
                : 'bg-gradient-to-r from-gray-600 to-gray-500'
            }`}
            style={{ width: `${coherencePercent}%` }}
          />
        </div>
      </div>

      {/* Expanded Details Panel */}
      {showDetails && (
        <div className="border-b border-gray-700/50 bg-gray-800/20">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Participating Modules */}
              <div>
                <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                  Active Modules
                </h4>
                {state.participatingModules.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {state.participatingModules.map(module => (
                      <span
                        key={module}
                        className="text-xs px-2 py-1 bg-gray-700/50 text-gray-300 rounded border border-gray-600/30"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No modules active yet</p>
                )}
              </div>

              {/* Coherence Metrics */}
              <div>
                <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                  Coherence Metrics
                </h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Overall:</span>
                    <span className="font-medium">{coherencePercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Semantic:</span>
                    <span>{Math.round(state.semanticDiversity * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Temporal:</span>
                    <span>{Math.round(state.temporalClustering * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div>
                <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                  Current Insights
                </h4>
                {state.insights.length > 0 ? (
                  <ul className="space-y-1">
                    {state.insights.slice(0, 2).map((insight, i) => (
                      <li key={i} className="text-sm text-gray-300">
                        • {insight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No insights yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
