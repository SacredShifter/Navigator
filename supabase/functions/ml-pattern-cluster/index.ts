/**
 * ML Pattern Clustering Edge Function
 * 
 * Matches users to journey archetypes discovered in public datasets.
 * 
 * PRIVACY: Users matched to archetypes, not to specific individuals
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface JourneyArchetype {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  typicalTrajectory: string;
  successfulInterventions: string[];
  avgRecoveryTime: number;
  prevalence: number;
}

interface PatternMatch {
  archetype: JourneyArchetype;
  similarity: number;
  matchingFeatures: string[];
  differingFeatures: string[];
}

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { userId, limit = 3 } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build user journey vector
    const userVector = await buildJourneyVector(supabase, userId);

    if (!userVector) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate similarity to each archetype
    const matches: PatternMatch[] = [];

    for (const archetype of ARCHETYPES) {
      const similarity = calculateSimilarity(userVector, archetype);

      if (similarity > 0.3) {
        matches.push({
          archetype,
          similarity,
          matchingFeatures: ['Similar overall pattern'],
          differingFeatures: []
        });
      }
    }

    // Sort by similarity
    const topMatches = matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return new Response(
      JSON.stringify({ matches: topMatches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Pattern clustering error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function buildJourneyVector(supabase: any, userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: branches } = await supabase
    .from('reality_branches')
    .select('resonance_index, created_at')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true });

  if (!branches || branches.length < 5) {
    return null;
  }

  const riValues = branches.map((b: any) => b.resonance_index);
  const avgRI = riValues.reduce((sum: number, ri: number) => sum + ri, 0) / riValues.length;

  const riVariance = riValues
    .map((ri: number) => Math.pow(ri - avgRI, 2))
    .reduce((sum: number, sq: number) => sum + sq, 0) / riValues.length;

  const riTrend = calculateTrend(riValues);

  return { riVariance, riTrend, avgRI };
}

function calculateTrend(values: number[]): number {
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

function calculateSimilarity(vector: any, archetype: JourneyArchetype): number {
  let score = 0;

  // RI level similarity
  if (archetype.id === 'depression_gradual' && vector.avgRI < 0.45) {
    score += 0.3;
  } else if (archetype.id === 'resilient_adjuster' && vector.avgRI > 0.6) {
    score += 0.3;
  } else if (archetype.id === 'stable_maintainer' && vector.avgRI >= 0.55 && vector.avgRI <= 0.65) {
    score += 0.3;
  } else if (vector.avgRI >= 0.4 && vector.avgRI <= 0.7) {
    score += 0.15;
  }

  // Variability similarity
  if (archetype.id === 'high_functioning_anxiety' && vector.riVariance > 0.03) {
    score += 0.25;
  } else if (archetype.id === 'stable_maintainer' && vector.riVariance < 0.01) {
    score += 0.25;
  }

  // Trend similarity
  if (archetype.id === 'anxiety_responder' && vector.riTrend > 0.01) {
    score += 0.2;
  } else if (archetype.id === 'depression_gradual' && vector.riTrend > 0 && vector.riTrend < 0.01) {
    score += 0.2;
  } else if (archetype.id === 'burnout_recoverer' && vector.riTrend < 0) {
    score += 0.2;
  }

  return Math.min(score, 1.0);
}
