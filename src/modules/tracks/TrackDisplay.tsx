import { Heart, Brain, TrendingUp, Sparkles, Sun } from 'lucide-react';

interface TrackDisplayProps {
  trackId: string;
  onReassess: () => void;
}

const trackInfo: Record<string, {
  title: string;
  description: string;
  icon: any;
  color: string;
}> = {
  'trauma-safety-track': {
    title: 'Trauma Safety Track',
    description: 'Gentle grounding and containment practices to help you feel safe in your body',
    icon: Heart,
    color: 'from-rose-500 to-pink-500'
  },
  'awakening-track': {
    title: 'Awakening Track',
    description: 'Navigate spiritual emergence and identity shifts with stabilizing support',
    icon: Sparkles,
    color: 'from-blue-500 to-indigo-500'
  },
  'grounding-protocol': {
    title: 'Grounding Protocol',
    description: 'Immediate grounding and stabilization for altered or heightened states',
    icon: Brain,
    color: 'from-teal-500 to-cyan-500'
  },
  'recovery-track': {
    title: 'Recovery Track',
    description: 'Stabilization and support for withdrawal and recovery journeys',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500'
  },
  'regulation-track': {
    title: 'Regulation Track',
    description: 'Nervous system balancing and emotional coherence practices',
    icon: Brain,
    color: 'from-purple-500 to-violet-500'
  },
  'leadership-integration-track': {
    title: 'Leadership Integration Track',
    description: 'Align your gifts with meaningful service and purposeful contribution',
    icon: TrendingUp,
    color: 'from-orange-500 to-amber-500'
  },
  'joy-embodiment-track': {
    title: 'Joy & Embodiment Track',
    description: 'Playful exploration of presence, somatic pleasure, and embodied joy',
    icon: Sun,
    color: 'from-yellow-500 to-orange-500'
  },
  'substance-integration-track': {
    title: 'Substance Integration Track',
    description: 'Process and integrate insights from psychedelic or altered state experiences',
    icon: Sparkles,
    color: 'from-fuchsia-500 to-pink-500'
  }
};

export function TrackDisplay({ trackId, onReassess }: TrackDisplayProps) {
  const track = trackInfo[trackId] || {
    title: 'Custom Track',
    description: 'Your personalized healing journey',
    icon: Sparkles,
    color: 'from-blue-500 to-purple-500'
  };

  const Icon = track.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto pt-12">
        <div className={`bg-gradient-to-r ${track.color} rounded-2xl p-8 mb-8`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                {track.title}
              </h1>
            </div>
          </div>
          <p className="text-xl text-white/90">
            {track.description}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Welcome to Your Personalized Track
          </h2>
          <p className="text-blue-100 mb-6">
            This track has been carefully selected based on your current state, needs, and capacity.
            The practices and content are tailored to support your unique journey right now.
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Coming Soon: Interactive Modules
              </h3>
              <p className="text-blue-200">
                Guided practices, reflections, and exercises designed specifically for your profile will appear here.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Adaptive Pacing
              </h3>
              <p className="text-blue-200">
                Content difficulty and pacing adjust based on your regulation level and progress.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Safety First
              </h3>
              <p className="text-blue-200">
                We monitor your state and provide grounding resources whenever needed.
              </p>
            </div>
          </div>

          <button
            onClick={onReassess}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl transition-all"
          >
            Reassess My State
          </button>
        </div>

        <p className="text-center text-blue-300 text-sm">
          Your state can change. Feel free to reassess anytime to ensure you're on the right path.
        </p>
      </div>
    </div>
  );
}
