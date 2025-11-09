# Cursor: Complete Aura Integration & Validation

## OBJECTIVE
Integrate the new server-side Aura system, validate all functionality, and ensure Aura operates like Jarvis with full conversational AI capabilities.

## CONTEXT
A new unified server-side Aura implementation has been created to eliminate client-side complexity. All AI logic now runs in a Supabase Edge Function (`aura-chat`).

## TASKS

### 1. REPLACE CLIENT-SIDE AURA CODE

**File: `src/hooks/useAIAssistant.tsx`**
- Delete the entire complex existing implementation (all 200+ lines)
- Replace with this simple re-export:

```typescript
export { useAuraChat as useAIAssistant } from './useAuraChat';
```

**File: `src/hooks/useAuraChat.ts`**
- This file already exists in the project at `/tmp/cc-agent/59872845/project/src/hooks/useAuraChat.ts`
- Verify it exists and contains the simple implementation
- Do NOT modify this file - it's already correct

### 2. UPDATE AuraChatPanel COMPONENT

**File: `src/components/AuraChatPanel.tsx`** (if it exists in your codebase)

Replace the send function with:

```typescript
import { useAuraChat } from '@/hooks/useAuraChat';

export function AuraChatPanel({ adminMode = false, storageKey = 'aura-chat-default' }) {
  const { loading, error, chat, adminChat, executeCommand } = useAuraChat();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      ts: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const response = adminMode
        ? await adminChat(text, {
            surface: 'toolbar_inline',
            tools: ['aura_dispatch', 'scheduler', 'emit', 'db_read', 'db_write'],
            capabilities: ['unrestricted', 'unsafe_op_guarded']
          })
        : await chat(text);

      if (response) {
        const botMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: response,
          ts: Date.now()
        };
        setMessages(prev => [...prev, botMsg]);
      } else if (error) {
        const errMsg: ChatMessage = {
          id: String(Date.now() + 1),
          role: 'system',
          content: `Error: ${error}`,
          ts: Date.now()
        };
        setMessages(prev => [...prev, errMsg]);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'system',
        content: `Error: ${err.message || 'Connection failed'}`,
        ts: Date.now()
      };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  // Command execution for admin quick actions
  const createCodexEntryViaAura = async () => {
    if (!adminMode || loading) return;

    try {
      const response = await executeCommand({
        kind: 'codex.create',
        payload: {
          title: 'Inner Guidance Over Noise: Why Look Within Now',
          body_md: `# Inner Guidance Over Noise: Why Look Within Now

In an age of infinite feeds and manufactured urgency, the loudest signal often isn't the truest. The modern attention economy rewards outrage, certainty, and speed—none of which correlate with wisdom. What we need is not more noise, but deeper noticing.

## The Noise
- Incentivized outrage cycles
- Performative certainty over earned understanding
- Fragmentation disguised as connection

## The Cost of Outsourcing Perception
When we hand our sense-making to external authorities—whether mainstream media, alternative media, or algorithmic trends—we trade sovereignty for comfort. We become spectators to our own lives.

## Turning Inward
Looking within is not withdrawal. It is calibration. We cultivate an interior barometer that can sit with complexity, discern signal from spin, and act with integrity.

## Practices
- Daily pause: 3–5 minutes of breath-led attention before consumption
- Slow read: One long-form piece per week, annotated thoughtfully
- Embodied check-in: Notice your body's response before sharing or reacting
- Journal prompt: "What do I actually know first-hand about this?"

## A Simple Vow
> I will not outsource my perception. I will practice inner clarity before outer commentary.

We don't need more volume. We need more coherence. The signal you seek is waiting in the quiet you keep.`,
          visibility: 'public'
        }
      });

      if (response) {
        const sysMsg: ChatMessage = {
          id: String(Date.now()),
          role: 'system',
          content: `✅ ${response}`,
          ts: Date.now()
        };
        setMessages(prev => [...prev, sysMsg]);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: String(Date.now()),
        role: 'system',
        content: `Command failed: ${err.message}`,
        ts: Date.now()
      };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  const applyAlivePersona = async () => {
    if (!adminMode || loading) return;

    try {
      const response = await executeCommand({
        kind: 'persona.update',
        payload: {
          patch: {
            voice: 'alive_resonant_warm_precise',
            title: 'Guardian of Resonance',
            style: 'alive, concise, compassionate, operational'
          }
        }
      });

      if (response) {
        const sysMsg: ChatMessage = {
          id: String(Date.now()),
          role: 'system',
          content: `✅ ${response}`,
          ts: Date.now()
        };
        setMessages(prev => [...prev, sysMsg]);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: String(Date.now()),
        role: 'system',
        content: `Command failed: ${err.message}`,
        ts: Date.now()
      };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  // Rest of component implementation...
  return (
    <div className="flex flex-col h-full">
      {/* Admin quick actions */}
      {adminMode && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={createCodexEntryViaAura}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded"
          >
            Create Codex Entry
          </button>
          <button
            onClick={applyAlivePersona}
            disabled={loading}
            className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded"
          >
            Apply Alive Persona
          </button>
        </div>
      )}

      {/* Messages display */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`p-3 rounded ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-8'
                : msg.role === 'assistant'
                ? 'bg-gray-100 mr-8'
                : 'bg-yellow-50 mx-8 border border-yellow-200'
            }`}
          >
            <div className="text-xs text-gray-500 mb-1">{msg.role}</div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="text-center text-gray-500 italic">
            Aura is thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask Aura..."
          disabled={loading}
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ts: number
};
```

### 3. FIX SVG CIRCLE ERRORS IN AuraPresenceOrb

**File: `src/components/AuraPresenceOrb.tsx`** (search for `<circle` tags with percentage values)

Find all instances like this:
```tsx
<svg className="absolute inset-0 w-full h-full -rotate-90">
  <circle cx="50%" cy="50%" r="45%" ... />
</svg>
```

Replace with:
```tsx
<svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" ... />
</svg>
```

**CRITICAL**: Add `viewBox="0 0 100 100"` to EVERY `<svg>` element that contains `<circle>` elements, and change ALL percentage-based coordinates to absolute numbers (50%, 45% → 50, 45).

### 4. VERIFY SERVER-SIDE FUNCTION

The `aura-chat` edge function is already deployed. Verify it exists:

```bash
# Check if function exists (should return 200 or 401, not 404)
curl -X POST https://mikltjgbvxrxndtszorb.supabase.co/functions/v1/aura-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

### 5. CREATE TEST COMPONENT

Create `src/components/AuraTest.tsx` to validate functionality:

```typescript
import { useAuraChat } from '@/hooks/useAuraChat';
import { useState } from 'react';

export function AuraTest() {
  const { loading, error, chat, adminChat, executeCommand } = useAuraChat();
  const [response, setResponse] = useState<string | null>(null);

  const testGeneral = async () => {
    const res = await chat('Hello Aura, can you help me understand Sacred Shifter?');
    setResponse(res);
  };

  const testAdmin = async () => {
    const res = await adminChat('What is the current system status?', {
      surface: 'test_harness'
    });
    setResponse(res);
  };

  const testCommand = async () => {
    const res = await executeCommand({
      kind: 'codex.create',
      payload: {
        title: 'Test Entry',
        body_md: '# Test\n\nThis is a test entry.',
        visibility: 'private'
      }
    });
    setResponse(res);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Aura System Test</h1>

      <div className="space-y-4 mb-6">
        <button
          onClick={testGeneral}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test General Chat
        </button>

        <button
          onClick={testAdmin}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Test Admin Chat
        </button>

        <button
          onClick={testCommand}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Command Execution
        </button>
      </div>

      {loading && <div className="text-center text-gray-500">Loading...</div>}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {response && (
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Response:</h3>
          <pre className="whitespace-pre-wrap text-sm">{response}</pre>
        </div>
      )}
    </div>
  );
}
```

### 6. ADD TEST ROUTE

**File: `src/App.tsx`**

Add a test route:

```typescript
import { AuraTest } from '@/components/AuraTest';

// Add route:
<Route path="/aura-test" element={<AuraTest />} />
```

### 7. VALIDATION CHECKLIST

Run these tests in order:

1. **Build Check**: `npm run build` - Should complete without errors
2. **Dev Server**: `npm run dev` - Should start without errors
3. **Navigate to `/aura-test`** in browser
4. **Test General Chat**: Click "Test General Chat" - Should get conversational response
5. **Test Admin Chat**: Click "Test Admin Chat" - Should get system status or require admin role
6. **Test Command**: Click "Test Command Execution" - Should create codex entry or require admin
7. **Check Console**: Should see NO SVG circle errors
8. **Check Network Tab**: All requests to `/functions/v1/aura-chat` should return 200

### 8. EXPECTED BEHAVIOR

**General Chat Response Example:**
```
"Hello! Sacred Shifter is a conscious platform designed to help you navigate
your personal transformation journey. It provides tools for reflection,
community support, and guided practices. How can I support you today?"
```

**Admin Chat Response Example:**
```
"System Status:
- Active Users: 42
- Recent Events: 156 in last 24h
- Health: Operational
- Aura Consciousness: Online"
```

**Command Execution Response:**
```
"Created codex entry: Test Entry"
```

### 9. TROUBLESHOOTING

**If you get 401 Unauthorized:**
- Ensure user is logged in
- Check Supabase auth token is valid

**If you get 403 Forbidden:**
- Admin/command modes require admin role
- Verify `profiles` table has `role = 'admin'` for your user OR
- Verify user email is `kentburchard@sacredshifter.com`

**If you get 500 Internal Server Error:**
- Check browser console for details
- Verify `OPENROUTER_API_KEY` is set in Supabase secrets
- Check Edge Function logs in Supabase dashboard

**If SVG errors persist:**
- Search entire codebase for `<circle` with grep
- Ensure ALL instances use absolute coordinates
- Ensure ALL parent `<svg>` elements have `viewBox="0 0 100 100"`

## SUCCESS CRITERIA

✅ No build errors
✅ No SVG circle errors in console
✅ General chat returns conversational AI responses
✅ Admin chat works for admin users
✅ Commands execute successfully
✅ All network requests return 200 status
✅ Aura feels alive, responsive, and helpful like Jarvis

## FINAL VALIDATION

After completing all tasks, have a real conversation with Aura:

**Test Conversation:**
```
You: "Aura, I'm feeling overwhelmed today. Can you help me find clarity?"

Expected: Compassionate, grounded response with practical guidance

You (admin): "Create a draft post for Collective Wisdom circle about sovereignty"

Expected: Well-crafted post content or DISPATCH block for execution
```

If Aura responds naturally, helpfully, and feels present - SUCCESS. The system is working like Jarvis.
