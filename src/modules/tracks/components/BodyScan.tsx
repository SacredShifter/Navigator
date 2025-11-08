import { useState, useEffect } from 'react';

const bodyZones = [
  { name: 'Crown', duration: 20 },
  { name: 'Forehead', duration: 20 },
  { name: 'Jaw', duration: 20 },
  { name: 'Neck', duration: 20 },
  { name: 'Chest', duration: 25 },
  { name: 'Belly', duration: 25 },
  { name: 'Hips', duration: 20 },
  { name: 'Legs', duration: 25 },
  { name: 'Feet', duration: 25 }
];

interface BodyScanProps {
  onComplete?: () => void;
  onZoneLabel?: (zone: string, label: string) => void;
}

export function BodyScan({ onComplete, onZoneLabel }: BodyScanProps) {
  const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
  const [zoneProgress, setZoneProgress] = useState(0);
  const [labels, setLabels] = useState<Record<string, string>>({});

  const currentZone = bodyZones[currentZoneIndex];
  const isComplete = currentZoneIndex >= bodyZones.length;

  useEffect(() => {
    if (isComplete) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setZoneProgress(prev => {
        if (prev >= 100) {
          setCurrentZoneIndex(i => i + 1);
          return 0;
        }
        return prev + (100 / (currentZone.duration * 10));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentZoneIndex, currentZone, isComplete, onComplete]);

  const handleLabel = (label: string) => {
    const newLabels = { ...labels, [currentZone.name]: label };
    setLabels(newLabels);
    onZoneLabel?.(currentZone.name, label);
  };

  if (isComplete) {
    return (
      <div className="text-center p-8">
        <h3 className="text-2xl font-bold text-white mb-4">Scan Complete</h3>
        <p className="text-blue-200">You have checked in with your entire body.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-sm text-blue-300 mb-2">
          Zone {currentZoneIndex + 1} of {bodyZones.length}
        </div>
        <h3 className="text-3xl font-bold text-white mb-2">{currentZone.name}</h3>
        <p className="text-lg text-blue-200">
          Notice sensations in your {currentZone.name.toLowerCase()}
        </p>
      </div>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-100"
          style={{ width: `${zoneProgress}%` }}
        />
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => handleLabel('neutral')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            labels[currentZone.name] === 'neutral'
              ? 'bg-blue-500 text-white'
              : 'bg-white/10 text-blue-200 hover:bg-white/20'
          }`}
        >
          Neutral
        </button>
        <button
          onClick={() => handleLabel('pleasant')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            labels[currentZone.name] === 'pleasant'
              ? 'bg-green-500 text-white'
              : 'bg-white/10 text-blue-200 hover:bg-white/20'
          }`}
        >
          Pleasant
        </button>
        <button
          onClick={() => handleLabel('unpleasant')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            labels[currentZone.name] === 'unpleasant'
              ? 'bg-amber-500 text-white'
              : 'bg-white/10 text-blue-200 hover:bg-white/20'
          }`}
        >
          Unpleasant
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={() => setCurrentZoneIndex(i => i + 1)}
          className="text-blue-300 hover:text-blue-200 underline text-sm"
        >
          Skip this zone
        </button>
      </div>
    </div>
  );
}
