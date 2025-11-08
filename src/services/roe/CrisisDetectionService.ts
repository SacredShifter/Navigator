/**
 * Crisis Detection Service - Automated Safety Monitoring
 *
 * Monitors ROE signals for crisis indicators and triggers appropriate
 * safety protocols. This is a critical safety feature for protecting
 * vulnerable users experiencing severe distress.
 *
 * IMPORTANT: This is NOT a replacement for professional mental health care.
 * It's an early warning system that connects users to appropriate resources.
 */

import { supabase } from '../../lib/supabase';

interface CrisisSignals {
  riPlunge: boolean;          // Rapid RI drop
  prolongedLowRI: boolean;    // Extended low coherence
  harmIndicators: boolean;    // Self-harm language patterns
  isolationPattern: boolean;  // Withdrawal from engagement
  entropySpike: boolean;      // Sudden system instability
}

interface CrisisLevel {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  signals: CrisisSignals;
  triggeredAt: string;
}

interface SafetyProtocol {
  level: string;
  actions: string[];
  resources: SafetyResource[];
  notifyGuardian: boolean;
}

interface SafetyResource {
  type: 'hotline' | 'text' | 'chat' | 'professional';
  name: string;
  contact: string;
  available: string;
  description: string;
}

export class CrisisDetectionService {
  private readonly riCrisisThreshold = 0.25;
  private readonly riPlungeThreshold = 0.3; // Drop of 0.3 or more
  private readonly prolongedLowRIDays = 7;
  private readonly entropySpikeThreshold = 0.7;

  /**
   * Analyze user signals for crisis indicators
   */
  async detectCrisis(userId: string): Promise<CrisisLevel | null> {
    try {
      const signals = await this.analyzeSignals(userId);

      if (!this.hasAnyCrisisSignals(signals)) {
        return null;
      }

      const severity = this.calculateSeverity(signals);
      const confidence = this.calculateConfidence(signals);

      if (severity === 'low' && confidence < 0.5) {
        return null; // Insufficient evidence
      }

      const crisis: CrisisLevel = {
        severity,
        confidence,
        signals,
        triggeredAt: new Date().toISOString()
      };

      // Log crisis detection
      await this.logCrisisDetection(userId, crisis);

      // Trigger appropriate protocol
      await this.activateSafetyProtocol(userId, crisis);

      return crisis;
    } catch (error) {
      console.error('Crisis detection failed:', error);
      return null;
    }
  }

  /**
   * Get appropriate safety resources based on crisis level
   */
  getSafetyResources(severity: string): SafetyResource[] {
    const resources: SafetyResource[] = [
      {
        type: 'hotline',
        name: '988 Suicide & Crisis Lifeline',
        contact: '988',
        available: '24/7',
        description: 'Free, confidential support for people in distress'
      },
      {
        type: 'text',
        name: 'Crisis Text Line',
        contact: 'Text HOME to 741741',
        available: '24/7',
        description: 'Free 24/7 support via text message'
      },
      {
        type: 'chat',
        name: 'NAMI HelpLine',
        contact: '1-800-950-6264',
        available: 'M-F 10am-10pm ET',
        description: 'Mental health information and support'
      }
    ];

    if (severity === 'critical' || severity === 'high') {
      resources.unshift({
        type: 'hotline',
        name: 'Emergency Services',
        contact: '911',
        available: '24/7',
        description: 'Immediate emergency response'
      });
    }

    return resources;
  }

  /**
   * Generate safety plan for user
   */
  async generateSafetyPlan(userId: string): Promise<string[]> {
    const { data: userState } = await supabase
      .from('reality_branches')
      .select('emotion_state, resonance_index')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const baseSteps = [
      'Recognize warning signs early (low energy, isolation urges, hopelessness)',
      'Use internal coping strategies (breathing, grounding, positive self-talk)',
      'Reach out to trusted friends or family members',
      'Contact professional support (therapist, crisis line)',
      'Remove access to means of harm',
      'Go to a safe environment or emergency room if needed'
    ];

    // Customize based on user's typical patterns
    if (userState?.emotion_state?.chemical_state === 'anxious') {
      baseSteps.splice(1, 0, 'Practice 5-4-3-2-1 grounding technique when anxiety peaks');
    }

    if (userState?.resonance_index < 0.4) {
      baseSteps.splice(1, 0, 'Return to previously helpful practices from your high-RI moments');
    }

    return baseSteps;
  }

  private async analyzeSignals(userId: string): Promise<CrisisSignals> {
    // Get recent branches
    const { data: recentBranches } = await supabase
      .from('reality_branches')
      .select('resonance_index, created_at, emotion_state')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!recentBranches || recentBranches.length < 2) {
      return {
        riPlunge: false,
        prolongedLowRI: false,
        harmIndicators: false,
        isolationPattern: false,
        entropySpike: false
      };
    }

    // Check for RI plunge
    const latestRI = recentBranches[0].resonance_index;
    const previousRI = recentBranches[1].resonance_index;
    const riDelta = latestRI - previousRI;
    const riPlunge = riDelta < -this.riPlungeThreshold;

    // Check for prolonged low RI
    const sevenDaysAgo = new Date(Date.now() - this.prolongedLowRIDays * 24 * 60 * 60 * 1000);
    const recentLowRIBranches = recentBranches.filter(
      b => new Date(b.created_at) > sevenDaysAgo && b.resonance_index < this.riCrisisThreshold
    );
    const prolongedLowRI = recentLowRIBranches.length >= 5;

    // Check for isolation pattern (reduced engagement)
    const lastWeekBranches = recentBranches.filter(
      b => new Date(b.created_at) > sevenDaysAgo
    );
    const isolationPattern = lastWeekBranches.length < 2; // Very low engagement

    // Check entropy spike
    const { data: entropyData } = await supabase
      .from('builders_log')
      .select('context')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const entropySpike = entropyData?.context?.entropy?.overallEntropy > this.entropySpikeThreshold;

    // Harm indicators would require NLP analysis of user inputs
    // For now, we set to false and rely on other signals
    const harmIndicators = false;

    return {
      riPlunge,
      prolongedLowRI,
      harmIndicators,
      isolationPattern,
      entropySpike
    };
  }

  private hasAnyCrisisSignals(signals: CrisisSignals): boolean {
    return Object.values(signals).some(signal => signal === true);
  }

  private calculateSeverity(signals: CrisisSignals): CrisisLevel['severity'] {
    let score = 0;

    if (signals.riPlunge) score += 3;
    if (signals.prolongedLowRI) score += 4;
    if (signals.harmIndicators) score += 5; // Highest weight
    if (signals.isolationPattern) score += 2;
    if (signals.entropySpike) score += 2;

    if (score >= 8) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'moderate';
    return 'low';
  }

  private calculateConfidence(signals: CrisisSignals): number {
    let signalCount = 0;
    let weightedScore = 0;

    if (signals.riPlunge) {
      signalCount++;
      weightedScore += 0.7; // High confidence in RI data
    }
    if (signals.prolongedLowRI) {
      signalCount++;
      weightedScore += 0.8; // Very high confidence
    }
    if (signals.harmIndicators) {
      signalCount++;
      weightedScore += 0.9; // Highest confidence
    }
    if (signals.isolationPattern) {
      signalCount++;
      weightedScore += 0.5; // Moderate confidence
    }
    if (signals.entropySpike) {
      signalCount++;
      weightedScore += 0.6;
    }

    return signalCount > 0 ? weightedScore / signalCount : 0;
  }

  private async logCrisisDetection(userId: string, crisis: CrisisLevel): Promise<void> {
    await supabase.from('roe_horizon_events').insert({
      id: `roe_crisis_${Date.now()}_${crypto.randomUUID()}`,
      user_id: userId,
      event_type: 'crisis.detected',
      module_id: 'crisis-detection',
      payload: {
        severity: crisis.severity,
        confidence: crisis.confidence,
        signals: crisis.signals
      },
      semantic_labels: ['crisis', 'safety', 'alert'],
      resonance_index: null
    });
  }

  private async activateSafetyProtocol(userId: string, crisis: CrisisLevel): Promise<void> {
    const protocol = this.determineSafetyProtocol(crisis);

    // Log protocol activation
    await supabase.from('builders_log').insert({
      id: `safety_${Date.now()}_${crypto.randomUUID()}`,
      user_id: userId,
      event_type: 'safety_protocol_activated',
      context: {
        crisis_level: crisis.severity,
        confidence: crisis.confidence,
        protocol: protocol.level,
        actions: protocol.actions
      }
    });

    // In production, this would:
    // 1. Display safety resources to user immediately
    // 2. Send notifications to designated guardians (if user opted in)
    // 3. Create persistent safety prompts in UI
    // 4. Throttle potentially distressing content
    // 5. Offer immediate connection to crisis resources
  }

  private determineSafetyProtocol(crisis: CrisisLevel): SafetyProtocol {
    const resources = this.getSafetyResources(crisis.severity);

    if (crisis.severity === 'critical') {
      return {
        level: 'critical',
        actions: [
          'Display emergency resources immediately',
          'Offer one-click crisis line connection',
          'Suggest going to safe environment',
          'Notify emergency guardian (if configured)',
          'Disable potentially triggering content'
        ],
        resources,
        notifyGuardian: true
      };
    }

    if (crisis.severity === 'high') {
      return {
        level: 'high',
        actions: [
          'Display prominent safety resources',
          'Suggest safety plan review',
          'Encourage reaching out to support network',
          'Offer connection to crisis services'
        ],
        resources,
        notifyGuardian: true
      };
    }

    if (crisis.severity === 'moderate') {
      return {
        level: 'moderate',
        actions: [
          'Display safety resources in sidebar',
          'Suggest self-care and grounding practices',
          'Remind of coping strategies',
          'Offer optional check-in with support'
        ],
        resources,
        notifyGuardian: false
      };
    }

    return {
      level: 'low',
      actions: [
        'Display subtle wellness check-in',
        'Suggest mindfulness practices',
        'Highlight positive patterns from history'
      ],
      resources: resources.slice(1), // Exclude emergency services
      notifyGuardian: false
    };
  }
}

export const crisisDetectionService = new CrisisDetectionService();
