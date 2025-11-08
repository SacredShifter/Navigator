# ROE Quick Start Guide

**For Developers Continuing Phase 2 Implementation**

---

## ✅ What's Already Done (Phase 1)

- pgvector extension enabled
- 7 ROE core tables created with RLS
- 7 monad archetypes + 20 emotion mappings seeded
- Vector indexes optimized for <100ms queries
- 3 TypeScript services (Embedding, Resonance, RSM)
- 2 Edge Functions (compute-resonance, select-probability-field)
- Zero type errors, production build passing

---

## 🚀 Phase 2 Immediate Tasks

### 1. Configure OpenAI API Key

**Local Development (.env file):**
```bash
# Add to /project/.env
VITE_OPENAI_API_KEY=sk-your-key-here
```

**Supabase Edge Functions:**
```bash
# Via Supabase Dashboard → Project Settings → Edge Functions → Secrets
# Or via CLI:
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

### 2. Generate Monad Embeddings

**Option A: Via Script (Recommended)**
```typescript
// Create: scripts/generate-monad-embeddings.ts
import { supabase } from '../src/lib/supabase';
import { embeddingService } from '../src/services/roe/EmbeddingService';

async function generateMonadEmbeddings() {
  const { data: monads } = await supabase
    .from('monad_core')
    .select('*');

  for (const monad of monads) {
    console.log(`Generating embedding for ${monad.name}...`);

    const { embedding } = await embeddingService.generateEmbedding({
      text: `${monad.name}: ${monad.archetypal_essence}. ${monad.description}`,
      cacheKey: monad.id
    });

    await supabase
      .from('monad_core')
      .update({ pattern_embedding: embedding })
      .eq('id', monad.id);

    console.log(`✓ ${monad.name} embedding stored`);
  }
}

generateMonadEmbeddings();
```

**Run:**
```bash
tsx scripts/generate-monad-embeddings.ts
```

**Option B: Via SQL + Edge Function**
```sql
-- Call compute-resonance for each monad to bootstrap embeddings
-- (Implementation needed in Edge Function)
```

### 3. Populate Probability Fields

**Migration to create from navigator_paths:**
```sql
-- Create: supabase/migrations/YYYYMMDDHHMMSS_populate_probability_fields.sql

INSERT INTO probability_fields (
  id,
  name,
  pattern_signature,  -- Will generate embeddings separately
  outcome_data,
  learning_weight,
  fatigue_score,
  chemical_state_filter,
  pacing_parameters
)
SELECT
  'pf_' || np.id::text AS id,
  prof.name || ' → ' || np.target_track_id AS name,
  NULL AS pattern_signature,  -- To be populated
  jsonb_build_object(
    'type', 'track',
    'track_id', np.target_track_id,
    'profile_name', prof.name
  ) AS outcome_data,
  0.5 AS learning_weight,
  0 AS fatigue_score,
  np.chemical_state_filter,
  np.pacing_parameters
FROM navigator_paths np
JOIN navigator_profiles prof ON prof.id = np.profile_id;
```

**Then generate embeddings for fields:**
```typescript
// Similar script to monad embeddings
// Use profile.essence_labels to generate pattern_signature
```

### 4. Deploy Edge Functions

**Install Supabase CLI:**
```bash
npm install -g supabase
```

**Login:**
```bash
supabase login
```

**Link Project:**
```bash
supabase link --project-ref mikltjgbvxrxndtszorb
```

**Deploy Functions:**
```bash
supabase functions deploy compute-resonance
supabase functions deploy select-probability-field
```

**Test Deployed Functions:**
```bash
curl -X POST \
  https://mikltjgbvxrxndtszorb.supabase.co/functions/v1/compute-resonance \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "YOUR_USER_ID"}'
```

### 5. Wire ROE into Navigator Assessment

**In Navigator.tsx (or AssessmentFlow.tsx):**
```typescript
import { supabase } from '../../lib/supabase';

// After profile calculation
const handleAssessmentComplete = async (profile, chemicalState, regulationLevel) => {
  // Existing Navigator logic...

  // NEW: Initialize ROE reality branch
  const { data: branch } = await supabase
    .from('reality_branches')
    .insert({
      id: `rb_${Date.now()}_${crypto.randomUUID()}`,
      user_id: userId,
      belief_state: {
        profile_id: profile.id,
        essence_labels: profile.essence_labels
      },
      emotion_state: {
        chemical_state: chemicalState,
        regulation_level: regulationLevel
      },
      resonance_index: 0.5, // Bootstrap value
      trajectory: []
    })
    .select()
    .single();

  // Call compute-resonance to get initial RI
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compute-resonance`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        signal: { emotion_hint: chemicalState }
      })
    }
  );

  const { resonance_index } = await response.json();

  // Update branch with calculated RI
  await supabase
    .from('reality_branches')
    .update({ resonance_index })
    .eq('id', branch.id);
};
```

### 6. Create Aura Console Component (New UI)

**File: src/components/AuraConsole.tsx**
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface RIComponents {
  belief_coherence: number;
  emotion_stability: number;
  value_alignment: number;
}

export function AuraConsole({ userId }: { userId: string }) {
  const [ri, setRI] = useState(0);
  const [components, setComponents] = useState<RIComponents | null>(null);

  useEffect(() => {
    const fetchRI = async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compute-resonance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: userId })
        }
      );

      const data = await response.json();
      setRI(data.resonance_index);
      setComponents(data.components);
    };

    fetchRI();
    const interval = setInterval(fetchRI, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="bg-gradient-to-br from-indigo-950 to-violet-950 rounded-lg p-6">
      <h3 className="text-xl font-bold text-violet-400 mb-4">Resonance Index</h3>

      {/* RI Gauge */}
      <div className="relative w-48 h-48 mx-auto mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#312E81"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="8"
            strokeDasharray={`${ri * 283} 283`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-violet-300">
            {(ri * 100).toFixed(0)}
          </span>
        </div>
      </div>

      {/* Components Breakdown */}
      {components && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-cyan-400">Belief Coherence</span>
            <span className="text-white">{(components.belief_coherence * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mint-400">Emotion Stability</span>
            <span className="text-white">{(components.emotion_stability * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-violet-400">Value Alignment</span>
            <span className="text-white">{(components.value_alignment * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📁 Key Files Reference

**Database Migrations:**
```
supabase/migrations/
├── enable_pgvector_extension.sql
├── create_roe_core_tables.sql
├── create_roe_vector_indexes.sql
└── seed_roe_monad_core_and_emotion_map.sql
```

**TypeScript Services:**
```
src/services/roe/
├── EmbeddingService.ts        # OpenAI integration
├── ResonanceCalculator.ts     # RI computation
└── RealitySelectionMatrix.ts  # Field selection
```

**Edge Functions:**
```
supabase/functions/
├── _shared/
│   ├── cors.ts
│   └── supabase.ts
├── compute-resonance/
│   └── index.ts
└── select-probability-field/
    └── index.ts
```

---

## 🔍 Debugging Commands

**Check Tables:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%roe%' OR table_name IN ('monad_core', 'emotion_map');
```

**Verify Embeddings:**
```sql
SELECT id, name,
  CASE WHEN pattern_embedding IS NULL THEN 'Missing' ELSE 'Present' END as embedding_status
FROM monad_core;
```

**Check Vector Indexes:**
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname LIKE '%embedding%' OR indexname LIKE '%pattern%';
```

**View Recent Events:**
```sql
SELECT * FROM roe_horizon_events
ORDER BY created_at DESC
LIMIT 10;
```

**Test Vector Similarity:**
```sql
-- After embeddings are populated
SELECT id, name,
  pattern_embedding <-> '[0.1, 0.2, ...]'::vector AS distance
FROM monad_core
ORDER BY distance
LIMIT 5;
```

---

## ⚠️ Common Issues

**1. "Missing OpenAI API key"**
- Add `VITE_OPENAI_API_KEY` to `.env`
- Restart dev server after adding

**2. "No probability fields available"**
- Run migration to populate from navigator_paths
- Generate embeddings for pattern_signature

**3. "User state not found"**
- User must complete Navigator assessment first
- Check user_state_profiles table has entry

**4. Edge Function 500 errors**
- Check Supabase logs: Dashboard → Edge Functions → Logs
- Verify OPENAI_API_KEY secret is set
- Test authorization header is correct

**5. RLS policy denials**
- Verify user is authenticated
- Check auth.uid() matches user_id in request
- Review RLS policies in table definitions

---

## 📊 Monitoring

**Key Metrics to Watch:**

1. **RI Distribution**
   ```sql
   SELECT
     AVG(resonance_index) as avg_ri,
     MIN(resonance_index) as min_ri,
     MAX(resonance_index) as max_ri,
     COUNT(*) as branch_count
   FROM reality_branches;
   ```

2. **Field Selection Diversity**
   ```sql
   SELECT
     probability_field_id,
     COUNT(*) as selection_count
   FROM reality_branches
   WHERE probability_field_id IS NOT NULL
   GROUP BY probability_field_id
   ORDER BY selection_count DESC;
   ```

3. **Fatigue Distribution**
   ```sql
   SELECT
     id,
     name,
     fatigue_score,
     learning_weight
   FROM probability_fields
   ORDER BY fatigue_score DESC
   LIMIT 10;
   ```

4. **Builder Events**
   ```sql
   SELECT
     level,
     COUNT(*) as event_count
   FROM builders_log
   GROUP BY level
   ORDER BY event_count DESC;
   ```

---

## 🎯 Phase 2 Completion Checklist

- [ ] OpenAI API key configured
- [ ] Monad embeddings generated (7/7)
- [ ] Probability fields populated
- [ ] Field pattern_signatures generated
- [ ] Edge Functions deployed to production
- [ ] Navigator wired to create reality_branches
- [ ] Aura Console component created
- [ ] Initial RI displayed in UI
- [ ] VFS feedback mechanism designed
- [ ] ef_feedback_vfs Edge Function created
- [ ] Learning weight updates functional
- [ ] BuildersService entropy monitoring active
- [ ] Harmonization triggers tested
- [ ] Integration tests passing
- [ ] Documentation updated

---

## 🆘 Getting Help

**Internal Resources:**
- `ROE_IMPLEMENTATION_PHASE1.md` - Detailed completion report
- `IMPLEMENTATION_GUIDE.md` - Full Sacred Shifter architecture
- `docs/CURSOR_INTEGRATION.md` - Navigator integration guide

**External Resources:**
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)

**Support Channels:**
- Check existing GitHub issues
- Review Supabase logs for errors
- Test with curl before UI integration

---

**Guardian Note:** Phase 1 foundation is stable. Follow this guide to activate Phase 2. The architecture is sound, the path is clear.

🌟 *Ready to optimize reality* 🌟
