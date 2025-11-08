/**
 * Builders Service - System Stability & Harmonization
 *
 * Monitors ROE system health, calculates entropy from reality branch
 * trajectories, and triggers automated harmonization actions when needed.
 *
 * Responsibilities:
 * - Entropy calculation from branch divergence
 * - Automated stabilization interventions
 * - System invariant monitoring
 * - Harmonization event logging
 */

import { supabase } from '../../lib/supabase';

interface EntropyMetrics {
  branchDivergence: number;
  riVariance: number;
  fieldFragmentation: number;
  overallEntropy: number;
  status: 'stable' | 'elevated' | 'critical';
}

interface HarmonizationAction {
  type: 'weight_decay' | 'intention_nudge' | 'grounding_boost' | 'field_reset';
  reason: string;
  metadata: Record<string, any>;
}

interface BuildersReport {
  userId: string;
  entropy: EntropyMetrics;
  actions: HarmonizationAction[];
  timestamp: string;
}

export class BuildersService {
  private readonly entropyThresholds = {
    stable: 0.3,
    elevated: 0.6,
    critical: 0.8
  };

  private readonly harmonizationInterval = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Calculate system entropy for a user
   */
  async calculateEntropy(userId: string): Promise<EntropyMetrics> {
    const branches = await this.fetchRecentBranches(userId, 50);

    if (branches.length < 2) {
      return {
        branchDivergence: 0,
        riVariance: 0,
        fieldFragmentation: 0,
        overallEntropy: 0,
        status: 'stable'
      };
    }

    const branchDivergence = this.computeBranchDivergence(branches);
    const riVariance = this.computeRIVariance(branches);
    const fieldFragmentation = this.computeFieldFragmentation(branches);

    const overallEntropy =
      0.4 * branchDivergence +
      0.3 * riVariance +
      0.3 * fieldFragmentation;

    const status =
      overallEntropy >= this.entropyThresholds.critical
        ? 'critical'
        : overallEntropy >= this.entropyThresholds.elevated
        ? 'elevated'
        : 'stable';

    return {
      branchDivergence,
      riVariance,
      fieldFragmentation,
      overallEntropy,
      status
    };
  }

  /**
   * Execute harmonization check and trigger actions if needed
   */
  async runHarmonizationCycle(userId: string): Promise<BuildersReport> {
    const entropy = await this.calculateEntropy(userId);
    const actions: HarmonizationAction[] = [];

    if (entropy.status === 'critical') {
      actions.push(...this.generateCriticalActions(entropy));
    } else if (entropy.status === 'elevated') {
      actions.push(...this.generateElevatedActions(entropy));
    }

    for (const action of actions) {
      await this.executeHarmonizationAction(userId, action);
    }

    await this.logHarmonization(userId, entropy, actions);

    return {
      userId,
      entropy,
      actions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if user needs harmonization intervention
   */
  async shouldHarmonize(userId: string): Promise<boolean> {
    const { data: lastHarmonization } = await supabase
      .from('builders_log')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastHarmonization) return true;

    const lastCheck = new Date(lastHarmonization.created_at).getTime();
    const now = Date.now();
    return now - lastCheck >= this.harmonizationInterval;
  }

  private async fetchRecentBranches(userId: string, limit: number) {
    const { data, error } = await supabase
      .from('reality_branches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Compute branch divergence from state trajectories
   */
  private computeBranchDivergence(branches: any[]): number {
    if (branches.length < 2) return 0;

    let totalDivergence = 0;
    let comparisons = 0;

    for (let i = 0; i < branches.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 5, branches.length); j++) {
        const b1 = branches[i];
        const b2 = branches[j];

        const riDiff = Math.abs(b1.resonance_index - b2.resonance_index);
        const chemicalDiff = b1.emotion_state?.chemical_state !== b2.emotion_state?.chemical_state ? 1 : 0;
        const profileDiff = b1.belief_state?.profile_id !== b2.belief_state?.profile_id ? 1 : 0;

        const divergence = (riDiff + chemicalDiff + profileDiff) / 3;
        totalDivergence += divergence;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalDivergence / comparisons : 0;
  }

  /**
   * Compute RI variance across recent branches
   */
  private computeRIVariance(branches: any[]): number {
    const riValues = branches.map(b => b.resonance_index);
    const mean = riValues.reduce((sum, ri) => sum + ri, 0) / riValues.length;
    const variance = riValues.reduce((sum, ri) => sum + Math.pow(ri - mean, 2), 0) / riValues.length;
    return Math.sqrt(variance);
  }

  /**
   * Compute field selection fragmentation
   */
  private computeFieldFragmentation(branches: any[]): number {
    const fieldCounts = new Map<string, number>();
    let totalSelections = 0;

    branches.forEach(branch => {
      if (branch.probability_field_id) {
        const count = fieldCounts.get(branch.probability_field_id) || 0;
        fieldCounts.set(branch.probability_field_id, count + 1);
        totalSelections++;
      }
    });

    if (totalSelections === 0) return 0;

    let entropy = 0;
    fieldCounts.forEach(count => {
      const p = count / totalSelections;
      entropy -= p * Math.log2(p);
    });

    const maxEntropy = Math.log2(fieldCounts.size);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  /**
   * Generate critical-level harmonization actions
   */
  private generateCriticalActions(entropy: EntropyMetrics): HarmonizationAction[] {
    const actions: HarmonizationAction[] = [];

    if (entropy.riVariance > 0.3) {
      actions.push({
        type: 'grounding_boost',
        reason: 'High RI instability detected',
        metadata: { variance: entropy.riVariance }
      });
    }

    if (entropy.fieldFragmentation > 0.8) {
      actions.push({
        type: 'field_reset',
        reason: 'Excessive field fragmentation',
        metadata: { fragmentation: entropy.fieldFragmentation }
      });
    }

    actions.push({
      type: 'intention_nudge',
      reason: 'Critical entropy level - system recalibration',
      metadata: { entropy: entropy.overallEntropy }
    });

    return actions;
  }

  /**
   * Generate elevated-level harmonization actions
   */
  private generateElevatedActions(entropy: EntropyMetrics): HarmonizationAction[] {
    const actions: HarmonizationAction[] = [];

    if (entropy.branchDivergence > 0.5) {
      actions.push({
        type: 'weight_decay',
        reason: 'High branch divergence',
        metadata: { divergence: entropy.branchDivergence }
      });
    }

    if (entropy.riVariance > 0.2) {
      actions.push({
        type: 'grounding_boost',
        reason: 'Moderate RI instability',
        metadata: { variance: entropy.riVariance }
      });
    }

    return actions;
  }

  /**
   * Execute harmonization action
   */
  private async executeHarmonizationAction(
    userId: string,
    action: HarmonizationAction
  ): Promise<void> {
    switch (action.type) {
      case 'weight_decay':
        await this.applyWeightDecay(userId, 0.9);
        break;
      case 'grounding_boost':
        await this.boostGroundingFields(userId);
        break;
      case 'field_reset':
        await this.resetFieldWeights(userId);
        break;
      case 'intention_nudge':
        await this.logIntentionNudge(userId, action.reason);
        break;
    }
  }

  private async applyWeightDecay(userId: string, decayFactor: number): Promise<void> {
    const { data: branches } = await supabase
      .from('reality_branches')
      .select('probability_field_id')
      .eq('user_id', userId)
      .not('probability_field_id', 'is', null);

    if (!branches) return;

    const fieldIds = [...new Set(branches.map(b => b.probability_field_id).filter(Boolean))];

    for (const fieldId of fieldIds) {
      const { data: field } = await supabase
        .from('probability_fields')
        .select('learning_weight')
        .eq('id', fieldId)
        .maybeSingle();

      if (field) {
        await supabase
          .from('probability_fields')
          .update({ learning_weight: field.learning_weight * decayFactor })
          .eq('id', fieldId);
      }
    }
  }

  private async boostGroundingFields(userId: string): Promise<void> {
    await supabase
      .from('probability_fields')
      .update({ learning_weight: supabase.rpc('boost_weight', { amount: 0.1 }) })
      .contains('outcome_data', { type: 'reflect' });
  }

  private async resetFieldWeights(userId: string): Promise<void> {
    const { data: branches } = await supabase
      .from('reality_branches')
      .select('probability_field_id')
      .eq('user_id', userId)
      .not('probability_field_id', 'is', null);

    if (!branches) return;

    const fieldIds = [...new Set(branches.map(b => b.probability_field_id).filter(Boolean))];

    await supabase
      .from('probability_fields')
      .update({ learning_weight: 0.5 })
      .in('id', fieldIds);
  }

  private async logIntentionNudge(userId: string, reason: string): Promise<void> {
    await supabase.from('roe_horizon_events').insert({
      id: `roe_${Date.now()}_${crypto.randomUUID()}`,
      user_id: userId,
      event_type: 'builders.intention_nudge',
      module_id: 'builders-service',
      payload: { reason },
      semantic_labels: ['builders', 'harmonization', 'intention'],
      resonance_index: null
    });
  }

  private async logHarmonization(
    userId: string,
    entropy: EntropyMetrics,
    actions: HarmonizationAction[]
  ): Promise<void> {
    await supabase.from('builders_log').insert({
      id: `build_${Date.now()}_${crypto.randomUUID()}`,
      user_id: userId,
      event_type: 'harmonization_cycle',
      context: {
        entropy,
        actions_taken: actions.map(a => ({ type: a.type, reason: a.reason }))
      }
    });

    await supabase.from('roe_horizon_events').insert({
      id: `roe_${Date.now()}_${crypto.randomUUID()}`,
      user_id: userId,
      event_type: 'builders.harmonization_complete',
      module_id: 'builders-service',
      payload: {
        entropy_status: entropy.status,
        actions_count: actions.length,
        overall_entropy: entropy.overallEntropy
      },
      semantic_labels: ['builders', 'harmonization', 'stability'],
      resonance_index: null
    });
  }
}

export const buildersService = new BuildersService();
