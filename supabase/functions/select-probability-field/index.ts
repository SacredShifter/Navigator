/**
 * Select Probability Field Edge Function
 *
 * Selects optimal probability field using Reality Selection Matrix (RSM).
 *
 * Endpoint: POST /functions/v1/select-probability-field
 *
 * Request Body:
 * {
 *   user_id: string,
 *   intent: 'reflect' | 'ritual' | 'lesson' | 'music' | 'visual',
 *   signal?: { text?: string, emotion_hint?: string }
 * }
 *
 * Response:
 * {
 *   ri: number,
 *   emotion: string,
 *   probability_field_id: string,
 *   outcome: { type: string, payload: any },
 *   reasoning: string
 * }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';

interface SelectFieldRequest {
  user_id: string;
  intent: string;
  signal?: {
    text?: string;
    emotion_hint?: string;
  };
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
    const { user_id, intent, signal }: SelectFieldRequest = await req.json();

    // Validate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user state and latest RI
    const { data: userState } = await supabase
      .from('user_state_profiles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (!userState) {
      return new Response(
        JSON.stringify({ error: 'User state not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: latestBranch } = await supabase
      .from('reality_branches')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentRI = latestBranch?.resonance_index || 0.5;

    // Retrieve candidate probability fields
    const { data: candidates, error: candidatesError } = await supabase
      .from('probability_fields')
      .select('*')
      .or(`chemical_state_filter.is.null,chemical_state_filter.eq.${userState.chemical_state}`)
      .order('learning_weight', { ascending: false })
      .limit(20);

    if (candidatesError) throw candidatesError;

    if (!candidates || candidates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No probability fields available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple scoring (placeholder for full RSM)
    // TODO: Integrate vector similarity when pattern_signatures are populated
    const scored = candidates.map(field => ({
      field,
      score: (
        0.4 * field.learning_weight +
        0.3 * currentRI +
        0.2 * (1 - field.fatigue_score / 10) +
        0.1 * Math.random() // Diversity sampling
      )
    }));

    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0].field;

    // Update fatigue
    await supabase
      .from('probability_fields')
      .update({ fatigue_score: selected.fatigue_score + 1 })
      .eq('id', selected.id);

    // Create reality branch entry
    await supabase.from('reality_branches').insert({
      id: `rb_${Date.now()}_${crypto.randomUUID()}`,
      user_id,
      belief_state: { profile: userState.profile_id },
      emotion_state: { chemical_state: userState.chemical_state },
      resonance_index: currentRI,
      probability_field_id: selected.id,
      trajectory: []
    });

    // Log selection event
    await supabase.from('roe_horizon_events').insert({
      id: `roe_${Date.now()}_${crypto.randomUUID()}`,
      user_id,
      event_type: 'field.selected',
      module_id: 'reality-selection-matrix',
      payload: {
        field_id: selected.id,
        field_name: selected.name,
        score: scored[0].score,
        intent,
        signal
      },
      semantic_labels: ['roe', 'selection', 'probability-field'],
      resonance_index: currentRI
    });

    return new Response(
      JSON.stringify({
        ri: currentRI,
        emotion: userState.chemical_state || 'unknown',
        probability_field_id: selected.id,
        outcome: selected.outcome_data,
        reasoning: `Selected based on learning weight (${selected.learning_weight.toFixed(2)}) and current RI (${currentRI.toFixed(2)})`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in select-probability-field:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
