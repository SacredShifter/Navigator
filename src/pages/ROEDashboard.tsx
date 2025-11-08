/**
 * ROE Dashboard - Reality Optimization Engine Analytics
 *
 * Comprehensive dashboard for tracking:
 * - Resonance Index trends
 * - Field effectiveness metrics
 * - Crisis monitoring
 * - Cohort insights
 * - Biometric feedback (when available)
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  Users,
  AlertTriangle,
  Heart,
  BarChart3,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RITrajectoryChart } from '../components/RITrajectoryChart';
import { EntropyHeatmap } from '../components/EntropyHeatmap';
import { FieldEffectivenessDashboard } from '../components/FieldEffectivenessDashboard';
import { DataExportButton } from '../components/DataExportButton';
import { AuraPresenceOrb } from '../components/AuraPresenceOrb';

interface ROEDashboardProps {
  userId: string;
}

interface DashboardStats {
  current_ri: number;
  ri_trend: 'up' | 'down' | 'stable';
  total_selections: number;
  active_cohorts: number;
  crisis_alerts: number;
  avg_field_effectiveness: number;
}

export function ROEDashboard({ userId }: ROEDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    current_ri: 0.5,
    ri_trend: 'stable',
    total_selections: 0,
    active_cohorts: 0,
    crisis_alerts: 0,
    avg_field_effectiveness: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setError(null);

      // Get current resonance index
      const { data: riData } = await supabase
        .from('roe_resonance_history')
        .select('resonance_index, measured_at')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false })
        .limit(10);

      const currentRI = riData?.[0]?.resonance_index || 0.5;

      // Calculate trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (riData && riData.length >= 2) {
        const recent = riData[0].resonance_index;
        const previous = riData[1].resonance_index;
        const delta = recent - previous;
        if (delta > 0.05) trend = 'up';
        else if (delta < -0.05) trend = 'down';
      }

      // Get total selections
      const { count: selectionsCount } = await supabase
        .from('roe_user_selections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get active cohorts
      const { count: cohortsCount } = await supabase
        .from('roe_cohort_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('active', true);

      // Get unresolved crisis alerts
      const { count: crisisCount } = await supabase
        .from('roe_crisis_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('resolved_at', null);

      // Get average field effectiveness
      const { data: effectivenessData } = await supabase
        .from('roe_field_effectiveness')
        .select('delta_resonance')
        .eq('user_id', userId)
        .not('delta_resonance', 'is', null);

      const avgEffectiveness = effectivenessData && effectivenessData.length > 0
        ? effectivenessData.reduce((sum, item) => sum + (item.delta_resonance || 0), 0) / effectivenessData.length
        : 0;

      setStats({
        current_ri: currentRI,
        ri_trend: trend,
        total_selections: selectionsCount || 0,
        active_cohorts: cohortsCount || 0,
        crisis_alerts: crisisCount || 0,
        avg_field_effectiveness: avgEffectiveness
      });

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userId, timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading your reality dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-gray-100 mb-2">Reality Optimization Dashboard</h1>
            <p className="text-gray-400">Monitor your consciousness navigation and field effectiveness</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Aura Presence Orb */}
            <div className="flex items-center gap-3">
              <AuraPresenceOrb size={48} />
              <span className="text-sm text-gray-400">Aura Active</span>
            </div>

            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-4 py-2 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Export Button */}
            <DataExportButton userId={userId} />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-medium mb-1">Error Loading Data</h3>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Resonance Index */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Resonance Index</h3>
              {getTrendIcon(stats.ri_trend)}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-gray-100">{(stats.current_ri * 100).toFixed(1)}%</span>
              <span className={`text-sm ${getTrendColor(stats.ri_trend)}`}>
                {stats.ri_trend === 'up' ? 'Rising' : stats.ri_trend === 'down' ? 'Declining' : 'Stable'}
              </span>
            </div>
          </div>

          {/* Total Field Selections */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Field Selections</h3>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-gray-100">{stats.total_selections}</span>
              <span className="text-sm text-gray-400">total</span>
            </div>
          </div>

          {/* Active Cohorts */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Active Cohorts</h3>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-gray-100">{stats.active_cohorts}</span>
              <span className="text-sm text-gray-400">groups</span>
            </div>
          </div>

          {/* Crisis Alerts */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Open Alerts</h3>
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-gray-100">{stats.crisis_alerts}</span>
              <span className="text-sm text-gray-400">
                {stats.crisis_alerts === 0 ? 'All clear' : 'needs attention'}
              </span>
            </div>
          </div>

          {/* Average Field Effectiveness */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Avg Effectiveness</h3>
              <BarChart3 className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-gray-100">
                {stats.avg_field_effectiveness >= 0 ? '+' : ''}{(stats.avg_field_effectiveness * 100).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-400">delta RI</span>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-400 uppercase tracking-wide mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left text-sm text-gray-300 hover:text-gray-100 transition-colors">
                View Journey Summary
              </button>
              <button className="w-full text-left text-sm text-gray-300 hover:text-gray-100 transition-colors">
                Explore Cohorts
              </button>
              <button className="w-full text-left text-sm text-gray-300 hover:text-gray-100 transition-colors">
                Find Professional Support
              </button>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* RI Trajectory Chart */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Resonance Trajectory
            </h2>
            <RITrajectoryChart userId={userId} days={timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365} />
          </div>

          {/* Entropy Heatmap */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Coherence Patterns
            </h2>
            <EntropyHeatmap userId={userId} />
          </div>
        </div>

        {/* Field Effectiveness Dashboard */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Field Effectiveness Analysis
          </h2>
          <FieldEffectivenessDashboard userId={userId} />
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data updates in real-time as you navigate probability fields</p>
          <p className="mt-1">All metrics are personalized and privacy-protected</p>
        </div>
      </div>
    </div>
  );
}
