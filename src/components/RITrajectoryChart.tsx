/**
 * RI Trajectory Chart - Resonance Index Over Time
 *
 * Interactive line chart showing user's RI evolution across reality branches.
 * Includes component breakdown (belief coherence, emotion stability, value alignment).
 */

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { supabase } from '../lib/supabase';
import { TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RIDataPoint {
  timestamp: string;
  resonance_index: number;
  belief_coherence?: number;
  emotion_stability?: number;
  value_alignment?: number;
}

interface RITrajectoryChartProps {
  userId: string;
  timeRange?: '24h' | '7d' | '30d' | 'all';
  showComponents?: boolean;
  className?: string;
}

export function RITrajectoryChart({
  userId,
  timeRange = '7d',
  showComponents = false,
  className = ''
}: RITrajectoryChartProps) {
  const [data, setData] = useState<RIDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRIHistory();
  }, [userId, timeRange]);

  async function fetchRIHistory() {
    try {
      setLoading(true);
      setError(null);

      const cutoffDate = getCutoffDate(timeRange);

      // Fetch reality branches with RI values (only existing columns)
      const { data: branches, error: branchError } = await supabase
        .from('reality_branches')
        .select('created_at, resonance_index')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: true });

      if (branchError) throw branchError;

      if (!branches || branches.length === 0) {
        setData([]);
        return;
      }

      // Fetch RI component data from compute-resonance events
      const { data: riEvents, error: eventsError } = await supabase
        .from('roe_horizon_events')
        .select('created_at, payload, resonance_index')
        .eq('user_id', userId)
        .eq('event_type', 'resonance.calculated')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: true });

      if (eventsError) throw eventsError;

      // Merge branch data with component data
      const componentMap = new Map(
        riEvents?.map(e => [
          new Date(e.created_at).toISOString(),
          {
            belief_coherence: e.payload?.components?.beliefCoherence,
            emotion_stability: e.payload?.components?.emotionStability,
            value_alignment: e.payload?.components?.valueAlignment
          }
        ]) || []
      );

      const dataPoints: RIDataPoint[] = branches.map(branch => ({
        timestamp: branch.created_at,
        resonance_index: branch.resonance_index,
        ...componentMap.get(branch.created_at)
      }));

      setData(dataPoints);
    } catch (err) {
      console.error('Failed to fetch RI history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trajectory');
    } finally {
      setLoading(false);
    }
  }

  function getCutoffDate(range: string): string {
    const now = new Date();
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(0).toISOString();
    }
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    if (timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/50 rounded-lg p-6 ${className}`}>
        <p className="text-red-400">Error loading trajectory: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">RI Trajectory</h3>
        <p className="text-slate-400">
          Not enough data to show trajectory. Complete more assessments.
        </p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => formatTimestamp(d.timestamp)),
    datasets: [
      {
        label: 'Resonance Index',
        data: data.map(d => d.resonance_index),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      ...(showComponents && data.some(d => d.belief_coherence !== undefined)
        ? [
            {
              label: 'Belief Coherence',
              data: data.map(d => d.belief_coherence || null),
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.05)',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              pointRadius: 2
            },
            {
              label: 'Emotion Stability',
              data: data.map(d => d.emotion_stability || null),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              pointRadius: 2
            },
            {
              label: 'Value Alignment',
              data: data.map(d => d.value_alignment || null),
              borderColor: 'rgb(251, 146, 60)',
              backgroundColor: 'rgba(251, 146, 60, 0.05)',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              pointRadius: 2
            }
          ]
        : [])
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(203, 213, 225)',
          font: {
            size: 12
          },
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: 'rgb(203, 213, 225)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgb(51, 65, 85)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value !== null ? value.toFixed(3) : 'N/A'}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          font: {
            size: 11
          }
        }
      },
      y: {
        min: 0,
        max: 1,
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          font: {
            size: 11
          },
          callback: function (value: any) {
            return value.toFixed(1);
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    }
  };

  const currentRI = data[data.length - 1]?.resonance_index || 0;
  const previousRI = data[data.length - 2]?.resonance_index;
  const riChange = previousRI ? currentRI - previousRI : 0;
  const riTrend = riChange > 0.02 ? 'up' : riChange < -0.02 ? 'down' : 'stable';

  return (
    <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">RI Trajectory</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-slate-400">Current RI</div>
            <div className={`text-lg font-semibold ${
              currentRI >= 0.75 ? 'text-green-400' :
              currentRI >= 0.5 ? 'text-blue-400' :
              currentRI >= 0.3 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {currentRI.toFixed(3)}
            </div>
          </div>
          {riTrend !== 'stable' && (
            <div className={`text-sm ${riTrend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {riChange > 0 ? '+' : ''}{riChange.toFixed(3)}
            </div>
          )}
        </div>
      </div>

      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-4 text-xs text-slate-400 text-center">
        {data.length} data points over {timeRange}
      </div>
    </div>
  );
}
