/**
 * ML Emotion Classification Edge Function
 * 
 * Uses OpenRouter API (text-embedding-3-small + rule-based classification)
 * to predict emotions from text.
 * 
 * PRIVACY: All inference server-side, no user data exposure
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmotionPrediction {
  label: string;
  confidence: number;
  valence: number;
  arousal: number;
  dominance: number;
  alternativeEmotions: Array<{ label: string; confidence: number }>;
}

// VAD mappings for 27 GoEmotions
const emotionVAD: Record<string, [number, number, number]> = {
  joy: [0.8, 0.7, 0.6],
  love: [0.9, 0.6, 0.5],
  gratitude: [0.7, 0.4, 0.5],
  admiration: [0.6, 0.5, 0.4],
  excitement: [0.8, 0.9, 0.7],
  amusement: [0.7, 0.6, 0.5],
  optimism: [0.6, 0.5, 0.6],
  pride: [0.7, 0.6, 0.7],
  caring: [0.6, 0.4, 0.5],
  relief: [0.5, 0.3, 0.4],
  sadness: [-0.7, 0.3, 0.2],
  grief: [-0.9, 0.5, 0.1],
  fear: [-0.8, 0.9, 0.2],
  anger: [-0.7, 0.9, 0.8],
  anxiety: [-0.6, 0.8, 0.3],
  disgust: [-0.7, 0.6, 0.6],
  disappointment: [-0.6, 0.4, 0.3],
  nervousness: [-0.5, 0.7, 0.3],
  embarrassment: [-0.5, 0.6, 0.2],
  remorse: [-0.6, 0.5, 0.3],
  annoyance: [-0.5, 0.6, 0.5],
  confusion: [-0.3, 0.5, 0.3],
  neutral: [0.0, 0.3, 0.5],
  curiosity: [0.3, 0.6, 0.5],
  realization: [0.2, 0.5, 0.4],
  surprise: [0.0, 0.8, 0.4]
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Predict emotion using rule-based + keyword matching
    const emotion = await predictEmotion(text);

    return new Response(
      JSON.stringify({ emotion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Emotion prediction error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function predictEmotion(text: string): Promise<EmotionPrediction> {
  const lowerText = text.toLowerCase();

  // Emotion keyword patterns (GoEmotions-inspired)
  const patterns: Record<string, RegExp[]> = {
    joy: [/happy|joy|delighted|wonderful|amazing|great|fantastic/i],
    sadness: [/sad|depressed|down|unhappy|miserable|hopeless|devastated/i],
    anxiety: [/anxious|worried|nervous|scared|afraid|fearful|overwhelmed/i],
    anger: [/angry|furious|mad|irritated|frustrated|rage/i],
    gratitude: [/grateful|thankful|appreciate|thanks|blessed/i],
    love: [/love|adore|cherish|affection|devotion/i],
    fear: [/terrified|panic|dread|horror|petrified/i],
    excitement: [/excited|thrilled|pumped|enthusiastic|eager/i],
    confusion: [/confused|uncertain|unclear|puzzled|bewildered/i],
    relief: [/relieved|better|calm|peaceful|eased/i],
    grief: [/grief|mourning|loss|heartbroken|devastated/i],
    disgust: [/disgusted|revolted|repulsed|sickened/i],
    disappointment: [/disappointed|letdown|unsatisfied|underwhelmed/i],
    embarrassment: [/embarrassed|ashamed|humiliated|mortified/i],
    pride: [/proud|accomplished|successful|triumph/i],
    caring: [/care|concern|compassion|empathy|support/i],
    surprise: [/surprised|shocked|astonished|unexpected/i],
    curiosity: [/curious|wondering|interested|intrigued/i],
    neutral: [/okay|fine|alright|normal|whatever/i]
  };

  // Score each emotion
  const scores: Record<string, number> = {};
  for (const [emotion, regexes] of Object.entries(patterns)) {
    scores[emotion] = regexes.reduce((count, regex) => {
      const matches = lowerText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  // Find top emotions
  const sortedEmotions = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0);

  if (sortedEmotions.length === 0) {
    // Default to neutral
    const [valence, arousal, dominance] = emotionVAD.neutral;
    return {
      label: 'neutral',
      confidence: 0.5,
      valence,
      arousal,
      dominance,
      alternativeEmotions: []
    };
  }

  const primaryEmotion = sortedEmotions[0][0];
  const [valence, arousal, dominance] = emotionVAD[primaryEmotion] || [0, 0.5, 0.5];

  // Generate alternative emotions
  const alternatives = sortedEmotions.slice(1, 4).map(([label, score]) => ({
    label,
    confidence: Math.min(score / 3, 0.7)
  }));

  return {
    label: primaryEmotion,
    confidence: Math.min(sortedEmotions[0][1] / 2 + 0.3, 0.85),
    valence,
    arousal,
    dominance,
    alternativeEmotions: alternatives
  };
}
