import { useState, useEffect } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SafetyOverlay } from './components/SafetyOverlay';
import { BreathGuide } from './components/BreathGuide';
import { RatingScale } from './components/RatingScale';
import { BodyScan } from './components/BodyScan';
import { TinyActionBuilder } from './components/TinyActionBuilder';

interface Exercise {
  id: string;
  type: string;
  title: string;
  duration_min: number;
  script: string;
  instructions: string[];
  order_index: number;
}

interface Stage {
  id: string;
  slug: string;
  title: string;
  summary: string;
  duration_min: number;
  exercises: Exercise[];
}

interface Track {
  id: string;
  slug: string;
  title: string;
  description: string;
  color_theme: string;
  visual_parameters: any;
  audio_parameters: any;
}

interface TrackExperienceProps {
  trackSlug: string;
  stageSlug: string;
  userId?: string;
  onComplete?: () => void;
  onExit?: () => void;
}

export function TrackExperience({ trackSlug, stageSlug, userId, onComplete, onExit }: TrackExperienceProps) {
  const [track, setTrack] = useState<Track | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showSafetyOverlay, setShowSafetyOverlay] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reflections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrackData();
  }, [trackSlug, stageSlug]);

  const loadTrackData = async () => {
    try {
      const { data: trackData, error: trackError } = await supabase
        .from('trauma_tracks')
        .select('*')
        .eq('slug', trackSlug)
        .maybeSingle();

      if (trackError) throw trackError;
      if (!trackData) {
        console.error('Track not found:', trackSlug);
        return;
      }

      setTrack(trackData);

      const { data: stageData, error: stageError } = await supabase
        .from('trauma_stages')
        .select(`
          *,
          trauma_exercises (*)
        `)
        .eq('track_id', trackData.id)
        .eq('slug', stageSlug)
        .maybeSingle();

      if (stageError) throw stageError;
      if (!stageData) {
        console.error('Stage not found:', stageSlug);
        return;
      }

      const exercises = (stageData as any).trauma_exercises.sort(
        (a: Exercise, b: Exercise) => a.order_index - b.order_index
      );

      setStage({ ...stageData, exercises });
      setLoading(false);
    } catch (error) {
      console.error('Error loading track data:', error);
      setLoading(false);
    }
  };

  const handleExerciseComplete = async () => {
    const exercise = stage?.exercises[currentExerciseIndex];
    if (!exercise || !userId) return;

    await supabase.from('user_trauma_progress').upsert({
      user_id: userId,
      track_id: track?.id,
      stage_id: stage?.id,
      exercise_id: exercise.id,
      status: 'completed',
      completed_at: new Date().toISOString(),
      reflections: reflections
    });

    if (currentExerciseIndex < (stage?.exercises.length ?? 0) - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      onComplete?.();
    }
  };

  const handleRating = async (type: string, value: number) => {
    setRatings({ ...ratings, [type]: value });

    if (userId && stage?.exercises[currentExerciseIndex]) {
      await supabase.from('user_ratings').insert({
        user_id: userId,
        exercise_id: stage.exercises[currentExerciseIndex].id,
        rating_type: type,
        rating_value: value
      });
    }
  };

  const handleTinyActionsSave = async (actions: any[]) => {
    if (!userId || !stage) return;

    for (const action of actions) {
      await supabase.from('user_tiny_actions').insert({
        user_id: userId,
        stage_id: stage.id,
        insight: action.insight,
        trigger_when: action.trigger,
        action_what: action.action,
        proof_how: action.proof
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!track || !stage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Track or stage not found</div>
      </div>
    );
  }

  const currentExercise = stage.exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / stage.exercises.length) * 100;

  const visualParams = track.visual_parameters || {};
  const maxFps = visualParams.maxMotionFps || 30;
  const lowContrast = visualParams.contrast === 'low';

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 ${
        lowContrast ? 'contrast-75' : ''
      }`}
      style={{
        animation: maxFps < 20 ? 'gentle-pulse 4s infinite ease-in-out' : 'none'
      }}
    >
      <button
        onClick={() => setShowSafetyOverlay(true)}
        className="fixed top-4 right-4 z-40 flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-lg transition-all"
      >
        <AlertCircle className="w-5 h-5" />
        Ground Now
      </button>

      {showSafetyOverlay && (
        <SafetyOverlay onClose={() => setShowSafetyOverlay(false)} />
      )}

      <div className="max-w-4xl mx-auto pt-20">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{stage.title}</h1>
              <p className="text-blue-300">{stage.summary}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-300">Exercise {currentExerciseIndex + 1} of {stage.exercises.length}</div>
              <div className="text-lg font-semibold text-white">{Math.round(progress)}%</div>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: track.color_theme
              }}
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">{currentExercise.title}</h2>

          {currentExercise.script && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-100 leading-relaxed">{currentExercise.script}</p>
            </div>
          )}

          {currentExercise.type === 'breath_4_6' && (
            <BreathGuide
              ratio="4:6"
              duration={currentExercise.duration_min * 60}
              onComplete={handleExerciseComplete}
            />
          )}

          {currentExercise.type === 'rating_0_10' && (
            <div className="space-y-6">
              <RatingScale
                label="Craving"
                onRate={(value) => handleRating('craving', value)}
              />
              <RatingScale
                label="Anxiety"
                onRate={(value) => handleRating('anxiety', value)}
              />
              <RatingScale
                label="Sleepiness"
                onRate={(value) => handleRating('sleepiness', value)}
              />
              <button
                onClick={handleExerciseComplete}
                className="w-full mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {currentExercise.type === 'body_scan_label' && (
            <BodyScan onComplete={handleExerciseComplete} />
          )}

          {currentExercise.type === 'tiny_action_design' && (
            <TinyActionBuilder
              onSave={handleTinyActionsSave}
              onComplete={handleExerciseComplete}
            />
          )}

          {!['breath_4_6', 'rating_0_10', 'body_scan_label', 'tiny_action_design'].includes(currentExercise.type) && (
            <div className="space-y-6">
              {currentExercise.instructions && currentExercise.instructions.length > 0 && (
                <ul className="space-y-2">
                  {currentExercise.instructions.map((instruction, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-blue-100">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={handleExerciseComplete}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {onExit && (
          <button
            onClick={onExit}
            className="mt-6 text-blue-300 hover:text-blue-200 underline text-sm"
          >
            Exit track
          </button>
        )}
      </div>

      <style>{`
        @keyframes gentle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}
