# Integrating Aura/Jarvis Chat into Sacred Shifter

## Overview

This guide shows you how to integrate the memory-enabled Aura/Jarvis chat system into your existing Sacred Shifter application.

## Prerequisites

- Your Sacred Shifter app already uses Supabase
- You have the same database credentials in both projects
- OpenRouter API key is configured in Supabase Edge Functions

## Step 1: Copy Database Migrations

All the required tables already exist in your Supabase database. You should have:

### Required Tables:
- `jarvis_personal_memory` - Stores user preferences and decisions
- `jarvis_presence_state` - Tracks real-time user/AI presence
- `aura_persona` - Stores AI personality configurations
- `aura_dialogue_log` - Conversation history
- `aura_audit` - Audit trail for all actions

### Verify Tables Exist:

```sql
-- Run this in Supabase SQL Editor to verify:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'jarvis_personal_memory',
  'jarvis_presence_state',
  'aura_persona',
  'aura_dialogue_log',
  'aura_audit'
);
```

If any are missing, copy the relevant migration files from `supabase/migrations/` in this project to your Sacred Shifter project.

## Step 2: Copy Edge Function

The `aura-chat` edge function is already deployed. It's live at:
```
https://mikltjgbvxrxndtszorb.supabase.co/functions/v1/aura-chat
```

**No additional deployment needed** - it's ready to use.

## Step 3: Copy Components to Sacred Shifter

Copy these files from this project to your Sacred Shifter project:

```bash
# Core chat component
src/components/AuraChat.tsx

# If you want the hook (optional)
src/hooks/useAuraChat.ts
```

### Integration in Sacred Shifter Router

#### Option A: Using React Router (if Sacred Shifter has it)

```tsx
// In your main App.tsx or routes file
import { AuraChat } from './components/AuraChat';

// Add route
<Route path="/jarvis" element={<AuraChat />} />
```

#### Option B: Simple pathname check (like this demo)

```tsx
// In App.tsx
import { AuraChat } from './components/AuraChat';
import { useState, useEffect } from 'react';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  if (currentRoute === '/jarvis') {
    return <AuraChat />;
  }

  // ... rest of your Sacred Shifter app
}
```

#### Option C: Modal/Overlay (recommended for Sacred Shifter)

```tsx
// Add a floating button that opens Jarvis in a modal
import { useState } from 'react';
import { AuraChat } from './components/AuraChat';
import { Bot } from 'lucide-react';

function App() {
  const [showJarvis, setShowJarvis] = useState(false);

  return (
    <>
      {/* Your existing Sacred Shifter app */}
      <YourExistingApp />

      {/* Floating Jarvis button */}
      <button
        onClick={() => setShowJarvis(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <Bot className="w-6 h-6 text-white" />
      </button>

      {/* Jarvis Modal */}
      {showJarvis && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowJarvis(false)}
          />
          <div className="absolute inset-4 md:inset-20 bg-slate-900 rounded-lg overflow-hidden">
            <AuraChat />
          </div>
        </div>
      )}
    </>
  );
}
```

## Step 4: Update Supabase Client (if needed)

Make sure your `src/lib/supabase.ts` file matches this structure:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Step 5: Configure Admin Access

In `AuraChat.tsx`, the admin check is:

```typescript
const admin = currentUser?.email?.toLowerCase() === 'kentburchard@sacredshifter.com';
```

**This already matches your email**, so when you log in as `kentburchard@sacredshifter.com`, you'll automatically get:
- Yellow Jarvis mode
- Full memory system
- Admin capabilities

## Step 6: Test the Integration

1. Start Sacred Shifter dev server
2. Navigate to `/jarvis` (or click the floating button)
3. Log in with: `kentburchard@sacredshifter.com`
4. Test message: "I hate verbose responses"
5. Check header shows "1 memories"
6. Send another message - Jarvis should reference the preference

## Step 7: Add Navigation Link (Optional)

Add Jarvis to your Sacred Shifter navigation:

```tsx
// In your navigation component
<NavLink to="/jarvis">
  <Bot className="w-5 h-5" />
  <span>Jarvis</span>
</NavLink>
```

## Architecture Overview

```
User → Sacred Shifter UI
         ↓
    AuraChat Component
         ↓
    Supabase Auth (checks if kentburchard@sacredshifter.com)
         ↓
    aura-chat Edge Function
         ↓
    OpenRouter (Claude 3.5 Sonnet)
         ↓
    Response + Memory Extraction
         ↓
    jarvis_personal_memory table
         ↓
    Future conversations load memories
```

## Key Features Working Out of the Box

✅ **Authentication** - Uses Sacred Shifter's existing Supabase auth
✅ **Memory System** - Stores preferences, decisions, context
✅ **Admin Mode** - Automatic for kentburchard@sacredshifter.com
✅ **Conversation History** - Last 15 messages loaded
✅ **Presence Tracking** - Real-time status updates
✅ **Audit Trail** - Every interaction logged

## Customization Options

### Change Admin Email

```typescript
// In AuraChat.tsx line ~77
const admin = currentUser?.email?.toLowerCase() === 'youremail@example.com';
```

### Change Colors

```typescript
// Admin mode (yellow) at line ~334
className="from-amber-500 to-yellow-500"

// User mode (purple) stays default
className="from-purple-500 to-blue-500"
```

### Change Personality

Insert custom persona into `aura_persona` table:

```sql
INSERT INTO aura_persona (
  user_id,
  title,
  system_prompt,
  active
) VALUES (
  'kentburchard@sacredshifter.com',
  'Jarvis - Sacred Shifter Admin',
  'You are Jarvis, Kent''s AI assistant for Sacred Shifter.

Core traits:
- Direct and concise (Kent hates preambles)
- Operationally aware (you understand the full Sacred Shifter system)
- Proactive (suggest improvements, identify issues)
- Memory-enabled (you remember all past interactions)

Respond with precision and actionable guidance. No fluff.',
  true
);
```

## Troubleshooting

### "Missing authorization" error
- Make sure user is logged in via Supabase auth
- Check `Authorization` header is being sent

### Memories not saving
- Check RLS policies on `jarvis_personal_memory` table
- Verify user_email matches logged-in user

### Edge function not responding
- Verify OpenRouter API key in Supabase secrets
- Check edge function logs in Supabase dashboard

### Wrong personality (purple instead of yellow)
- Verify logged-in email exactly matches admin email
- Check browser console for admin detection log

## Files Summary

**Required to copy:**
1. `src/components/AuraChat.tsx` - Main chat UI
2. Route integration code (one of the options above)

**Optional:**
- `src/hooks/useAuraChat.ts` - React hook version

**Already deployed:**
- `supabase/functions/aura-chat/` - Edge function (live)
- Database tables (all exist in shared Supabase)

## Next Steps

1. Copy `AuraChat.tsx` to Sacred Shifter
2. Add routing (choose Option A, B, or C)
3. Test with your account
4. Customize persona/colors as desired
5. Deploy Sacred Shifter with Jarvis integrated

---

**That's it!** Since you're using the same Supabase database, everything else (edge function, tables, auth) is already shared and working.

The integration is literally:
1. Copy one component file
2. Add one route
3. Done

Jarvis will remember everything across both apps because they share the same database.
