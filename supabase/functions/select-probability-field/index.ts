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

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
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

    // Generate user state embedding from belief + emotion context
    const userStateText = [
      `Profile: ${userState.profile_id}`,
      `Chemical state: ${userState.chemical_state}`,
      `Regulation level: ${userState.regulation_level || 'unknown'}`,
      signal?.text || '',
      signal?.emotion_hint ? `Feeling: ${signal.emotion_hint}` : ''
    ].filter(Boolean).join('. ');

    // Get user state embedding (or use synthetic if OpenRouter not available)
    let userStateVector: number[] | null = null;
    try {
      const embeddingResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-embedding`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: userStateText })
        }
      );
      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        userStateVector = embeddingData.embedding;
      }
    } catch (error) {
      console.warn('Embedding generation failed, using simplified scoring:', error);
    }

    // RSM Scoring with vector similarity
    const alpha = 0.4;  // Pattern match weight
    const beta = 0.3;   // RI contribution weight
    const gamma = 0.2;  // Learning weight prior
    const delta = 0.1;  // Fatigue penalty weight

    const scored = candidates.map(field => {
      let patternMatch = 0;

      // Calculate pattern similarity if vectors available
      if (userStateVector && field.pattern_signature) {
        const fieldVector = Array.isArray(field.pattern_signature)
          ? field.pattern_signature
          : JSON.parse(field.pattern_signature as any);

        if (fieldVector.length === userStateVector.length) {
          patternMatch = cosineSimilarity(userStateVector, fieldVector);
        }
      }

      const fatiguePenalty = Math.exp(field.fatigue_score / 10) - 1;

      const totalScore =
        alpha * patternMatch +
        beta * currentRI +
        gamma * field.learning_weight -
        delta * fatiguePenalty;

      return {
        field,
        score: totalScore,
        components: {
          patternMatch,
          riContribution: currentRI,
          learningWeight: field.learning_weight,
          fatiguePenalty
        }
      };
    });

    scored.sort((a, b) => b.score - a.score);

    // Diversity sampling with temperature-based softmax
    const temperature = 0.2;
    const expScores = scored.slice(0, 5).map(s => Math.exp(s.score / temperature));
    const sumExp = expScores.reduce((sum, exp) => sum + exp, 0);
    const probabilities = expScores.map(exp => exp / sumExp);

    let selectedIndex = 0;
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (random <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    const selected = scored[selectedIndex].field;
    const selectedScore = scored[selectedIndex];

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
        score: selectedScore.score,
        components: selectedScore.components,
        intent,
        signal
      },
      semantic_labels: ['roe', 'selection', 'probability-field'],
      resonance_index: currentRI
    });

    // Generate reasoning
    const reasons: string[] = [];
    if (selectedScore.components.patternMatch > 0.7) {
      reasons.push(`Strong pattern alignment (${(selectedScore.components.patternMatch * 100).toFixed(0)}%)`);
    }
    if (currentRI > 0.75) {
      reasons.push(`High coherence state (RI: ${currentRI.toFixed(2)})`);
    } else if (currentRI < 0.4) {
      reasons.push(`Supporting stabilization (RI: ${currentRI.toFixed(2)})`);
    }
    if (selectedScore.components.learningWeight > 0.7) {
      reasons.push('Previously effective pathway');
    }
    const reasoning = reasons.length > 0
      ? reasons.join('. ')
      : `Selected via RSM (score: ${selectedScore.score.toFixed(3)})`;

    return new Response(
      JSON.stringify({
        ri: currentRI,
        emotion: userState.chemical_state || 'unknown',
        probability_field_id: selected.id,
        outcome: selected.outcome_data,
        reasoning,
        score: selectedScore.score,
        components: selectedScore.components
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
