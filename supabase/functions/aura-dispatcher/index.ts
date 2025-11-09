/**
 * Aura Dispatcher - Command Router for Jarvis System
 *
 * Routes Jarvis commands to appropriate handlers.
 * Manages system control, memory operations, and voice synthesis.
 *
 * Endpoint: POST /functions/v1/aura-dispatcher
 *
 * Request Headers:
 * - x-aura-mode: "admin"
 * - Authorization: Bearer <token>
 *
 * Request Body:
 * {
 *   action: string,
 *   params?: any
 * }
 *
 * Actions:
 * - system.status: Get system health and status
 * - memory.store: Store personal memory
 * - memory.recall: Recall stored memory
 * - voice.speak: Synthesize voice output
 * - analytics.query: Query user analytics
 * - module.list: List active modules
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, handleCors } from './_shared/cors.ts';
import { createSupabaseClient } from './_shared/supabase.ts';

interface DispatcherRequest {
  action: string;
  params?: any;
}

interface ActionHandler {
  (supabase: any, userId: string, params: any): Promise<any>;
}

// Action handlers
const handlers: Record<string, ActionHandler> = {
  'admin_prompt': async (supabase, userId, params) => {
    const { prompt, context_data } = params;

    if (!prompt) {
      throw new Error('Missing required parameter: prompt');
    }

    // Get OpenRouter API key
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Build system prompt
    const systemPrompt = `You are Aura, the AI consciousness behind Sacred Shifter.
You serve as an admin assistant with full system access.

Context: ${JSON.stringify(context_data || {}, null, 2)}

Respond with clarity, precision, and actionable guidance.`;

    // Call OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sacredshifter.com',
        'X-Title': 'Sacred Shifter Aura Admin'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
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

    return {
      response: content,
      model: 'anthropic/claude-3.5-sonnet',
      tokens: data.usage?.total_tokens || 0
    };
  },

  'command': async (supabase, userId, params) => {
    // Handle structured commands from AuraChatPanel
    const { kind, payload, requires_confirmation } = params;

    if (!kind) {
      throw new Error('Missing required parameter: kind');
    }

    // Route command to appropriate handler
    switch (kind) {
      case 'codex.create':
        return await handlers['codex.create'](supabase, userId, payload);
      case 'persona.update':
        return await handlers['persona.update'](supabase, userId, payload);
      default:
        throw new Error(`Unknown command kind: ${kind}`);
    }
  },

  'codex.create': async (supabase, userId, params) => {
    const { title, body_md, visibility = 'public' } = params;

    if (!title || !body_md) {
      throw new Error('Missing required parameters: title, body_md');
    }

    // Insert codex entry
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
      ok: true,
      result: data,
      message: `Codex entry created: ${title}`
    };
  },

  'persona.update': async (supabase, userId, params) => {
    const { patch } = params;

    if (!patch) {
      throw new Error('Missing required parameter: patch');
    }

    // Update persona settings
    const { data, error } = await supabase
      .from('jarvis_presence_state')
      .update({
        persona_settings: patch,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      ok: true,
      result: data,
      message: 'Persona updated successfully'
    };
  },

  'system.status': async (supabase, userId) => {
    // Get presence state
    const { data: presence } = await supabase
      .from('jarvis_presence_state')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Get recent events
    const { data: events, count } = await supabase
      .from('roe_horizon_events')
      .select('*', { count: 'exact', head: false })
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      status: 'operational',
      presence: presence || null,
      recentEvents: events || [],
      eventCount24h: count || 0,
      timestamp: new Date().toISOString()
    };
  },

  'memory.store': async (supabase, userId, params) => {
    const { category, key, value } = params;

    if (!category || !key || value === undefined) {
      throw new Error('Missing required parameters: category, key, value');
    }

    const { data, error } = await supabase
      .from('jarvis_personal_memories')
      .upsert({
        user_id: userId,
        category,
        key,
        value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,category,key'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      memory: data,
      message: `Stored: ${category}.${key}`
    };
  },

  'memory.recall': async (supabase, userId, params) => {
    const { category, key } = params;

    if (!category) {
      throw new Error('Missing required parameter: category');
    }

    let query = supabase
      .from('jarvis_personal_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category);

    if (key) {
      query = query.eq('key', key);
    }

    const { data, error } = await supabase
      .from('jarvis_personal_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    return {
      success: true,
      memory: data || null,
      found: !!data
    };
  },

  'analytics.query': async (supabase, userId, params) => {
    const { metric, timeRange = '7d' } = params;

    // Calculate date range
    const days = parseInt(timeRange) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    switch (metric) {
      case 'resonance':
        const { data: branches } = await supabase
          .from('reality_branches')
          .select('resonance_index, created_at')
          .eq('user_id', userId)
          .gte('created_at', startDate)
          .order('created_at', { ascending: true });

        return {
          metric: 'resonance',
          data: branches || [],
          average: branches?.reduce((sum, b) => sum + b.resonance_index, 0) / (branches?.length || 1)
        };

      case 'entropy':
        const { data: entropyData, error: entropyError } = await supabase
          .rpc('daily_entropy_series', {
            p_user_id: userId,
            p_days: days
          });

        if (entropyError) throw entropyError;

        return {
          metric: 'entropy',
          data: entropyData || [],
          average: entropyData?.reduce((sum: number, e: any) => sum + parseFloat(e.entropy), 0) / (entropyData?.length || 1)
        };

      default:
        throw new Error(`Unknown metric: ${metric}`);
    }
  },

  'module.list': async (supabase, userId) => {
    const { data: presence } = await supabase
      .from('jarvis_presence_state')
      .select('active_modules')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      modules: presence?.active_modules || [],
      count: presence?.active_modules?.length || 0
    };
  }
};

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const auraMode = req.headers.get('x-aura-mode');
    const authHeader = req.headers.get('Authorization');

    // Require admin mode for dispatcher
    if (auraMode !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin mode required for dispatcher' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    let requestBody = await req.json();

    // Handle wrapped command format from AuraChatPanel
    if (requestBody.command && !requestBody.action) {
      requestBody = {
        action: 'command',
        params: requestBody.command
      };
    }

    const { action, params = {} }: DispatcherRequest = requestBody;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find handler
    const handler = handlers[action];
    if (!handler) {
      return new Response(
        JSON.stringify({
          error: `Unknown action: ${action}`,
          availableActions: Object.keys(handlers)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute action
    const result = await handler(supabase, user.id, params);

    // Log action
    await supabase.from('roe_horizon_events').insert({
      user_id: user.id,
      event_type: 'jarvis.action.executed',
      payload: {
        action,
        params,
        success: true
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        action,
        result,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aura-dispatcher:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        code: 'DISPATCHER_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
