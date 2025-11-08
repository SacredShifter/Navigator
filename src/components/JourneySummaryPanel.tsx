/**
 * Journey Summary Panel - AI-Powered Narrative Insights
 *
 * Displays AI-generated narrative summary of user's consciousness journey
 * with key insights, patterns, and recommendations.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { narrativeSynthesisService } from '../services/roe/NarrativeSynthesisService';
import { Sparkles, RefreshCw, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface JourneySummary {
  narrative: string;
  keyInsights: string[];
  growthAreas: string[];
  patterns: string[];
  recommendations: string[];
}

interface JourneySummaryPanelProps {
  userId: string;
  timeRange?: '7d' | '30d' | 'all';
  className?: string;
}

export function JourneySummaryPanel({
  userId,
  timeRange = '7d',
  className = ''
}: JourneySummaryPanelProps) {
  const [summary, setSummary] = useState<JourneySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateSummary();
  }, [userId, timeRange]);

  async function generateSummary() {
    try {
      setLoading(true);
      setError(null);

      const cutoff = getCutoffDate(timeRange);

      // Fetch reality branches
      const { data: branches, error: branchError } = await supabase
        .from('reality_branches')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: true });

      if (branchError) throw branchError;

      if (!branches || branches.length === 0) {
        setSummary(null);
        return;
      }

      // Get field names
      const fieldIds = [...new Set(branches.map(b => b.probability_field_id).filter(Boolean))];
      const { data: fields } = await supabase
        .from('probability_fields')
        .select('id, name')
        .in('id', fieldIds);

      const fieldNames = new Map(fields?.map(f => [f.id, f.name]) || []);

      // Generate AI summary
      const timeRangeLabel = timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : 'all time';
      const journeySummary = await narrativeSynthesisService.generateJourneySummary(
        branches,
        fieldNames,
        timeRangeLabel
      );

      setSummary(journeySummary);
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  }

  function getCutoffDate(range: string): string {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(0).toISOString();
    }
  }

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/30 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-purple-500/50 rounded"></div>
            <div className="h-6 bg-purple-500/50 rounded w-1/3"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-purple-500/30 rounded"></div>
            <div className="h-4 bg-purple-500/30 rounded w-5/6"></div>
            <div className="h-4 bg-purple-500/30 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/50 rounded-lg p-6 ${className}`}>
        <p className="text-red-400">Error generating summary: {error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">Journey Summary</h3>
        <p className="text-slate-400">
          Not enough data to generate summary. Create more reality branches through assessments and field experiences.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/30 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Your Journey</h3>
        </div>
        <button
          onClick={generateSummary}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm text-white"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Main Narrative */}
      <div className="mb-6 text-slate-200 leading-relaxed">
        {summary.narrative.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-3">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Key Insights */}
      {summary.keyInsights.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-semibold text-white">Key Insights</h4>
          </div>
          <div className="space-y-2">
            {summary.keyInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-yellow-400 mt-1">•</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns */}
      {summary.patterns.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-white">Patterns Detected</h4>
          </div>
          <div className="space-y-2">
            {summary.patterns.map((pattern, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-blue-400 mt-1">•</span>
                <span>{pattern}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Areas */}
      {summary.growthAreas.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-green-400" />
            <h4 className="text-sm font-semibold text-white">Growth Opportunities</h4>
          </div>
          <div className="space-y-2">
            {summary.growthAreas.map((area, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-green-400 mt-1">•</span>
                <span>{area}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {summary.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-white">Recommendations</h4>
          </div>
          <div className="space-y-2">
            {summary.recommendations.map((rec, index) => (
              <div key={index} className="bg-purple-900/20 rounded-lg p-3 text-sm text-slate-200">
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-purple-500/30 text-xs text-slate-400 text-center">
        AI-powered insights synthesized from your journey data
      </div>
    </div>
  );
}
