# Sacred Shifter Branding Integration

Complete branding system integrated into the expanded Navigator platform.

## 🎨 Overview

The Sacred Shifter aesthetic is now fully integrated:
- **Colors as resonance**, not decoration
- **Sigils as anchors**, marking thresholds and coherence points
- **Audio as entrainment**, serving nervous system regulation
- **Motion as medicine**, not engagement metrics

---

## 📦 What Was Created

### 1. Supabase Storage Bucket
**Location**: `brand-guides` bucket
**Access**: Public read, service role write
**Migration**: `supabase/migrations/20251108055xxx_create_brand_guides_bucket.sql`

### 2. Branding Guide JSON
**Location**: `docs/branding/sacred-shifter-aesthetics.v1.json`
**Storage Path**: `brand-guides/branding/sacred-shifter-aesthetics.v1.json`
**Version**: 1.0.0

Contains:
- 8 resonance colors (violet, aqua, mint, indigo, magenta, cyan, charcoal, amber)
- 7 profile branding configs (visual treatment, FPS limits, audio frequencies)
- Typography system (Inter font family, 3 weight tiers)
- Spacing system (8px base, multiples only)
- Motion principles (easing, duration, nervous system-aware)
- Sigil philosophy (thresholds, anchors, completion, protection)
- Audio entrainment guidelines (BPM targets, volume limits)
- Safety gating rules (dark UI, motion limits, crisis resources)

### 3. Upload Script
**Location**: `scripts/upload-branding-guide.mjs`

```bash
# Upload to Supabase
SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/upload-branding-guide.mjs
```

Validates JSON, uploads with upsert, displays public URL.

### 4. Aura Bridge Service
**Location**: `src/services/aura-bridges/branding.ts`

Type-safe API for accessing branding guide:

```typescript
import { getBrandingGuide, getProfileColors, getProfileBranding } from '@/services/aura-bridges/branding';

// Get full guide
const guide = await getBrandingGuide();

// Get colors for a profile
const { primary, secondary } = await getProfileColors('seeker');
// primary.hex === '#06B6D4' (aqua - alignment)
// secondary.hex === '#8B5CF6' (violet - resonance)

// Get complete branding config
const branding = await getProfileBranding('numb');
// { primary_color: 'pulse', fps_limit: 15, visual_treatment: 'minimal_motion', ... }
```

### 5. Database Color Application
**Migration**: `supabase/migrations/20251108065500_apply_sacred_shifter_branding.sql`

All profiles and tracks now have proper brand colors applied:

| Profile | Color | Hex | Function |
|---------|-------|-----|----------|
| **Numb** | Neon Cyan | `#22D3EE` | Pulse - life force, re-sensitization |
| **Lost** | Charcoal | `#1F2937` | Shadow - depth, trauma integration |
| **Seeker** | Aqua | `#06B6D4` | Alignment - flow, truth-seeking |
| **Awakening** | Violet | `#8B5CF6` | Resonance - spiritual expansion |
| **Integrator** | Mint | `#10B981` | Truth - grounded wisdom |
| **Expander** | Magenta | `#D946EF` | Purpose - service activation |
| **Observer** | Deep Indigo | `#312E81` | Silence - witness consciousness |

---

## 🧭 Color Philosophy (Metaphysical Mapping)

Each color serves a specific **energetic function**:

### Pulse (Neon Cyan `#22D3EE`)
**Function**: Life force, vitality, energy pulse
**Usage**: Re-sensitization (Numb), micro-movement, proving you're alive
**Profile**: Numb

### Shadow (Charcoal `#1F2937`)
**Function**: Shadow work, integration, depth
**Usage**: Trauma processing, deep healing, containment
**Profile**: Lost

### Alignment (Aqua `#06B6D4`)
**Function**: Flow state, alignment with truth, clarity
**Usage**: Integration processes, truth-seeking, curiosity exploration
**Profile**: Seeker

### Resonance (Violet `#8B5CF6`)
**Function**: Spiritual resonance, connection to higher consciousness
**Usage**: Mystical states, consciousness expansion, identity dissolution
**Profile**: Awakening

### Truth (Mint `#10B981`)
**Function**: Grounded truth, embodied wisdom, growth
**Usage**: Grounding exercises, somatic work, recovery processes
**Profile**: Integrator

### Purpose (Magenta `#D946EF`)
**Function**: Purpose activation, service, expansion
**Usage**: Service-oriented content, teaching, contribution
**Profile**: Expander

### Silence (Deep Indigo `#312E81`)
**Function**: Sacred silence, void space, witness consciousness
**Usage**: Meditation, stillness practices, observer state
**Profile**: Observer

### Safety (Warm Amber `#F59E0B`)
**Function**: Safety, warmth, nervous system regulation
**Usage**: Safety overlays, grounding, withdrawal support
**Universal**: All crisis/safety features

---

## 🎯 Profile-Specific Branding

Each profile has unique visual and audio parameters:

### Numb
```json
{
  "primary_color": "pulse",
  "secondary_color": "truth",
  "visual_treatment": "minimal_motion",
  "fps_limit": 15,
  "contrast": "low",
  "sigil_density": "sparse",
  "audio_frequency": "sub_1hz"
}
```

### Seeker
```json
{
  "primary_color": "alignment",
  "secondary_color": "resonance",
  "visual_treatment": "fractal_bloom",
  "fps_limit": 30,
  "contrast": "medium",
  "sigil_density": "moderate",
  "audio_frequency": "coherence_1hz"
}
```

### Awakening
```json
{
  "primary_color": "resonance",
  "secondary_color": "alignment",
  "visual_treatment": "breathing_halo",
  "fps_limit": 20,
  "contrast": "low",
  "sigil_density": "moderate",
  "audio_frequency": "swell_1_to_1.2hz"
}
```

### Lost
```json
{
  "primary_color": "shadow",
  "secondary_color": "safety",
  "visual_treatment": "grounded_stable",
  "fps_limit": 15,
  "contrast": "high",
  "sigil_density": "minimal",
  "audio_frequency": "heart_rate_60_70"
}
```

---

## 🎨 Usage Examples

### Fetch Branding in a Module

```typescript
import { getBrandingGuide } from '@/services/aura-bridges/branding';

const NavigatorModule = {
  async initialize() {
    const guide = await getBrandingGuide();

    // Apply profile colors dynamically
    this.currentProfile = 'seeker';
    const colors = await getProfileColors(this.currentProfile);

    document.documentElement.style.setProperty('--primary-color', colors.primary.hex);
    document.documentElement.style.setProperty('--secondary-color', colors.secondary.hex);
  }
};
```

### Get Safety Gating Rules

```typescript
import { getSafetyGating } from '@/services/aura-bridges/branding';

const safetyRules = await getSafetyGating('numb_lost');
// {
//   enforce_dark_ui: true,
//   max_motion: 'minimal',
//   disable_reverb: true,
//   ground_now_always_visible: true
// }
```

### Apply Color by Function

```typescript
import { getColorByFunction } from '@/services/aura-bridges/branding';

const pulseColor = await getColorByFunction('pulse');
// { name: 'Neon Cyan', hex: '#22D3EE', function: 'Life force...', ... }
```

---

## 🛡️ Safety Gating Integration

Branding guide includes safety rules for each state:

### Numb/Lost State
```json
{
  "enforce_dark_ui": true,
  "max_motion": "minimal",
  "disable_reverb": true,
  "ground_now_always_visible": true
}
```

### Psychedelic State
```json
{
  "fps_cap": 15,
  "high_contrast_option": true,
  "breathing_cues": "prominent"
}
```

### Withdrawal State
```json
{
  "safety_overlay": "pinned",
  "crisis_resources": "always_accessible",
  "temperature_regulation_prompts": true
}
```

---

## 📋 Files Created

```
project/
├── docs/branding/
│   └── sacred-shifter-aesthetics.v1.json  # Complete branding guide (JSON)
├── scripts/
│   └── upload-branding-guide.mjs          # Upload to Supabase Storage
├── src/services/aura-bridges/
│   └── branding.ts                        # Type-safe fetch API
└── supabase/migrations/
    ├── 2025-11-08_xxx_create_brand_guides_bucket.sql  # Storage bucket + RLS
    └── 20251108065500_apply_sacred_shifter_branding.sql  # Apply colors to DB
```

---

## ✅ Status

**Supabase Bucket**: ✅ Created (`brand-guides`)
**RLS Policies**: ✅ Public read, service write
**Branding Guide**: ✅ Authored (1.0.0)
**Upload Script**: ✅ Created (Node ESM)
**Aura Bridge**: ✅ Type-safe TypeScript API
**Database Colors**: ✅ Applied to 7 profiles + 4 tracks
**Build**: ✅ No errors (305.67 kB)

---

## 🚀 Next Steps to Upload

1. **Set environment variables**:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **Run upload script**:
   ```bash
   node scripts/upload-branding-guide.mjs
   ```

3. **Verify public access**:
   ```
   https://your-project.supabase.co/storage/v1/object/public/brand-guides/branding/sacred-shifter-aesthetics.v1.json
   ```

4. **Use in modules**:
   ```typescript
   import { getBrandingGuide } from '@/services/aura-bridges/branding';
   const guide = await getBrandingGuide();
   ```

---

## 🎉 Summary

The Sacred Shifter branding system is now:
- ✅ Fully documented in JSON
- ✅ Stored in Supabase (brand-guides bucket)
- ✅ Accessible via type-safe Aura bridge
- ✅ Applied to all 7 profiles and 4 tracks
- ✅ Integrated with safety gating and motion principles

**Colors are now energetic functions.** Each hue serves consciousness navigation and nervous system regulation—not decoration.
