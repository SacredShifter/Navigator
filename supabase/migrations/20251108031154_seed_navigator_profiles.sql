/*
  # Seed Navigator Profiles and Questions

  ## Summary
  Populates the Navigator system with initial profile archetypes and assessment questions.
  
  ## Profile Archetypes
  - Lost: Deep trauma, seeking safety and grounding
  - Awakening: Spiritual emergence, identity dissolution
  - Integrator: Processing insights, seeking balance
  - Expander: Growth-oriented, service-minded
  - Observer: Witnessing consciousness, embodied joy

  ## Assessment Questions
  Five core questions that profile users across dimensions of safety, perception, identity, emotion, and chemical state.
*/

-- Insert profile archetypes
INSERT INTO navigator_profiles (name, description, color_theme, essence_labels, entry_message, safety_parameters)
VALUES
  (
    'Lost',
    'In a state of deep trauma or disorientation, seeking safety and ground beneath their feet',
    '#8B4513',
    ARRAY['grounding', 'safety', 'containment', 'trauma-aware', 'gentle'],
    'You''re in a tender place right now. Let''s focus on finding solid ground and helping you feel safe in your body.',
    '{"visual_intensity": "minimal", "pacing": "very_slow", "safety_checks": "frequent"}'::jsonb
  ),
  (
    'Awakening',
    'Experiencing spiritual emergence or identity shifts, navigating the dissolution of old structures',
    '#4169E1',
    ARRAY['transformation', 'emergence', 'identity', 'spiritual', 'flux'],
    'You''re moving through a powerful shift. We''ll help you stabilize while honoring what''s emerging.',
    '{"visual_intensity": "moderate", "pacing": "slow", "grounding_emphasis": "high"}'::jsonb
  ),
  (
    'Integrator',
    'Processing insights and experiences, seeking to balance and embody new understanding',
    '#2E8B57',
    ARRAY['integration', 'balance', 'embodiment', 'processing', 'reflection'],
    'You''re weaving together your experiences. Let''s support your integration with practices that bring coherence.',
    '{"visual_intensity": "moderate", "pacing": "medium", "reflection_prompts": "frequent"}'::jsonb
  ),
  (
    'Expander',
    'Growth-oriented and service-minded, ready to deepen practice and share gifts with others',
    '#FF8C00',
    ARRAY['expansion', 'service', 'leadership', 'purpose', 'contribution'],
    'You''re ready to expand your impact. Let''s cultivate your gifts and align them with meaningful service.',
    '{"visual_intensity": "dynamic", "pacing": "medium_fast", "challenge_level": "elevated"}'::jsonb
  ),
  (
    'Observer',
    'Resting in witnessing consciousness, cultivating joy, play, and embodied presence',
    '#9370DB',
    ARRAY['witness', 'presence', 'joy', 'playfulness', 'embodiment'],
    'You''re dancing with presence itself. Let''s explore practices that celebrate the joy of being.',
    '{"visual_intensity": "vibrant", "pacing": "flowing", "play_emphasis": "high"}'::jsonb
  )
ON CONFLICT (name) DO NOTHING;

-- Insert assessment questions
INSERT INTO navigator_questions (question_text, input_type, options, weight_map, semantic_tags, order_index)
VALUES
  (
    'Do you feel safe in your body right now?',
    'scale',
    '["No", "Somewhat", "Mostly", "Completely"]'::jsonb,
    '{
      "Lost": [3, 2, 1, 0],
      "Awakening": [2, 1, 0, 0],
      "Integrator": [1, 1, 0, 0],
      "Expander": [0, 0, 0, 0],
      "Observer": [0, 0, 1, 2]
    }'::jsonb,
    ARRAY['safety', 'embodiment', 'regulation'],
    1
  ),
  (
    'Do you feel like your sense of self is changing or dissolving?',
    'scale',
    '["No", "Maybe", "Yes", "Intensely"]'::jsonb,
    '{
      "Lost": [0, 1, 2, 3],
      "Awakening": [0, 1, 3, 4],
      "Integrator": [0, 1, 2, 1],
      "Expander": [2, 1, 0, 0],
      "Observer": [1, 0, 0, 0]
    }'::jsonb,
    ARRAY['identity', 'transformation', 'awakening'],
    2
  ),
  (
    'Can you connect with and feel your emotions clearly?',
    'scale',
    '["Not at all", "Barely", "Somewhat", "Fully"]'::jsonb,
    '{
      "Lost": [3, 2, 1, 0],
      "Awakening": [1, 2, 1, 0],
      "Integrator": [0, 1, 2, 1],
      "Expander": [0, 0, 1, 2],
      "Observer": [0, 0, 1, 3]
    }'::jsonb,
    ARRAY['emotion', 'awareness', 'connection'],
    3
  ),
  (
    'Are you seeking grounding and safety, or expansion and growth?',
    'scale',
    '["Deep grounding", "Mostly grounding", "Both equally", "Growth and expansion"]'::jsonb,
    '{
      "Lost": [4, 2, 0, 0],
      "Awakening": [2, 3, 1, 0],
      "Integrator": [1, 2, 3, 1],
      "Expander": [0, 0, 2, 4],
      "Observer": [0, 1, 2, 2]
    }'::jsonb,
    ARRAY['intention', 'direction', 'telos'],
    4
  ),
  (
    'Have you recently used any substances that might affect your perception or emotions?',
    'multi',
    '[
      "None / Sober",
      "Cannabis / Psychedelics",
      "Prescription medication",
      "Stimulants",
      "Depressants",
      "In withdrawal",
      "Prefer not to say"
    ]'::jsonb,
    '{
      "mapping": {
        "None / Sober": "sober",
        "Cannabis / Psychedelics": "psychedelic",
        "Prescription medication": "prescription",
        "Stimulants": "stimulant",
        "Depressants": "depressant",
        "In withdrawal": "withdrawal",
        "Prefer not to say": "unknown"
      }
    }'::jsonb,
    ARRAY['chemical', 'substance', 'safety'],
    5
  )
ON CONFLICT DO NOTHING;
