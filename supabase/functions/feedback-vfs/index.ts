/**
 * Value Fulfillment Score (VFS) Feedback Edge Function
 *
 * Processes user feedback and updates probability field learning weights
 * based on Value Fulfillment Score calculation.
 *
 * Endpoint: POST /functions/v1/feedback-vfs
 *
 * Request Body:
 * {
 *   user_id: string,
 *   field_id: string,
 *   branch_id?: string,
 *   self_report: number,        // -1 to 1 scale
 *   behavioral_metrics?: {
 *     completion_rate?: number, // 0-1
 *     revisit_count?: number,
 *     dwell_time_seconds?: number
 *   },
 *   context?: Record<string, any>
 * }
 *
 * Response:
 * {
 *   vfs_score: number,
 *   resonance_delta: number,
 *   field_id: string,
 *   new_learning_weight: number,
 *   harmonization_triggered: boolean
 * }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';

interface FeedbackVFSRequest {
  user_id: string;
  field_id: string;
  branch_id?: string;
  self_report: number;
  behavioral_metrics?: {
    completion_rate?: number;
    revisit_count?: number;
    dwell_time_seconds?: number;
  };
  context?: Record<string, any>;
}

// Learning rate (eta) for weight updates
const ETA = 0.05;

// Harmonization threshold
const HARMONIZATION_THRESHOLD = -0.3;

/**
 * Calculate Value Fulfillment Score from multi-signal fusion
 */
function calculateVFS(request: FeedbackVFSRequest): number {
  const { self_report, behavioral_metrics } = request;

  // Self-report is primary signal (weight: 0.6)
  let vfs = self_report * 0.6;

  if (behavioral_metrics) {
    // Completion rate contributes positively (weight: 0.2)
    if (behavioral_metrics.completion_rate !== undefined) {
      vfs += (behavioral_metrics.completion_rate * 2 - 1) * 0.2;
    }

    // Revisit count indicates engagement (weight: 0.1)
    if (behavioral_metrics.revisit_count !== undefined) {
      const revisitScore = Math.min(behavioral_metrics.revisit_count / 3, 1);
      vfs += (revisitScore * 2 - 1) * 0.1;
    }

    // Dwell time (normalized to minutes, weight: 0.1)
    if (behavioral_metrics.dwell_time_seconds !== undefined) {
      const dwellMinutes = behavioral_metrics.dwell_time_seconds / 60;
      const dwellScore = Math.min(dwellMinutes / 10, 1);
      vfs += (dwellScore * 2 - 1) * 0.1;
    }
  }

  // Clamp to [-1, 1]
  return Math.max(-1, Math.min(1, vfs));
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
    const feedbackData: FeedbackVFSRequest = await req.json();

    // Validate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== feedbackData.user_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate self_report range
    if (feedbackData.self_report < -1 || feedbackData.self_report > 1) {
      return new Response(
        JSON.stringify({ error: 'self_report must be between -1 and 1' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current field and latest branch
    const { data: field, error: fieldError } = await supabase
      .from('probability_fields')
      .select('*')
      .eq('id', feedbackData.field_id)
      .maybeSingle();

    if (fieldError) throw fieldError;
    if (!field) {
      return new Response(
        JSON.stringify({ error: 'Probability field not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: latestBranch } = await supabase
      .from('reality_branches')
      .select('resonance_index')
      .eq('user_id', feedbackData.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentRI = latestBranch?.resonance_index || 0.5;

    // Calculate VFS
    const vfsScore = calculateVFS(feedbackData);

    // Calculate resonance delta (change from current RI based on feedback)
    const resonanceDelta = vfsScore * 0.1; // Scale feedback to RI delta

    // Update learning weight using gradient descent
    const currentWeight = field.learning_weight;
    const weightDelta = ETA * vfsScore;
    const newWeight = Math.max(0, Math.min(1, currentWeight + weightDelta));

    // Update probability field
    await supabase
      .from('probability_fields')
      .update({ learning_weight: newWeight })
      .eq('id', feedbackData.field_id);

    // Log to value_fulfillment_log
    await supabase.from('value_fulfillment_log').insert({
      id: `vfl_${Date.now()}_${crypto.randomUUID()}`,
      user_id: feedbackData.user_id,
      branch_id: feedbackData.branch_id || null,
      probability_field_id: feedbackData.field_id,
      resonance_delta: resonanceDelta,
      fulfillment_score: vfsScore,
      context: {
        self_report: feedbackData.self_report,
        behavioral_metrics: feedbackData.behavioral_metrics,
        current_ri: currentRI,
        weight_change: weightDelta,
        ...(feedbackData.context || {})
      }
    });

    // Check if harmonization is needed
    const harmonizationTriggered = vfsScore < HARMONIZATION_THRESHOLD;

    if (harmonizationTriggered) {
      // Log to builders_log
      await supabase.from('builders_log').insert({
        id: `bl_${Date.now()}_${crypto.randomUUID()}`,
        level: 'harmonize',
        integrity_check: 'vfs_threshold',
        anomaly_type: 'negative_feedback_trajectory',
        resolution: {
          triggered_by: 'feedback_vfs',
          user_id: feedbackData.user_id,
          field_id: feedbackData.field_id,
          vfs_score: vfsScore,
          action: 'weight_stabilization_recommended'
        }
      });
    }

    // Log event to ROE horizon
    await supabase.from('roe_horizon_events').insert({
      id: `roe_${Date.now()}_${crypto.randomUUID()}`,
      user_id: feedbackData.user_id,
      event_type: 'feedback.vfs',
      module_id: 'value-fulfillment',
      payload: {
        field_id: feedbackData.field_id,
        vfs_score: vfsScore,
        resonance_delta: resonanceDelta,
        weight_change: weightDelta
      },
      semantic_labels: ['roe', 'feedback', 'vfs', 'learning'],
      resonance_index: currentRI + resonanceDelta
    });

    return new Response(
      JSON.stringify({
        vfs_score: vfsScore,
        resonance_delta: resonanceDelta,
        field_id: feedbackData.field_id,
        new_learning_weight: newWeight,
        harmonization_triggered: harmonizationTriggered
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in feedback-vfs:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
