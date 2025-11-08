/**
 * Safety Overlay - Crisis Support Interface
 *
 * Displays when crisis indicators are detected. Provides immediate access
 * to safety resources, crisis lines, and supportive messaging.
 *
 * CRITICAL: This component prioritizes user safety above all else.
 */

import { useState, useEffect } from 'react';
import { crisisDetectionService } from '../services/roe/CrisisDetectionService';
import { AlertTriangle, Heart, Phone, MessageSquare, X, ExternalLink } from 'lucide-react';

interface SafetyResource {
  type: 'hotline' | 'text' | 'chat' | 'professional';
  name: string;
  contact: string;
  available: string;
  description: string;
}

interface SafetyOverlayProps {
  userId: string;
  onDismiss?: () => void;
}

export function SafetyOverlay({ userId, onDismiss }: SafetyOverlayProps) {
  const [crisisLevel, setCrisisLevel] = useState<any>(null);
  const [resources, setResources] = useState<SafetyResource[]>([]);
  const [safetyPlan, setSafetyPlan] = useState<string[]>([]);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForCrisis();
  }, [userId]);

  async function checkForCrisis() {
    try {
      setLoading(true);
      const crisis = await crisisDetectionService.detectCrisis(userId);

      if (crisis) {
        setCrisisLevel(crisis);
        const safetyResources = crisisDetectionService.getSafetyResources(crisis.severity);
        setResources(safetyResources);

        const plan = await crisisDetectionService.generateSafetyPlan(userId);
        setSafetyPlan(plan);
      }
    } catch (error) {
      console.error('Failed to check crisis status:', error);
    } finally {
      setLoading(false);
    }
  }

  function getResourceIcon(type: string) {
    switch (type) {
      case 'hotline':
        return <Phone className="w-5 h-5" />;
      case 'text':
      case 'chat':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Heart className="w-5 h-5" />;
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/95 border-red-500';
      case 'high':
        return 'bg-orange-900/95 border-orange-500';
      case 'moderate':
        return 'bg-yellow-900/95 border-yellow-500';
      default:
        return 'bg-blue-900/95 border-blue-500';
    }
  }

  function getSeverityMessage(severity: string) {
    switch (severity) {
      case 'critical':
        return 'We\'ve detected signals that you may be in crisis. Your safety is the absolute priority right now.';
      case 'high':
        return 'We\'re concerned about some patterns we\'re seeing. You don\'t have to go through this alone.';
      case 'moderate':
        return 'It looks like you might be struggling. Support is available when you\'re ready.';
      default:
        return 'We wanted to check in with you and share some supportive resources.';
    }
  }

  if (loading || !crisisLevel) {
    return null;
  }

  const isCritical = crisisLevel.severity === 'critical' || crisisLevel.severity === 'high';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`max-w-2xl w-full rounded-lg border-2 ${getSeverityColor(crisisLevel.severity)} shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="p-6 bg-black/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {isCritical ? (
                <AlertTriangle className="w-8 h-8 text-red-400 animate-pulse" />
              ) : (
                <Heart className="w-8 h-8 text-blue-400" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">You Matter</h2>
                <p className="text-slate-300 mt-1">
                  {getSeverityMessage(crisisLevel.severity)}
                </p>
              </div>
            </div>
            {!isCritical && onDismiss && (
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Resources */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Immediate Support Available</h3>
            <div className="space-y-3">
              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-white mt-1">{getResourceIcon(resource.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{resource.name}</h4>
                          <p className="text-sm text-slate-300 mt-1">{resource.description}</p>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                          {resource.available}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={resource.type === 'hotline' ? `tel:${resource.contact}` : '#'}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
                        >
                          {resource.type === 'hotline' && <Phone className="w-4 h-4" />}
                          {resource.type === 'text' && <MessageSquare className="w-4 h-4" />}
                          {resource.contact}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Plan */}
          {safetyPlan.length > 0 && (
            <div>
              <button
                onClick={() => setShowFullPlan(!showFullPlan)}
                className="w-full text-left p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Your Safety Plan</h3>
                  <span className="text-slate-400">
                    {showFullPlan ? '−' : '+'}
                  </span>
                </div>
              </button>

              {showFullPlan && (
                <div className="mt-3 p-4 bg-white/5 rounded-lg">
                  <ol className="space-y-3">
                    {safetyPlan.map((step, index) => (
                      <li key={index} className="flex items-start gap-3 text-slate-200">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Supportive Message */}
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
            <p className="text-slate-200 leading-relaxed">
              <strong className="text-white">Remember:</strong> This feeling is temporary. You've navigated difficult moments before.
              The system has learned from your patterns of resilience. Reach out to someone - you don't have to face this alone.
            </p>
          </div>

          {/* Data-Informed Insight */}
          {crisisLevel.signals.prolongedLowRI && (
            <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
              <p className="text-slate-200 text-sm">
                <strong className="text-white">From your patterns:</strong> When you've been in similar states before,
                reaching out for support and returning to grounding practices helped shift things. Your data shows you
                have the capacity to move through this.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-black/30 border-t border-white/10">
          <div className="flex gap-3">
            {isCritical && (
              <a
                href="tel:988"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call 988 Now
              </a>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
              >
                I'm Safe for Now
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">
            This system is designed to support, not replace, professional mental health care.
          </p>
        </div>
      </div>
    </div>
  );
}
