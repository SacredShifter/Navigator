/**
 * Compute Resonance Edge Function
 *
 * Calculates Resonance Index (RI) for a user based on their current state.
 *
 * Endpoint: POST /functions/v1/compute-resonance
 *
 * Request Body:
 * {
 *   user_id: string,
 *   signal?: { text?: string, emotion_hint?: string }
 * }
 *
 * Response:
 * {
 *   resonance_index: number,
 *   components: {
 *     belief_coherence: number,
 *     emotion_stability: number,
 *     value_alignment: number
 *   },
 *   current_emotion: string,
 *   timestamp: number
 * }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';

interface ComputeResonanceRequest {
  user_id: string;
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
    const { user_id, signal }: ComputeResonanceRequest = await req.json();

    // Validate user has access to their own data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to user data' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve user's current state
    const { data: userState, error: stateError } = await supabase
      .from('user_state_profiles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (stateError) throw stateError;

    if (!userState) {
      return new Response(
        JSON.stringify({ error: 'User state not found. Complete assessment first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve latest reality branch
    const { data: latestBranch } = await supabase
      .from('reality_branches')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get emotion frequency from emotion_map
    const { data: emotionData } = await supabase
      .from('emotion_map')
      .select('emotion, frequency_value')
      .maybeSingle();

    const emotionFrequency = emotionData?.frequency_value || 0.5;

    // Calculate RI components
    // TODO: Integrate with full ResonanceCalculator when embeddings are available
    const components = {
      belief_coherence: 0.7, // Placeholder: would use embedding similarity
      emotion_stability: latestBranch?.resonance_index || emotionFrequency,
      value_alignment: 0.6 // Placeholder: would use intention vector correlation
    };

    const resonance_index = (
      components.belief_coherence +
      components.emotion_stability +
      components.value_alignment
    ) / 3;

    // Clamp to [0, 1]
    const finalRI = Math.max(0, Math.min(1, resonance_index));

    // Log to roe_horizon_events
    await supabase.from('roe_horizon_events').insert({
      id: `roe_${Date.now()}_${crypto.randomUUID()}`,
      user_id,
      event_type: 'resonance.calculated',
      module_id: 'resonance-calculator',
      payload: {
        resonance_index: finalRI,
        components,
        signal
      },
      semantic_labels: ['roe', 'resonance', 'calculation'],
      resonance_index: finalRI,
      metadata: { version: '1.0' }
    });

    return new Response(
      JSON.stringify({
        resonance_index: finalRI,
        components,
        current_emotion: userState.chemical_state || 'unknown',
        timestamp: Date.now()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in compute-resonance:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
