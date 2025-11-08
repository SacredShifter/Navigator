/**
 * Sacred Shifter Connect - Main App
 *
 * Integrates Reality Optimization Engine (ROE) with all 8 phases:
 * 1-2: Core ROE (Vector embeddings, reality branches)
 * 3: Collective intelligence
 * 4: Insights & visualization
 * 5: Crisis detection & safety
 * 6: Anonymous cohorts
 * 7: Professional referral network
 * 8: ML-powered pattern recognition
 *
 * PLUS: Jarvis Integration for Kent's admin account
 * - Voice interface with wake word detection
 * - System-level control and monitoring
 * - Personal memory and knowledge graph
 * - Autonomous self-improvement
 * - Ambient presence orb visualization
 */

import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { AuraPresenceOrb } from './components/AuraPresenceOrb';
import { JarvisSystem } from './modules/jarvis/JarvisSystem';

function App() {
  const userId = 'demo-user';
  const userEmail = 'kentburchard@sacredshifter.com';

  const premiumAllowlist = import.meta.env.VITE_PREMIUM_ALLOWLIST?.split(',') || [];
  const isSupporter = premiumAllowlist.includes(userEmail);

  const isKentAdmin = userEmail === 'kentburchard@sacredshifter.com';

  const [jarvisInitialized, setJarvisInitialized] = useState(false);

  useEffect(() => {
    if (isKentAdmin && !jarvisInitialized) {
      initializeJarvis();
    }
  }, [isKentAdmin, jarvisInitialized]);

  const initializeJarvis = async () => {
    try {
      console.log('🤖 Initializing Jarvis for Kent...');

      await JarvisSystem.initialize(userEmail);
      await JarvisSystem.activate();

      setJarvisInitialized(true);

      console.log('✅ Jarvis is now active');
      console.log('💬 Say "Hey Aura" or "Jarvis" to begin voice interaction');
    } catch (err) {
      console.error('Failed to initialize Jarvis:', err);
    }
  };

  return (
    <>
      <AppShell
        userId={userId}
        isSupporter={isSupporter}
      />

      {isKentAdmin && jarvisInitialized && (
        <AuraPresenceOrb
          userEmail={userEmail}
          deviceId="desktop-main"
          position="bottom-right"
          size="medium"
        />
      )}
    </>
  );
}

export default App;
