interface MultiSelectInputProps {
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
}

export function MultiSelectInput({ options, value, onChange }: MultiSelectInputProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-blue-300 mb-4">
        Your nervous system might be affected by substances or medication. That's okay — we'll tailor your experience so it stays safe and clear.
      </p>
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onChange(option)}
          className={`w-full p-4 rounded-xl text-left transition-all ${
            value === option
              ? 'bg-green-500/20 text-white border-2 border-green-400'
              : 'bg-white/5 text-blue-100 border-2 border-white/10 hover:bg-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                value === option
                  ? 'border-green-400 bg-green-400'
                  : 'border-white/30'
              }`}
            >
              {value === option && (
                <div className="w-3 h-3 rounded-full bg-white" />
              )}
            </div>
            <span className="text-lg">{option}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
