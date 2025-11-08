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
    scroll_depth?: number;
    pause_count?: number;
    focus_time?: number;
  };
  biometric_signals?: Array<{
    type: 'hrv' | 'breath' | 'gsr' | 'motion' | 'interaction';
    value: number;
    timestamp: number;
    confidence: number;
  }>;
  context?: Record<string, any>;
}

// Learning rate (eta) for weight updates
const ETA = 0.05;

// Harmonization threshold
const HARMONIZATION_THRESHOLD = -0.3;

/**
 * Calculate Value Fulfillment Score from multi-signal fusion
 */
function calculateVFS(request: FeedbackVFSRequest): { vfs: number; confidence: number } {
  const { self_report, behavioral_metrics, biometric_signals } = request;

  const hasSelfReport = self_report !== undefined && self_report !== null;
  const hasBehavioral = behavioral_metrics !== undefined;
  const hasBiometric = biometric_signals && biometric_signals.length > 0;

  let selfReportScore = 0;
  let behavioralScore = 0;
  let biometricScore = 0;

  let weights = { self: 0.5, behavioral: 0.3, biometric: 0.2 };

  if (!hasBiometric) {
    weights = { self: 0.6, behavioral: 0.4, biometric: 0 };
  }
  if (!hasBehavioral) {
    weights = { self: 0.7, behavioral: 0, biometric: 0.3 };
  }
  if (!hasBehavioral && !hasBiometric) {
    weights = { self: 1.0, behavioral: 0, biometric: 0 };
  }

  if (hasSelfReport) {
    selfReportScore = self_report;
  }

  if (hasBehavioral) {
    const m = behavioral_metrics!;
    let score = 0;
    let count = 0;

    if (m.completion_rate !== undefined) {
      score += (m.completion_rate * 2 - 1) * 0.3;
      count += 0.3;
    }
    if (m.revisit_count !== undefined) {
      const revisit = Math.min(m.revisit_count / 3, 1);
      score += (revisit * 2 - 1) * 0.1;
      count += 0.1;
    }
    if (m.dwell_time_seconds !== undefined) {
      const dwell = Math.min(m.dwell_time_seconds / 600, 1);
      score += (dwell * 2 - 1) * 0.25;
      count += 0.25;
    }
    if (m.scroll_depth !== undefined) {
      score += (m.scroll_depth / 100) * 0.15;
      count += 0.15;
    }
    if (m.focus_time !== undefined && m.dwell_time_seconds !== undefined) {
      const focusRatio = m.focus_time / m.dwell_time_seconds;
      score += (focusRatio * 2 - 1) * 0.2;
      count += 0.2;
    }

    behavioralScore = count > 0 ? score / count : 0;
  }

  if (hasBiometric) {
    const signals = biometric_signals!;
    let weightedSum = 0;
    let totalWeight = 0;

    signals.forEach(signal => {
      const normalized = normalizeSignal(signal);
      weightedSum += normalized * signal.confidence;
      totalWeight += signal.confidence;
    });

    biometricScore = totalWeight > 0 ? (weightedSum / totalWeight) * 2 - 1 : 0;
  }

  const vfs =
    weights.self * selfReportScore +
    weights.behavioral * behavioralScore +
    weights.biometric * biometricScore;

  const values = [];
  if (hasSelfReport) values.push(selfReportScore);
  if (hasBehavioral) values.push(behavioralScore);
  if (hasBiometric) values.push(biometricScore);

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const agreement = 1 - Math.min(Math.sqrt(variance) / 0.5, 1);

  const confidence = Math.min(values.length / 3, 1) * agreement;

  return {
    vfs: Math.max(-1, Math.min(1, vfs)),
    confidence: Math.max(0, Math.min(1, confidence))
  };
}

function normalizeSignal(signal: any): number {
  switch (signal.type) {
    case 'hrv':
      return Math.max(0, Math.min(1, (signal.value - 20) / 80));
    case 'breath':
      return Math.max(0, 1 - Math.abs(signal.value - 6) / 10);
    case 'gsr':
      return Math.max(0, Math.min(1, 1 - (signal.value - 1) / 19));
    case 'motion':
      return Math.max(0, Math.min(1, 1 - signal.value / 2));
    case 'interaction':
      return Math.max(0, Math.min(1, signal.value));
    default:
      return signal.value;
  }
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

    // Calculate VFS with multimodal fusion
    const { vfs: vfsScore, confidence } = calculateVFS(feedbackData);

    // Calculate resonance delta (change from current RI based on feedback)
    const resonanceDelta = vfsScore * 0.1; // Scale feedback to RI delta

    // Adaptive learning rate based on confidence
    const adaptiveEta = ETA * (0.5 + confidence * 0.5);

    // Update learning weight using gradient descent
    const currentWeight = field.learning_weight;
    const weightDelta = adaptiveEta * vfsScore;
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
        biometric_signals: feedbackData.biometric_signals,
        current_ri: currentRI,
        weight_change: weightDelta,
        confidence: confidence,
        adaptive_eta: adaptiveEta,
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
        confidence: confidence,
        resonance_delta: resonanceDelta,
        field_id: feedbackData.field_id,
        new_learning_weight: newWeight,
        weight_delta: weightDelta,
        adaptive_eta: adaptiveEta,
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
