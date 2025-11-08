/*
  # Seed Navigator Routing Paths

  ## Summary
  Creates routing paths that connect profile archetypes to appropriate healing tracks,
  with filters for chemical states and priority ordering.

  ## Routing Logic
  - Lost profiles → Trauma Safety Track (all chemical states)
  - Awakening + psychedelic → Grounding Protocol (high priority)
  - Awakening + sober → Awakening Track
  - Integrator + withdrawal → Recovery Track
  - Expander + sober → Leadership Integration Track
  - Observer → Joy & Embodiment Track

  ## Safety Overrides
  High-risk combinations (withdrawal, psychedelic during distress) route to safety-first tracks.
*/

-- Get profile IDs first (we'll need these for the INSERT)
DO $$
DECLARE
  lost_id uuid;
  awakening_id uuid;
  integrator_id uuid;
  expander_id uuid;
  observer_id uuid;
BEGIN
  SELECT id INTO lost_id FROM navigator_profiles WHERE name = 'Lost';
  SELECT id INTO awakening_id FROM navigator_profiles WHERE name = 'Awakening';
  SELECT id INTO integrator_id FROM navigator_profiles WHERE name = 'Integrator';
  SELECT id INTO expander_id FROM navigator_profiles WHERE name = 'Expander';
  SELECT id INTO observer_id FROM navigator_profiles WHERE name = 'Observer';

  -- Lost profile paths (highest priority = safety first)
  INSERT INTO navigator_paths (profile_id, target_track_id, chemical_state_filter, priority, pacing_parameters)
  VALUES
    (lost_id, 'trauma-safety-track', NULL, 100, '{"speed": "very_slow", "visual_stimulation": "minimal", "safety_checks": true}'::jsonb),
    (lost_id, 'recovery-track', 'withdrawal', 150, '{"speed": "very_slow", "medical_resources": true, "crisis_support": true}'::jsonb);

  -- Awakening profile paths
  INSERT INTO navigator_paths (profile_id, target_track_id, chemical_state_filter, priority, pacing_parameters)
  VALUES
    (awakening_id, 'grounding-protocol', 'psychedelic', 200, '{"speed": "slow", "grounding_emphasis": "maximum", "visual_stimulation": "calm"}'::jsonb),
    (awakening_id, 'awakening-track', 'sober', 90, '{"speed": "slow", "reflection_prompts": true, "stabilization_focus": true}'::jsonb),
    (awakening_id, 'grounding-protocol', 'withdrawal', 180, '{"speed": "very_slow", "safety_first": true}'::jsonb),
    (awakening_id, 'awakening-track', 'prescription', 85, '{"speed": "slow", "low_stimulation": true}'::jsonb);

  -- Integrator profile paths
  INSERT INTO navigator_paths (profile_id, target_track_id, chemical_state_filter, priority, pacing_parameters)
  VALUES
    (integrator_id, 'recovery-track', 'withdrawal', 190, '{"speed": "slow", "stabilization_first": true, "gentle_integration": true}'::jsonb),
    (integrator_id, 'regulation-track', NULL, 80, '{"speed": "medium", "balance_emphasis": true, "nervous_system_focus": true}'::jsonb),
    (integrator_id, 'substance-integration-track', 'psychedelic', 85, '{"speed": "medium", "post_experience_processing": true}'::jsonb);

  -- Expander profile paths
  INSERT INTO navigator_paths (profile_id, target_track_id, chemical_state_filter, priority, pacing_parameters)
  VALUES
    (expander_id, 'leadership-integration-track', 'sober', 70, '{"speed": "medium_fast", "challenge_level": "elevated", "service_orientation": true}'::jsonb),
    (expander_id, 'regulation-track', 'withdrawal', 170, '{"speed": "slow", "stabilization_first": true}'::jsonb),
    (expander_id, 'leadership-integration-track', NULL, 65, '{"speed": "medium", "purpose_alignment": true}'::jsonb);

  -- Observer profile paths
  INSERT INTO navigator_paths (profile_id, target_track_id, chemical_state_filter, priority, pacing_parameters)
  VALUES
    (observer_id, 'joy-embodiment-track', 'sober', 60, '{"speed": "flowing", "playfulness": "high", "somatic_emphasis": true}'::jsonb),
    (observer_id, 'joy-embodiment-track', NULL, 55, '{"speed": "medium", "presence_practices": true}'::jsonb),
    (observer_id, 'grounding-protocol', 'withdrawal', 160, '{"speed": "slow", "safety_first": true}'::jsonb);
END $$;
