import { useEffect, useState } from 'react';

interface BreathGuideProps {
  ratio?: string;
  duration?: number;
  onComplete?: () => void;
}

export function BreathGuide({ ratio = '4:6', duration = 180, onComplete }: BreathGuideProps) {
  const [inhale, exhale] = ratio.split(':').map(Number);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [count, setCount] = useState(inhale);
  const [elapsed, setElapsed] = useState(0);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev > 1) return prev - 1;

        if (phase === 'inhale') {
          setPhase('exhale');
          return exhale;
        } else {
          setPhase('inhale');
          setCycles(c => c + 1);
          return inhale;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, inhale, exhale]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= duration && onComplete) {
          onComplete();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  const progress = (elapsed / duration) * 100;
  const scale = phase === 'inhale' ? 1.2 : 0.8;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="relative">
        <div
          className="w-48 h-48 rounded-full bg-blue-500/30 transition-transform duration-1000 ease-in-out flex items-center justify-center"
          style={{ transform: `scale(${scale})` }}
        >
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-2">{count}</div>
            <div className="text-xl text-blue-200 uppercase tracking-wider">
              {phase}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="text-2xl text-white mb-2">Cycle {cycles}</div>
        <div className="text-blue-300">
          {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="w-full max-w-md mt-6">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
