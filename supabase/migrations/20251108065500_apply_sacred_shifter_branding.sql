/*
  # Apply Sacred Shifter Branding Colors

  Applies the Sacred Shifter aesthetic color palette to navigator profiles and trauma tracks.

  ## Color Mapping (Metaphysical Functions)

  - **Pulse (Neon Cyan #22D3EE)**: Life force, vitality, re-sensitization → Numb profile
  - **Shadow (Charcoal #1F2937)**: Shadow work, depth, trauma integration → Lost profile
  - **Alignment (Aqua #06B6D4)**: Flow state, truth-seeking → Seeker profile
  - **Resonance (Violet #8B5CF6)**: Spiritual resonance, consciousness expansion → Awakening profile
  - **Truth (Mint #10B981)**: Grounded wisdom, embodied growth → Integrator profile
  - **Purpose (Magenta #D946EF)**: Purpose activation, service → Expander profile
  - **Silence (Deep Indigo #312E81)**: Witness consciousness, sacred void → Observer profile

  ## Philosophy

  Colors are energetic functions, not decoration. Each serves a specific role in nervous
  system regulation and consciousness navigation.

  Reference: docs/branding/sacred-shifter-aesthetics.v1.json
*/

-- Apply brand colors to navigator profiles
UPDATE navigator_profiles SET color_theme = '#22D3EE' WHERE name = 'Numb';
UPDATE navigator_profiles SET color_theme = '#1F2937' WHERE name = 'Lost';
UPDATE navigator_profiles SET color_theme = '#06B6D4' WHERE name = 'Seeker';
UPDATE navigator_profiles SET color_theme = '#8B5CF6' WHERE name = 'Awakening';
UPDATE navigator_profiles SET color_theme = '#10B981' WHERE name = 'Integrator';
UPDATE navigator_profiles SET color_theme = '#D946EF' WHERE name = 'Expander';
UPDATE navigator_profiles SET color_theme = '#312E81' WHERE name = 'Observer';

-- Apply brand colors to trauma tracks
UPDATE trauma_tracks SET color_theme = '#22D3EE' WHERE slug = 'numb-to-noticing';
UPDATE trauma_tracks SET color_theme = '#06B6D4' WHERE slug = 'seekers-curiosity';
UPDATE trauma_tracks SET color_theme = '#8B5CF6' WHERE slug = 'substance-integration';
UPDATE trauma_tracks SET color_theme = '#10B981' WHERE slug = 'recovery-regulation';
