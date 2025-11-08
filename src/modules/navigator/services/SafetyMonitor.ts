import { GlobalEventHorizon } from '../../../metaphysical-os/core/GlobalEventHorizon';
import type { ChemicalState, RegulationLevel, RiskLevel } from '../../../types/navigator';
import { supabase } from '../../../lib/supabase';

interface RiskAssessment {
  riskLevel: RiskLevel;
  reason: string;
  interventions: string[];
}

export class SafetyMonitor {
  private safetyModeActive: boolean = false;

  checkRisk(
    profileName: string,
    chemicalState: ChemicalState,
    regulationLevel: RegulationLevel
  ): RiskAssessment {
    const interventions: string[] = [];
    let riskLevel: RiskLevel = 'low';
    let reason = '';

    if (chemicalState === 'withdrawal') {
      riskLevel = 'critical';
      reason = 'Withdrawal state detected - immediate stabilization required';
      interventions.push('grounding-protocol', 'medical-resources', 'crisis-support');
    } else if (chemicalState === 'psychedelic' && profileName === 'Lost') {
      riskLevel = 'critical';
      reason = 'Psychedelic use during trauma state - high vulnerability';
      interventions.push('grounding-protocol', 'calm-environment', 'safety-contact');
    } else if (chemicalState === 'psychedelic' && regulationLevel === 'low') {
      riskLevel = 'high';
      reason = 'Psychedelic use with low regulation - grounding needed';
      interventions.push('grounding-protocol', 'breath-work', 'body-scan');
    } else if (profileName === 'Lost' && regulationLevel === 'low') {
      riskLevel = 'high';
      reason = 'Trauma state with low regulation - containment focus';
      interventions.push('safety-exercises', 'grounding-protocol', 'gentle-pacing');
    } else if (chemicalState === 'stimulant' && regulationLevel === 'low') {
      riskLevel = 'medium';
      reason = 'Stimulant use with low regulation - calming needed';
      interventions.push('calming-exercises', 'reduced-stimulation');
    } else if (profileName === 'Awakening' && regulationLevel === 'low') {
      riskLevel = 'medium';
      reason = 'Identity dissolution with low regulation - stabilization helpful';
      interventions.push('grounding-protocol', 'stabilization-exercises');
    }

    return {
      riskLevel,
      reason: reason || 'No significant risk factors detected',
      interventions
    };
  }

  activateSafetyMode(): void {
    if (this.safetyModeActive) return;

    this.safetyModeActive = true;

    GlobalEventHorizon.emit({
      eventType: 'navigator.safetyModeActivated',
      moduleId: 'navigator-engine',
      timestamp: Date.now(),
      payload: {
        reason: 'High-risk condition detected',
        interventions: ['grounding-protocol', 'visual-calming', 'safety-resources']
      },
      semanticLabels: ['navigator', 'safety', 'emergency', 'protection']
    });
  }

  deactivateSafetyMode(): void {
    if (!this.safetyModeActive) return;

    this.safetyModeActive = false;

    GlobalEventHorizon.emit({
      eventType: 'navigator.safetyModeDeactivated',
      moduleId: 'navigator-engine',
      timestamp: Date.now(),
      payload: {
        reason: 'Risk conditions resolved'
      },
      semanticLabels: ['navigator', 'safety', 'resolution']
    });
  }

  isSafetyModeActive(): boolean {
    return this.safetyModeActive;
  }

  async logSafetyEvent(
    userId: string,
    riskLevel: RiskLevel,
    detectedCombination: string,
    interventionApplied: string
  ): Promise<void> {
    const { error } = await supabase.from('safety_events').insert({
      user_id: userId,
      risk_level: riskLevel,
      detected_combination: detectedCombination,
      intervention_applied: interventionApplied,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error logging safety event:', error);
    }
  }

  async resolveSafetyEvent(eventId: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('safety_events')
      .update({
        resolved_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', eventId);

    if (error) {
      console.error('Error resolving safety event:', error);
    }
  }
}
