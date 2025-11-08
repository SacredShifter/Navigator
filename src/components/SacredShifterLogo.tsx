/**
 * Sacred Shifter Logo Component
 *
 * Visual identity representing consciousness navigation and transformation.
 * Uses the official Sacred Shifter logo from Supabase storage.
 */

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function SacredShifterLogo({ size = 80, className = '', showText = false }: LogoProps) {
  const logoUrl = 'https://mikltjgbvxrxndtszorb.supabase.co/storage/v1/object/public/sacred-assets/uploads/Logo-MainSacredShifter-removebg-preview.png';

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* Official Sacred Shifter Logo */}
      <img
        src={logoUrl}
        alt="Sacred Shifter Logo"
        width={size}
        height={size}
        className="drop-shadow-2xl"
        style={{
          filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))'
        }}
      />

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
