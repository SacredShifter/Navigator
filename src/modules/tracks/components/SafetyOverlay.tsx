import { useState } from 'react';
import { AlertTriangle, Phone, Eye, EyeOff, Wind, X } from 'lucide-react';

interface SafetyOverlayProps {
  onClose: () => void;
  showGroundNow?: boolean;
}

export function SafetyOverlay({ onClose, showGroundNow = true }: SafetyOverlayProps) {
  const [visualsLocked, setVisualsLocked] = useState(false);
  const [showingBreath, setShowingBreath] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-900 rounded-2xl border-2 border-amber-500 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Safety Resources</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {showGroundNow && (
          <div className="bg-blue-500/20 border-2 border-blue-400 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">Ground Now</h3>
            <div className="space-y-3 text-blue-100 mb-4">
              <p>• Sit. Feet to floor. Exhale longer than inhale.</p>
              <p>• Name 3 things you see, 3 you hear, 3 you feel.</p>
              <p>• You are here. This moment is enough.</p>
            </div>
            {!showingBreath && (
              <button
                onClick={() => setShowingBreath(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
              >
                <Wind className="w-5 h-5" />
                Start Box Breathing
              </button>
            )}
            {showingBreath && (
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-blue-400 mb-2">4</div>
                <div className="text-xl text-blue-300">Breathe In - Hold - Out - Hold</div>
                <button
                  onClick={() => setShowingBreath(false)}
                  className="mt-4 text-blue-400 hover:text-blue-300 underline"
                >
                  Stop
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-red-500/20 border-2 border-red-400 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-3">
            <Phone className="inline w-5 h-5 mr-2" />
            Emergency Support
          </h3>
          <div className="space-y-3 text-white">
            <div>
              <p className="font-semibold text-red-200">Immediate Danger</p>
              <p className="text-2xl font-bold">000 (Australia)</p>
              <p className="text-sm text-red-200">Police, Fire, Ambulance</p>
            </div>
            <div>
              <p className="font-semibold text-red-200">Lifeline</p>
              <p className="text-2xl font-bold">13 11 14</p>
              <p className="text-sm text-red-200">24/7 Crisis support</p>
            </div>
            <div>
              <p className="font-semibold text-red-200">Beyond Blue</p>
              <p className="text-2xl font-bold">1300 22 4636</p>
              <p className="text-sm text-red-200">Mental health support</p>
            </div>
            <div>
              <p className="font-semibold text-red-200">Alcohol & Drug Info Service</p>
              <p className="text-2xl font-bold">1800 250 015</p>
              <p className="text-sm text-red-200">Confidential advice</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setVisualsLocked(!visualsLocked)}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              visualsLocked
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            {visualsLocked ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {visualsLocked ? 'Visuals Locked' : 'Lock Visuals'}
          </button>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
          >
            Return to Track
          </button>
        </div>
      </div>
    </div>
  );
}
