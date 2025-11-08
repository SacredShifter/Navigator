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
 */

import { AppShell } from './components/AppShell';

function App() {
  // In production, get from auth context
  const userId = 'demo-user';

  // Check if user is a supporter (premium/pay-what-you-can)
  // For now, check premium allowlist from .env
  const premiumAllowlist = import.meta.env.VITE_PREMIUM_ALLOWLIST?.split(',') || [];
  const userEmail = 'kentburchard@sacredshifter.com'; // Demo - get from auth
  const isSupporter = premiumAllowlist.includes(userEmail);

  return (
    <AppShell
      userId={userId}
      isSupporter={isSupporter}
    />
  );
}

export default App;
