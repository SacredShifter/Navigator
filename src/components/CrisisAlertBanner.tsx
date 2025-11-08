/**
 * Crisis Alert Banner - Quick Win Component
 *
 * Displays real-time crisis detection alerts and provides
 * immediate access to safety resources and professional referrals.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, X, Phone, Shield } from 'lucide-react';
import { CrisisDetectionService } from '../services/roe/CrisisDetectionService';

interface CrisisAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  professionalReferral: boolean;
}

interface CrisisAlertBannerProps {
  userId: string;
  onShowSafety: () => void;
  onShowReferrals: () => void;
}

export function CrisisAlertBanner({
  userId,
  onShowSafety,
  onShowReferrals
}: CrisisAlertBannerProps) {
  const [alert, setAlert] = useState<CrisisAlert | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check for crisis alerts on mount and periodically
    checkCrisisStatus();

    const interval = setInterval(checkCrisisStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userId]);

  const checkCrisisStatus = async () => {
    try {
      const crisisService = new CrisisDetectionService();
      const detected = await crisisService.detectCrisis(userId);

      if (detected) {
        // In production, fetch detailed alert from service
        setAlert({
          severity: 'high',
          message: 'We noticed your recent journey shows signs of distress',
          recommendation: 'Consider reaching out to a professional or using our safety resources',
          professionalReferral: true
        });
        setDismissed(false);
      }
    } catch (error) {
      console.error('Crisis check failed:', error);
    }
  };

  if (!alert || dismissed) {
    return null;
  }

  const severityColors = {
    low: 'from-yellow-600/20 to-yellow-500/20 border-yellow-500/50',
    medium: 'from-orange-600/20 to-orange-500/20 border-orange-500/50',
    high: 'from-red-600/20 to-red-500/20 border-red-500/50',
    critical: 'from-red-700/30 to-red-600/30 border-red-600/70'
  };

  const severityTextColors = {
    low: 'text-yellow-400',
    medium: 'text-orange-400',
    high: 'text-red-400',
    critical: 'text-red-300'
  };

  return (
    <div
      className={`
        fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl mx-4
        bg-gradient-to-r ${severityColors[alert.severity]}
        border rounded-lg shadow-2xl p-4 animate-in slide-in-from-top
      `}
    >
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <AlertTriangle className={`w-6 h-6 ${severityTextColors[alert.severity]}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium ${severityTextColors[alert.severity]} mb-1`}>
            Support Available
          </h3>
          <p className="text-gray-300 text-sm mb-2">
            {alert.message}
          </p>
          <p className="text-gray-400 text-xs mb-4">
            {alert.recommendation}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Crisis Hotline */}
            <button
              onClick={() => window.open('tel:988', '_blank')}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call 988 (Crisis Line)</span>
            </button>

            {/* Safety Resources */}
            <button
              onClick={onShowSafety}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Safety Resources</span>
            </button>

            {/* Professional Referrals */}
            {alert.professionalReferral && (
              <button
                onClick={onShowReferrals}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <span>Find a Therapist</span>
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Notice */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Your safety is our priority. These resources are always available, confidential, and free.
        </p>
      </div>
    </div>
  );
}
