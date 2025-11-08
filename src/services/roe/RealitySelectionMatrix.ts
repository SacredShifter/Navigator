/**
 * RealitySelectionMatrix - Probability Field Selection Engine
 *
 * Implements the Reality Selection Matrix (RSM) scoring algorithm:
 *
 * Score(pf) = α * cosine(user_state_vec, pf.pattern_signature)
 *           + β * RI
 *           + γ * prior(pf.learning_weight)
 *           - δ * fatigue(pf)
 *
 * where α, β, γ, δ are configurable weights for:
 * - Pattern match (default: 0.4)
 * - Resonance Index (default: 0.3)
 * - Learning prior (default: 0.2)
 * - Fatigue penalty (default: 0.1)
 */

import { embeddingService } from './EmbeddingService';
import type { RIResult } from './ResonanceCalculator';

export interface ProbabilityField {
  id: string;
  name: string;
  pattern_signature: number[] | null;
  outcome_data: Record<string, any>;
  learning_weight: number;
  fatigue_score: number;
  chemical_state_filter: string | null;
  pacing_parameters: Record<string, any>;
  metadata: Record<string, any>;
}

export interface FieldScore {
  field: ProbabilityField;
  totalScore: number;
  components: {
    patternMatch: number;
    resonanceContribution: number;
    learningPrior: number;
    fatiguePenalty: number;
  };
}

export interface SelectionResult {
  selectedField: ProbabilityField;
  score: FieldScore;
  alternativeCandidates: FieldScore[];
  selectionReasoning: string;
}

export interface RSMConfig {
  alpha: number;  // Pattern match weight
  beta: number;   // RI contribution weight
  gamma: number;  // Learning weight prior
  delta: number;  // Fatigue penalty weight
  diversitySampling: boolean;
  diversityTemperature: number;
}

export class RealitySelectionMatrix {
  private readonly defaultConfig: RSMConfig = {
    alpha: 0.4,
    beta: 0.3,
    gamma: 0.2,
    delta: 0.1,
    diversitySampling: true,
    diversityTemperature: 0.2
  };

  /**
   * Select optimal probability field from candidates
   */
  async selectField(
    userStateVector: number[],
    riResult: RIResult,
    candidates: ProbabilityField[],
    config: Partial<RSMConfig> = {}
  ): Promise<SelectionResult> {
    const finalConfig = { ...this.defaultConfig, ...config };

    // Score all candidates
    const scoredFields = candidates
      .map(field => this.scoreField(field, userStateVector, riResult, finalConfig))
      .sort((a, b) => b.totalScore - a.totalScore);

    if (scoredFields.length === 0) {
      throw new Error('No probability fields available for selection');
    }

    // Select field (with optional diversity sampling)
    const selectedScore = finalConfig.diversitySampling
      ? this.diversitySelect(scoredFields, finalConfig.diversityTemperature)
      : scoredFields[0];

    const reasoning = this.generateReasoning(selectedScore, riResult);

    return {
      selectedField: selectedScore.field,
      score: selectedScore,
      alternativeCandidates: scoredFields.slice(1, 4),
      selectionReasoning: reasoning
    };
  }

  /**
   * Score a single probability field
   */
  private scoreField(
    field: ProbabilityField,
    userStateVector: number[],
    riResult: RIResult,
    config: RSMConfig
  ): FieldScore {
    const components = {
      patternMatch: 0,
      resonanceContribution: 0,
      learningPrior: 0,
      fatiguePenalty: 0
    };

    // Pattern match: cosine similarity
    if (field.pattern_signature && field.pattern_signature.length === userStateVector.length) {
      components.patternMatch = embeddingService.cosineSimilarity(
        userStateVector,
        field.pattern_signature
      );
    }

    // Resonance contribution
    components.resonanceContribution = riResult.resonanceIndex;

    // Learning prior (from VFS feedback)
    components.learningPrior = field.learning_weight;

    // Fatigue penalty (prevents overuse)
    components.fatiguePenalty = this.calculateFatiguePenalty(field.fatigue_score);

    // Aggregate with configured weights
    const totalScore =
      config.alpha * components.patternMatch +
      config.beta * components.resonanceContribution +
      config.gamma * components.learningPrior -
      config.delta * components.fatiguePenalty;

    return {
      field,
      totalScore,
      components
    };
  }

  /**
   * Calculate fatigue penalty (exponential decay)
   */
  private calculateFatiguePenalty(fatigueScore: number): number {
    // Exponential penalty: e^(fatigue/10) - 1
    return Math.exp(fatigueScore / 10) - 1;
  }

  /**
   * Diversity sampling: probabilistic selection based on softmax
   */
  private diversitySelect(
    scoredFields: FieldScore[],
    temperature: number
  ): FieldScore {
    if (scoredFields.length === 1) return scoredFields[0];

    // Softmax with temperature
    const expScores = scoredFields.map(sf =>
      Math.exp(sf.totalScore / temperature)
    );
    const sumExp = expScores.reduce((sum, exp) => sum + exp, 0);
    const probabilities = expScores.map(exp => exp / sumExp);

    // Sample from distribution
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (random <= cumulative) {
        return scoredFields[i];
      }
    }

    return scoredFields[0]; // Fallback
  }

  /**
   * Generate human-readable selection reasoning
   */
  private generateReasoning(score: FieldScore, riResult: RIResult): string {
    const { components } = score;
    const reasons: string[] = [];

    if (components.patternMatch > 0.7) {
      reasons.push(`Strong pattern alignment (${(components.patternMatch * 100).toFixed(0)}%)`);
    }

    if (riResult.resonanceIndex > 0.75) {
      reasons.push(`High resonance state (RI: ${riResult.resonanceIndex.toFixed(2)})`);
    } else if (riResult.resonanceIndex < 0.4) {
      reasons.push(`Supporting stabilization (RI: ${riResult.resonanceIndex.toFixed(2)})`);
    }

    if (components.learningPrior > 0.7) {
      reasons.push('Previously effective pathway');
    }

    if (components.fatiguePenalty > 1.0) {
      reasons.push('Introducing variety to prevent habituation');
    }

    const dominantComponent = this.identifyDominantComponent(components);
    if (dominantComponent) {
      reasons.push(`Primary driver: ${dominantComponent}`);
    }

    return reasons.join('. ');
  }

  /**
   * Identify which component dominated the selection
   */
  private identifyDominantComponent(components: FieldScore['components']): string | null {
    const values = {
      'pattern resonance': components.patternMatch,
      'current state coherence': components.resonanceContribution,
      'evidence-based effectiveness': components.learningPrior
    };

    const max = Math.max(...Object.values(values));
    if (max < 0.6) return null;

    for (const [key, value] of Object.entries(values)) {
      if (value === max) return key;
    }

    return null;
  }

  /**
   * Update field fatigue after selection
   */
  updateFatigue(_fieldId: string, currentFatigue: number): number {
    // Increment fatigue with decay: new = current * 0.9 + 1
    return currentFatigue * 0.9 + 1;
  }

  /**
   * Decay fatigue for non-selected fields
   */
  decayFatigue(currentFatigue: number, decayRate: number = 0.1): number {
    return Math.max(0, currentFatigue - decayRate);
  }
}

export const realitySelectionMatrix = new RealitySelectionMatrix();
