/*
  # Navigator Module Database Schema

  ## Overview
  Creates comprehensive database structure for The Navigator module - the adaptive profiling
  and routing engine for Sacred Shifter's trauma and awakening journey system.

  ## Tables Created

  1. **navigator_profiles**
     - Stores profile archetypes (Lost, Awakening, Integrator, Expander, Observer)
     - Includes color themes, essence labels, entry messages, and safety parameters
     - Each profile represents a distinct state in the healing/awakening journey

  2. **navigator_questions**
     - Question pool for assessment with weighted scoring
     - Supports scale, multi-select, and boolean input types
     - Weight maps determine profile alignment from responses

  3. **navigator_paths**
     - Connects profiles to target tracks with routing logic
     - Includes chemical state filters and priority ordering
     - Defines valid progressions between states

  4. **user_state_profiles**
     - Current state tracking per user
     - Stores profile, chemical state, regulation level
     - Maintains integrity score and custom notes

  5. **navigator_assessments**
     - Historical record of all assessments taken
     - Stores responses, calculated profiles, and metadata
     - Enables analysis of user progression patterns

  6. **user_module_progress**
     - Tracks completion and engagement across all tracks
     - Records emotional state and last access timestamps
     - Powers progress visualization and analytics

  7. **navigator_recommendations**
     - Logs all track recommendations served to users
     - Captures acceptance rate and reasoning
     - Enables recommendation algorithm refinement

  8. **navigator_path_history**
     - Complete journey log of profile transitions
     - Records trigger events and context for each change
     - Powers reflection and pattern recognition features

  9. **safety_events**
     - Critical safety intervention logging
     - Tracks risk detection and resolution
     - Ensures high-risk situations are monitored

  ## Security
  - Row Level Security enabled on all tables
  - Users can only access their own data
  - Safety event logging protected but accessible to user
  - Admin access requires service role

  ## Important Notes
  - All timestamps use timestamptz for timezone awareness
  - JSONB fields enable flexible metadata storage
  - Foreign key constraints maintain referential integrity
  - Indexes optimize common query patterns
*/

-- Core profile archetypes
CREATE TABLE IF NOT EXISTS navigator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  color_theme text NOT NULL,
  essence_labels text[] DEFAULT '{}',
  entry_message text NOT NULL,
  safety_parameters jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE navigator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Navigator profiles are viewable by everyone"
  ON navigator_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Question pool for assessments
CREATE TABLE IF NOT EXISTS navigator_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  input_type text NOT NULL CHECK (input_type IN ('scale', 'multi', 'boolean')),
  options jsonb DEFAULT '[]',
  weight_map jsonb NOT NULL DEFAULT '{}',
  semantic_tags text[] DEFAULT '{}',
  order_index int NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE navigator_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Navigator questions are viewable by everyone"
  ON navigator_questions FOR SELECT
  TO authenticated
  USING (true);

-- Routing paths from profiles to tracks
CREATE TABLE IF NOT EXISTS navigator_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES navigator_profiles(id) ON DELETE CASCADE,
  target_track_id text NOT NULL,
  chemical_state_filter text,
  priority int DEFAULT 0,
  prerequisites jsonb DEFAULT '{}',
  pacing_parameters jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE navigator_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Navigator paths are viewable by everyone"
  ON navigator_paths FOR SELECT
  TO authenticated
  USING (true);

-- User current state
CREATE TABLE IF NOT EXISTS user_state_profiles (
  user_id uuid PRIMARY KEY,
  profile_id uuid REFERENCES navigator_profiles(id),
  chemical_state text CHECK (chemical_state IN 
    ('sober', 'psychedelic', 'prescription', 'stimulant', 'depressant', 'withdrawal', 'unknown')),
  regulation_level text CHECK (regulation_level IN ('low', 'medium', 'high')),
  last_updated timestamptz DEFAULT now(),
  custom_notes text,
  integrity_score decimal(3, 2) DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_state_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own state profile"
  ON user_state_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own state profile"
  ON user_state_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own state profile"
  ON user_state_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Assessment history
CREATE TABLE IF NOT EXISTS navigator_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  responses jsonb NOT NULL DEFAULT '{}',
  calculated_profile uuid REFERENCES navigator_profiles(id),
  profile_scores jsonb DEFAULT '{}',
  chemical_state text,
  regulation_level text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE navigator_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments"
  ON navigator_assessments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own assessments"
  ON navigator_assessments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Track progress tracking
CREATE TABLE IF NOT EXISTS user_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id text NOT NULL,
  stage text DEFAULT 'not_started',
  completion_percentage int DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  emotional_state text,
  last_accessed timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, track_id)
);

ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_module_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress"
  ON user_module_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
  ON user_module_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Recommendation tracking
CREATE TABLE IF NOT EXISTS navigator_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recommended_track_id text NOT NULL,
  reason text,
  priority int DEFAULT 0,
  served_at timestamptz DEFAULT now(),
  accepted boolean,
  accepted_at timestamptz
);

ALTER TABLE navigator_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON navigator_recommendations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recommendations"
  ON navigator_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recommendations"
  ON navigator_recommendations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Journey path history
CREATE TABLE IF NOT EXISTS navigator_path_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_profile uuid REFERENCES navigator_profiles(id),
  to_profile uuid REFERENCES navigator_profiles(id),
  trigger_event text NOT NULL,
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE navigator_path_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own path history"
  ON navigator_path_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own path history"
  ON navigator_path_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Safety event logging
CREATE TABLE IF NOT EXISTS safety_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  detected_combination text NOT NULL,
  intervention_applied text NOT NULL,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE safety_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own safety events"
  ON safety_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own safety events"
  ON safety_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own safety events"
  ON safety_events FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_state_profiles_user_id ON user_state_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_navigator_assessments_user_id ON navigator_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_navigator_assessments_created_at ON navigator_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_module_progress_user_id ON user_module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_navigator_recommendations_user_id ON navigator_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_navigator_path_history_user_id ON navigator_path_history(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_user_id ON safety_events(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_created_at ON safety_events(created_at DESC);
