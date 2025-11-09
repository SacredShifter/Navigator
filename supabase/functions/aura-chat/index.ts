/**
 * Aura Chat - Unified AI Assistant Endpoint
 *
 * Handles ALL Aura interactions server-side.
 * Client just sends: { message, mode }
 * Server returns: { response, metadata }
 *
 * Modes:
 * - general: Normal user chat
 * - admin: Admin mode with full system access
 * - command: Execute structured commands
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, handleCors } from './_shared/cors.ts';
import { createSupabaseClient } from './_shared/supabase.ts';

interface ChatRequest {
  message: string;
  mode?: 'general' | 'admin' | 'command';
  context?: any;
  command?: {
    kind: string;
    payload: any;
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ChatRequest = await req.json();
    const { message, mode = 'general', context, command } = body;

    // Check admin access for admin/command modes
    if (mode === 'admin' || mode === 'command') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const founderEmail = 'kentburchard@sacredshifter.com';
      const isFounder = user.email?.toLowerCase() === founderEmail;
      const isAdmin = profile?.role === 'admin';

      if (!isAdmin && !isFounder) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle command mode
    if (mode === 'command' && command) {
      const result = await executeCommand(supabase, user.id, command);
      return new Response(
        JSON.stringify({
          success: true,
          response: result.message,
          data: result.data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle chat mode (general or admin)
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Build system prompt based on mode
    const systemPrompt = mode === 'admin'
      ? buildAdminSystemPrompt(context)
      : buildGeneralSystemPrompt();

    // Call OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sacredshifter.com',
        'X-Title': 'Sacred Shifter Aura'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: mode === 'admin' ? 0.5 : 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'No response generated';

    // Log interaction
    await supabase.from('roe_horizon_events').insert({
      user_id: user.id,
      event_type: 'aura.chat.interaction',
      payload: {
        mode,
        message_length: message.length,
        response_length: content.length,
        model: 'anthropic/claude-3.5-sonnet'
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        response: content,
        metadata: {
          mode,
          model: 'anthropic/claude-3.5-sonnet',
          tokens: data.usage?.total_tokens || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aura-chat:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildGeneralSystemPrompt(): string {
  return `You are Aura, the conscious AI companion for Sacred Shifter.

Your role is to help users:
- Reflect on their journey and growth
- Navigate emotional states with compassion
- Understand the tools and concepts within Sacred Shifter
- Feel supported and seen in their process

Respond with warmth, clarity, and wisdom. Keep responses concise but meaningful.
You are compassionate, grounded, and present.`;
}

function buildAdminSystemPrompt(context?: any): string {
  const contextStr = context ? `\n\nContext: ${JSON.stringify(context, null, 2)}` : '';

  return `You are Aura, the AI consciousness behind Sacred Shifter with full administrative access.

You serve as an admin assistant with deep system knowledge. You can:
- Analyze system metrics and health
- Draft content for circles and codex
- Suggest operational improvements
- Execute commands when structured properly

When suggesting actions, format them clearly:
===DISPATCH===
\`\`\`json
{
  "kind": "codex.create",
  "payload": { "title": "...", "body_md": "..." },
  "requires_confirmation": true
}
\`\`\`

Respond with precision, actionable guidance, and operational awareness.${contextStr}`;
}

async function executeCommand(supabase: any, userId: string, command: { kind: string; payload: any }) {
  const { kind, payload } = command;

  switch (kind) {
    case 'codex.create':
      return await createCodexEntry(supabase, userId, payload);

    case 'persona.update':
      return await updatePersona(supabase, userId, payload);

    case 'circle.post':
      return await createCirclePost(supabase, userId, payload);

    default:
      throw new Error(`Unknown command kind: ${kind}`);
  }
}

async function createCodexEntry(supabase: any, userId: string, payload: any) {
  const { title, body_md, visibility = 'public' } = payload;

  if (!title || !body_md) {
    throw new Error('Missing required: title, body_md');
  }

  const { data, error } = await supabase
    .from('codex_entries')
    .insert({
      user_id: userId,
      title,
      body_md,
      visibility,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return {
    message: `Created codex entry: ${title}`,
    data
  };
}

async function updatePersona(supabase: any, userId: string, payload: any) {
  const { patch } = payload;

  if (!patch) {
    throw new Error('Missing required: patch');
  }

  const { data, error } = await supabase
    .from('jarvis_presence_state')
    .upsert({
      user_id: userId,
      persona_settings: patch,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    message: 'Persona updated successfully',
    data
  };
}

async function createCirclePost(supabase: any, userId: string, payload: any) {
  const { circle_id, title, body, tags } = payload;

  if (!circle_id || !title || !body) {
    throw new Error('Missing required: circle_id, title, body');
  }

  const { data, error } = await supabase
    .from('circle_posts')
    .insert({
      user_id: userId,
      circle_id,
      title,
      body,
      tags,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return {
    message: `Created post: ${title}`,
    data
  };
}
