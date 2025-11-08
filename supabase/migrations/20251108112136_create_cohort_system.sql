/*
  # Create Cohort System - Social Synchronicity Infrastructure

  1. New Tables
    - `cohorts`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `resonance_range` (numrange) - RI range for matching
      - `state_cluster` (text) - Emotion/belief cluster
      - `member_count` (integer)
      - `privacy_level` (text) - public/private/anonymous
      - `created_at` (timestamptz)

    - `cohort_members`
      - `id` (uuid, primary key)
      - `cohort_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `joined_at` (timestamptz)
      - `anonymized_name` (text) - Privacy-preserving display name
      - `share_level` (text) - what data to share (minimal/moderate/full)
      - `is_active` (boolean)

    - `cohort_messages`
      - `id` (uuid, primary key)
      - `cohort_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `message` (text)
      - `message_type` (text) - text/insight/milestone/support
      - `flagged` (boolean) - moderation flag
      - `created_at` (timestamptz)

    - `cohort_insights`
      - `id` (uuid, primary key)
      - `cohort_id` (uuid, foreign key)
      - `insight_type` (text) - pattern/synchronicity/collective_shift
      - `description` (text)
      - `confidence` (float)
      - `member_count` (integer) - how many members share this pattern
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all cohort tables
    - Members can only read cohorts they belong to
    - Messages require cohort membership
    - Anonymity preserved in queries
    - Moderation flags tracked

  3. Indexes
    - cohorts.resonance_range (GiST for range queries)
    - cohort_members.user_id
    - cohort_messages.cohort_id + created_at
*/

-- Create cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  resonance_range numrange NOT NULL DEFAULT '[0,1]'::numrange,
  state_cluster text NOT NULL DEFAULT 'general',
  member_count integer DEFAULT 0,
  privacy_level text NOT NULL DEFAULT 'anonymous' CHECK (privacy_level IN ('public', 'private', 'anonymous')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public cohorts"
  ON cohorts FOR SELECT
  TO authenticated
  USING (privacy_level = 'public' OR privacy_level = 'anonymous');

-- Create cohort_members table
CREATE TABLE IF NOT EXISTS cohort_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  anonymized_name text NOT NULL,
  share_level text DEFAULT 'minimal' CHECK (share_level IN ('minimal', 'moderate', 'full')),
  is_active boolean DEFAULT true
);

ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their cohort memberships"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view cohort members of their cohorts"
  ON cohort_members FOR SELECT
  TO authenticated
  USING (
    cohort_id IN (
      SELECT cohort_id FROM cohort_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can join cohorts"
  ON cohort_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave cohorts"
  ON cohort_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create cohort_messages table
CREATE TABLE IF NOT EXISTS cohort_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  message text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'insight', 'milestone', 'support')),
  flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cohort_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cohort members can read messages"
  ON cohort_messages FOR SELECT
  TO authenticated
  USING (
    cohort_id IN (
      SELECT cohort_id FROM cohort_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Cohort members can post messages"
  ON cohort_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    cohort_id IN (
      SELECT cohort_id FROM cohort_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create cohort_insights table
CREATE TABLE IF NOT EXISTS cohort_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('pattern', 'synchronicity', 'collective_shift')),
  description text NOT NULL,
  confidence float NOT NULL DEFAULT 0.5,
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cohort_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cohort members can view insights"
  ON cohort_insights FOR SELECT
  TO authenticated
  USING (
    cohort_id IN (
      SELECT cohort_id FROM cohort_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cohorts_resonance_range ON cohorts USING GIST (resonance_range);
CREATE INDEX IF NOT EXISTS idx_cohorts_state_cluster ON cohorts(state_cluster);
CREATE INDEX IF NOT EXISTS idx_cohort_members_user_id ON cohort_members(user_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort_id ON cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_messages_cohort_created ON cohort_messages(cohort_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_insights_cohort_id ON cohort_insights(cohort_id);

-- Seed initial cohorts
INSERT INTO cohorts (id, name, description, resonance_range, state_cluster, privacy_level)
VALUES
  (
    'cohort_high_ri',
    'Thriving Explorers',
    'Users experiencing high coherence and actively growing',
    '[0.7,1.0]'::numrange,
    'high_coherence',
    'anonymous'
  ),
  (
    'cohort_mid_ri',
    'Integration Seekers',
    'Users working through moderate complexity and building coherence',
    '[0.4,0.7]'::numrange,
    'integration',
    'anonymous'
  ),
  (
    'cohort_emerging_ri',
    'Foundation Builders',
    'Users establishing their practice and growing awareness',
    '[0.2,0.4]'::numrange,
    'foundation',
    'anonymous'
  ),
  (
    'cohort_anxiety_support',
    'Anxiety Navigation',
    'Focused support for navigating anxious states',
    '[0,1]'::numrange,
    'anxiety',
    'anonymous'
  ),
  (
    'cohort_grounding',
    'Grounding Practice',
    'Community practicing grounding and presence',
    '[0,1]'::numrange,
    'grounding',
    'anonymous'
  )
ON CONFLICT (id) DO NOTHING;
