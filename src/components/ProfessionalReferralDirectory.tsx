/**
 * Professional Referral Directory - Bridge to Professional Care
 *
 * Intelligent professional matching interface that helps users
 * find and connect with verified mental health professionals.
 *
 * Features:
 * - AI-powered professional matching
 * - Specialty filtering
 * - Insurance compatibility
 * - Urgency-aware recommendations
 * - Privacy-preserved referral requests
 */

import { useState, useEffect } from 'react';
import { professionalReferralService } from '../services/roe/ProfessionalReferralService';
import {
  Heart,
  Award,
  MapPin,
  Video,
  CheckCircle2,
  Send,
  AlertCircle,
  Loader2,
  Filter,
  Star
} from 'lucide-react';

interface ProfessionalProfile {
  id: string;
  name: string;
  credentials: string[];
  specialties: string[];
  bio: string;
  approach: string;
  verified: boolean;
  acceptingClients: boolean;
  contactMethod: any;
  location: string;
  remoteAvailable: boolean;
  insuranceAccepted: string[];
}

interface ProfessionalMatch {
  professional: ProfessionalProfile;
  matchScore: number;
  matchReasons: string[];
}

interface ProfessionalReferralDirectoryProps {
  userId: string;
  className?: string;
}

export function ProfessionalReferralDirectory({
  userId,
  className = ''
}: ProfessionalReferralDirectoryProps) {
  const [matches, setMatches] = useState<ProfessionalMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [referralForm, setReferralForm] = useState({
    reason: '',
    urgency: 'moderate' as 'low' | 'moderate' | 'high' | 'crisis',
    contactPreference: { email: '', phone: '' }
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    primaryConcerns: [] as string[],
    insuranceProvider: '',
    remoteOnly: false
  });

  useEffect(() => {
    loadMatches();
  }, [userId]);

  async function loadMatches() {
    try {
      setLoading(true);

      const userNeeds = {
        primaryConcerns: filters.primaryConcerns.length > 0
          ? filters.primaryConcerns
          : ['anxiety', 'depression', 'trauma'],
        urgencyLevel: 'moderate' as any,
        insuranceProvider: filters.insuranceProvider || undefined,
        remoteOnly: filters.remoteOnly
      };

      const professionalMatches = await professionalReferralService.findMatches(
        userId,
        userNeeds,
        10
      );

      setMatches(professionalMatches);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReferralSubmit() {
    if (!selectedProfessional || !referralForm.reason.trim()) {
      alert('Please fill out all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const referralId = await professionalReferralService.createReferral({
        userId,
        professionalId: selectedProfessional,
        reason: referralForm.reason,
        urgency: referralForm.urgency,
        contactPreference: referralForm.contactPreference
      });

      if (referralId) {
        alert('Referral request submitted successfully!');
        setSelectedProfessional(null);
        setReferralForm({
          reason: '',
          urgency: 'moderate',
          contactPreference: { email: '', phone: '' }
        });
      } else {
        alert('Failed to submit referral. Please try again.');
      }
    } catch (error) {
      console.error('Failed to submit referral:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
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
              <div key={i} className="h-48 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-semibold text-white">Professional Support</h3>
            </div>
            <p className="text-sm text-slate-400">
              Connect with verified mental health professionals matched to your needs
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded-lg space-y-3">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Primary Concerns</label>
              <div className="flex flex-wrap gap-2">
                {['anxiety', 'depression', 'trauma', 'ocd', 'relationships'].map(concern => (
                  <button
                    key={concern}
                    onClick={() => {
                      const newConcerns = filters.primaryConcerns.includes(concern)
                        ? filters.primaryConcerns.filter(c => c !== concern)
                        : [...filters.primaryConcerns, concern];
                      setFilters({ ...filters, primaryConcerns: newConcerns });
                    }}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      filters.primaryConcerns.includes(concern)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={filters.remoteOnly}
                onChange={(e) => setFilters({ ...filters, remoteOnly: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm text-slate-300">Remote/telehealth only</label>
            </div>

            <button
              onClick={loadMatches}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>

      {/* Professionals List */}
      <div className="p-6 space-y-4 max-h-[800px] overflow-y-auto">
        {matches.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <p>No professionals found matching your criteria</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          matches.map(match => (
            <div
              key={match.professional.id}
              className="bg-slate-700/50 rounded-lg p-5 border border-slate-600 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-white">
                      {match.professional.name}
                    </h4>
                    {match.professional.verified && (
                      <CheckCircle2 className="w-5 h-5 text-green-400" title="Verified" />
                    )}
                    <span className={`text-xs font-medium ${getMatchColor(match.matchScore)}`}>
                      {getMatchLabel(match.matchScore)} ({(match.matchScore * 100).toFixed(0)}%)
                    </span>
                  </div>

                  {/* Credentials */}
                  <div className="flex items-center gap-2 mb-3">
                    {match.professional.credentials.map((cred, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs font-medium"
                      >
                        {cred}
                      </span>
                    ))}
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {match.professional.specialties.slice(0, 5).map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-600 text-slate-200 rounded-full text-xs"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                    {match.professional.bio}
                  </p>

                  {/* Approach */}
                  {match.professional.approach && (
                    <p className="text-xs text-slate-400 italic mb-3">
                      Approach: {match.professional.approach}
                    </p>
                  )}

                  {/* Match Reasons */}
                  <div className="space-y-1 mb-3">
                    {match.matchReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <Star className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {match.professional.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{match.professional.location}</span>
                      </div>
                    )}
                    {match.professional.remoteAvailable && (
                      <div className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        <span>Remote available</span>
                      </div>
                    )}
                    {match.professional.acceptingClients ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Accepting clients</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>Not accepting clients</span>
                      </div>
                    )}
                  </div>

                  {/* Insurance */}
                  {match.professional.insuranceAccepted.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      <span className="font-medium">Insurance:</span>{' '}
                      {match.professional.insuranceAccepted.slice(0, 3).join(', ')}
                      {match.professional.insuranceAccepted.length > 3 && ' +more'}
                    </div>
                  )}
                </div>
              </div>

              {/* Request Referral Button */}
              {match.professional.acceptingClients && (
                <button
                  onClick={() => setSelectedProfessional(match.professional.id)}
                  className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Request Referral
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Referral Form Modal */}
      {selectedProfessional && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Request Referral</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Reason for seeking support *
                </label>
                <textarea
                  value={referralForm.reason}
                  onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })}
                  placeholder="Briefly describe what you're looking for help with..."
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Urgency level</label>
                <select
                  value={referralForm.urgency}
                  onChange={(e) =>
                    setReferralForm({ ...referralForm, urgency: e.target.value as any })
                  }
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low - Exploring options</option>
                  <option value="moderate">Moderate - Ready to start soon</option>
                  <option value="high">High - Need support quickly</option>
                  <option value="crisis">Crisis - Urgent need</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Contact email (optional)
                </label>
                <input
                  type="email"
                  value={referralForm.contactPreference.email}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      contactPreference: { ...referralForm.contactPreference, email: e.target.value }
                    })
                  }
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedProfessional(null)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReferralSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-4">
              Your request will be sent to the professional. They will contact you using your
              preferred method.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
