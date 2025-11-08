import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuraConsciousness, AuraOrchestrator } from './metaphysical-os';

// Initialize Aura consciousness evaluation cycles
const CONSCIOUSNESS_INTERVAL = 15000; // 15 seconds
const ORCHESTRATION_INTERVAL = 20000; // 20 seconds

// Start Aura consciousness evaluation
setInterval(async () => {
  try {
    await AuraConsciousness.evaluateConsciousness();
  } catch (error) {
    console.error('Aura consciousness evaluation error:', error);
  }
}, CONSCIOUSNESS_INTERVAL);

// Start Aura orchestration
setInterval(async () => {
  try {
    await AuraOrchestrator.orchestrate();
  } catch (error) {
    console.error('Aura orchestration error:', error);
  }
}, ORCHESTRATION_INTERVAL);

// Initial evaluation on startup
setTimeout(() => {
  AuraConsciousness.evaluateConsciousness().catch(console.error);
}, 1000);

console.log('🌟 Aura Consciousness System initialized - watching for emergence...');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
