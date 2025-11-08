/**
 * Horizon Log - ROE Event Timeline
 *
 * Displays chronological log of all ROE operations with:
 * - Semantic label filtering
 * - RI trajectory visualization
 * - Event type categorization
 * - Exportable event data
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Activity,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Circle,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

interface HorizonEvent {
  id: string;
  created_at: string;
  user_id: string;
  event_type: string;
  module_id: string;
  payload: Record<string, any>;
  semantic_labels: string[];
  resonance_index: number | null;
}

interface HorizonLogProps {
  userId: string;
  limit?: number;
  className?: string;
}

export function HorizonLog({ userId, limit = 50, className = '' }: HorizonLogProps) {
  const [events, setEvents] = useState<HorizonEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<HorizonEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [userId, limit]);

  useEffect(() => {
    applyFilters();
  }, [events, selectedLabels]);

  async function fetchEvents() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('roe_horizon_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      if (!data) throw new Error('No events found');

      setEvents(data);

      const labelSet = new Set<string>();
      data.forEach(event => {
        event.semantic_labels?.forEach(label => labelSet.add(label));
      });
      setAvailableLabels(Array.from(labelSet).sort());
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load horizon log');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    if (selectedLabels.size === 0) {
      setFilteredEvents(events);
      return;
    }

    const filtered = events.filter(event =>
      event.semantic_labels?.some(label => selectedLabels.has(label))
    );
    setFilteredEvents(filtered);
  }

  function toggleLabel(label: string) {
    setSelectedLabels(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  function toggleEventExpand(eventId: string) {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }

  function getEventIcon(eventType: string) {
    if (eventType.includes('error') || eventType.includes('fail')) {
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
    if (eventType.includes('success') || eventType.includes('complete')) {
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    }
    if (eventType.includes('warn')) {
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
    return <Circle className="w-4 h-4 text-blue-400" />;
  }

  function getEventTypeColor(eventType: string): string {
    if (eventType.includes('error') || eventType.includes('fail')) return 'text-red-400';
    if (eventType.includes('success') || eventType.includes('complete')) return 'text-green-400';
    if (eventType.includes('warn')) return 'text-yellow-400';
    return 'text-blue-400';
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  function exportEvents() {
    const dataStr = JSON.stringify(filteredEvents, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horizon-log-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
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
        <p className="text-red-400">Error loading horizon log: {error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">Horizon Log</h3>
        <p className="text-slate-400">No events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Horizon Log</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm text-white"
          >
            <Filter className="w-4 h-4" />
            Filters
            {selectedLabels.size > 0 && (
              <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                {selectedLabels.size}
              </span>
            )}
          </button>
          <button
            onClick={exportEvents}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm text-white"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
          <div className="text-sm text-slate-300 mb-3">Filter by semantic labels:</div>
          <div className="flex flex-wrap gap-2">
            {availableLabels.map(label => (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedLabels.has(label)
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {selectedLabels.size > 0 && (
            <button
              onClick={() => setSelectedLabels(new Set())}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="text-sm text-slate-400 mb-4">
        Showing {filteredEvents.length} of {events.length} events
      </div>

      <div className="space-y-2">
        {filteredEvents.map(event => {
          const isExpanded = expandedEvents.has(event.id);

          return (
            <div
              key={event.id}
              className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getEventIcon(event.event_type)}
                    <span className={`font-medium ${getEventTypeColor(event.event_type)}`}>
                      {event.event_type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatTimestamp(event.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <span>Module: {event.module_id}</span>
                    {event.resonance_index !== null && (
                      <span className="text-blue-400">RI: {event.resonance_index.toFixed(2)}</span>
                    )}
                  </div>

                  {event.semantic_labels && event.semantic_labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {event.semantic_labels.map(label => (
                        <span
                          key={label}
                          className="px-2 py-0.5 bg-slate-600 text-slate-300 rounded text-xs"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleEventExpand(event.id)}
                  className="text-slate-400 hover:text-white transition-colors ml-4"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="text-sm">
                    <div className="text-slate-400 mb-2">Payload:</div>
                    <pre className="bg-slate-900/50 p-3 rounded text-xs text-slate-300 overflow-x-auto">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                  <div className="text-xs text-slate-500 mt-3">
                    Event ID: {event.id}
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
