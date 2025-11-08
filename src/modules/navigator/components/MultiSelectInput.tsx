interface MultiSelectInputProps {
  options: string[] | any;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function MultiSelectInput({ options, value, onChange }: MultiSelectInputProps) {
  const optionsArray = Array.isArray(options) ? options : [];

  if (optionsArray.length === 0) {
    return <div className="text-red-400">No options available</div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-cyan-300 mb-4">
        Your nervous system might be affected by substances or medication. That's okay — we'll tailor your experience so it stays safe and clear.
      </p>
      {optionsArray.map((option, index) => (
        <button
          key={index}
          onClick={() => onChange(option)}
          className={`w-full p-4 rounded-xl text-left transition-all ${
            value === option
              ? 'bg-emerald-500/20 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-400/20'
              : 'bg-white/5 text-slate-200 border-2 border-white/10 hover:bg-white/10 hover:border-violet-400/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                value === option
                  ? 'border-emerald-400 bg-emerald-400'
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
