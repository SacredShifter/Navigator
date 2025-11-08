/**
 * Cohort Discovery - Find Your Community
 *
 * Intelligent cohort matching interface with:
 * - AI-powered match scoring
 * - Match reason explanations
 * - Privacy-first design
 * - One-click joining
 */

import { useState, useEffect } from 'react';
import { cohortMatchingService } from '../services/roe/CohortMatchingService';
import { Users, TrendingUp, Heart, CheckCircle2, Loader2 } from 'lucide-react';

interface CohortMatch {
  cohortId: string;
  cohortName: string;
  description: string;
  matchScore: number;
  matchReasons: string[];
  memberCount: number;
  privacyLevel: string;
}

interface CohortDiscoveryProps {
  userId: string;
  onCohortJoined?: (cohortId: string) => void;
  className?: string;
}

export function CohortDiscovery({ userId, onCohortJoined, className = '' }: CohortDiscoveryProps) {
  const [matches, setMatches] = useState<CohortMatch[]>([]);
  const [userCohorts, setUserCohorts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningCohort, setJoiningCohort] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
    loadUserCohorts();
  }, [userId]);

  async function loadMatches() {
    try {
      setLoading(true);
      const cohortMatches = await cohortMatchingService.findMatches(userId, 10);
      setMatches(cohortMatches);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserCohorts() {
    try {
      const cohorts = await cohortMatchingService.getUserCohorts(userId);
      setUserCohorts(cohorts.map(c => c.cohort_id));
    } catch (error) {
      console.error('Failed to load user cohorts:', error);
    }
  }

  async function handleJoinCohort(cohortId: string) {
    try {
      setJoiningCohort(cohortId);

      const success = await cohortMatchingService.joinCohort(userId, cohortId, 'minimal');

      if (success) {
        setUserCohorts(prev => [...prev, cohortId]);
        onCohortJoined?.(cohortId);
      } else {
        alert('Failed to join cohort. Please try again.');
      }
    } catch (error) {
      console.error('Failed to join cohort:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setJoiningCohort(null);
    }
  }

  function getMatchColor(score: number): string {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-blue-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-slate-400';
  }

  function getMatchLabel(score: number): string {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Moderate Match';
    return 'Potential Match';
  }

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">Find Your Cohort</h3>
        <p className="text-slate-400">
          No cohorts available right now. Check back soon as we're always creating new communities.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Discover Your Cohort</h3>
        </div>
        <p className="text-sm text-slate-400">
          We've matched you with communities based on your journey. All interactions are anonymous.
        </p>
      </div>

      <div className="space-y-4">
        {matches.map(match => {
          const isJoined = userCohorts.includes(match.cohortId);
          const isJoining = joiningCohort === match.cohortId;

          return (
            <div
              key={match.cohortId}
              className="bg-slate-700/50 rounded-lg p-5 border border-slate-600 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-white">{match.cohortName}</h4>
                    <span className={`text-xs font-medium ${getMatchColor(match.matchScore)}`}>
                      {getMatchLabel(match.matchScore)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{match.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{match.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{(match.matchScore * 100).toFixed(0)}% match</span>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  {match.matchReasons.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      <div className="text-xs text-slate-400 font-medium">Why this matches:</div>
                      {match.matchReasons.map((reason, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-600">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Heart className="w-3 h-3" />
                  <span>Anonymous & safe</span>
                </div>

                {isJoined ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Joined
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoinCohort(match.cohortId)}
                    disabled={isJoining}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        Join Cohort
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy Note */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Privacy Protected:</strong> You'll appear with a random
          anonymous name like "BraveExplorer42". No personal information is shared. You can leave
          any cohort at any time.
        </p>
      </div>
    </div>
  );
}
