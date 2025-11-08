/**
 * ROE Analytics Dashboard - Master Visualization Hub
 *
 * Comprehensive dashboard integrating all Phase 4 visualizations:
 * - RI Trajectory Chart
 * - Field Effectiveness Dashboard
 * - Entropy Heatmap
 * - Journey Summary Panel
 * - Memory Mirror
 * - Horizon Log
 * - Aura Console
 */

import { useState } from 'react';
import { RITrajectoryChart } from './RITrajectoryChart';
import { FieldEffectivenessDashboard } from './FieldEffectivenessDashboard';
import { EntropyHeatmap } from './EntropyHeatmap';
import { JourneySummaryPanel } from './JourneySummaryPanel';
import { MemoryMirror } from './MemoryMirror';
import { HorizonLog } from './HorizonLog';
import { AuraConsole } from './AuraConsole';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Activity,
  Sparkles,
  History,
  FileText,
  Gauge
} from 'lucide-react';

interface ROEAnalyticsDashboardProps {
  userId: string;
  className?: string;
}

type ViewMode = 'overview' | 'trajectory' | 'fields' | 'entropy' | 'journey' | 'memory' | 'events';

export function ROEAnalyticsDashboard({ userId, className = '' }: ROEAnalyticsDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'trajectory', label: 'RI Trajectory', icon: TrendingUp },
    { id: 'fields', label: 'Field Analytics', icon: BarChart3 },
    { id: 'entropy', label: 'Stability', icon: Activity },
    { id: 'journey', label: 'Journey AI', icon: Sparkles },
    { id: 'memory', label: 'Memory Mirror', icon: History },
    { id: 'events', label: 'Event Log', icon: FileText }
  ] as const;

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Gauge className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">ROE Analytics</h2>
        </div>
        <p className="text-slate-400">
          Comprehensive insights into your consciousness navigation patterns, growth trajectory, and system performance.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-800/50 rounded-lg p-2 mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as ViewMode)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {viewMode === 'overview' && (
          <>
            {/* Top Row: Aura Console + Journey Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AuraConsole userId={userId} refreshInterval={60000} />
              <JourneySummaryPanel userId={userId} timeRange="7d" />
            </div>

            {/* Second Row: RI Trajectory */}
            <RITrajectoryChart userId={userId} timeRange="7d" showComponents={false} />

            {/* Third Row: Field Effectiveness + Entropy Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FieldEffectivenessDashboard userId={userId} limit={5} />
              <EntropyHeatmap userId={userId} days={7} />
            </div>

            {/* Fourth Row: Recent Memory */}
            <MemoryMirror userId={userId} limit={5} />
          </>
        )}

        {viewMode === 'trajectory' && (
          <>
            <RITrajectoryChart userId={userId} timeRange="7d" showComponents={true} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RITrajectoryChart userId={userId} timeRange="24h" showComponents={false} />
              <RITrajectoryChart userId={userId} timeRange="30d" showComponents={false} />
              <AuraConsole userId={userId} refreshInterval={30000} />
            </div>
          </>
        )}

        {viewMode === 'fields' && (
          <>
            <FieldEffectivenessDashboard userId={userId} limit={20} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RITrajectoryChart userId={userId} timeRange="30d" showComponents={false} />
              <EntropyHeatmap userId={userId} days={30} />
            </div>
          </>
        )}

        {viewMode === 'entropy' && (
          <>
            <EntropyHeatmap userId={userId} days={30} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EntropyHeatmap userId={userId} days={7} />
              <div className="space-y-6">
                <RITrajectoryChart userId={userId} timeRange="30d" showComponents={false} />
                <div className="bg-slate-800/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">System Stability Guide</h3>
                  <div className="space-y-3 text-sm text-slate-300">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="font-medium text-white">Stable (Entropy &lt; 0.3)</span>
                      </div>
                      <p className="text-slate-400 ml-5">
                        Healthy coherence across branches. System is learning effectively.
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="font-medium text-white">Elevated (0.3-0.6)</span>
                      </div>
                      <p className="text-slate-400 ml-5">
                        Moderate complexity. Builders monitoring for potential interventions.
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="font-medium text-white">Critical (&gt; 0.6)</span>
                      </div>
                      <p className="text-slate-400 ml-5">
                        High divergence detected. Automated harmonization actions triggered.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {viewMode === 'journey' && (
          <>
            <JourneySummaryPanel userId={userId} timeRange="30d" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RITrajectoryChart userId={userId} timeRange="30d" showComponents={true} />
              <MemoryMirror userId={userId} limit={10} />
            </div>
          </>
        )}

        {viewMode === 'memory' && (
          <>
            <MemoryMirror userId={userId} limit={50} />
            <RITrajectoryChart userId={userId} timeRange="all" showComponents={false} />
          </>
        )}

        {viewMode === 'events' && (
          <>
            <HorizonLog userId={userId} limit={100} />
          </>
        )}
      </div>
    </div>
  );
}
