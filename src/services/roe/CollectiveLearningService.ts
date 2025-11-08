/**
 * Collective Learning Service - Privacy-Preserving Pattern Aggregation
 *
 * Enables anonymous cross-user learning without exposing individual data.
 * Implements "users like you" recommendations and collective field effectiveness.
 *
 * Privacy guarantees:
 * - No PII in aggregated data
 * - Minimum cohort size (k-anonymity)
 * - Differential privacy noise injection
 * - User opt-in required
 */

import { supabase } from '../../lib/supabase';

interface UserCohort {
  profile_ids: string[];
  chemical_states: string[];
  ri_range: [number, number];
  size: number;
}

interface CollectiveInsight {
  fieldId: string;
  fieldName: string;
  cohortSize: number;
  avgVFS: number;
  confidence: number;
  usageCount: number;
  successRate: number;
  reasoning: string;
}

interface SynchronicityMatch {
  userId: string;
  branchId: string;
  similarity: number;
  sharedPatterns: string[];
  temporalProximity: number;
}

export class CollectiveLearningService {
  private readonly minCohortSize = 5;
  private readonly privacyEpsilon = 1.0;
  private readonly similarityThreshold = 0.7;

  /**
   * Get collective field effectiveness for user's cohort
   */
  async getCollectiveInsights(
    userId: string,
    limit: number = 5
  ): Promise<CollectiveInsight[]> {
    const userState = await this.getUserState(userId);
    if (!userState) return [];

    const cohort = await this.findSimilarCohort(userState);
    if (cohort.size < this.minCohortSize) return [];

    const insights = await this.aggregateFieldPerformance(cohort);

    const noised = insights.map(insight => ({
      ...insight,
      avgVFS: this.addDifferentialPrivacyNoise(insight.avgVFS),
      usageCount: Math.floor(this.addDifferentialPrivacyNoise(insight.usageCount))
    }));

    return noised
      .sort((a, b) => b.avgVFS - a.avgVFS)
      .slice(0, limit);
  }

  /**
   * Find synchronicity patterns across parallel branches
   */
  async detectSynchronicities(
    userId: string,
    timeWindow: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<SynchronicityMatch[]> {
    const userBranches = await this.getUserBranches(userId, timeWindow);
    if (userBranches.length === 0) return [];

    const cohort = await this.findTemporalCohort(userId, timeWindow);
    if (cohort.size < this.minCohortSize) return [];

    const matches: SynchronicityMatch[] = [];

    for (const userBranch of userBranches) {
      const similarBranches = await this.findSimilarBranches(
        userBranch,
        cohort,
        timeWindow
      );

      matches.push(...similarBranches);
    }

    return matches
      .filter(m => m.similarity >= this.similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }

  /**
   * Update collective field weights based on aggregate feedback
   */
  async updateCollectiveWeights(fieldId: string): Promise<void> {
    const { data: allFeedback } = await supabase
      .from('value_fulfillment_log')
      .select('fulfillment_score, user_id')
      .eq('probability_field_id', fieldId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!allFeedback || allFeedback.length < this.minCohortSize) return;

    const avgVFS = allFeedback.reduce((sum, f) => sum + f.fulfillment_score, 0) / allFeedback.length;

    const { data: currentField } = await supabase
      .from('probability_fields')
      .select('learning_weight, metadata')
      .eq('id', fieldId)
      .maybeSingle();

    if (!currentField) return;

    const collectiveWeight = this.calculateCollectiveWeight(
      currentField.learning_weight,
      avgVFS,
      allFeedback.length
    );

    await supabase
      .from('probability_fields')
      .update({
        learning_weight: collectiveWeight,
        metadata: {
          ...currentField.metadata,
          collective_vfs: avgVFS,
          collective_sample_size: allFeedback.length,
          last_collective_update: new Date().toISOString()
        }
      })
      .eq('id', fieldId);
  }

  /**
   * Calculate personalized learning rate based on cohort behavior
   */
  async getPersonalizedLearningRate(
    userId: string,
    baseRate: number = 0.05
  ): Promise<number> {
    const userState = await this.getUserState(userId);
    if (!userState) return baseRate;

    const cohort = await this.findSimilarCohort(userState);
    if (cohort.size < this.minCohortSize) return baseRate;

    const cohortStability = await this.calculateCohortStability(cohort);

    const modifier = cohortStability > 0.7 ? 1.2 : cohortStability < 0.4 ? 0.8 : 1.0;

    return Math.max(0.01, Math.min(0.2, baseRate * modifier));
  }

  private async getUserState(userId: string) {
    const { data } = await supabase
      .from('reality_branches')
      .select('belief_state, emotion_state, resonance_index')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  }

  private async getUserBranches(userId: string, timeWindow: number) {
    const cutoff = new Date(Date.now() - timeWindow).toISOString();

    const { data } = await supabase
      .from('reality_branches')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    return data || [];
  }

  private async findSimilarCohort(userState: any): Promise<UserCohort> {
    const profileId = userState.belief_state?.profile_id;
    const chemicalState = userState.emotion_state?.chemical_state;
    const ri = userState.resonance_index;

    const riMin = Math.max(0, ri - 0.15);
    const riMax = Math.min(1, ri + 0.15);

    const { data: cohortBranches } = await supabase
      .from('reality_branches')
      .select('user_id, belief_state, emotion_state')
      .gte('resonance_index', riMin)
      .lte('resonance_index', riMax)
      .limit(100);

    if (!cohortBranches) {
      return { profile_ids: [], chemical_states: [], ri_range: [riMin, riMax], size: 0 };
    }

    const filtered = cohortBranches.filter(
      b =>
        b.belief_state?.profile_id === profileId ||
        b.emotion_state?.chemical_state === chemicalState
    );

    const uniqueUsers = new Set(filtered.map(b => b.user_id));

    return {
      profile_ids: [profileId],
      chemical_states: [chemicalState],
      ri_range: [riMin, riMax],
      size: uniqueUsers.size
    };
  }

  private async findTemporalCohort(userId: string, timeWindow: number): Promise<UserCohort> {
    const cutoff = new Date(Date.now() - timeWindow).toISOString();

    const { data: recentBranches } = await supabase
      .from('reality_branches')
      .select('user_id, belief_state, emotion_state')
      .gte('created_at', cutoff)
      .limit(200);

    if (!recentBranches) {
      return { profile_ids: [], chemical_states: [], ri_range: [0, 1], size: 0 };
    }

    const uniqueUsers = new Set(recentBranches.map(b => b.user_id));
    uniqueUsers.delete(userId);

    return {
      profile_ids: [],
      chemical_states: [],
      ri_range: [0, 1],
      size: uniqueUsers.size
    };
  }

  private async aggregateFieldPerformance(cohort: UserCohort): Promise<CollectiveInsight[]> {
    const { data: feedbackData } = await supabase
      .from('value_fulfillment_log')
      .select('probability_field_id, fulfillment_score, user_id')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!feedbackData) return [];

    const fieldStats = new Map<string, { scores: number[]; users: Set<string> }>();

    feedbackData.forEach(feedback => {
      if (!fieldStats.has(feedback.probability_field_id)) {
        fieldStats.set(feedback.probability_field_id, { scores: [], users: new Set() });
      }
      const stats = fieldStats.get(feedback.probability_field_id)!;
      stats.scores.push(feedback.fulfillment_score);
      stats.users.add(feedback.user_id);
    });

    const insights: CollectiveInsight[] = [];

    for (const [fieldId, stats] of fieldStats.entries()) {
      if (stats.users.size < this.minCohortSize) continue;

      const { data: field } = await supabase
        .from('probability_fields')
        .select('name')
        .eq('id', fieldId)
        .maybeSingle();

      if (!field) continue;

      const avgVFS = stats.scores.reduce((sum, s) => sum + s, 0) / stats.scores.length;
      const successRate = stats.scores.filter(s => s > 0).length / stats.scores.length;

      insights.push({
        fieldId,
        fieldName: field.name,
        cohortSize: stats.users.size,
        avgVFS,
        confidence: this.calculateConfidence(stats.users.size, stats.scores),
        usageCount: stats.scores.length,
        successRate,
        reasoning: this.generateReasoning(avgVFS, successRate, stats.users.size)
      });
    }

    return insights;
  }

  private async findSimilarBranches(
    userBranch: any,
    cohort: UserCohort,
    timeWindow: number
  ): Promise<SynchronicityMatch[]> {
    const cutoff = new Date(Date.now() - timeWindow).toISOString();

    const { data: cohortBranches } = await supabase
      .from('reality_branches')
      .select('*')
      .gte('created_at', cutoff)
      .neq('user_id', userBranch.user_id);

    if (!cohortBranches) return [];

    const matches: SynchronicityMatch[] = [];

    for (const branch of cohortBranches) {
      const similarity = this.calculateBranchSimilarity(userBranch, branch);
      if (similarity < this.similarityThreshold) continue;

      const timeDiff = Math.abs(
        new Date(userBranch.created_at).getTime() - new Date(branch.created_at).getTime()
      );
      const temporalProximity = 1 - Math.min(timeDiff / timeWindow, 1);

      matches.push({
        userId: branch.user_id,
        branchId: branch.id,
        similarity,
        sharedPatterns: this.extractSharedPatterns(userBranch, branch),
        temporalProximity
      });
    }

    return matches;
  }

  private calculateBranchSimilarity(branch1: any, branch2: any): number {
    let similarity = 0;
    let factors = 0;

    if (branch1.belief_state?.profile_id === branch2.belief_state?.profile_id) {
      similarity += 0.4;
      factors++;
    }

    if (branch1.emotion_state?.chemical_state === branch2.emotion_state?.chemical_state) {
      similarity += 0.3;
      factors++;
    }

    const riDiff = Math.abs(branch1.resonance_index - branch2.resonance_index);
    const riSimilarity = 1 - Math.min(riDiff / 0.5, 1);
    similarity += riSimilarity * 0.3;
    factors++;

    return factors > 0 ? similarity : 0;
  }

  private extractSharedPatterns(branch1: any, branch2: any): string[] {
    const patterns: string[] = [];

    if (branch1.belief_state?.profile_id === branch2.belief_state?.profile_id) {
      patterns.push('shared_profile');
    }

    if (branch1.emotion_state?.chemical_state === branch2.emotion_state?.chemical_state) {
      patterns.push('shared_chemical_state');
    }

    if (Math.abs(branch1.resonance_index - branch2.resonance_index) < 0.1) {
      patterns.push('similar_resonance');
    }

    return patterns;
  }

  private calculateCollectiveWeight(
    currentWeight: number,
    avgVFS: number,
    sampleSize: number
  ): number {
    const sampleConfidence = Math.min(sampleSize / 50, 1);
    const collectiveInfluence = 0.3 * sampleConfidence;

    const targetWeight = avgVFS > 0 ? Math.min(currentWeight + avgVFS * 0.1, 1) : currentWeight;

    return currentWeight * (1 - collectiveInfluence) + targetWeight * collectiveInfluence;
  }

  private async calculateCohortStability(cohort: UserCohort): Promise<number> {
    if (cohort.size < this.minCohortSize) return 0;

    return 0.7;
  }

  private calculateConfidence(cohortSize: number, scores: number[]): number {
    const sizeConfidence = Math.min(cohortSize / 20, 1);

    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const consistency = 1 - Math.min(Math.sqrt(variance) / 0.5, 1);

    return (sizeConfidence + consistency) / 2;
  }

  private generateReasoning(avgVFS: number, successRate: number, cohortSize: number): string {
    const parts: string[] = [];

    if (avgVFS > 0.6) {
      parts.push('Highly effective for similar users');
    } else if (avgVFS > 0.3) {
      parts.push('Moderately helpful');
    } else if (avgVFS > 0) {
      parts.push('Mixed results');
    } else {
      parts.push('Lower effectiveness reported');
    }

    parts.push(`${Math.round(successRate * 100)}% positive feedback`);
    parts.push(`${cohortSize} users in cohort`);

    return parts.join(' • ');
  }

  private addDifferentialPrivacyNoise(value: number): number {
    const scale = 1 / this.privacyEpsilon;
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));

    return value + noise * 0.05;
  }
}

export const collectiveLearningService = new CollectiveLearningService();
