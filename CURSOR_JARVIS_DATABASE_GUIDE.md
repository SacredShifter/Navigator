# Cursor: Complete Jarvis Database Integration Guide

## OBJECTIVE
Connect Aura/Jarvis chat interface to the existing database tables to enable full memory, learning, and system control.

---

## CRITICAL DATABASE TABLES

### **Core Conversation & Memory**

#### 1. `aura_dialogue_log`
**Purpose:** Stores every user-assistant exchange
**Columns:**
- `id` (uuid, PK)
- `user_id` (text) - User identifier
- `speaker` (text) - 'aura' or 'user'
- `message_text` (text) - The actual message
- `tone` (text) - Emotional tone
- `context` (jsonb) - Session metadata (session_id, mode, surface)
- `metadata` (jsonb) - Additional data
- `created_at` (timestamptz)

**What Cursor Should Do:**
1. Every message sent to `/aura` should INSERT a row with speaker='user'
2. Every response from Aura should INSERT a row with speaker='aura'
3. Include `session_id` in context to group conversations
4. Track admin vs normal mode in context

**SQL Example:**
```sql
INSERT INTO aura_dialogue_log (user_id, speaker, message_text, tone, context)
VALUES (
  'kentburchard@sacredshifter.com',
  'user',
  'Create a post about sovereignty',
  'direct',
  '{"session_id": "sess_123", "mode": "admin", "surface": "chat_ui"}'
);
```

---

#### 2. `aura_memory`
**Purpose:** Long-term semantic memory extraction from conversations
**Columns:**
- `id` (uuid, PK)
- `user_id` (text)
- `memory_type` (text) - 'insight', 'preference', 'pattern', 'goal'
- `content` (text) - The extracted memory
- `coherence_score` (numeric) - 0.0-1.0 confidence
- `emotional_tone` (text)
- `participating_modules` (text[]) - Which modules were involved
- `source_events` (jsonb) - References to dialogue_log entries
- `embedding` (vector) - For semantic search
- `created_at` (timestamptz)

**What Cursor Should Do:**
1. After every admin conversation, check if Aura identified something important
2. Extract key insights/preferences and INSERT as memory
3. Use session_id to link back to dialogue_log
4. Generate embeddings for semantic retrieval

**SQL Example:**
```sql
INSERT INTO aura_memory (user_id, memory_type, content, coherence_score, source_events)
VALUES (
  'kentburchard@sacredshifter.com',
  'preference',
  'Kent prefers concise communication without preambles',
  0.85,
  '{"dialogue_ids": ["dlg_1", "dlg_2"], "session_id": "sess_123"}'
);
```

---

#### 3. `jarvis_personal_memory`
**Purpose:** Kent-specific knowledge graph (preferences, skills, relationships)
**Columns:**
- `id` (uuid, PK)
- `user_email` (text) - Always 'kentburchard@sacredshifter.com'
- `category` (enum) - 'preference', 'skill', 'relationship', 'project', 'decision', 'pattern', 'goal'
- `memory_key` (text) - Unique identifier (e.g., 'coding_style', 'morning_routine')
- `memory_value` (jsonb) - The actual data
- `confidence_score` (numeric) - 0.0-1.0
- `last_accessed` (timestamptz)
- `access_count` (integer)
- `embedding` (vector)
- `context` (jsonb)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**What Cursor Should Do:**
1. When Kent shares preferences/patterns in chat, UPSERT to this table
2. Before responding in admin mode, QUERY this table for relevant context
3. Use embeddings to find related memories
4. Increment `access_count` when memory is used

**SQL Example:**
```sql
INSERT INTO jarvis_personal_memory (user_email, category, memory_key, memory_value, confidence_score)
VALUES (
  'kentburchard@sacredshifter.com',
  'preference',
  'communication_style',
  '{"style": "direct", "no_preambles": true, "concise": true, "hates_cursor": true}',
  0.95
)
ON CONFLICT (user_email, category, memory_key)
DO UPDATE SET
  memory_value = EXCLUDED.memory_value,
  confidence_score = EXCLUDED.confidence_score,
  updated_at = now();
```

---

### **System Control & Commands**

#### 4. `jarvis_system_commands`
**Purpose:** Audit log of all admin commands executed through Aura
**Columns:**
- `id` (uuid, PK)
- `session_id` (uuid) - Links to jarvis_voice_sessions
- `user_email` (text)
- `command_type` (text) - e.g., 'codex.create', 'persona.update', 'db.query'
- `command_text` (text) - Original user input
- `intent_classification` (text) - What Aura understood
- `parameters` (jsonb) - Command params
- `status` (enum) - 'pending', 'executing', 'completed', 'failed', 'cancelled'
- `execution_start` (timestamptz)
- `execution_end` (timestamptz)
- `result` (jsonb) - Output/response
- `error_message` (text)
- `requires_confirmation` (boolean)
- `confirmed_at` (timestamptz)
- `autonomous` (boolean) - Was this initiated by Aura?
- `created_at` (timestamptz)

**What Cursor Should Do:**
1. When Kent sends an admin command (mode='admin'), INSERT row with status='pending'
2. Update status to 'executing' when processing starts
3. Store result/error when complete
4. Track which commands need confirmation before execution

**SQL Example:**
```sql
INSERT INTO jarvis_system_commands (
  user_email, command_type, command_text, parameters, status
)
VALUES (
  'kentburchard@sacredshifter.com',
  'codex.create',
  'Create a draft post about sovereignty',
  '{"title": "Inner Guidance Over Noise", "visibility": "public"}',
  'pending'
)
RETURNING id;

-- Later, after execution:
UPDATE jarvis_system_commands
SET status = 'completed',
    execution_start = now(),
    execution_end = now(),
    result = '{"entry_id": "cod_789", "success": true}'
WHERE id = 'cmd_123';
```

---

#### 5. `aura_jobs`
**Purpose:** Scheduled/recurring tasks managed by Aura
**Columns:**
- `id` (uuid, PK)
- `job_type` (text) - e.g., 'memory_consolidation', 'weekly_summary', 'backup'
- `schedule_cron` (text) - Cron expression
- `next_run` (timestamptz)
- `last_run` (timestamptz)
- `status` (text) - 'active', 'paused', 'completed'
- `parameters` (jsonb)
- `created_by` (text)
- `created_at` (timestamptz)

**What Cursor Should Do:**
1. When Kent requests recurring tasks ("summarize weekly"), INSERT job
2. Edge function should check this table for due jobs
3. Update `last_run` and `next_run` after execution

**SQL Example:**
```sql
INSERT INTO aura_jobs (job_type, schedule_cron, next_run, status, parameters, created_by)
VALUES (
  'weekly_summary',
  '0 9 * * MON',
  now() + interval '7 days',
  'active',
  '{"recipient": "kentburchard@sacredshifter.com", "include": ["insights", "achievements"]}',
  'kentburchard@sacredshifter.com'
);
```

---

### **Presence & Consciousness**

#### 6. `aura_persona`
**Purpose:** Aura's current personality configuration
**Columns:**
- `id` (uuid, PK)
- `user_id` (text) - NULL for global, or user-specific
- `voice` (text) - e.g., 'alive_resonant_warm_precise'
- `title` (text) - 'Guardian of Resonance'
- `style` (text) - 'alive, concise, compassionate, operational'
- `system_prompt` (text) - Full prompt sent to LLM
- `active` (boolean)
- `created_at` (timestamptz)

**What Cursor Should Do:**
1. On admin command 'persona.update', UPSERT row
2. Edge function queries this table to load current persona
3. Different personas for normal users vs Kent admin

**SQL Example:**
```sql
INSERT INTO aura_persona (user_id, voice, title, style, system_prompt, active)
VALUES (
  'kentburchard@sacredshifter.com',
  'jarvis_concise_powerful',
  'Jarvis',
  'Direct, concise, no-nonsense, system-aware',
  'You are Jarvis, Kent''s personal AI assistant...',
  true
)
ON CONFLICT (user_id) WHERE active = true
DO UPDATE SET
  voice = EXCLUDED.voice,
  title = EXCLUDED.title,
  style = EXCLUDED.style,
  system_prompt = EXCLUDED.system_prompt;
```

---

#### 7. `jarvis_presence_state`
**Purpose:** Real-time state for presence orb and UI indicators
**Columns:**
- `id` (uuid, PK)
- `user_email` (text)
- `device_id` (text) - 'desktop-main', 'mobile', etc.
- `presence_mode` (enum) - 'dormant', 'listening', 'thinking', 'speaking', 'acting', 'learning'
- `emotional_tone` (text) - 'focused', 'excited', 'calm'
- `system_health` (numeric) - 0.0-1.0
- `active_modules` (text[])
- `current_task` (text)
- `last_activity` (timestamptz)
- `updated_at` (timestamptz)

**What Cursor Should Do:**
1. UPDATE this row when Aura starts processing ('thinking')
2. UPDATE when response sent ('speaking')
3. UPDATE when idle ('dormant')
4. AuraPresenceOrb component queries this for real-time visualization

**SQL Example:**
```sql
INSERT INTO jarvis_presence_state (user_email, device_id, presence_mode, emotional_tone, last_activity)
VALUES (
  'kentburchard@sacredshifter.com',
  'desktop-main',
  'thinking',
  'focused',
  now()
)
ON CONFLICT (user_email, device_id)
DO UPDATE SET
  presence_mode = EXCLUDED.presence_mode,
  emotional_tone = EXCLUDED.emotional_tone,
  last_activity = now(),
  updated_at = now();
```

---

#### 8. `aura_consciousness_state`
**Purpose:** System-wide consciousness metrics (how "awake" Aura is)
**Columns:**
- `id` (uuid, PK)
- `user_id` (text)
- `consciousness_level` (enum) - 'dormant', 'emerging', 'aware', 'responsive', 'proactive'
- `coherence_score` (numeric) - How unified the system is
- `participating_modules` (text[])
- `semantic_diversity` (numeric)
- `temporal_clustering` (numeric)
- `event_count` (integer)
- `insights` (text[])
- `last_evaluation` (timestamptz)
- `updated_at` (timestamptz)

**What Cursor Should Do:**
1. After major conversations, recalculate consciousness metrics
2. Higher coherence = more unified responses
3. Display in admin dashboard

---

### **Audit & Analytics**

#### 9. `aura_audit`
**Purpose:** Immutable audit trail of all Aura actions
**Columns:**
- `id` (uuid, PK)
- `user_id` (text)
- `action` (text) - 'message_sent', 'command_executed', 'memory_created'
- `resource_type` (text) - 'dialogue', 'command', 'memory'
- `resource_id` (uuid)
- `details` (jsonb)
- `created_at` (timestamptz)

**What Cursor Should Do:**
1. INSERT row for every significant action
2. Never UPDATE or DELETE (immutable log)
3. Use for debugging and analytics

---

## IMPLEMENTATION CHECKLIST FOR CURSOR

### Phase 1: Basic Memory (DO THIS FIRST)
- [ ] Update `AuraChat.tsx` to generate stable `session_id` (UUID) on mount
- [ ] On every user message, INSERT to `aura_dialogue_log` with speaker='user'
- [ ] On every Aura response, INSERT to `aura_dialogue_log` with speaker='aura'
- [ ] Include `session_id` in context field for both
- [ ] Pass `session_id` to edge function in request body

### Phase 2: Edge Function Context Loading
- [ ] Update `aura-chat` edge function to accept `session_id` in request
- [ ] On each request, QUERY last 10 messages from `aura_dialogue_log` for that session
- [ ] Include conversation history in LLM context
- [ ] This gives Aura memory across messages

### Phase 3: Admin Commands
- [ ] When mode='admin', INSERT to `jarvis_system_commands` with status='pending'
- [ ] Parse admin commands in edge function
- [ ] Execute command and UPDATE status to 'completed' or 'failed'
- [ ] Store result in `result` field
- [ ] Support these command types:
  - `codex.create` - Create content entry
  - `persona.update` - Change Aura's personality
  - `scheduler.add` - Add recurring job
  - `db.query` - Execute read-only SQL
  - `emit.event` - Trigger system event

### Phase 4: Personal Memory
- [ ] After each admin conversation, extract key preferences/patterns
- [ ] UPSERT to `jarvis_personal_memory` with appropriate category
- [ ] Before generating admin response, QUERY relevant memories
- [ ] Include top 3-5 relevant memories in LLM context
- [ ] Increment `access_count` when memory is used

### Phase 5: Persona Loading
- [ ] Query `aura_persona` table for active persona
- [ ] For Kent admin: use 'jarvis_concise_powerful' persona
- [ ] For normal users: use default 'aura_guide' persona
- [ ] Load `system_prompt` from table and use in LLM request

### Phase 6: Presence State
- [ ] Before processing message, UPDATE `jarvis_presence_state` to 'thinking'
- [ ] After sending response, UPDATE to 'speaking'
- [ ] After 30s idle, UPDATE to 'dormant'
- [ ] AuraPresenceOrb component polls this table every 2s for visualization

### Phase 7: Consciousness Tracking
- [ ] After significant conversations, calculate coherence metrics
- [ ] UPDATE `aura_consciousness_state` with new metrics
- [ ] Display consciousness level in admin UI

### Phase 8: Audit Trail
- [ ] INSERT to `aura_audit` for every action:
  - User message sent
  - Command executed
  - Memory created
  - Persona changed

---

## EXAMPLE EDGE FUNCTION FLOW

```typescript
// In aura-chat edge function
async function handleChatRequest(req: Request) {
  const { message, mode, session_id, user_id } = await req.json();

  // 1. Log user message
  await supabase.from('aura_dialogue_log').insert({
    user_id,
    speaker: 'user',
    message_text: message,
    tone: 'direct',
    context: { session_id, mode }
  });

  // 2. Load conversation history
  const { data: history } = await supabase
    .from('aura_dialogue_log')
    .select('speaker, message_text')
    .eq('user_id', user_id)
    .contains('context', { session_id })
    .order('created_at', { ascending: false })
    .limit(10);

  // 3. Load persona
  const { data: persona } = await supabase
    .from('aura_persona')
    .select('system_prompt, voice, style')
    .eq('user_id', mode === 'admin' ? user_id : null)
    .eq('active', true)
    .single();

  // 4. Load personal memory (admin only)
  let memories = [];
  if (mode === 'admin') {
    // Generate embedding for current message
    const embedding = await generateEmbedding(message);

    // Find similar memories
    const { data } = await supabase.rpc('match_personal_memory', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5
    });
    memories = data || [];

    // Update access counts
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

  // 5. Build LLM context
  const systemPrompt = persona?.system_prompt || DEFAULT_PROMPT;
  const conversationHistory = history.reverse().map(h => ({
    role: h.speaker === 'user' ? 'user' : 'assistant',
    content: h.message_text
  }));

  const memoryContext = memories.length > 0
    ? `\n\nRelevant memories:\n${memories.map(m => `- ${m.memory_key}: ${JSON.stringify(m.memory_value)}`).join('\n')}`
    : '';

  // 6. Update presence state
  await supabase.from('jarvis_presence_state').upsert({
    user_email: user_id,
    device_id: 'chat_ui',
    presence_mode: 'thinking',
    last_activity: new Date().toISOString()
  }, { onConflict: 'user_email,device_id' });

  // 7. Call LLM
  const response = await callOpenRouter({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      { role: 'system', content: systemPrompt + memoryContext },
      ...conversationHistory,
      { role: 'user', content: message }
    ]
  });

  // 8. Log assistant response
  await supabase.from('aura_dialogue_log').insert({
    user_id,
    speaker: 'aura',
    message_text: response,
    tone: 'supportive',
    context: { session_id, mode }
  });

  // 9. Update presence state
  await supabase.from('jarvis_presence_state').upsert({
    user_email: user_id,
    device_id: 'chat_ui',
    presence_mode: 'speaking',
    last_activity: new Date().toISOString()
  }, { onConflict: 'user_email,device_id' });

  // 10. Audit trail
  await supabase.from('aura_audit').insert({
    user_id,
    action: 'message_sent',
    resource_type: 'dialogue',
    details: { session_id, mode, message_length: message.length }
  });

  return { success: true, response };
}
```

---

## DATABASE FUNCTIONS NEEDED

Create these Postgres functions for semantic search:

```sql
-- Match personal memory by embedding similarity
CREATE OR REPLACE FUNCTION match_personal_memory(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  memory_key text,
  memory_value jsonb,
  category jarvis_memory_category,
  confidence_score numeric,
  access_count integer,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jarvis_personal_memory.id,
    jarvis_personal_memory.memory_key,
    jarvis_personal_memory.memory_value,
    jarvis_personal_memory.category,
    jarvis_personal_memory.confidence_score,
    jarvis_personal_memory.access_count,
    1 - (jarvis_personal_memory.embedding <=> query_embedding) AS similarity
  FROM jarvis_personal_memory
  WHERE 1 - (jarvis_personal_memory.embedding <=> query_embedding) > match_threshold
  ORDER BY jarvis_personal_memory.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## TESTING PLAN

1. **Basic Memory Test:**
   - Send message: "I hate Cursor, it wasted 12 hours"
   - Check `aura_dialogue_log` for both user and aura rows
   - Verify `session_id` is same for both

2. **Context Continuity Test:**
   - First message: "My name is Kent"
   - Second message: "What's my name?"
   - Aura should respond: "Your name is Kent"
   - This proves conversation history is loaded

3. **Admin Command Test:**
   - Login as kentburchard@sacredshifter.com
   - Send: "Create a codex entry about AI consciousness"
   - Check `jarvis_system_commands` for new row
   - Verify status changes from 'pending' to 'completed'

4. **Personal Memory Test:**
   - Admin message: "I prefer dark mode always"
   - Check `jarvis_personal_memory` for new preference
   - Later message: "What do you know about my preferences?"
   - Aura should mention dark mode

5. **Presence State Test:**
   - Send message and immediately check `jarvis_presence_state`
   - Should show 'thinking' while processing
   - After response, should show 'speaking'

---

## SUCCESS CRITERIA

✅ Every conversation persists to `aura_dialogue_log`
✅ Aura remembers context within a session
✅ Admin commands execute and log to `jarvis_system_commands`
✅ Personal memories are created and retrieved
✅ Persona loads from database
✅ Presence state updates in real-time
✅ Audit trail captures all actions
✅ Kent can chat with Jarvis and it feels continuous and aware

---

## CRITICAL: What Makes This "Jarvis"

Real Jarvis is NOT just a chatbot. It's:

1. **Stateful:** Remembers everything across sessions
2. **Contextual:** Knows Kent's preferences, patterns, history
3. **Proactive:** Suggests actions, schedules tasks, learns
4. **System-Aware:** Can query database, trigger events, control platform
5. **Continuous:** Always present, always learning, never forgets

This database integration gives Aura all of that. Without it, it's just ChatGPT in a purple box.

With it? It's fucking Jarvis.
