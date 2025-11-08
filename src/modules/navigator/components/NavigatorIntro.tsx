import { SacredShifterLogo } from '../../../components/SacredShifterLogo';

interface NavigatorIntroProps {
  onBegin: () => void;
}

export function NavigatorIntro({ onBegin }: NavigatorIntroProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <SacredShifterLogo size={80} showText={false} className="mb-8" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-4">
            The Navigator
          </h1>
          <p className="text-xl text-cyan-300/80">
            Sacred Shifter's Adaptive Guidance System
          </p>
        </div>

        <div className="bg-gradient-to-br from-violet-950/30 via-indigo-950/40 to-cyan-950/30 backdrop-blur-xl rounded-2xl p-8 border border-violet-500/20 shadow-2xl shadow-violet-500/10 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Everyone's path looks different. Let's find yours.
          </h2>
          <p className="text-lg text-cyan-100/90 mb-6">
            No right or wrong answers — only signals of where your system is now.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shadow-lg shadow-cyan-400/50" />
              <p className="text-slate-200/90">
                We'll assess your current state across three dimensions: awakening journey, nervous system regulation, and any chemical influences.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-violet-400 mt-2 shadow-lg shadow-violet-400/50" />
              <p className="text-slate-200/90">
                Based on your responses, we'll recommend personalized tracks designed for your unique needs right now.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shadow-lg shadow-emerald-400/50" />
              <p className="text-slate-200/90">
                Your safety is our priority. We'll adjust pacing and content to match your current capacity.
              </p>
            </div>
          </div>

          <button
            onClick={onBegin}
            className="w-full py-4 bg-gradient-to-r from-violet-600 via-cyan-600 to-violet-600 hover:from-violet-500 hover:via-cyan-500 hover:to-violet-500 text-white text-lg font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/30"
          >
            Begin Assessment
          </button>
        </div>

        <p className="text-center text-cyan-400/70 text-sm">
          This assessment takes about 2-3 minutes. You can pause and return anytime.
        </p>
      </div>
    </div>
  );
}
