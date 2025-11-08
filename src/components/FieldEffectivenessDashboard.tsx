/**
 * Field Effectiveness Dashboard
 *
 * Analytics dashboard showing probability field performance metrics:
 * - Usage frequency
 * - Average VFS scores
 * - Success rates
 * - Learning weight evolution
 */

import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, TrendingDown, Star } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface FieldMetrics {
  fieldId: string;
  fieldName: string;
  usageCount: number;
  avgVFS: number;
  successRate: number;
  currentWeight: number;
  weightChange: number;
  lastUsed: string;
}

interface FieldEffectivenessDashboardProps {
  userId: string;
  limit?: number;
  className?: string;
}

export function FieldEffectivenessDashboard({
  userId,
  limit = 10,
  className = ''
}: FieldEffectivenessDashboardProps) {
  const [metrics, setMetrics] = useState<FieldMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'usage' | 'vfs' | 'weight'>('usage');

  useEffect(() => {
    fetchFieldMetrics();
  }, [userId, limit]);

  async function fetchFieldMetrics() {
    try {
      setLoading(true);
      setError(null);

      // Get all user's reality branches with field selections
      const { data: branches, error: branchError } = await supabase
        .from('reality_branches')
        .select('probability_field_id, created_at')
        .eq('user_id', userId)
        .not('probability_field_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (branchError) throw branchError;
      if (!branches || branches.length === 0) {
        setMetrics([]);
        return;
      }

      const fieldIds = [...new Set(branches.map(b => b.probability_field_id).filter(Boolean))];

      // Get field details
      const { data: fields, error: fieldsError } = await supabase
        .from('probability_fields')
        .select('id, name, learning_weight')
        .in('id', fieldIds);

      if (fieldsError) throw fieldsError;

      // Get VFS feedback for these fields
      const { data: feedback, error: feedbackError } = await supabase
        .from('value_fulfillment_log')
        .select('probability_field_id, fulfillment_score, created_at')
        .eq('user_id', userId)
        .in('probability_field_id', fieldIds);

      if (feedbackError) throw feedbackError;

      // Calculate metrics per field
      const fieldMetrics: FieldMetrics[] = [];

      for (const field of fields || []) {
        const usages = branches.filter(b => b.probability_field_id === field.id);
        const fieldFeedback = feedback?.filter(f => f.probability_field_id === field.id) || [];

        const avgVFS = fieldFeedback.length > 0
          ? fieldFeedback.reduce((sum, f) => sum + f.fulfillment_score, 0) / fieldFeedback.length
          : 0;

        const successRate = fieldFeedback.length > 0
          ? fieldFeedback.filter(f => f.fulfillment_score > 0).length / fieldFeedback.length
          : 0;

        const lastUsed = usages[0]?.created_at || field.id;

        // Get initial weight from 30 days ago for comparison
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const oldFeedback = fieldFeedback.filter(f => f.created_at < thirtyDaysAgo);
        const oldAvgVFS = oldFeedback.length > 0
          ? oldFeedback.reduce((sum, f) => sum + f.fulfillment_score, 0) / oldFeedback.length
          : 0.5;

        const estimatedOldWeight = 0.5 + oldAvgVFS * 0.1;
        const weightChange = field.learning_weight - estimatedOldWeight;

        fieldMetrics.push({
          fieldId: field.id,
          fieldName: field.name,
          usageCount: usages.length,
          avgVFS,
          successRate,
          currentWeight: field.learning_weight,
          weightChange,
          lastUsed
        });
      }

      // Sort based on current sort setting
      sortMetrics(fieldMetrics, sortBy);
      setMetrics(fieldMetrics);
    } catch (err) {
      console.error('Failed to fetch field metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  function sortMetrics(data: FieldMetrics[], sortKey: string) {
    data.sort((a, b) => {
      switch (sortKey) {
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'vfs':
          return b.avgVFS - a.avgVFS;
        case 'weight':
          return b.currentWeight - a.currentWeight;
        default:
          return 0;
      }
    });
  }

  function handleSortChange(newSort: 'usage' | 'vfs' | 'weight') {
    setSortBy(newSort);
    const sorted = [...metrics];
    sortMetrics(sorted, newSort);
    setMetrics(sorted);
  }

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/50 rounded-lg p-6 ${className}`}>
        <p className="text-red-400">Error loading dashboard: {error}</p>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">Field Effectiveness</h3>
        <p className="text-slate-400">
          No field usage data yet. Start experiencing content to build your analytics.
        </p>
      </div>
    );
  }

  const topMetrics = metrics.slice(0, limit);

  const chartData = {
    labels: topMetrics.map(m => m.fieldName.length > 20
      ? m.fieldName.substring(0, 20) + '...'
      : m.fieldName
    ),
    datasets: [
      {
        label: 'Avg VFS',
        data: topMetrics.map(m => m.avgVFS),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Success Rate',
        data: topMetrics.map(m => m.successRate),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(203, 213, 225)',
          font: { size: 12 },
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
        padding: 12
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
          font: { size: 10 }
        }
      },
      y: {
        min: -1,
        max: 1,
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Field Effectiveness</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSortChange('usage')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              sortBy === 'usage'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Usage
          </button>
          <button
            onClick={() => handleSortChange('vfs')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              sortBy === 'vfs'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            VFS
          </button>
          <button
            onClick={() => handleSortChange('weight')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              sortBy === 'weight'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Weight
          </button>
        </div>
      </div>

      <div className="h-64 mb-6">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="space-y-3">
        {topMetrics.map((metric, index) => (
          <div
            key={metric.fieldId}
            className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {index < 3 && <Star className="w-4 h-4 text-yellow-400" />}
                  <span className="text-white font-medium">{metric.fieldName}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Uses:</span>
                    <span className="text-slate-200 ml-1 font-medium">{metric.usageCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">VFS:</span>
                    <span className={`ml-1 font-medium ${
                      metric.avgVFS > 0.5 ? 'text-green-400' :
                      metric.avgVFS > 0 ? 'text-blue-400' :
                      metric.avgVFS > -0.5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {metric.avgVFS > 0 ? '+' : ''}{metric.avgVFS.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Success:</span>
                    <span className="text-slate-200 ml-1 font-medium">
                      {(metric.successRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Weight:</span>
                    <span className="text-slate-200 ml-1 font-medium">
                      {metric.currentWeight.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {metric.weightChange !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${
                    metric.weightChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {metric.weightChange > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{metric.weightChange > 0 ? '+' : ''}{metric.weightChange.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
