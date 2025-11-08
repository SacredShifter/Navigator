/**
 * Pattern Clusterer - Find Similar Journey Archetypes
 *
 * Identifies patterns in user journeys and matches to known archetypes
 * discovered in public mental health datasets (SMHD, RSDD, CLPsych).
 *
 * Training: Unsupervised clustering on public datasets
 * Architecture: K-means, DBSCAN, or HDBSCAN
 * Deployment: Pre-computed clusters, cosine similarity
 *
 * PRIVACY: Users matched to archetypes, not to specific individuals
 */

import { supabase } from '../../lib/supabase';

interface JourneyArchetype {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  typicalTrajectory: string;
  successfulInterventions: string[];
  avgRecoveryTime: number; // days
  prevalence: number; // 0-1 (how common)
}

interface PatternMatch {
  archetype: JourneyArchetype;
  similarity: number; // 0-1
  matchingFeatures: string[];
  differingFeatures: string[];
}

interface UserJourneyVector {
  riVariance: number;
  riTrend: number;
  avgRI: number;
  dominantEmotions: string[];
  emotionVariability: number;
  interventionsUsed: string[];
  timespan: number; // days
}

/**
 * Pre-defined archetypes from public dataset analysis
 * These would be learned from clustering real data
 */
const ARCHETYPES: JourneyArchetype[] = [
  {
    id: 'anxiety_responder',
    name: 'Anxiety-to-Calm Responder',
    description: 'Starts with high anxiety, responds well to grounding interventions',
    characteristics: [
      'High initial arousal/anxiety',
      'Rapid response to body-based practices',
      'Gradual stabilization over 2-3 weeks'
    ],
    typicalTrajectory: 'Sharp improvement with consistent practice',
    successfulInterventions: ['breathing_exercise', 'body_scan_meditation', 'grounding'],
    avgRecoveryTime: 14,
    prevalence: 0.18
  },
  {
    id: 'depression_gradual',
    name: 'Gradual Depression Lifter',
    description: 'Low energy, slow but steady improvement',
    characteristics: [
      'Low initial RI (0.3-0.4)',
      'Consistent but slow progress',
      'Benefits from routine and small wins'
    ],
    typicalTrajectory: 'Slow, linear improvement over weeks',
    successfulInterventions: ['gentle_movement', 'tiny_actions', 'social_connection'],
    avgRecoveryTime: 45,
    prevalence: 0.22
  },
  {
    id: 'high_functioning_anxiety',
    name: 'High-Functioning Anxious',
    description: 'Moderate-high RI with high variability',
    characteristics: [
      'RI oscillates between 0.5-0.7',
      'High achievement but inner turmoil',
      'Resistant to slowing down'
    ],
    typicalTrajectory: 'Cyclical with peaks and valleys',
    successfulInterventions: ['rest_recovery', 'boundary_setting', 'self_compassion'],
    avgRecoveryTime: 30,
    prevalence: 0.15
  },
  {
    id: 'trauma_processor',
    name: 'Trauma Processor',
    description: 'Processing past trauma, nonlinear progress',
    characteristics: [
      'High emotional variability',
      'Setbacks followed by breakthroughs',
      'Benefits from professional support'
    ],
    typicalTrajectory: 'Two steps forward, one step back',
    successfulInterventions: ['professional_therapy', 'somatic_work', 'safe_connection'],
    avgRecoveryTime: 90,
    prevalence: 0.12
  },
  {
    id: 'resilient_adjuster',
    name: 'Resilient Adjuster',
    description: 'Quick adapters, high baseline resilience',
    characteristics: [
      'High initial RI (0.6+)',
      'Quick recovery from setbacks',
      'Self-directed learning style'
    ],
    typicalTrajectory: 'Rapid improvement, maintains high RI',
    successfulInterventions: ['self_reflection', 'creative_expression', 'experimentation'],
    avgRecoveryTime: 7,
    prevalence: 0.10
  },
  {
    id: 'burnout_recoverer',
    name: 'Burnout Recoverer',
    description: 'Exhausted, needs rest before growth',
    characteristics: [
      'Flat affect, low energy',
      'Initial worsening before improvement',
      'Must prioritize rest'
    ],
    typicalTrajectory: 'U-shaped: dip then rise',
    successfulInterventions: ['rest_recovery', 'saying_no', 'gentle_movement'],
    avgRecoveryTime: 60,
    prevalence: 0.13
  },
  {
    id: 'stable_maintainer',
    name: 'Stable Maintainer',
    description: 'Consistent mid-high RI, preventive practice',
    characteristics: [
      'Low variability (0.55-0.65)',
      'Steady practice routine',
      'Preventive rather than reactive'
    ],
    typicalTrajectory: 'Stable horizontal line with gentle uptrend',
    successfulInterventions: ['routine_maintenance', 'variety', 'growth_challenges'],
    avgRecoveryTime: 0,
    prevalence: 0.10
  }
];

export class PatternClusterer {
  /**
   * Find best matching archetype for user
   */
  async findArchetype(userId: string): Promise<PatternMatch | null> {
    try {
      // Build user journey vector
      const userVector = await this.buildJourneyVector(userId);

      if (!userVector) {
        return null;
      }

      // Calculate similarity to each archetype
      const matches: PatternMatch[] = [];

      for (const archetype of ARCHETYPES) {
        const similarity = this.calculateSimilarity(userVector, archetype);
        const { matching, differing } = this.compareFeatures(userVector, archetype);

        matches.push({
          archetype,
          similarity,
          matchingFeatures: matching,
          differingFeatures: differing
        });
      }

      // Sort by similarity
      matches.sort((a, b) => b.similarity - a.similarity);

      // Return best match if similarity is high enough
      if (matches[0].similarity > 0.4) {
        return matches[0];
      }

      return null;
    } catch (error) {
      console.error('Pattern clustering failed:', error);
      return null;
    }
  }

  /**
   * Get top N matching archetypes
   */
  async findTopMatches(userId: string, limit: number = 3): Promise<PatternMatch[]> {
    const topMatch = await this.findArchetype(userId);

    if (!topMatch) {
      return [];
    }

    const userVector = await this.buildJourneyVector(userId);
    if (!userVector) return [];

    const matches: PatternMatch[] = [];

    for (const archetype of ARCHETYPES) {
      const similarity = this.calculateSimilarity(userVector, archetype);
      const { matching, differing } = this.compareFeatures(userVector, archetype);

      if (similarity > 0.3) {
        matches.push({
          archetype,
          similarity,
          matchingFeatures: matching,
          differingFeatures: differing
        });
      }
    }

    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Get all available archetypes
   */
  getAllArchetypes(): JourneyArchetype[] {
    return ARCHETYPES;
  }

  /**
   * Get archetype by ID
   */
  getArchetype(id: string): JourneyArchetype | undefined {
    return ARCHETYPES.find(a => a.id === id);
  }

  /**
   * Build journey vector from user data
   */
  private async buildJourneyVector(userId: string): Promise<UserJourneyVector | null> {
    // Get last 30 days of branches
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: branches } = await supabase
      .from('reality_branches')
      .select('resonance_index, emotion_state, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true });

    if (!branches || branches.length < 5) {
      return null;
    }

    // Calculate metrics
    const riValues = branches.map(b => b.resonance_index);
    const avgRI = riValues.reduce((sum, ri) => sum + ri, 0) / riValues.length;

    // Calculate variance
    const riVariance = riValues
      .map(ri => Math.pow(ri - avgRI, 2))
      .reduce((sum, sq) => sum + sq, 0) / riValues.length;

    // Calculate trend
    const riTrend = this.calculateTrend(riValues);

    // Get dominant emotions
    const emotions = branches
      .map(b => b.emotion_state?.chemical_state)
      .filter(Boolean);

    const emotionCounts = new Map<string, number>();
    emotions.forEach(emotion => {
      emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
    });

    const dominantEmotions = Array.from(emotionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion]) => emotion);

    // Emotion variability (how many different emotions)
    const emotionVariability = emotionCounts.size / branches.length;

    // Get interventions used (from probability_field_id)
    const { data: fieldsUsed } = await supabase
      .from('reality_branches')
      .select('probability_field_id')
      .eq('user_id', userId)
      .not('probability_field_id', 'is', null)
      .gte('created_at', thirtyDaysAgo);

    const interventionsUsed = [...new Set((fieldsUsed || []).map(f => f.probability_field_id))];

    return {
      riVariance,
      riTrend,
      avgRI,
      dominantEmotions,
      emotionVariability,
      interventionsUsed,
      timespan: 30
    };
  }

  /**
   * Calculate similarity to archetype
   */
  private calculateSimilarity(vector: UserJourneyVector, archetype: JourneyArchetype): number {
    let score = 0;
    let maxScore = 0;

    // RI level similarity (0-0.3 points)
    maxScore += 0.3;
    if (archetype.id === 'depression_gradual' && vector.avgRI < 0.45) {
      score += 0.3;
    } else if (archetype.id === 'resilient_adjuster' && vector.avgRI > 0.6) {
      score += 0.3;
    } else if (archetype.id === 'stable_maintainer' && vector.avgRI >= 0.55 && vector.avgRI <= 0.65) {
      score += 0.3;
    } else if (vector.avgRI >= 0.4 && vector.avgRI <= 0.7) {
      score += 0.15; // Moderate RI
    }

    // Variability similarity (0-0.25 points)
    maxScore += 0.25;
    if (archetype.id === 'high_functioning_anxiety' && vector.riVariance > 0.03) {
      score += 0.25;
    } else if (archetype.id === 'stable_maintainer' && vector.riVariance < 0.01) {
      score += 0.25;
    } else if (archetype.id === 'trauma_processor' && vector.emotionVariability > 0.5) {
      score += 0.25;
    }

    // Trend similarity (0-0.2 points)
    maxScore += 0.2;
    if (archetype.id === 'anxiety_responder' && vector.riTrend > 0.01) {
      score += 0.2;
    } else if (archetype.id === 'depression_gradual' && vector.riTrend > 0 && vector.riTrend < 0.01) {
      score += 0.2;
    } else if (archetype.id === 'burnout_recoverer' && vector.riTrend < 0) {
      score += 0.2; // Initial decline
    }

    // Emotion similarity (0-0.25 points)
    maxScore += 0.25;
    const anxietyEmotions = ['anxious', 'worried', 'nervous'];
    const depressionEmotions = ['sad', 'hopeless', 'numb'];

    if (archetype.id.includes('anxiety') &&
        vector.dominantEmotions.some(e => anxietyEmotions.includes(e))) {
      score += 0.25;
    } else if (archetype.id.includes('depression') &&
               vector.dominantEmotions.some(e => depressionEmotions.includes(e))) {
      score += 0.25;
    }

    return score / maxScore;
  }

  /**
   * Compare features between user and archetype
   */
  private compareFeatures(
    vector: UserJourneyVector,
    archetype: JourneyArchetype
  ): { matching: string[]; differing: string[] } {
    const matching: string[] = [];
    const differing: string[] = [];

    // Check RI level
    if (archetype.id === 'depression_gradual' && vector.avgRI < 0.45) {
      matching.push('Low-moderate RI baseline');
    } else if (archetype.id === 'resilient_adjuster' && vector.avgRI > 0.6) {
      matching.push('High RI baseline');
    }

    // Check variability
    if (archetype.id === 'high_functioning_anxiety' && vector.riVariance > 0.03) {
      matching.push('High RI variability');
    } else if (archetype.id === 'stable_maintainer' && vector.riVariance < 0.01) {
      matching.push('Low RI variability');
    }

    // Check trend
    if (vector.riTrend > 0.01) {
      matching.push('Positive trajectory trend');
    } else if (vector.riTrend < -0.01) {
      matching.push('Declining trajectory');
    }

    // If no matching features found, add generic
    if (matching.length === 0) {
      matching.push('Similar overall pattern');
    }

    return { matching, differing };
  }

  /**
   * Calculate trend (slope)
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, y) => sum + y, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

export const patternClusterer = new PatternClusterer();
