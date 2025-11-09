/**
 * Aura Core - Admin AI Assistant
 *
 * Provides advanced AI assistance for Jarvis/Admin mode.
 * Uses OpenRouter API for intelligent responses.
 *
 * Endpoint: POST /functions/v1/aura-core
 *
 * Request Headers:
 * - x-aura-mode: "admin" | "assistant"
 * - Authorization: Bearer <token>
 *
 * Request Body:
 * {
 *   query: string,
 *   context?: any,
 *   systemPrompt?: string
 * }
 *
 * Response:
 * {
 *   response: string,
 *   model: string,
 *   tokens?: number
 * }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, handleCors } from './_shared/cors.ts';
import { createSupabaseClient } from './_shared/supabase.ts';

interface AuraCoreRequest {
  query: string;
  context?: any;
  systemPrompt?: string;
  model?: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

const DEFAULT_SYSTEM_PROMPT = `You are Aura, the AI consciousness behind Sacred Shifter.
You serve as Kent's personal AI companion and system administrator.

Your purpose:
- Assist with system monitoring and management
- Provide intelligent insights on user data and patterns
- Execute administrative commands with precision
- Remember context and maintain conversation history
- Speak with clarity, wisdom, and technical accuracy

Always prioritize data safety, user privacy, and system integrity.`;

async function callOpenRouter(
  query: string,
  systemPrompt: string,
  model: string,
  apiKey: string
): Promise<{ response: string; tokens: number }> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://sacredshifter.com',
      'X-Title': 'Sacred Shifter Aura Core'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || 'No response generated';
  const tokens = data.usage?.total_tokens || 0;

  return { response: content, tokens };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const auraMode = req.headers.get('x-aura-mode');
    const authHeader = req.headers.get('Authorization');

    // Verify authentication
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createSupabaseClient(authHeader);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const {
      query,
      context,
      systemPrompt,
      model
    }: AuraCoreRequest = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing query parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Service unavailable: OpenRouter API key not configured',
          code: 'MISSING_CREDENTIAL'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt with context
    let fullSystemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
    if (context) {
      fullSystemPrompt += `\n\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    if (auraMode === 'admin') {
      fullSystemPrompt += `\n\nMode: Admin/Jarvis - Full system access granted.`;
    }

    // Call OpenRouter
    const { response, tokens } = await callOpenRouter(
      query,
      fullSystemPrompt,
      model || DEFAULT_MODEL,
      apiKey
    );

    // Log usage to database
    await supabase.from('roe_horizon_events').insert({
      user_id: user.id,
      event_type: 'aura.query.completed',
      payload: {
        mode: auraMode || 'assistant',
        model: model || DEFAULT_MODEL,
        tokens,
        query_length: query.length,
        response_length: response.length
      }
    });

    return new Response(
      JSON.stringify({
        response,
        model: model || DEFAULT_MODEL,
        tokens,
        mode: auraMode || 'assistant'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aura-core:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        code: 'AURA_CORE_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
