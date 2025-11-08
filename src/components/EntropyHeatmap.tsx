/**
 * Entropy Heatmap - System Stability Over Time
 *
 * Visual heatmap showing entropy levels across different time periods.
 * Helps identify stability patterns and harmonization effectiveness.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface EntropyDataPoint {
  timestamp: string;
  entropy: number;
  status: 'stable' | 'elevated' | 'critical';
  components: {
    branchDivergence: number;
    riVariance: number;
    fieldFragmentation: number;
  };
}

interface EntropyHeatmapProps {
  userId: string;
  days?: number;
  className?: string;
}

export function EntropyHeatmap({ userId, days = 14, className = '' }: EntropyHeatmapProps) {
  const [data, setData] = useState<EntropyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntropyHistory();
  }, [userId, days]);

  async function fetchEntropyHistory() {
    try {
      setLoading(true);
      setError(null);

      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Fetch harmonization logs which contain entropy calculations
      const { data: logs, error: logsError } = await supabase
        .from('builders_log')
        .select('created_at, context')
        .eq('user_id', userId)
        .eq('event_type', 'harmonization_cycle')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: true });

      if (logsError) throw logsError;

      if (!logs || logs.length === 0) {
        // Generate synthetic entropy data from branches
        await generateSyntheticEntropy();
        return;
      }

      const entropyPoints: EntropyDataPoint[] = logs.map(log => ({
        timestamp: log.created_at,
        entropy: log.context?.entropy?.overallEntropy || 0,
        status: log.context?.entropy?.status || 'stable',
        components: {
          branchDivergence: log.context?.entropy?.branchDivergence || 0,
          riVariance: log.context?.entropy?.riVariance || 0,
          fieldFragmentation: log.context?.entropy?.fieldFragmentation || 0
        }
      }));

      setData(entropyPoints);
    } catch (err) {
      console.error('Failed to fetch entropy history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load heatmap');
    } finally {
      setLoading(false);
    }
  }

  async function generateSyntheticEntropy() {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: branches } = await supabase
      .from('reality_branches')
      .select('created_at, resonance_index')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true });

    if (!branches || branches.length < 2) {
      setData([]);
      return;
    }

    // Group by day and calculate daily entropy
    const dailyEntropy = new Map<string, number[]>();
    branches.forEach(branch => {
      const day = new Date(branch.created_at).toISOString().split('T')[0];
      if (!dailyEntropy.has(day)) {
        dailyEntropy.set(day, []);
      }
      dailyEntropy.get(day)!.push(branch.resonance_index);
    });

    const entropyPoints: EntropyDataPoint[] = [];
    for (const [day, riValues] of dailyEntropy.entries()) {
      if (riValues.length < 2) continue;

      const variance = calculateVariance(riValues);
      const entropy = Math.min(variance / 0.2, 1);

      entropyPoints.push({
        timestamp: `${day}T12:00:00Z`,
        entropy,
        status: entropy > 0.6 ? 'critical' : entropy > 0.3 ? 'elevated' : 'stable',
        components: {
          branchDivergence: entropy * 0.4,
          riVariance: variance,
          fieldFragmentation: entropy * 0.3
        }
      });
    }

    setData(entropyPoints);
  }

  function calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  function getEntropyColor(entropy: number): string {
    if (entropy >= 0.6) return 'bg-red-500';
    if (entropy >= 0.3) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  function getEntropyOpacity(entropy: number): string {
    const opacity = Math.max(0.2, Math.min(1, entropy + 0.2));
    return `opacity-${Math.round(opacity * 100)}`;
  }

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/50 rounded-lg p-6 ${className}`}>
        <p className="text-red-400">Error loading heatmap: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">Entropy Heatmap</h3>
        <p className="text-slate-400">
          Not enough data to show entropy patterns. Use the system more to build history.
        </p>
      </div>
    );
  }

  const avgEntropy = data.reduce((sum, d) => sum + d.entropy, 0) / data.length;
  const criticalCount = data.filter(d => d.status === 'critical').length;
  const elevatedCount = data.filter(d => d.status === 'elevated').length;
  const stableCount = data.filter(d => d.status === 'stable').length;

  return (
    <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Entropy Heatmap</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-slate-300">{stableCount} stable</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300">{elevatedCount} elevated</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-slate-300">{criticalCount} critical</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-slate-400 mb-2">System Stability Overview</div>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400">Avg Entropy:</span>
            <span className={`ml-2 font-semibold ${
              avgEntropy > 0.6 ? 'text-red-400' :
              avgEntropy > 0.3 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {avgEntropy.toFixed(3)}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Stability:</span>
            <span className="ml-2 font-semibold text-blue-400">
              {((stableCount / data.length) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-6">
        {data.map((point, index) => {
          const date = new Date(point.timestamp);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = date.getDate();

          return (
            <div
              key={index}
              className="relative group"
            >
              <div
                className={`
                  ${getEntropyColor(point.entropy)}
                  ${getEntropyOpacity(point.entropy)}
                  rounded-lg p-3 aspect-square flex flex-col items-center justify-center
                  transition-all hover:scale-105 cursor-pointer
                `}
              >
                <div className="text-xs text-white font-medium">{dayName}</div>
                <div className="text-lg text-white font-bold">{dayNum}</div>
                <div className="text-xs text-white opacity-80">
                  {point.entropy.toFixed(2)}
                </div>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white whitespace-nowrap shadow-xl">
                  <div className="font-semibold mb-2">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div>Status: <span className={
                    point.status === 'critical' ? 'text-red-400' :
                    point.status === 'elevated' ? 'text-yellow-400' : 'text-green-400'
                  }>{point.status}</span></div>
                  <div>Entropy: {point.entropy.toFixed(3)}</div>
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <div>Divergence: {point.components.branchDivergence.toFixed(2)}</div>
                    <div>RI Variance: {point.components.riVariance.toFixed(2)}</div>
                    <div>Fragmentation: {point.components.fieldFragmentation.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Stable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Elevated</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Critical</span>
          </div>
        </div>
        <div>
          Last {days} days
        </div>
      </div>
    </div>
  );
}
