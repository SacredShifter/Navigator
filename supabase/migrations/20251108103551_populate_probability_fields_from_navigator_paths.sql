/*
  # Populate Probability Fields from Navigator Paths

  ## Overview
  Migrates existing navigator_paths data into the new probability_fields table
  for ROE Reality Selection Matrix functionality.

  ## Migration Strategy
  1. Copy navigator_paths data to probability_fields
  2. Create rich outcome_data structure with profile + track info
  3. Initialize learning_weight to 0.5 (neutral prior)
  4. Set fatigue_score to 0 (no usage yet)
  5. Preserve chemical_state_filter and pacing_parameters
  6. pattern_signature left NULL (will be generated separately)

  ## Data Mapping
  - navigator_paths.id → probability_fields.id (with 'pf_' prefix)
  - profile.name + track_id → probability_fields.name
  - Outcome data includes profile metadata and track info
  - All paths get neutral learning_weight to start
  - Chemical state filters preserved for field selection

  ## Post-Migration
  After this migration, run generate-field-embeddings.ts to create
  pattern_signature vectors for each probability field.

  ## Safety
  - Uses INSERT ... ON CONFLICT DO NOTHING to be idempotent
  - Can be run multiple times safely
  - Existing probability_fields entries are preserved
*/

-- Populate probability_fields from navigator_paths
INSERT INTO probability_fields (
  id,
  name,
  pattern_signature,
  outcome_data,
  learning_weight,
  fatigue_score,
  chemical_state_filter,
  prerequisites,
  pacing_parameters,
  metadata,
  created_at,
  updated_at
)
SELECT
  'pf_' || np.id::text AS id,
  prof.name || ' → ' || np.target_track_id AS name,
  NULL AS pattern_signature,  -- To be populated by embedding service
  jsonb_build_object(
    'type', 'track',
    'track_id', np.target_track_id,
    'profile_id', prof.id,
    'profile_name', prof.name,
    'profile_description', prof.description,
    'essence_labels', prof.essence_labels,
    'color_theme', prof.color_theme,
    'safety_parameters', prof.safety_parameters,
    'entry_message', prof.entry_message
  ) AS outcome_data,
  0.5 AS learning_weight,  -- Neutral prior
  0 AS fatigue_score,      -- No usage yet
  np.chemical_state_filter,
  np.prerequisites,
  np.pacing_parameters,
  jsonb_build_object(
    'source', 'navigator_paths',
    'original_path_id', np.id,
    'priority', np.priority,
    'migrated_at', now()
  ) AS metadata,
  np.created_at,
  now() AS updated_at
FROM navigator_paths np
JOIN navigator_profiles prof ON prof.id = np.profile_id
ON CONFLICT (id) DO NOTHING;

-- Verify migration
SELECT
  COUNT(*) as total_fields,
  COUNT(CASE WHEN pattern_signature IS NULL THEN 1 END) as pending_embeddings,
  COUNT(CASE WHEN pattern_signature IS NOT NULL THEN 1 END) as with_embeddings,
  ROUND(AVG(learning_weight)::numeric, 2) as avg_learning_weight,
  ROUND(AVG(fatigue_score)::numeric, 2) as avg_fatigue_score
FROM probability_fields;
