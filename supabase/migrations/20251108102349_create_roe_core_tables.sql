/*
  # Reality Optimization Engine (ROE) - Core Tables

  ## Overview
  Creates the foundational ROE tables for monadic consciousness navigation.
  
  ## New Tables
  1. monad_core - Archetypal consciousness patterns with embeddings
  2. emotion_map - Frequency-emotion bidirectional mappings
  3. probability_fields - Vector-enhanced routing with learning weights
  4. reality_branches - User consciousness trajectory tracking
  5. value_fulfillment_log - Evidence-based learning feedback
  6. builders_log - System integrity monitoring
  7. roe_horizon_events - ROE-specific event log (separate from existing aura_horizon_log)

  ## Integration
  - Works alongside existing Navigator tables
  - Complements existing aura_* tables without conflicts
  - All tables use RLS for security

  ## Vector Operations
  - Uses pgvector extension (already enabled)
  - 768-dimension vectors for OpenAI embeddings
  - Indexes created in separate migration for performance
*/

-- ============================================================================
-- MONAD CORE: Archetypal Consciousness Patterns
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.monad_core (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  archetypal_essence text NOT NULL,
  pattern_embedding vector(768),
  frequency_signature jsonb NOT NULL DEFAULT '{}',
  metaphysical_properties jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monad_core ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Monad core patterns viewable by all authenticated users"
  ON public.monad_core FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- EMOTION MAP: Frequency-Emotion Bidirectional Mappings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.emotion_map (
  id text PRIMARY KEY,
  emotion text NOT NULL UNIQUE,
  frequency_value numeric NOT NULL CHECK (frequency_value BETWEEN 0 AND 1),
  polarity text NOT NULL CHECK (polarity IN ('expansive', 'contractive', 'neutral')),
  regulation_correlation text CHECK (regulation_correlation IN ('low', 'medium', 'high')),
  somatic_markers jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.emotion_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Emotion map viewable by all authenticated users"
  ON public.emotion_map FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PROBABILITY FIELDS: Vector-Enhanced Routing with Learning
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.probability_fields (
  id text PRIMARY KEY,
  name text NOT NULL,
  pattern_signature vector(768),
  outcome_data jsonb NOT NULL,
  learning_weight numeric NOT NULL DEFAULT 0.5 CHECK (learning_weight BETWEEN 0 AND 1),
  fatigue_score numeric NOT NULL DEFAULT 0 CHECK (fatigue_score >= 0),
  chemical_state_filter text,
  prerequisites jsonb DEFAULT '{}',
  pacing_parameters jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.probability_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Probability fields viewable by all authenticated users"
  ON public.probability_fields FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- REALITY BRANCHES: User Consciousness Trajectory
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reality_branches (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belief_state jsonb NOT NULL,
  emotion_state jsonb NOT NULL,
  resonance_index numeric NOT NULL CHECK (resonance_index BETWEEN 0 AND 1),
  probability_field_id text REFERENCES public.probability_fields(id),
  trajectory jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reality_branches_user 
  ON public.reality_branches(user_id, updated_at DESC);

ALTER TABLE public.reality_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reality branches"
  ON public.reality_branches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reality branches"
  ON public.reality_branches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reality branches"
  ON public.reality_branches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VALUE FULFILLMENT LOG: Evidence-Based Learning
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.value_fulfillment_log (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id text REFERENCES public.reality_branches(id) ON DELETE SET NULL,
  probability_field_id text REFERENCES public.probability_fields(id) ON DELETE SET NULL,
  resonance_delta numeric NOT NULL,
  fulfillment_score numeric NOT NULL CHECK (fulfillment_score BETWEEN -1 AND 1),
  context jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vfl_user_time 
  ON public.value_fulfillment_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vfl_field 
  ON public.value_fulfillment_log(probability_field_id);

ALTER TABLE public.value_fulfillment_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own value fulfillment log"
  ON public.value_fulfillment_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own value fulfillment log"
  ON public.value_fulfillment_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- BUILDERS LOG: System Integrity Monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.builders_log (
  id text PRIMARY KEY,
  level text NOT NULL CHECK (level IN ('info', 'warn', 'harmonize', 'block')),
  integrity_check text NOT NULL,
  anomaly_type text,
  resolution jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_builders_log_level 
  ON public.builders_log(level, created_at DESC);

ALTER TABLE public.builders_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Builders log viewable by all authenticated users"
  ON public.builders_log FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- ROE HORIZON EVENTS: ROE-Specific Event Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_horizon_events (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  module_id text NOT NULL,
  payload jsonb NOT NULL,
  semantic_labels text[] DEFAULT '{}',
  resonance_index numeric CHECK (resonance_index BETWEEN 0 AND 1),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roe_horizon_user_time 
  ON public.roe_horizon_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_roe_horizon_event_type 
  ON public.roe_horizon_events(event_type);

ALTER TABLE public.roe_horizon_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ROE horizon events"
  ON public.roe_horizon_events FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "System can insert ROE horizon events"
  ON public.roe_horizon_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_roe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_monad_core_updated 
  BEFORE UPDATE ON public.monad_core
  FOR EACH ROW EXECUTE FUNCTION public.update_roe_updated_at();

CREATE TRIGGER t_probability_fields_updated 
  BEFORE UPDATE ON public.probability_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_roe_updated_at();

CREATE TRIGGER t_reality_branches_updated 
  BEFORE UPDATE ON public.reality_branches
  FOR EACH ROW EXECUTE FUNCTION public.update_roe_updated_at();
