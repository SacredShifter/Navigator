/**
 * Builders Harmonization Edge Function
 *
 * Executes automated system stability checks and harmonization actions.
 * Can be called manually or via scheduled cron job.
 *
 * Endpoint: POST /functions/v1/builders-harmonization
 *
 * Request Body:
 * {
 *   user_id: string,
 *   force?: boolean
 * }
 *
 * Response:
 * {
 *   entropy: EntropyMetrics,
 *   actions: HarmonizationAction[],
 *   timestamp: string
 * }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';

interface HarmonizationRequest {
  user_id: string;
  force?: boolean;
}

interface EntropyMetrics {
  branchDivergence: number;
  riVariance: number;
  fieldFragmentation: number;
  overallEntropy: number;
  status: 'stable' | 'elevated' | 'critical';
}

interface HarmonizationAction {
  type: string;
  reason: string;
  metadata: Record<string, any>;
}

const HARMONIZATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const ENTROPY_THRESHOLDS = {
  stable: 0.3,
  elevated: 0.6,
  critical: 0.8
};

async function calculateEntropy(supabase: any, userId: string): Promise<EntropyMetrics> {
  const { data: branches } = await supabase
    .from('reality_branches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!branches || branches.length < 2) {
    return {
      branchDivergence: 0,
      riVariance: 0,
      fieldFragmentation: 0,
      overallEntropy: 0,
      status: 'stable'
    };
  }

  const branchDivergence = computeBranchDivergence(branches);
  const riVariance = computeRIVariance(branches);
  const fieldFragmentation = computeFieldFragmentation(branches);

  const overallEntropy =
    0.4 * branchDivergence +
    0.3 * riVariance +
    0.3 * fieldFragmentation;

  const status =
    overallEntropy >= ENTROPY_THRESHOLDS.critical
      ? 'critical'
      : overallEntropy >= ENTROPY_THRESHOLDS.elevated
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

function computeBranchDivergence(branches: any[]): number {
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

function computeRIVariance(branches: any[]): number {
  const riValues = branches.map(b => b.resonance_index);
  const mean = riValues.reduce((sum, ri) => sum + ri, 0) / riValues.length;
  const variance = riValues.reduce((sum, ri) => sum + Math.pow(ri - mean, 2), 0) / riValues.length;
  return Math.sqrt(variance);
}

function computeFieldFragmentation(branches: any[]): number {
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

function generateActions(entropy: EntropyMetrics): HarmonizationAction[] {
  const actions: HarmonizationAction[] = [];

  if (entropy.status === 'critical') {
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
  } else if (entropy.status === 'elevated') {
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
  }

  return actions;
}

async function executeActions(
  supabase: any,
  userId: string,
  actions: HarmonizationAction[]
): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case 'weight_decay':
        await applyWeightDecay(supabase, userId, 0.9);
        break;
      case 'grounding_boost':
        await logGroundingBoost(supabase, userId);
        break;
      case 'field_reset':
        await resetFieldWeights(supabase, userId);
        break;
      case 'intention_nudge':
        await logIntentionNudge(supabase, userId, action.reason);
        break;
    }
  }
}

async function applyWeightDecay(supabase: any, userId: string, decayFactor: number): Promise<void> {
  const { data: branches } = await supabase
    .from('reality_branches')
    .select('probability_field_id')
    .eq('user_id', userId)
    .not('probability_field_id', 'is', null);

  if (!branches) return;

  const fieldIds = [...new Set(branches.map((b: any) => b.probability_field_id).filter(Boolean))];

  for (const fieldId of fieldIds) {
    const { data: field } = await supabase
      .from('probability_fields')
      .select('learning_weight')
      .eq('id', fieldId)
      .maybeSingle();

    if (field) {
      await supabase
        .from('probability_fields')
        .update({ learning_weight: Math.max(0.1, field.learning_weight * decayFactor) })
        .eq('id', fieldId);
    }
  }
}

async function logGroundingBoost(supabase: any, userId: string): Promise<void> {
  await supabase.from('roe_horizon_events').insert({
    id: `roe_${Date.now()}_${crypto.randomUUID()}`,
    user_id: userId,
    event_type: 'builders.grounding_boost',
    module_id: 'builders-service',
    payload: { action: 'grounding_boost_recommended' },
    semantic_labels: ['builders', 'harmonization', 'grounding'],
    resonance_index: null
  });
}

async function resetFieldWeights(supabase: any, userId: string): Promise<void> {
  const { data: branches } = await supabase
    .from('reality_branches')
    .select('probability_field_id')
    .eq('user_id', userId)
    .not('probability_field_id', 'is', null);

  if (!branches) return;

  const fieldIds = [...new Set(branches.map((b: any) => b.probability_field_id).filter(Boolean))];

  await supabase
    .from('probability_fields')
    .update({ learning_weight: 0.5 })
    .in('id', fieldIds);
}

async function logIntentionNudge(supabase: any, userId: string, reason: string): Promise<void> {
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

async function logHarmonization(
  supabase: any,
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

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { user_id, force }: HarmonizationRequest = await req.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!force) {
      const { data: lastHarmonization } = await supabase
        .from('builders_log')
        .select('created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastHarmonization) {
        const lastCheck = new Date(lastHarmonization.created_at).getTime();
        const now = Date.now();
        if (now - lastCheck < HARMONIZATION_INTERVAL) {
          return new Response(
            JSON.stringify({
              message: 'Harmonization not needed yet',
              next_check: new Date(lastCheck + HARMONIZATION_INTERVAL).toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const entropy = await calculateEntropy(supabase, user_id);
    const actions = generateActions(entropy);

    if (actions.length > 0) {
      await executeActions(supabase, user_id, actions);
    }

    await logHarmonization(supabase, user_id, entropy, actions);

    return new Response(
      JSON.stringify({
        entropy,
        actions,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in builders-harmonization:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
