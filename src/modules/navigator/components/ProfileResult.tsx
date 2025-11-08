import { Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import type { NavigatorProfile, ProfileScore, ChemicalState, RegulationLevel } from '../../../types/navigator';

interface ProfileResultProps {
  profile: NavigatorProfile;
  scores: ProfileScore[];
  chemicalState: ChemicalState;
  regulationLevel: RegulationLevel;
  targetTrackId: string;
  safetyMode: boolean;
  safetyReason?: string;
  onContinue: () => void;
}

export function ProfileResult({
  profile,
  scores,
  chemicalState,
  regulationLevel,
  targetTrackId,
  safetyMode,
  safetyReason,
  onContinue
}: ProfileResultProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-3xl w-full">
        {safetyMode && (
          <div className="bg-amber-500/20 border-2 border-amber-500 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold text-amber-100 mb-2">
                  Safety Mode Activated
                </h3>
                <p className="text-amber-200">
                  {safetyReason || "We've detected a combination that requires extra care. We'll keep visuals calmer and focus on grounding until your system feels settled."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-6">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ backgroundColor: `${profile.color_theme}40` }}
            >
              <Sparkles className="w-10 h-10" style={{ color: profile.color_theme }} />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              {profile.name}
            </h2>
            <p className="text-xl text-blue-200 mb-6">
              Your Current Profile
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <p className="text-lg text-blue-100 leading-relaxed">
              {profile.entry_message}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Your Profile Dimensions
            </h3>
            <div className="space-y-3">
              {scores.slice(0, 3).map((score) => (
                <div key={score.profileName}>
                  <div className="flex justify-between text-sm text-blue-200 mb-1">
                    <span>{score.profileName}</span>
                    <span>{score.percentage}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
                      style={{ width: `${score.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-blue-300 mb-1">Chemical State</p>
              <p className="text-lg font-semibold text-white capitalize">
                {chemicalState}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-blue-300 mb-1">Regulation Level</p>
              <p className="text-lg font-semibold text-white capitalize">
                {regulationLevel}
              </p>
            </div>
          </div>

          <div className="bg-blue-500/20 border-2 border-blue-400 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">
              Recommended Track
            </h3>
            <p className="text-blue-100 mb-4">
              Based on your profile, we recommend starting with the{' '}
              <span className="font-semibold">
                {targetTrackId.split('-').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
              .
            </p>
          </div>

          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95"
          >
            Continue to Your Track
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-blue-300 text-sm">
          You can reassess your state anytime from the main menu
        </p>
      </div>
    </div>
  );
}
