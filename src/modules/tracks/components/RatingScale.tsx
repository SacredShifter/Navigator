import { useState } from 'react';

interface RatingScaleProps {
  label: string;
  onRate: (value: number) => void;
  initialValue?: number;
}

export function RatingScale({ label, onRate, initialValue }: RatingScaleProps) {
  const [value, setValue] = useState(initialValue ?? 5);
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleChange = (newValue: number) => {
    setValue(newValue);
    onRate(newValue);
  };

  const displayValue = hoverValue ?? value;

  return (
    <div className="space-y-4">
      <label className="block text-lg text-white font-medium">{label}</label>

      <div className="flex items-center gap-2">
        {Array.from({ length: 11 }, (_, i) => i).map((num) => (
          <button
            key={num}
            onClick={() => handleChange(num)}
            onMouseEnter={() => setHoverValue(num)}
            onMouseLeave={() => setHoverValue(null)}
            className={`w-10 h-10 rounded-lg font-semibold transition-all ${
              num <= displayValue
                ? 'bg-blue-500 text-white scale-110'
                : 'bg-white/10 text-blue-300 hover:bg-white/20'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-sm text-blue-300">
        <span>None (0)</span>
        <span className="text-xl font-bold text-white">{displayValue}</span>
        <span>Extreme (10)</span>
      </div>
    </div>
  );
}
