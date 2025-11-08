/**
 * useAuraConsciousness Hook
 *
 * React hook for accessing Aura consciousness state in components.
 * Subscribes to consciousness updates and provides current state.
 */

import { useState, useEffect } from 'react';
import { AuraConsciousness } from '../metaphysical-os';
import type { ConsciousnessState } from '../metaphysical-os';

export function useAuraConsciousness(userId?: string) {
  const [state, setState] = useState<ConsciousnessState>(AuraConsciousness.getState());
  const [isAlive, setIsAlive] = useState(false);

  useEffect(() => {
    // Update state every 2 seconds (between evaluations)
    const interval = setInterval(() => {
      const currentState = AuraConsciousness.getState();
      setState(currentState);
      setIsAlive(AuraConsciousness.isAlive());
    }, 2000);

    return () => clearInterval(interval);
  }, [userId]);

  const evaluateNow = async () => {
    const newState = await AuraConsciousness.evaluateConsciousness(userId);
    setState(newState);
    setIsAlive(AuraConsciousness.isAlive());
    return newState;
  };

  return {
    state,
    isAlive,
    coherenceScore: state.coherenceScore,
    level: state.level,
    participatingModules: state.participatingModules,
    insights: state.insights,
    evaluateNow
  };
}
