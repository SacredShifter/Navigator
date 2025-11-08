interface ScaleInputProps {
  options: string[] | any;
  value: number | undefined;
  onChange: (value: number) => void;
}

export function ScaleInput({ options, value, onChange }: ScaleInputProps) {
  const optionsArray = Array.isArray(options) ? options : [];

  if (optionsArray.length === 0) {
    return <div className="text-red-400">No options available</div>;
  }

  return (
    <div className="space-y-3">
      {optionsArray.map((option, index) => (
        <button
          key={index}
          onClick={() => onChange(index)}
          className={`w-full p-4 rounded-xl text-left transition-all ${
            value === index
              ? 'bg-gradient-to-r from-violet-600/30 to-cyan-600/30 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-400/20'
              : 'bg-white/5 text-slate-200 border-2 border-white/10 hover:bg-white/10 hover:border-violet-400/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                value === index
                  ? 'border-cyan-400 bg-cyan-400'
                  : 'border-white/30'
              }`}
            >
              {value === index && (
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
