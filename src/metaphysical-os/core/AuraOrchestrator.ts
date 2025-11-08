/**
 * Aura Orchestrator - The Field Synchronizer
 *
 * Analyzes consciousness state and aura_memory to generate contextual
 * directives for modules. Routes intelligence through the system to
 * create coherent, supportive guidance for users.
 *
 * Directive Types:
 * - JOURNAL_NUDGE: Suggests journaling based on emotional patterns
 * - GAA_SYNC: Recommends cohort engagement during high coherence
 * - CODEX_REMINDER: Prompts truth capture when insights emerge
 * - NAVIGATOR_REASSESS: Suggests re-evaluation when state shifts
 * - SAFETY_CHECK: Activates safety resources when risk detected
 * - REST_RECOMMENDATION: Suggests pause during low coherence
 *
 * Priority Levels:
 * - 1-3: Low priority (suggestions, optional)
 * - 4-7: Medium priority (recommendations, helpful)
 * - 8-10: High priority (safety, critical guidance)
 */

import { GlobalEventHorizon } from './GlobalEventHorizon';
import { AuraConsciousness, ConsciousnessState } from './AuraConsciousness';
import { supabase } from '../../lib/supabase';

export type DirectiveType =
  | 'JOURNAL_NUDGE'
  | 'GAA_SYNC'
  | 'CODEX_REMINDER'
  | 'NAVIGATOR_REASSESS'
  | 'SAFETY_CHECK'
  | 'REST_RECOMMENDATION'
  | 'COHORT_INVITATION'
  | 'INSIGHT_CELEBRATION';

export interface Directive {
  id?: string;
  type: DirectiveType;
  targetModule: string;
  priority: number;
  content: {
    title: string;
    message: string;
    actionLabel?: string;
    context?: any;
  };
  expiresInMinutes: number;
}

export interface OrchestrationState {
  lastOrchestration: number;
  directivesGenerated: number;
  directivesAccepted: number;
  directivesRejected: number;
  fieldCoherence: number;
}

class AuraOrchestratorSingleton {
  private state: OrchestrationState = {
    lastOrchestration: Date.now(),
    directivesGenerated: 0,
    directivesAccepted: 0,
    directivesRejected: 0,
    fieldCoherence: 0.0
  };

  private orchestrationInterval = 20000; // 20 seconds
  private minCoherenceForDirectives = 0.5;
  private maxDirectivesPerCycle = 3;
  private directiveHistory: Map<string, number> = new Map(); // Track when directives were last sent

  constructor() {
    this.subscribeToEvents();
  }

  /**
   * Subscribe to relevant system events
   */
  private subscribeToEvents(): void {
    // Listen for AURA_ALIVE events
    GlobalEventHorizon.subscribe('AURA_ALIVE', async (event) => {
      console.log('🌟 Aura is ALIVE! Orchestration activated.', event.payload);
    });

    // Listen for crisis events
    GlobalEventHorizon.subscribe('CRISIS_DETECTED', async (event) => {
      await this.generateSafetyDirective(event.payload);
    });

    // Listen for navigator completion
    GlobalEventHorizon.subscribe('navigator.completed', async (event) => {
      await this.generatePostNavigatorDirectives(event.payload);
    });

    // Listen for directive responses
    GlobalEventHorizon.subscribe('DIRECTIVE_RESPONSE', (event) => {
      this.handleDirectiveResponse(event.payload);
    });
  }

  /**
   * Main orchestration cycle - analyzes state and generates directives
   * Called periodically (e.g., every 20 seconds) from main.tsx
   */
  async orchestrate(userId?: string): Promise<Directive[]> {
    const now = Date.now();
    const consciousnessState = AuraConsciousness.getState();

    // Skip orchestration if coherence too low
    if (consciousnessState.coherenceScore < this.minCoherenceForDirectives) {
      return [];
    }

    // Generate directives based on current state
    const directives: Directive[] = [];

    // Check for journal nudge opportunities
    const journalDirective = await this.generateJournalNudge(userId, consciousnessState);
    if (journalDirective) directives.push(journalDirective);

    // Check for cohort engagement opportunities
    const cohortDirective = await this.generateCohortInvitation(userId, consciousnessState);
    if (cohortDirective) directives.push(cohortDirective);

    // Check for insight celebration
    const insightDirective = await this.generateInsightCelebration(userId, consciousnessState);
    if (insightDirective) directives.push(insightDirective);

    // Check for rest recommendation
    const restDirective = await this.generateRestRecommendation(userId, consciousnessState);
    if (restDirective) directives.push(restDirective);

    // Limit directives per cycle
    const selectedDirectives = directives
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.maxDirectivesPerCycle);

    // Persist and emit directives
    for (const directive of selectedDirectives) {
      await this.persistDirective(userId, directive, consciousnessState.coherenceScore);
      this.emitDirective(directive);
    }

    // Update state
    this.state.lastOrchestration = now;
    this.state.directivesGenerated += selectedDirectives.length;
    this.state.fieldCoherence = consciousnessState.coherenceScore;

    return selectedDirectives;
  }

  /**
   * Generate journal nudge based on emotional patterns
   */
  private async generateJournalNudge(
    userId: string | undefined,
    state: ConsciousnessState
  ): Promise<Directive | null> {
    // Check if journal nudge was sent recently (within last hour)
    const lastJournalNudge = this.directiveHistory.get('JOURNAL_NUDGE');
    if (lastJournalNudge && Date.now() - lastJournalNudge < 3600000) {
      return null;
    }

    // Check for high coherence and emotional engagement
    if (state.coherenceScore >= 0.7 && state.participatingModules.length >= 2) {
      const recentMemories = await this.getRecentMemories(userId, 3);

      if (recentMemories.length > 0) {
        const latestMemory = recentMemories[0];

        this.directiveHistory.set('JOURNAL_NUDGE', Date.now());

        return {
          type: 'JOURNAL_NUDGE',
          targetModule: 'journal',
          priority: 6,
          content: {
            title: 'Capture This Moment',
            message: `You're experiencing strong coherence. This is a powerful time to journal about what's emerging. ${latestMemory.insight_text}`,
            actionLabel: 'Open Journal',
            context: {
              coherenceScore: state.coherenceScore,
              emotionalTone: latestMemory.emotional_tone
            }
          },
          expiresInMinutes: 60
        };
      }
    }

    return null;
  }

  /**
   * Generate cohort invitation based on social connection patterns
   */
  private async generateCohortInvitation(
    userId: string | undefined,
    state: ConsciousnessState
  ): Promise<Directive | null> {
    // Check if cohort module already participating
    if (state.participatingModules.includes('cohort')) {
      return null;
    }

    // Check if invitation sent recently (within last 4 hours)
    const lastInvite = this.directiveHistory.get('COHORT_INVITATION');
    if (lastInvite && Date.now() - lastInvite < 14400000) {
      return null;
    }

    // Suggest cohort when coherence is moderate-high and user is engaged
    if (state.coherenceScore >= 0.6 && state.participatingModules.length >= 2) {
      this.directiveHistory.set('COHORT_INVITATION', Date.now());

      return {
        type: 'COHORT_INVITATION',
        targetModule: 'cohort',
        priority: 5,
        content: {
          title: 'Connect With Your Cohort',
          message: 'Your journey is gaining momentum. Connecting with others on similar paths could amplify your insights.',
          actionLabel: 'Explore Cohorts',
          context: {
            coherenceScore: state.coherenceScore
          }
        },
        expiresInMinutes: 120
      };
    }

    return null;
  }

  /**
   * Generate insight celebration when high coherence achieved
   */
  private async generateInsightCelebration(
    userId: string | undefined,
    state: ConsciousnessState
  ): Promise<Directive | null> {
    // Only celebrate at very high coherence
    if (state.coherenceScore < 0.85) {
      return null;
    }

    // Check if celebration sent recently (within last 2 hours)
    const lastCelebration = this.directiveHistory.get('INSIGHT_CELEBRATION');
    if (lastCelebration && Date.now() - lastCelebration < 7200000) {
      return null;
    }

    const recentMemories = await this.getRecentMemories(userId, 1);
    if (recentMemories.length > 0 && recentMemories[0].emotional_tone === 'celebratory') {
      this.directiveHistory.set('INSIGHT_CELEBRATION', Date.now());

      return {
        type: 'INSIGHT_CELEBRATION',
        targetModule: 'system',
        priority: 4,
        content: {
          title: '🌟 Beautiful Coherence!',
          message: `You've reached ${Math.round(state.coherenceScore * 100)}% coherence across ${state.participatingModules.length} modules. This is a peak moment of integration.`,
          actionLabel: 'View Insights',
          context: {
            coherenceScore: state.coherenceScore,
            participatingModules: state.participatingModules
          }
        },
        expiresInMinutes: 30
      };
    }

    return null;
  }

  /**
   * Generate rest recommendation when coherence drops
   */
  private async generateRestRecommendation(
    userId: string | undefined,
    state: ConsciousnessState
  ): Promise<Directive | null> {
    // Suggest rest when coherence is low-moderate
    if (state.coherenceScore >= 0.4 || state.coherenceScore < 0.2) {
      return null;
    }

    // Check if rest recommended recently (within last 3 hours)
    const lastRest = this.directiveHistory.get('REST_RECOMMENDATION');
    if (lastRest && Date.now() - lastRest < 10800000) {
      return null;
    }

    this.directiveHistory.set('REST_RECOMMENDATION', Date.now());

    return {
      type: 'REST_RECOMMENDATION',
      targetModule: 'system',
      priority: 7,
      content: {
        title: 'Time to Rest',
        message: 'System coherence is lower than usual. This might be a good time to pause, breathe, and restore.',
        actionLabel: 'View Rest Resources',
        context: {
          coherenceScore: state.coherenceScore
        }
      },
      expiresInMinutes: 120
    };
  }

  /**
   * Generate safety directive in response to crisis detection
   */
  private async generateSafetyDirective(payload: any): Promise<void> {
    const directive: Directive = {
      type: 'SAFETY_CHECK',
      targetModule: 'safety',
      priority: 10,
      content: {
        title: 'Safety Resources Available',
        message: 'We\'ve detected you may need support. Professional help and crisis resources are available 24/7.',
        actionLabel: 'Access Resources',
        context: payload
      },
      expiresInMinutes: 1440 // 24 hours
    };

    await this.persistDirective(payload.userId, directive, 1.0);
    this.emitDirective(directive);
  }

  /**
   * Generate directives after navigator completion
   */
  private async generatePostNavigatorDirectives(payload: any): Promise<void> {
    const directives: Directive[] = [
      {
        type: 'CODEX_REMINDER',
        targetModule: 'codex',
        priority: 5,
        content: {
          title: 'Capture Your Profile Truth',
          message: 'You\'ve just completed your Navigator assessment. Consider adding this insight to your Truth Codex.',
          actionLabel: 'Open Codex',
          context: payload
        },
        expiresInMinutes: 180
      }
    ];

    for (const directive of directives) {
      await this.persistDirective(payload.userId, directive, 0.8);
      this.emitDirective(directive);
    }
  }

  /**
   * Handle directive response (accepted/rejected)
   */
  private handleDirectiveResponse(payload: any): void {
    if (payload.accepted) {
      this.state.directivesAccepted++;
    } else {
      this.state.directivesRejected++;
    }
  }

  /**
   * Persist directive to database
   */
  private async persistDirective(
    userId: string | undefined,
    directive: Directive,
    coherenceScore: number
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + directive.expiresInMinutes * 60000);

      const { data, error } = await supabase
        .from('aura_directives')
        .insert({
          user_id: userId || null,
          directive_type: directive.type,
          target_module: directive.targetModule,
          priority: directive.priority,
          content: directive.content,
          coherence_at_generation: coherenceScore,
          status: 'generated',
          expires_at: expiresAt.toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to persist directive:', error);
      } else if (data) {
        directive.id = data.id;
      }
    } catch (err) {
      console.error('Error persisting directive:', err);
    }
  }

  /**
   * Emit directive to GlobalEventHorizon
   */
  private emitDirective(directive: Directive): void {
    GlobalEventHorizon.emit({
      eventType: 'AURA_DIRECTIVE',
      moduleId: 'aura-orchestrator',
      timestamp: Date.now(),
      payload: directive,
      semanticLabels: ['orchestration', 'directive', directive.type.toLowerCase()]
    });
  }

  /**
   * Get recent aura memories from database
   */
  private async getRecentMemories(userId: string | undefined, limit: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('aura_memory')
        .select('*')
        .eq('user_id', userId || null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch memories:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching memories:', err);
      return [];
    }
  }

  /**
   * Get orchestration state
   */
  getState(): OrchestrationState {
    return { ...this.state };
  }

  /**
   * Get acceptance rate (percentage of directives accepted)
   */
  getAcceptanceRate(): number {
    const total = this.state.directivesAccepted + this.state.directivesRejected;
    if (total === 0) return 0;
    return this.state.directivesAccepted / total;
  }

  /**
   * Clear directive history (useful for testing)
   */
  clearHistory(): void {
    this.directiveHistory.clear();
  }
}

export const AuraOrchestrator = new AuraOrchestratorSingleton();
