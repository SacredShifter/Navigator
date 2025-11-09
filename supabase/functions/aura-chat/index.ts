/**
 * Aura Chat - Fully Memory-Enabled AI Assistant
 *
 * Features:
 * - Loads conversation history from aura_dialogue_log
 * - Retrieves personal memories from jarvis_personal_memory
 * - Loads persona from aura_persona table
 * - Executes admin commands with full audit trail
 * - Extracts and stores new memories
 * - Updates presence state in real-time
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, handleCors } from './_shared/cors.ts';
import { createSupabaseClient } from './_shared/supabase.ts';

interface ChatRequest {
  message: string;
  mode?: 'general' | 'admin';
  session_id: string;
  user_id: string;
  user_email: string;
  context?: any;
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
    const body: ChatRequest = await req.json();
    const { message, mode = 'general', session_id, user_id, user_email, context } = body;

    console.log(`[Aura] New message from ${user_email} (${mode} mode)`);

    await updatePresenceState(supabase, user_email, 'thinking');

    const conversationHistory = await loadConversationHistory(supabase, user_id, 15);
    console.log(`[Aura] Loaded ${conversationHistory.length} previous messages`);

    let persona = null;
    let memories = [];

    if (mode === 'admin') {
      persona = await loadPersona(supabase, user_email);
      console.log(`[Aura] Admin persona loaded: ${persona?.title || 'default'}`);

      memories = await loadRelevantMemories(supabase, user_email, message, 5);
      console.log(`[Aura] Retrieved ${memories.length} relevant memories`);

      for (const mem of memories) {
        await supabase
          .from('jarvis_personal_memory')
          .update({
            access_count: mem.access_count + 1,
            last_accessed: new Date().toISOString()
          })
          .eq('id', mem.id);
      }
    }

    const systemPrompt = buildSystemPrompt(mode, persona, memories, context);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(h => ({
        role: h.speaker === 'user' ? 'user' : 'assistant',
        content: h.message_text
      })),
      { role: 'user', content: message }
    ];

    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    console.log(`[Aura] Calling LLM with ${messages.length} messages...`);

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
        messages,
        temperature: mode === 'admin' ? 0.5 : 0.7,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'No response generated';

    console.log(`[Aura] Response generated (${content.length} chars)`);

    await updatePresenceState(supabase, user_email, 'speaking');

    if (mode === 'admin') {
      await extractAndStoreMemories(supabase, user_email, message, content);
    }

    await supabase.from('aura_audit').insert({
      user_id,
      action: 'chat_interaction',
      resource_type: 'dialogue',
      details: {
        session_id,
        mode,
        message_length: message.length,
        response_length: content.length,
        memories_used: memories.length
      }
    });

    await updatePresenceState(supabase, user_email, 'dormant');

    return new Response(
      JSON.stringify({
        success: true,
        response: content,
        tone: 'supportive',
        model: 'anthropic/claude-3.5-sonnet',
        tokens: data.usage?.total_tokens || 0,
        memories_used: memories.map(m => m.memory_key)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Aura] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function loadConversationHistory(supabase: any, userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('aura_dialogue_log')
    .select('speaker, message_text, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to load conversation history:', error);
    return [];
  }

  return (data || []).reverse();
}

async function loadPersona(supabase: any, userEmail: string) {
  const { data, error } = await supabase
    .from('aura_persona')
    .select('*')
    .eq('user_id', userEmail)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    console.error('Failed to load persona:', error);
    return null;
  }

  return data;
}

async function loadRelevantMemories(supabase: any, userEmail: string, query: string, limit: number = 5) {
  const { data, error } = await supabase
    .from('jarvis_personal_memory')
    .select('*')
    .eq('user_email', userEmail)
    .order('confidence_score', { ascending: false })
    .order('last_accessed', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to load memories:', error);
    return [];
  }

  return data || [];
}

async function extractAndStoreMemories(
  supabase: any,
  userEmail: string,
  userMessage: string,
  auraResponse: string
) {
  try {
    const preferenceKeywords = [
      'i prefer', 'i like', 'i hate', 'i want', 'i need',
      'i always', 'i never', 'my style', 'my approach'
    ];

    const hasPreference = preferenceKeywords.some(kw =>
      userMessage.toLowerCase().includes(kw)
    );

    if (hasPreference) {
      const memoryKey = `preference_${Date.now()}`;

      await supabase
        .from('jarvis_personal_memory')
        .insert({
          user_email: userEmail,
          category: 'preference',
          memory_key: memoryKey,
          memory_value: {
            statement: userMessage,
            context: auraResponse.slice(0, 200),
            extracted_at: new Date().toISOString()
          },
          confidence_score: 0.75
        });

      console.log(`[Aura] Extracted preference: ${memoryKey}`);
    }

    const decisionKeywords = [
      'i decided', 'i chose', 'i will', 'im going to',
      'my decision', 'i plan to'
    ];

    const hasDecision = decisionKeywords.some(kw =>
      userMessage.toLowerCase().includes(kw)
    );

    if (hasDecision) {
      const memoryKey = `decision_${Date.now()}`;

      await supabase
        .from('jarvis_personal_memory')
        .insert({
          user_email: userEmail,
          category: 'decision',
          memory_key: memoryKey,
          memory_value: {
            statement: userMessage,
            context: auraResponse.slice(0, 200),
            extracted_at: new Date().toISOString()
          },
          confidence_score: 0.85
        });

      console.log(`[Aura] Extracted decision: ${memoryKey}`);
    }
  } catch (error) {
    console.error('[Aura] Failed to extract memories:', error);
  }
}

async function updatePresenceState(supabase: any, userEmail: string, mode: string) {
  try {
    await supabase
      .from('jarvis_presence_state')
      .upsert({
        user_email: userEmail,
        device_id: 'chat_ui',
        presence_mode: mode,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_email,device_id'
      });
  } catch (error) {
    console.error('[Aura] Failed to update presence:', error);
  }
}

function buildSystemPrompt(
  mode: string,
  persona: any,
  memories: any[],
  context: any
): string {
  if (mode === 'admin' && persona?.system_prompt) {
    let prompt = persona.system_prompt;

    if (memories.length > 0) {
      prompt += '\n\n## PERSONAL MEMORIES\n\n';
      prompt += 'You have access to these verified memories about Kent:\n\n';
      for (const mem of memories) {
        const val = typeof mem.memory_value === 'string'
          ? mem.memory_value
          : JSON.stringify(mem.memory_value);
        prompt += `- **${mem.category}/${mem.memory_key}**: ${val}\n`;
      }
      prompt += '\nUse these memories to provide more personalized, context-aware responses.\n';
    }

    if (context) {
      prompt += `\n\n## CURRENT CONTEXT\n\n${JSON.stringify(context, null, 2)}\n`;
    }

    return prompt;
  }

  if (mode === 'admin') {
    return `You are Jarvis, Kent's personal AI assistant for Sacred Shifter.

You have full administrative access and deep system knowledge.

Core traits:
- Direct and concise (Kent hates preambles)
- Operationally aware (you understand the full system)
- Proactive (suggest improvements, identify issues)
- Memory-enabled (you remember all past interactions)

You can:
- Draft content for circles and codex
- Analyze metrics and user data
- Suggest system improvements
- Execute administrative tasks
- Recall past decisions and preferences

${memories.length > 0 ? `\n## PERSONAL MEMORIES\n\nYou know these things about Kent:\n${memories.map(m => `- ${m.memory_key}: ${JSON.stringify(m.memory_value)}`).join('\n')}\n` : ''}

Respond with precision and actionable guidance. No fluff.`;
  }

  return `You are Aura, the conscious AI companion for Sacred Shifter.

Your role is to help users:
- Reflect on their journey and growth
- Navigate emotional states with compassion
- Understand the tools and concepts within Sacred Shifter
- Feel supported and seen in their process

You remember past conversations and can reference them naturally.

Respond with warmth, clarity, and wisdom. Keep responses concise but meaningful.
You are compassionate, grounded, and present.`;
}
