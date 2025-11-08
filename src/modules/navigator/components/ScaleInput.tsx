interface ScaleInputProps {
  options: string[];
  value: number | undefined;
  onChange: (value: number) => void;
}

export function ScaleInput({ options, value, onChange }: ScaleInputProps) {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onChange(index)}
          className={`w-full p-4 rounded-xl text-left transition-all ${
            value === index
              ? 'bg-blue-500 text-white border-2 border-blue-400'
              : 'bg-white/5 text-blue-100 border-2 border-white/10 hover:bg-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                value === index
                  ? 'border-white bg-white'
                  : 'border-white/30'
              }`}
            >
              {value === index && (
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              )}
            </div>
            <span className="text-lg">{option}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
