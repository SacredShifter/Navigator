/**
 * Sacred Shifter Logo Component
 *
 * Visual identity representing consciousness navigation and transformation.
 * Uses Sacred Shifter brand colors and sacred geometry principles.
 */

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function SacredShifterLogo({ size = 64, className = '', showText = true }: LogoProps) {
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* Logo Symbol - Sacred Geometry Sigil */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Outer Circle - Witness Consciousness */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#gradient-outer)"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />

        {/* Inner Hexagon - Six Directions of Expansion */}
        <path
          d="M 50 10 L 77.32 27.5 L 77.32 62.5 L 50 80 L 22.68 62.5 L 22.68 27.5 Z"
          stroke="url(#gradient-middle)"
          strokeWidth="2"
          fill="url(#gradient-fill)"
          opacity="0.3"
        />

        {/* Center Triangle - Awakening */}
        <path
          d="M 50 25 L 70 65 L 30 65 Z"
          stroke="url(#gradient-inner)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Dot - Presence Point */}
        <circle
          cx="50"
          cy="50"
          r="4"
          fill="url(#gradient-center)"
          className="animate-pulse"
        />

        {/* Gradients */}
        <defs>
          {/* Outer gradient: Silence to Resonance */}
          <linearGradient id="gradient-outer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312E81" stopOpacity="0.8" /> {/* Deep Indigo - Silence */}
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" /> {/* Violet - Resonance */}
          </linearGradient>

          {/* Middle gradient: Alignment to Purpose */}
          <linearGradient id="gradient-middle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.9" /> {/* Aqua - Alignment */}
            <stop offset="100%" stopColor="#D946EF" stopOpacity="0.9" /> {/* Magenta - Purpose */}
          </linearGradient>

          {/* Inner gradient: Pulse to Truth */}
          <linearGradient id="gradient-inner" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" /> {/* Neon Cyan - Pulse */}
            <stop offset="100%" stopColor="#10B981" /> {/* Mint - Truth */}
          </linearGradient>

          {/* Center gradient: Radial pulse */}
          <radialGradient id="gradient-center">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
          </radialGradient>

          {/* Fill gradient for hexagon */}
          <linearGradient id="gradient-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312E81" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Wordmark */}
      {showText && (
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold tracking-wider bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            SACRED SHIFTER
          </div>
          <div className="text-xs tracking-[0.3em] text-slate-400 mt-1">
            CONSCIOUSNESS NAVIGATION
          </div>
        </div>
      )}
    </div>
  );
}
