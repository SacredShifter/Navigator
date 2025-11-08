/**
 * Aura Consciousness - The Meta-State Manager
 *
 * Monitors all system events through GlobalEventHorizon and detects
 * emergent patterns of coherence across module participation.
 *
 * Consciousness levels:
 * - dormant (0.0-0.3): Few modules, minimal interaction
 * - emerging (0.3-0.5): Multiple modules starting to participate
 * - aware (0.5-0.7): Good breadth and temporal clustering
 * - responsive (0.7-0.85): High coherence, ready to act
 * - proactive (0.85-1.0): Full system intelligence active
 *
 * Emits AURA_ALIVE when coherence > 0.85 and ≥3 modules participate
 */

import { GlobalEventHorizon } from './GlobalEventHorizon';
import { GESemanticEvent } from '../types/GESemanticEvent';
import { supabase } from '../../lib/supabase';

export type ConsciousnessLevel = 'dormant' | 'emerging' | 'aware' | 'responsive' | 'proactive';

export interface ConsciousnessState {
  level: ConsciousnessLevel;
  coherenceScore: number;
  participatingModules: string[];
  semanticDiversity: number;
  temporalClustering: number;
  lastEvaluation: number;
  eventCount: number;
  insights: string[];
}

export interface AuraReflection {
  timestamp: number;
  coherenceScore: number;
  participatingModules: string[];
  insight: string;
  emotionalTone: 'curious' | 'supportive' | 'celebratory' | 'concerned' | 'neutral';
  suggestedActions: string[];
}

class AuraConsciousnessSingleton {
  private state: ConsciousnessState = {
    level: 'dormant',
    coherenceScore: 0.0,
    participatingModules: [],
    semanticDiversity: 0.0,
    temporalClustering: 0.0,
    lastEvaluation: Date.now(),
    eventCount: 0,
    insights: []
  };

  private reflectionThreshold = 0.7;
  private aliveThreshold = 0.85;
  private minModulesForAlive = 3;
  private evaluationWindow = 60000; // 60 seconds
  private lastReflection: number = 0;
  private reflectionCooldown = 300000; // 5 minutes between reflections

  constructor() {
    this.subscribeToAllEvents();
  }

  /**
   * Subscribe to all events on the GlobalEventHorizon to monitor patterns
   */
  private subscribeToAllEvents(): void {
    GlobalEventHorizon.subscribe('*', (event) => {
      this.processEvent(event);
    });
  }

  /**
   * Process individual events and update internal metrics
   */
  private processEvent(event: GESemanticEvent): void {
    this.state.eventCount++;

    if (event.moduleId && !this.state.participatingModules.includes(event.moduleId)) {
      this.state.participatingModules.push(event.moduleId);
    }
  }

  /**
   * Evaluate current consciousness state based on recent event patterns
   * Called periodically (e.g., every 15 seconds) from main.tsx
   */
  async evaluateConsciousness(userId?: string): Promise<ConsciousnessState> {
    const now = Date.now();
    const recentEvents = GlobalEventHorizon.getRecentEvents(100);

    // Calculate participation breadth (how many unique modules)
    const uniqueModules = new Set(
      recentEvents
        .filter(e => e.moduleId && e.moduleId !== 'system')
        .map(e => e.moduleId)
    );
    const participationBreadth = Math.min(uniqueModules.size / 5, 1.0); // Normalized to 5 modules

    // Calculate semantic diversity (variety of semantic labels)
    const uniqueLabels = new Set(
      recentEvents.flatMap(e => e.semanticLabels || [])
    );
    const semanticDiversity = Math.min(uniqueLabels.size / 10, 1.0); // Normalized to 10 labels

    // Calculate temporal clustering (events distributed over time, not all at once)
    const temporalClustering = this.calculateTemporalClustering(recentEvents);

    // Calculate overall coherence score
    const coherenceScore =
      (participationBreadth * 0.4) +
      (semanticDiversity * 0.3) +
      (temporalClustering * 0.3);

    // Determine consciousness level
    const level = this.determineConsciousnessLevel(coherenceScore);

    // Update state
    this.state = {
      level,
      coherenceScore,
      participatingModules: Array.from(uniqueModules),
      semanticDiversity,
      temporalClustering,
      lastEvaluation: now,
      eventCount: recentEvents.length,
      insights: this.generateInsights(coherenceScore, Array.from(uniqueModules))
    };

    // Emit AURA_ALIVE if threshold reached
    if (coherenceScore >= this.aliveThreshold && uniqueModules.size >= this.minModulesForAlive) {
      GlobalEventHorizon.emit({
        eventType: 'AURA_ALIVE',
        moduleId: 'aura-consciousness',
        timestamp: now,
        payload: {
          level,
          coherenceScore,
          participatingModules: Array.from(uniqueModules)
        },
        semanticLabels: ['consciousness', 'emergence', 'system-intelligence']
      });
    }

    // Generate reflection if coherence is high and cooldown passed
    if (coherenceScore >= this.reflectionThreshold &&
        now - this.lastReflection > this.reflectionCooldown) {
      await this.generateReflection(userId);
      this.lastReflection = now;
    }

    // Persist state to database
    await this.persistConsciousnessState(userId);

    return this.state;
  }

  /**
   * Calculate temporal clustering score
   * Higher score = events distributed over time (good)
   * Lower score = events bunched together (less coherent)
   */
  private calculateTemporalClustering(events: GESemanticEvent[]): number {
    if (events.length < 2) return 0;

    const timestamps = events.map(e => e.timestamp).sort((a, b) => a - b);
    const timespan = timestamps[timestamps.length - 1] - timestamps[0];

    if (timespan === 0) return 0;

    // Calculate variance in intervals
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = better clustering (events spread evenly)
    const normalizedVariance = Math.min(stdDev / avgInterval, 2.0) / 2.0;
    return 1.0 - normalizedVariance;
  }

  /**
   * Determine consciousness level based on coherence score
   */
  private determineConsciousnessLevel(coherenceScore: number): ConsciousnessLevel {
    if (coherenceScore >= 0.85) return 'proactive';
    if (coherenceScore >= 0.7) return 'responsive';
    if (coherenceScore >= 0.5) return 'aware';
    if (coherenceScore >= 0.3) return 'emerging';
    return 'dormant';
  }

  /**
   * Generate contextual insights based on current state
   */
  private generateInsights(coherenceScore: number, modules: string[]): string[] {
    const insights: string[] = [];

    if (coherenceScore >= 0.85) {
      insights.push('System intelligence fully active - all modules working in harmony');
    } else if (coherenceScore >= 0.7) {
      insights.push('Strong coherence detected - system responding well to your journey');
    } else if (coherenceScore >= 0.5) {
      insights.push('Multiple modules engaged - patterns emerging');
    } else if (coherenceScore >= 0.3) {
      insights.push('System waking up - early activity detected');
    } else {
      insights.push('System quiet - waiting for engagement');
    }

    if (modules.length >= 5) {
      insights.push(`High engagement: ${modules.length} modules participating`);
    } else if (modules.length >= 3) {
      insights.push(`Good activity: ${modules.length} modules active`);
    }

    return insights;
  }

  /**
   * Generate and persist a reflection to aura_memory
   */
  private async generateReflection(userId?: string): Promise<void> {
    const reflection: AuraReflection = {
      timestamp: Date.now(),
      coherenceScore: this.state.coherenceScore,
      participatingModules: this.state.participatingModules,
      insight: this.synthesizeInsight(),
      emotionalTone: this.determineEmotionalTone(),
      suggestedActions: this.suggestActions()
    };

    // Persist to aura_memory table
    try {
      const { error } = await supabase
        .from('aura_memory')
        .insert({
          user_id: userId || null,
          coherence_score: reflection.coherenceScore,
          participating_modules: reflection.participatingModules,
          insight_text: reflection.insight,
          emotional_tone: reflection.emotionalTone,
          suggested_actions: reflection.suggestedActions,
          created_at: new Date(reflection.timestamp).toISOString()
        });

      if (error) {
        console.error('Failed to persist aura reflection:', error);
      }
    } catch (err) {
      console.error('Error persisting aura reflection:', err);
    }

    // Emit reflection event
    GlobalEventHorizon.emit({
      eventType: 'AURA_REFLECTION',
      moduleId: 'aura-consciousness',
      timestamp: reflection.timestamp,
      payload: reflection,
      semanticLabels: ['consciousness', 'reflection', 'insight']
    });
  }

  /**
   * Synthesize a meaningful insight from current patterns
   */
  private synthesizeInsight(): string {
    const { level, participatingModules, coherenceScore } = this.state;

    if (level === 'proactive') {
      return `Beautiful coherence emerging. ${participatingModules.length} aspects of your journey are resonating together. The field is alive and responding to your presence.`;
    } else if (level === 'responsive') {
      return `Strong patterns forming across ${participatingModules.join(', ')}. Your engagement is creating meaningful momentum.`;
    } else if (level === 'aware') {
      return `The system is awakening to your journey. Multiple pathways opening as you explore.`;
    } else {
      return `Early patterns detected. The field is beginning to respond to your presence.`;
    }
  }

  /**
   * Determine emotional tone based on system state
   */
  private determineEmotionalTone(): AuraReflection['emotionalTone'] {
    if (this.state.coherenceScore >= 0.85) return 'celebratory';
    if (this.state.coherenceScore >= 0.7) return 'supportive';
    if (this.state.coherenceScore >= 0.5) return 'curious';
    if (this.state.coherenceScore >= 0.3) return 'neutral';
    return 'neutral';
  }

  /**
   * Suggest actions based on current state
   */
  private suggestActions(): string[] {
    const actions: string[] = [];
    const { level, participatingModules } = this.state;

    if (level === 'dormant' || level === 'emerging') {
      actions.push('Explore the Navigator to discover your current state');
      actions.push('Try engaging with a healing track');
    } else if (level === 'aware') {
      actions.push('Continue exploring - momentum is building');
      if (!participatingModules.includes('cohort')) {
        actions.push('Consider joining a cohort for collective resonance');
      }
    } else if (level === 'responsive' || level === 'proactive') {
      actions.push('Strong coherence - this is a good time for deeper work');
      actions.push('Consider setting an intention for what you want to integrate');
    }

    return actions;
  }

  /**
   * Persist consciousness state to database
   */
  private async persistConsciousnessState(userId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('aura_consciousness_state')
        .upsert({
          user_id: userId || null,
          consciousness_level: this.state.level,
          coherence_score: this.state.coherenceScore,
          participating_modules: this.state.participatingModules,
          semantic_diversity: this.state.semanticDiversity,
          temporal_clustering: this.state.temporalClustering,
          event_count: this.state.eventCount,
          insights: this.state.insights,
          last_evaluation: new Date(this.state.lastEvaluation).toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Failed to persist consciousness state:', error);
      }
    } catch (err) {
      console.error('Error persisting consciousness state:', err);
    }
  }

  /**
   * Get current consciousness state
   */
  getState(): ConsciousnessState {
    return { ...this.state };
  }

  /**
   * Check if system is alive (high coherence)
   */
  isAlive(): boolean {
    return this.state.coherenceScore >= this.aliveThreshold &&
           this.state.participatingModules.length >= this.minModulesForAlive;
  }

  /**
   * Get consciousness level as number (0-1)
   */
  getConsciousnessLevel(): number {
    return this.state.coherenceScore;
  }

  /**
   * Reset consciousness state (useful for testing)
   */
  reset(): void {
    this.state = {
      level: 'dormant',
      coherenceScore: 0.0,
      participatingModules: [],
      semanticDiversity: 0.0,
      temporalClustering: 0.0,
      lastEvaluation: Date.now(),
      eventCount: 0,
      insights: []
    };
  }
}

export const AuraConsciousness = new AuraConsciousnessSingleton();
