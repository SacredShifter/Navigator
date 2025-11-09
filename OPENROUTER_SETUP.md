# OpenRouter API Setup for Jarvis

## Step 1: Get Your OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up or log in
3. Navigate to **Keys** section
4. Create a new API key
5. Copy the key (looks like: `sk-or-v1-...`)

## Step 2: Add Secret to Supabase

You have **TWO options**:

### Option A: Via Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard/project/mikltjgbvxrxndtszorb
2. Click **Settings** (gear icon in left sidebar)
3. Click **Edge Functions**
4. Scroll to **Secrets** section
5. Click **Add Secret**
6. Name: `OPENROUTER_API_KEY`
7. Value: Paste your OpenRouter key
8. Click **Save**

### Option B: Via Supabase CLI

```bash
# Make sure you're in the project directory
cd /path/to/your/project

# Set the secret
npx supabase secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY-HERE
```

## Step 3: Verify Edge Function Can Access It

The edge function already has this code:

```typescript
const apiKey = Deno.env.get('OPENROUTER_API_KEY');
if (!apiKey) {
  throw new Error('OpenRouter API key not configured');
}
```

Once you add the secret, it will automatically work!

## Step 4: Test Jarvis

1. Go to `/aura` in your app
2. Log in as kentburchard@sacredshifter.com
3. Send a message like: "I hate Cursor, it wasted 12 hours"
4. Jarvis should respond AND:
   - Store that preference in `jarvis_personal_memory`
   - Remember it in future conversations
   - Show "1 memories" in the header

## Pricing Notes

OpenRouter charges per token:
- **Claude 3.5 Sonnet**: ~$3 per million input tokens, ~$15 per million output tokens
- Average conversation: ~$0.01-0.03 per exchange
- For moderate usage: $10-20/month

They offer $5 free credit to start.

## Common Issues

### "OpenRouter API key not configured"
- **Cause**: Secret not set in Supabase
- **Fix**: Follow Step 2 above

### "OpenRouter API error: 401"
- **Cause**: Invalid API key
- **Fix**: Double-check key from https://openrouter.ai/keys

### "OpenRouter API error: 429"
- **Cause**: Rate limit exceeded (free tier) or out of credits
- **Fix**: Add credits to your OpenRouter account

### "OpenRouter API error: 402"
- **Cause**: Payment required (credits exhausted)
- **Fix**: Add payment method to OpenRouter account

## What Happens When It Works

**Normal User Message:**
```
User: "How do I find peace?"
Aura: "Finding peace often begins with..."
```

**Kent Admin Message:**
```
Kent: "I hate preambles in responses"
Jarvis: "Noted. Stored preference. No preambles."
```

Then later:

```
Kent: "Draft a post about sovereignty"
Jarvis: "Title: Trusting Your Inner Voice
Body: When you shift from external validation..."
(no preamble, direct response)
```

**Memory works because:**
1. First message stored preference to `jarvis_personal_memory`
2. Second message loaded that memory
3. Jarvis adjusted its response style accordingly

---

## Quick Start (TL;DR)

1. Get key: https://openrouter.ai/keys
2. Add to Supabase: Dashboard → Settings → Edge Functions → Secrets
3. Name: `OPENROUTER_API_KEY`
4. Value: Your key
5. Go to `/aura` and test

That's it. Jarvis will remember everything after that.
