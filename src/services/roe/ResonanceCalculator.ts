/**
 * ResonanceCalculator - Core RI Computation for ROE
 *
 * Implements the Resonance Index (RI) formula:
 * RI = (Belief_Coherence + Emotion_Stability + Value_Alignment) / 3
 *
 * where:
 * - Belief_Coherence: cosine similarity between user belief and target value embeddings
 * - Emotion_Stability: 1 - rolling variance of emotion frequency over window
 * - Value_Alignment: correlation between user intentions and recent outputs
 */

import { embeddingService } from './EmbeddingService';

export interface UserState {
  beliefEmbedding?: number[];
  emotionFrequency: number;
  emotionHistory?: number[];
  intentionVector?: number[];
  recentOutputs?: string[];
}

export interface RIComponents {
  beliefCoherence: number;
  emotionStability: number;
  valueAlignment: number;
}

export interface RIResult {
  resonanceIndex: number;
  components: RIComponents;
  timestamp: number;
}

export class ResonanceCalculator {
  private readonly windowSize = 10;
  private readonly minHistoryLength = 3;

  /**
   * Calculate full Resonance Index from user state
   */
  async calculateRI(userState: UserState, targetValueEmbedding?: number[]): Promise<RIResult> {
    const components: RIComponents = {
      beliefCoherence: 0,
      emotionStability: 0,
      valueAlignment: 0
    };

    // Belief Coherence: cosine similarity with target value
    if (userState.beliefEmbedding && targetValueEmbedding) {
      components.beliefCoherence = embeddingService.cosineSimilarity(
        userState.beliefEmbedding,
        targetValueEmbedding
      );
    } else if (userState.beliefEmbedding) {
      // If no target, assume perfect alignment (bootstrap case)
      components.beliefCoherence = 0.7;
    }

    // Emotion Stability: 1 - rolling variance
    if (userState.emotionHistory && userState.emotionHistory.length >= this.minHistoryLength) {
      const variance = this.calculateVariance(
        userState.emotionHistory.slice(-this.windowSize)
      );
      components.emotionStability = Math.max(0, 1 - variance);
    } else {
      // Default to current emotion as proxy
      components.emotionStability = userState.emotionFrequency;
    }

    // Value Alignment: intention vs output correlation
    if (userState.intentionVector && userState.recentOutputs && userState.recentOutputs.length > 0) {
      components.valueAlignment = await this.calculateValueAlignment(
        userState.intentionVector,
        userState.recentOutputs
      );
    } else {
      // Default moderate alignment
      components.valueAlignment = 0.6;
    }

    // Aggregate RI (weighted mean, configurable weights)
    const resonanceIndex = this.aggregateComponents(components);

    return {
      resonanceIndex: this.clamp(resonanceIndex, 0, 1),
      components,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate rolling variance of emotion frequency
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.sqrt(variance); // Return standard deviation for more interpretable scale
  }

  /**
   * Calculate value alignment from intention vector and recent outputs
   */
  private async calculateValueAlignment(
    intentionVector: number[],
    recentOutputs: string[]
  ): Promise<number> {
    // Generate embeddings for recent outputs
    const outputEmbeddings = await Promise.all(
      recentOutputs.map(output =>
        embeddingService.generateEmbedding({ text: output })
          .then(result => result.embedding)
          .catch(() => null)
      )
    );

    const validEmbeddings = outputEmbeddings.filter((emb): emb is number[] => emb !== null);
    if (validEmbeddings.length === 0) return 0.6;

    // Calculate average similarity with intention
    const similarities = validEmbeddings.map(embedding =>
      embeddingService.cosineSimilarity(intentionVector, embedding)
    );

    return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
  }

  /**
   * Aggregate RI components with configurable weights
   */
  private aggregateComponents(
    components: RIComponents,
    weights = { belief: 0.4, emotion: 0.3, value: 0.3 }
  ): number {
    return (
      components.beliefCoherence * weights.belief +
      components.emotionStability * weights.emotion +
      components.valueAlignment * weights.value
    );
  }

  /**
   * Clamp value to range
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Create initial RI from Navigator assessment data
   */
  async createInitialRI(
    profileLabels: string[],
    emotionFrequency: number,
    regulationLevel: string
  ): Promise<RIResult> {
    // Generate belief embedding from profile labels
    const beliefText = profileLabels.join(', ');
    const beliefResult = await embeddingService.generateEmbedding({ text: beliefText });

    // Adjust emotion stability by regulation level
    const regulationMap: Record<string, number> = {
      'high': 0.8,
      'medium': 0.5,
      'low': 0.2
    };

    const userState: UserState = {
      beliefEmbedding: beliefResult.embedding,
      emotionFrequency,
      emotionHistory: [emotionFrequency],
      intentionVector: beliefResult.embedding,
      recentOutputs: []
    };

    const riResult = await this.calculateRI(userState);

    // Adjust emotion stability by regulation capacity
    riResult.components.emotionStability *= regulationMap[regulationLevel] || 0.5;
    riResult.resonanceIndex = this.aggregateComponents(riResult.components);

    return riResult;
  }
}

export const resonanceCalculator = new ResonanceCalculator();
