/**
 * Memory Mirror - Reality Branch Visualization
 *
 * Displays user's consciousness trajectory through reality branches.
 * Shows belief/emotion states, RI values, and probability field selections.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';

interface RealityBranch {
  id: string;
  created_at: string;
  belief_state: {
    profile_id?: string;
    essence_labels?: string[];
  };
  emotion_state: {
    chemical_state?: string;
    regulation_level?: number;
  };
  resonance_index: number;
  probability_field_id: string | null;
  trajectory: any[];
}

interface ProbabilityField {
  id: string;
  name: string;
  outcome_data: {
    type?: string;
    track_name?: string;
    profile_name?: string;
  };
}

interface MemoryMirrorProps {
  userId: string;
  limit?: number;
  className?: string;
}

export function MemoryMirror({ userId, limit = 20, className = '' }: MemoryMirrorProps) {
  const [branches, setBranches] = useState<RealityBranch[]>([]);
  const [fields, setFields] = useState<Map<string, ProbabilityField>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBranches();
  }, [userId, limit]);

  async function fetchBranches() {
    try {
      setLoading(true);
      setError(null);

      const { data: branchData, error: branchError } = await supabase
        .from('reality_branches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (branchError) throw branchError;
      if (!branchData) throw new Error('No branches found');

      setBranches(branchData);

      const fieldIds = branchData
        .map(b => b.probability_field_id)
        .filter(Boolean) as string[];

      if (fieldIds.length > 0) {
        const { data: fieldData, error: fieldError } = await supabase
          .from('probability_fields')
          .select('id, name, outcome_data')
          .in('id', fieldIds);

        if (fieldError) throw fieldError;

        const fieldMap = new Map<string, ProbabilityField>();
        fieldData?.forEach(f => fieldMap.set(f.id, f));
        setFields(fieldMap);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load memory mirror');
    } finally {
      setLoading(false);
    }
  }

  function toggleBranchExpand(branchId: string) {
    setExpandedBranches(prev => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  }

  function getRITrend(currentRI: number, previousRI?: number): 'up' | 'down' | 'stable' {
    if (!previousRI) return 'stable';
    const diff = currentRI - previousRI;
    if (diff > 0.05) return 'up';
    if (diff < -0.05) return 'down';
    return 'stable';
  }

  function getRIColor(ri: number): string {
    if (ri >= 0.75) return 'text-green-400';
    if (ri >= 0.5) return 'text-blue-400';
    if (ri >= 0.3) return 'text-yellow-400';
    return 'text-red-400';
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
        <p className="text-red-400">Error loading memory mirror: {error}</p>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">Memory Mirror</h3>
        <p className="text-slate-400">
          No reality branches yet. Complete an assessment to begin your journey.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Memory Mirror</h3>
        <div className="text-sm text-slate-400">
          {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
        </div>
      </div>

      <div className="space-y-3">
        {branches.map((branch, index) => {
          const previousBranch = branches[index + 1];
          const trend = getRITrend(branch.resonance_index, previousBranch?.resonance_index);
          const field = branch.probability_field_id ? fields.get(branch.probability_field_id) : null;
          const isExpanded = expandedBranches.has(branch.id);

          return (
            <div
              key={branch.id}
              className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer"
              onClick={() => toggleBranchExpand(branch.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        {formatTimestamp(branch.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-semibold ${getRIColor(branch.resonance_index)}`}>
                        RI {branch.resonance_index.toFixed(2)}
                      </span>
                      {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                      {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                      {trend === 'stable' && <Minus className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {field && (
                    <div className="text-sm text-slate-300 mb-2">
                      Selected: <span className="text-blue-400">{field.name}</span>
                    </div>
                  )}

                  {branch.emotion_state?.chemical_state && (
                    <div className="text-xs text-slate-400">
                      State: {branch.emotion_state.chemical_state}
                      {branch.emotion_state.regulation_level !== undefined &&
                        ` • Regulation: ${branch.emotion_state.regulation_level}/10`}
                    </div>
                  )}
                </div>

                <button
                  className="text-slate-400 hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBranchExpand(branch.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-600 space-y-2">
                  <div className="text-sm">
                    <div className="text-slate-400 mb-1">Belief State:</div>
                    <div className="text-slate-300 ml-4">
                      {branch.belief_state?.profile_id && (
                        <div>Profile: {branch.belief_state.profile_id}</div>
                      )}
                      {branch.belief_state?.essence_labels && branch.belief_state.essence_labels.length > 0 && (
                        <div>
                          Labels: {branch.belief_state.essence_labels.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {field?.outcome_data && (
                    <div className="text-sm">
                      <div className="text-slate-400 mb-1">Field Details:</div>
                      <div className="text-slate-300 ml-4">
                        {field.outcome_data.type && <div>Type: {field.outcome_data.type}</div>}
                        {field.outcome_data.track_name && (
                          <div>Track: {field.outcome_data.track_name}</div>
                        )}
                        {field.outcome_data.profile_name && (
                          <div>Profile: {field.outcome_data.profile_name}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {branch.trajectory && branch.trajectory.length > 0 && (
                    <div className="text-sm">
                      <div className="text-slate-400 mb-1">Trajectory:</div>
                      <div className="text-slate-300 ml-4">
                        {branch.trajectory.length} state{branch.trajectory.length !== 1 ? 's' : ''} recorded
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 mt-2">
                    Branch ID: {branch.id}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
