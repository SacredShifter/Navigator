/**
 * Generate Embedding Edge Function
 *
 * Generates semantic embeddings using OpenRouter API.
 * Falls back to synthetic embeddings if API unavailable.
 *
 * Endpoint: POST /functions/v1/generate-embedding
 *
 * Request Body:
 * {
 *   text: string,
 *   cache_key?: string
 * }
 *
 * Response:
 * {
 *   embedding: number[],
 *   cached: boolean,
 *   dimensions: number
 * }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

interface EmbeddingRequest {
  text: string;
  cache_key?: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/embeddings';
const MODEL = 'openai/text-embedding-3-small';
const TARGET_DIMENSIONS = 768;

function generateSyntheticEmbedding(text: string): number[] {
  const embedding = new Array(TARGET_DIMENSIONS).fill(0);
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const rng = () => {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };

  for (let i = 0; i < TARGET_DIMENSIONS; i++) {
    embedding[i] = (rng() - 0.5) * 0.1;
  }

  let norm = 0;
  for (let i = 0; i < embedding.length; i++) {
    norm += embedding[i] * embedding[i];
  }
  norm = Math.sqrt(norm);

  for (let i = 0; i < embedding.length; i++) {
    embedding[i] /= norm;
  }

  return embedding;
}

async function callOpenRouter(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://sacredshifter.com',
      'X-Title': 'Sacred Shifter ROE'
    },
    body: JSON.stringify({
      model: MODEL,
      input: text
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const fullEmbedding = data.data[0].embedding;

  return fullEmbedding.slice(0, TARGET_DIMENSIONS);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { text, cache_key }: EmbeddingRequest = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Missing text parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    const environment = Deno.env.get('ENVIRONMENT') || 'development';
    let embedding: number[];
    let method = 'synthetic';

    if (!apiKey) {
      if (environment === 'production') {
        return new Response(
          JSON.stringify({
            error: 'Service unavailable: OPENROUTER_API_KEY not configured',
            code: 'MISSING_CREDENTIAL'
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.warn('⚠️ Using synthetic fallback - set OPENROUTER_API_KEY for production');
        embedding = generateSyntheticEmbedding(text);
      }
    } else {
      try {
        embedding = await callOpenRouter(text, apiKey);
        method = 'openrouter';
      } catch (error) {
        console.warn('OpenRouter failed, using synthetic:', error);
        embedding = generateSyntheticEmbedding(text);
      }
    }

    return new Response(
      JSON.stringify({
        embedding,
        cached: false,
        dimensions: embedding.length,
        method
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-embedding:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
