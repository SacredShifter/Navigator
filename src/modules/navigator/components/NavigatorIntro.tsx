import { Compass } from 'lucide-react';

interface NavigatorIntroProps {
  onBegin: () => void;
}

export function NavigatorIntro({ onBegin }: NavigatorIntroProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-500/20 mb-6">
            <Compass className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            The Navigator
          </h1>
          <p className="text-xl text-blue-200">
            Sacred Shifter's Adaptive Guidance System
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Everyone's path looks different. Let's find yours.
          </h2>
          <p className="text-lg text-blue-100 mb-6">
            No right or wrong answers — only signals of where your system is now.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
              <p className="text-blue-100">
                We'll assess your current state across three dimensions: awakening journey, nervous system regulation, and any chemical influences.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
              <p className="text-blue-100">
                Based on your responses, we'll recommend personalized tracks designed for your unique needs right now.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
              <p className="text-blue-100">
                Your safety is our priority. We'll adjust pacing and content to match your current capacity.
              </p>
            </div>
          </div>

          <button
            onClick={onBegin}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl transition-all transform hover:scale-105 active:scale-95"
          >
            Begin Assessment
          </button>
        </div>

        <p className="text-center text-blue-300 text-sm">
          This assessment takes about 2-3 minutes. You can pause and return anytime.
        </p>
      </div>
    </div>
  );
}
