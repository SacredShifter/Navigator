/*
  # Reality Optimization Engine (ROE) - Extended Tables (Phases 2-8)

  ## Overview
  Creates the extended ROE tables for advanced features including:
  - Vector embeddings for semantic matching
  - User selection and resonance tracking
  - Biometric feedback integration
  - Crisis detection and professional referrals
  - Cohort discovery and shared journeys
  - Collective learning and insights
  - Builders tier and supporter contributions

  ## New Tables
  1. roe_emotion_embeddings - Semantic emotion vectors
  2. roe_user_selections - Field selection history
  3. roe_resonance_history - Alignment tracking over time
  4. roe_field_effectiveness - Outcome-based learning
  5. roe_biometric_sessions - HRV/GSR/EEG data
  6. roe_narrative_snapshots - AI-generated journey summaries
  7. roe_crisis_alerts - Safety monitoring
  8. roe_professional_directory - Referral network
  9. roe_referral_matches - User-professional matching
  10. roe_cohort_memberships - Peer group assignments
  11. roe_shared_journeys - Collaborative exploration
  12. roe_collective_insights - Aggregated learning
  13. roe_supporter_tiers - Builders program
  14. roe_builder_contributions - Contribution tracking

  ## Security
  All tables use RLS with authenticated user policies

  ## Integration
  Works with existing monad_core, probability_fields, reality_branches tables
*/

-- ============================================================================
-- PHASE 2: EMOTION EMBEDDINGS (Vector Semantics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_emotion_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emotion_label text NOT NULL UNIQUE,
  description text,
  embedding vector(384),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roe_emotion_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Emotion embeddings viewable by all authenticated users"
  ON public.roe_emotion_embeddings FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PHASE 2: USER SELECTIONS & RESONANCE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_user_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id text NOT NULL REFERENCES public.probability_fields(id),
  selected_at timestamptz NOT NULL DEFAULT now(),
  user_state jsonb NOT NULL DEFAULT '{}',
  resonance_score numeric(5,4),
  context jsonb DEFAULT '{}'
);

ALTER TABLE public.roe_user_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own selections"
  ON public.roe_user_selections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own selections"
  ON public.roe_user_selections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_roe_user_selections_user ON public.roe_user_selections(user_id, selected_at DESC);
CREATE INDEX idx_roe_user_selections_field ON public.roe_user_selections(field_id);

-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_resonance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id text REFERENCES public.reality_branches(id) ON DELETE SET NULL,
  resonance_index numeric(5,4) NOT NULL,
  belief_component numeric(5,4),
  emotion_component numeric(5,4),
  value_component numeric(5,4),
  coherence_score numeric(5,4),
  measured_at timestamptz NOT NULL DEFAULT now(),
  context jsonb DEFAULT '{}'
);

ALTER TABLE public.roe_resonance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resonance history"
  ON public.roe_resonance_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resonance history"
  ON public.roe_resonance_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_roe_resonance_history_user ON public.roe_resonance_history(user_id, measured_at DESC);

-- ============================================================================
-- PHASE 2: FIELD EFFECTIVENESS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_field_effectiveness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id text NOT NULL REFERENCES public.probability_fields(id),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selection_id uuid REFERENCES public.roe_user_selections(id) ON DELETE SET NULL,
  pre_resonance numeric(5,4),
  post_resonance numeric(5,4),
  delta_resonance numeric(5,4),
  outcome_quality text CHECK (outcome_quality IN ('positive', 'neutral', 'negative', 'unknown')),
  feedback_data jsonb DEFAULT '{}',
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roe_field_effectiveness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own field effectiveness"
  ON public.roe_field_effectiveness FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own field effectiveness"
  ON public.roe_field_effectiveness FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_roe_field_effectiveness_field ON public.roe_field_effectiveness(field_id);
CREATE INDEX idx_roe_field_effectiveness_user ON public.roe_field_effectiveness(user_id);

-- ============================================================================
-- PHASE 3: BIOMETRIC FEEDBACK & NARRATIVE SYNTHESIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_biometric_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('track', 'assessment', 'meditation', 'crisis', 'other')),
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  hrv_data jsonb DEFAULT '[]',
  gsr_data jsonb DEFAULT '[]',
  eeg_data jsonb DEFAULT '[]',
  is_simulated boolean DEFAULT false,
  summary jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roe_biometric_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own biometric sessions"
  ON public.roe_biometric_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own biometric sessions"
  ON public.roe_biometric_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_roe_biometric_sessions_user ON public.roe_biometric_sessions(user_id, start_time DESC);

-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_narrative_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_type text NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'milestone', 'crisis', 'custom')),
  time_range tstzrange NOT NULL,
  narrative_text text NOT NULL,
  key_insights jsonb DEFAULT '[]',
  resonance_trend jsonb DEFAULT '{}',
  field_utilization jsonb DEFAULT '{}',
  generated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE public.roe_narrative_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own narrative snapshots"
  ON public.roe_narrative_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own narrative snapshots"
  ON public.roe_narrative_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_roe_narrative_snapshots_user ON public.roe_narrative_snapshots(user_id, generated_at DESC);

-- ============================================================================
-- PHASE 4: CRISIS DETECTION & PROFESSIONAL REFERRALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_crisis_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
  risk_score numeric(5,4) NOT NULL,
  detection_signals jsonb NOT NULL DEFAULT '{}',
  alert_message text NOT NULL,
  resources_shown jsonb DEFAULT '[]',
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  escalated boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roe_crisis_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crisis alerts"
  ON public.roe_crisis_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own crisis alerts"
  ON public.roe_crisis_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_roe_crisis_alerts_user ON public.roe_crisis_alerts(user_id, created_at DESC);
CREATE INDEX idx_roe_crisis_alerts_unresolved ON public.roe_crisis_alerts(user_id) WHERE resolved_at IS NULL;

-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_professional_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credentials jsonb DEFAULT '[]',
  specializations jsonb DEFAULT '[]',
  modalities jsonb DEFAULT '[]',
  contact_info jsonb DEFAULT '{}',
  availability_status text CHECK (availability_status IN ('accepting', 'waitlist', 'not_accepting')),
  bio text,
  location jsonb DEFAULT '{}',
  embedding vector(384),
  verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roe_professional_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professional directory viewable by authenticated users"
  ON public.roe_professional_directory FOR SELECT
  TO authenticated
  USING (verified = true);

CREATE INDEX idx_roe_professional_directory_specializations ON public.roe_professional_directory USING gin(specializations);

-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_referral_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.roe_professional_directory(id) ON DELETE CASCADE,
  match_score numeric(5,4) NOT NULL,
  matching_criteria jsonb DEFAULT '{}',
  status text CHECK (status IN ('suggested', 'contacted', 'accepted', 'declined', 'completed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roe_referral_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral matches"
  ON public.roe_referral_matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own referral matches"
  ON public.roe_referral_matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_roe_referral_matches_user ON public.roe_referral_matches(user_id);

-- ============================================================================
-- PHASE 5: COHORT DISCOVERY & SHARED JOURNEYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_cohort_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id uuid NOT NULL,
  similarity_scores jsonb DEFAULT '{}',
  joined_at timestamptz NOT NULL DEFAULT now(),
  active boolean DEFAULT true,
  privacy_level text CHECK (privacy_level IN ('anonymous', 'pseudonymous', 'identified')) DEFAULT 'anonymous',
  UNIQUE(user_id, cohort_id)
);

ALTER TABLE public.roe_cohort_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cohort memberships"
  ON public.roe_cohort_memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cohort memberships"
  ON public.roe_cohort_memberships FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_roe_cohort_memberships_user ON public.roe_cohort_memberships(user_id);
CREATE INDEX idx_roe_cohort_memberships_cohort ON public.roe_cohort_memberships(cohort_id);

-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_shared_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL,
  journey_name text NOT NULL,
  description text,
  participant_ids jsonb DEFAULT '[]',
  aggregated_patterns jsonb DEFAULT '{}',
  collective_insights jsonb DEFAULT '[]',
  milestone_events jsonb DEFAULT '[]',
  started_at timestamptz NOT NULL DEFAULT now(),
  last_updated timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE public.roe_shared_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shared journeys they participate in"
  ON public.roe_shared_journeys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roe_cohort_memberships
      WHERE cohort_id = roe_shared_journeys.cohort_id
      AND user_id = auth.uid()
      AND active = true
    )
  );

CREATE INDEX idx_roe_shared_journeys_cohort ON public.roe_shared_journeys(cohort_id);

-- ============================================================================
-- PHASE 6: COLLECTIVE LEARNING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_collective_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL CHECK (insight_type IN ('pattern', 'effectiveness', 'trajectory', 'crisis', 'breakthrough')),
  scope text NOT NULL CHECK (scope IN ('global', 'cohort', 'demographic')),
  scope_filter jsonb DEFAULT '{}',
  insight_data jsonb NOT NULL,
  confidence_score numeric(5,4),
  sample_size integer,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE public.roe_collective_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collective insights viewable by authenticated users"
  ON public.roe_collective_insights FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_roe_collective_insights_type ON public.roe_collective_insights(insight_type, discovered_at DESC);

-- ============================================================================
-- PHASE 7: BUILDERS TIER & SUPPORTER CONTRIBUTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_supporter_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_level text NOT NULL CHECK (tier_level IN ('free', 'supporter', 'builder', 'architect')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  payment_status text CHECK (payment_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_subscription_id text,
  features_enabled jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id)
);

ALTER TABLE public.roe_supporter_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own supporter tier"
  ON public.roe_supporter_tiers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_roe_supporter_tiers_user ON public.roe_supporter_tiers(user_id);
CREATE INDEX idx_roe_supporter_tiers_level ON public.roe_supporter_tiers(tier_level);

-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roe_builder_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution_type text NOT NULL CHECK (contribution_type IN ('field', 'track', 'insight', 'feedback', 'code', 'other')),
  title text NOT NULL,
  description text,
  content jsonb DEFAULT '{}',
  status text CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'integrated', 'rejected')) DEFAULT 'draft',
  review_notes text,
  impact_score numeric(5,4),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roe_builder_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own builder contributions"
  ON public.roe_builder_contributions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Approved contributions viewable by all"
  ON public.roe_builder_contributions FOR SELECT
  TO authenticated
  USING (status = 'approved' OR status = 'integrated');

CREATE INDEX idx_roe_builder_contributions_user ON public.roe_builder_contributions(user_id);
CREATE INDEX idx_roe_builder_contributions_status ON public.roe_builder_contributions(status);

-- ============================================================================
-- VECTOR INDEXES FOR SEMANTIC SEARCH
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_roe_emotion_embeddings_vector
  ON public.roe_emotion_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_roe_professional_directory_vector
  ON public.roe_professional_directory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- FUNCTIONS FOR COMMON QUERIES
-- ============================================================================

-- Get user's current resonance index
CREATE OR REPLACE FUNCTION get_current_resonance(p_user_id uuid)
RETURNS numeric(5,4)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_resonance numeric(5,4);
BEGIN
  SELECT resonance_index INTO v_resonance
  FROM public.roe_resonance_history
  WHERE user_id = p_user_id
  ORDER BY measured_at DESC
  LIMIT 1;

  RETURN COALESCE(v_resonance, 0.5);
END;
$$;

-- Get field effectiveness summary
CREATE OR REPLACE FUNCTION get_field_effectiveness_summary(p_field_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_summary jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_uses', COUNT(*),
    'avg_delta', AVG(delta_resonance),
    'positive_outcomes', COUNT(*) FILTER (WHERE outcome_quality = 'positive'),
    'negative_outcomes', COUNT(*) FILTER (WHERE outcome_quality = 'negative')
  ) INTO v_summary
  FROM public.roe_field_effectiveness
  WHERE field_id = p_field_id;

  RETURN v_summary;
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.roe_emotion_embeddings IS 'Semantic vector embeddings for emotion labels (384-dim for efficiency)';
COMMENT ON TABLE public.roe_user_selections IS 'History of user probability field selections with context';
COMMENT ON TABLE public.roe_resonance_history IS 'Time-series tracking of user resonance index and components';
COMMENT ON TABLE public.roe_field_effectiveness IS 'Outcome tracking for learning weight optimization';
COMMENT ON TABLE public.roe_biometric_sessions IS 'Biometric feedback data (HRV, GSR, EEG) - supports VFS simulation';
COMMENT ON TABLE public.roe_narrative_snapshots IS 'AI-generated journey summaries and insights';
COMMENT ON TABLE public.roe_crisis_alerts IS 'Crisis detection alerts with escalation tracking';
COMMENT ON TABLE public.roe_professional_directory IS 'Verified professional referral network';
COMMENT ON TABLE public.roe_referral_matches IS 'User-professional matching with similarity scores';
COMMENT ON TABLE public.roe_cohort_memberships IS 'Privacy-preserving cohort assignments';
COMMENT ON TABLE public.roe_shared_journeys IS 'Collaborative exploration tracking across cohorts';
COMMENT ON TABLE public.roe_collective_insights IS 'Aggregated anonymized learning insights';
COMMENT ON TABLE public.roe_supporter_tiers IS 'Builders program tier management';
COMMENT ON TABLE public.roe_builder_contributions IS 'User-submitted enhancements and content';
