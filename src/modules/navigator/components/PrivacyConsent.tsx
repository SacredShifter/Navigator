import { useState, useRef, useEffect } from 'react';
import { Shield, Check, X, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface PrivacyConsentProps {
  onConsent: (granted: boolean) => void;
  onDecline: () => void;
  sessionId: string;
}

const CONSENT_VERSION = 'privacy-v1.0.0';
const PRIVACY_POLICY_URL = 'https://sacredshifter.com/privacy';
const OAIC_URL = 'https://www.oaic.gov.au';

export function PrivacyConsent({ onConsent, onDecline, sessionId }: PrivacyConsentProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;

    const isAtBottom =
      Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;

    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const recordConsent = async (granted: boolean, reason?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const consentRecord = {
        user_id: user?.id || null,
        session_id: sessionId,
        consent_type: 'navigator_assessment',
        consent_version: CONSENT_VERSION,
        consent_given: granted,
        consent_timestamp: new Date().toISOString(),
        notes: reason ? { declined_reason: reason } : {}
      };

      const { error: insertError } = await supabase
        .from('user_consent_records')
        .insert(consentRecord);

      if (insertError) throw insertError;

      if (user?.id && granted) {
        await supabase
          .from('user_onboarding_state')
          .upsert({
            user_id: user.id,
            consent_privacy_given: true,
            consent_version_accepted: CONSENT_VERSION,
            onboarding_step: 'assessment',
            updated_at: new Date().toISOString()
          });
      }

      return true;
    } catch (err) {
      console.error('Error recording consent:', err);
      setError('Failed to record your consent. Please try again.');
      return false;
    }
  };

  const handleAgree = async () => {
    if (!isAgreed) return;

    setIsSubmitting(true);
    setError(null);

    const success = await recordConsent(true);

    setIsSubmitting(false);

    if (success) {
      onConsent(true);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    setError(null);

    const success = await recordConsent(false, 'user_declined');

    setIsSubmitting(false);

    if (success) {
      onDecline();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-gradient-to-br from-violet-950/30 via-indigo-950/40 to-cyan-950/30 backdrop-blur-xl rounded-2xl border border-violet-500/20 shadow-2xl shadow-violet-500/10 overflow-hidden">

          <div className="p-8 border-b border-violet-500/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-violet-500/20 rounded-xl">
                <Shield className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Your Privacy Matters</h1>
                <p className="text-cyan-400 mt-1">Sacred Shifter Privacy Collection Notice</p>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Before we begin your consciousness navigation journey, we need your informed consent
              to collect and use sensitive health information. Please read this notice carefully.
            </p>
          </div>

          <div
            ref={scrollRef}
            className="p-8 max-h-[60vh] overflow-y-auto space-y-6 text-slate-200"
            style={{ scrollBehavior: 'smooth' }}
          >
            <section>
              <h2 className="text-2xl font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <span className="text-cyan-400">1.</span> What We Collect
              </h2>
              <div className="space-y-3 ml-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">Consciousness Profile Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Your responses to assessment questions</li>
                    <li>Calculated profile type (e.g., Seeker, Integrator, Awakening)</li>
                    <li>Nervous system regulation level</li>
                    <li>Current chemical state (if you choose to disclose)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Usage & Interaction Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Which healing tracks and modules you access</li>
                    <li>Duration and completion of experiences</li>
                    <li>Safety check responses</li>
                    <li>Device and session information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Account Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Email address (if authenticated)</li>
                    <li>User ID and session tokens</li>
                    <li>Consent records and timestamps</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <span className="text-cyan-400">2.</span> Why We Collect It
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-6 text-slate-300">
                <li><strong className="text-white">Personalize your healing journey</strong> - Match you with appropriate experiences for your current state</li>
                <li><strong className="text-white">Ensure your safety</strong> - Prevent exposure to experiences that could be overwhelming or harmful</li>
                <li><strong className="text-white">Improve Sacred Shifter</strong> - Understand which approaches support different consciousness states</li>
                <li><strong className="text-white">Fulfill our duty of care</strong> - Monitor for crisis situations and provide appropriate resources</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <span className="text-cyan-400">3.</span> How We Use It
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-6 text-slate-300">
                <li>Route you to suitable healing tracks</li>
                <li>Adjust pacing, intensity, and visual stimulation</li>
                <li>Provide crisis resources if needed</li>
                <li>Generate anonymized insights (no individual identification)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <span className="text-cyan-400">4.</span> Who Can Access It
              </h2>
              <div className="space-y-2 ml-6">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">You</strong> - Full access to your own data</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Sacred Shifter System</strong> - Automated processing for personalization</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Emergency Services</strong> - Only if you indicate imminent self-harm (legal duty)</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Nobody else</strong> - We do NOT sell, trade, or share your data with third parties</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <span className="text-cyan-400">5.</span> Data Storage & Security
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-6 text-slate-300">
                <li><strong className="text-white">Location:</strong> Secure Supabase servers (ISO 27001 certified)</li>
                <li><strong className="text-white">Encryption:</strong> AES-256 at rest, TLS 1.3 in transit</li>
                <li><strong className="text-white">Access Control:</strong> Row-level security policies</li>
                <li><strong className="text-white">Retention:</strong> Kept while your account is active, plus 7 years (legal requirement)</li>
                <li><strong className="text-white">Deletion:</strong> Request deletion at any time via settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <span className="text-cyan-400">6.</span> Your Rights (Privacy Act 1988)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Access</strong> your data (download anytime)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Correct</strong> inaccurate information</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Withdraw consent</strong> (may limit functionality)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Delete</strong> your data</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300"><strong className="text-white">Complain</strong> to OAIC</span>
                </div>
              </div>
            </section>

            <section className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-violet-400 mb-3">Consent Statement</h2>
              <p className="text-slate-200 leading-relaxed">
                By clicking <strong>"I Agree & Proceed"</strong> below, you:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-slate-300">
                <li>Acknowledge you have read and understood this notice</li>
                <li>Consent to the collection, use, and disclosure of your sensitive health information</li>
                <li>Understand you can withdraw consent at any time via Settings → Privacy</li>
                <li>Confirm you are 18+ years old (or have guardian consent)</li>
              </ul>
              <p className="mt-4 text-cyan-400 font-semibold">
                This is voluntary - You can decline and explore Sacred Shifter without personalization.
              </p>
            </section>

            <section className="border-t border-violet-500/20 pt-6">
              <div className="flex flex-wrap gap-4 text-sm">
                <a
                  href={PRIVACY_POLICY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Full Privacy Policy <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={OAIC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  OAIC Website <ExternalLink className="w-4 h-4" />
                </a>
                <span className="text-slate-400">
                  Questions? <a href="mailto:privacy@sacredshifter.com" className="text-cyan-400 hover:text-cyan-300">privacy@sacredshifter.com</a>
                </span>
              </div>
            </section>

            {!hasScrolledToBottom && (
              <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-950 to-transparent h-20 flex items-end justify-center pb-4">
                <p className="text-cyan-400 text-sm animate-pulse">
                  ↓ Please scroll to the bottom to continue ↓
                </p>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-violet-500/20 bg-slate-950/50">
            <div className="flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                disabled={!hasScrolledToBottom || isSubmitting}
                className="mt-1 w-5 h-5 rounded border-violet-500/50 bg-slate-900 text-violet-500 focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label
                htmlFor="consent-checkbox"
                className={`text-sm leading-relaxed ${
                  hasScrolledToBottom ? 'text-white cursor-pointer' : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                I have read and understood the Privacy Collection Notice above. I consent to Sacred Shifter
                collecting and using my sensitive health information as described.
              </label>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDecline}
                disabled={isSubmitting}
                className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white rounded-xl transition-all border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Maybe Later'}
              </button>

              <button
                onClick={handleAgree}
                disabled={!isAgreed || !hasScrolledToBottom || isSubmitting}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-violet-600 via-cyan-600 to-violet-600 hover:from-violet-500 hover:via-cyan-500 hover:to-violet-500 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isSubmitting ? 'Processing...' : 'I Agree & Proceed'}
              </button>
            </div>

            <p className="text-center text-slate-400 text-xs mt-4">
              Consent version: {CONSENT_VERSION} | Last updated: November 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
