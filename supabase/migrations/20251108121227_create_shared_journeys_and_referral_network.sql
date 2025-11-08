/*
  # Create Shared Journeys & Professional Referral Network

  1. New Tables - Shared Journey Visualization
    - `shared_journey_permissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Who's sharing
      - `cohort_id` (uuid) - Which cohort can see it
      - `share_level` (text) - trajectory_only/with_insights/full
      - `anonymized` (boolean) - Show as anonymous or named
      - `created_at` (timestamptz)

    - `journey_snapshots`
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `cohort_id` (uuid)
      - `snapshot_data` (jsonb) - Aggregated trajectory points
      - `ri_trend` (text) - improving/stable/declining
      - `created_at` (timestamptz)

  2. New Tables - Professional Referral Network
    - `professional_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - If professional has account
      - `name` (text)
      - `credentials` (text[]) - [LMFT, PhD, MD, etc.]
      - `specialties` (text[]) - [anxiety, trauma, depression, etc.]
      - `bio` (text)
      - `approach` (text) - Therapeutic approach
      - `verified` (boolean) - Credential verification
      - `accepting_clients` (boolean)
      - `contact_method` (jsonb) - {type: 'form', url: '...'}
      - `location` (text)
      - `remote_available` (boolean)
      - `insurance_accepted` (text[])
      - `created_at` (timestamptz)

    - `referral_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Who's requesting
      - `professional_id` (uuid, foreign key)
      - `reason` (text) - Why seeking professional help
      - `urgency` (text) - low/moderate/high/crisis
      - `contact_preference` (jsonb)
      - `status` (text) - pending/contacted/scheduled/completed/declined
      - `created_at` (timestamptz)

    - `professional_matches`
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `professional_id` (uuid, foreign key)
      - `match_score` (float)
      - `match_reasons` (text[])
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on all tables
    - Users control their journey sharing
    - Professionals manage their profiles
    - Referral requests private to user
    - Public professional directory

  4. Indexes
    - journey permissions by user/cohort
    - professional specialties (GIN for array search)
    - referral requests by user and status
*/

-- =====================================================
-- SHARED JOURNEY VISUALIZATION TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS shared_journey_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cohort_id uuid REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
  share_level text NOT NULL DEFAULT 'trajectory_only'
    CHECK (share_level IN ('trajectory_only', 'with_insights', 'full')),
  anonymized boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shared_journey_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sharing permissions"
  ON shared_journey_permissions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cohort members can view sharing permissions"
  ON shared_journey_permissions FOR SELECT
  TO authenticated
  USING (
    cohort_id IN (
      SELECT cohort_id FROM cohort_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE TABLE IF NOT EXISTS journey_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cohort_id uuid REFERENCES cohorts(id) ON DELETE CASCADE NOT NULL,
  snapshot_data jsonb NOT NULL DEFAULT '{}',
  ri_trend text NOT NULL DEFAULT 'stable'
    CHECK (ri_trend IN ('improving', 'stable', 'declining')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journey_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own snapshots"
  ON journey_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Cohort members can view shared snapshots"
  ON journey_snapshots FOR SELECT
  TO authenticated
  USING (
    cohort_id IN (
      SELECT cohort_id FROM cohort_members
      WHERE user_id = auth.uid() AND is_active = true
    )
    AND user_id IN (
      SELECT user_id FROM shared_journey_permissions
      WHERE cohort_id = journey_snapshots.cohort_id
    )
  );

-- =====================================================
-- PROFESSIONAL REFERRAL NETWORK TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS professional_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL,
  credentials text[] DEFAULT '{}',
  specialties text[] NOT NULL DEFAULT '{}',
  bio text,
  approach text,
  verified boolean DEFAULT false,
  accepting_clients boolean DEFAULT true,
  contact_method jsonb NOT NULL DEFAULT '{"type": "form"}',
  location text,
  remote_available boolean DEFAULT true,
  insurance_accepted text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified professionals"
  ON professional_profiles FOR SELECT
  TO authenticated
  USING (verified = true);

CREATE POLICY "Professionals can manage their own profiles"
  ON professional_profiles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS referral_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid REFERENCES professional_profiles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  urgency text NOT NULL DEFAULT 'moderate'
    CHECK (urgency IN ('low', 'moderate', 'high', 'crisis')),
  contact_preference jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'declined')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referral_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral requests"
  ON referral_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create referral requests"
  ON referral_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral requests"
  ON referral_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS professional_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid REFERENCES professional_profiles(id) ON DELETE CASCADE NOT NULL,
  match_score float NOT NULL DEFAULT 0.5,
  match_reasons text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE professional_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
  ON professional_matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_shared_permissions_user ON shared_journey_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_permissions_cohort ON shared_journey_permissions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_journey_snapshots_cohort ON journey_snapshots(cohort_id);
CREATE INDEX IF NOT EXISTS idx_journey_snapshots_created ON journey_snapshots(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_professionals_verified ON professional_profiles(verified);
CREATE INDEX IF NOT EXISTS idx_professionals_specialties ON professional_profiles USING GIN (specialties);
CREATE INDEX IF NOT EXISTS idx_professionals_accepting ON professional_profiles(accepting_clients);

CREATE INDEX IF NOT EXISTS idx_referrals_user ON referral_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referral_requests(status);
CREATE INDEX IF NOT EXISTS idx_professional_matches_user ON professional_matches(user_id);

-- =====================================================
-- SEED DATA - Example Professionals
-- =====================================================

INSERT INTO professional_profiles (
  id,
  name,
  credentials,
  specialties,
  bio,
  approach,
  verified,
  accepting_clients,
  contact_method,
  location,
  remote_available,
  insurance_accepted
)
VALUES
  (
    'prof_001',
    'Dr. Sarah Chen',
    ARRAY['PhD', 'Licensed Psychologist'],
    ARRAY['anxiety', 'trauma', 'mindfulness'],
    'Specializing in anxiety and trauma with 15 years of experience. I integrate somatic approaches with cognitive behavioral therapy to help clients find lasting peace.',
    'Somatic Experiencing, CBT, Mindfulness-Based',
    true,
    true,
    '{"type": "form", "url": "https://example.com/contact/chen"}'::jsonb,
    'San Francisco, CA',
    true,
    ARRAY['Blue Cross', 'Aetna', 'Self-Pay']
  ),
  (
    'prof_002',
    'Michael Torres, LMFT',
    ARRAY['LMFT', 'Certified EMDR Therapist'],
    ARRAY['trauma', 'depression', 'relationships'],
    'I work with individuals navigating trauma, depression, and relationship challenges. My approach is compassionate, evidence-based, and tailored to each person.',
    'EMDR, Attachment Theory, Person-Centered',
    true,
    true,
    '{"type": "form", "url": "https://example.com/contact/torres"}'::jsonb,
    'Austin, TX',
    true,
    ARRAY['United Healthcare', 'Cigna', 'Self-Pay']
  ),
  (
    'prof_003',
    'Dr. Priya Patel',
    ARRAY['MD', 'Board Certified Psychiatrist'],
    ARRAY['medication_management', 'depression', 'anxiety', 'bipolar'],
    'Board-certified psychiatrist offering medication management and supportive therapy. I believe in collaborative care and finding the right balance for each individual.',
    'Integrative Psychiatry, Medication Management',
    true,
    true,
    '{"type": "form", "url": "https://example.com/contact/patel"}'::jsonb,
    'New York, NY',
    true,
    ARRAY['Medicare', 'Medicaid', 'Most Major Insurance']
  ),
  (
    'prof_004',
    'James Williams, LCSW',
    ARRAY['LCSW', 'Certified IFS Therapist'],
    ARRAY['parts_work', 'self_compassion', 'identity'],
    'I guide clients through Internal Family Systems (IFS) work, helping them develop self-compassion and integrate different parts of themselves into a cohesive whole.',
    'Internal Family Systems (IFS), Compassion-Focused',
    true,
    true,
    '{"type": "form", "url": "https://example.com/contact/williams"}'::jsonb,
    'Portland, OR',
    true,
    ARRAY['Self-Pay', 'Sliding Scale Available']
  ),
  (
    'prof_005',
    'Dr. Emma Rodriguez',
    ARRAY['PsyD', 'Licensed Clinical Psychologist'],
    ARRAY['anxiety', 'ocd', 'exposure_therapy'],
    'Specializing in anxiety disorders and OCD using exposure and response prevention (ERP). I help clients break free from anxiety cycles and reclaim their lives.',
    'Exposure Therapy (ERP), CBT, ACT',
    true,
    false,
    '{"type": "form", "url": "https://example.com/contact/rodriguez"}'::jsonb,
    'Chicago, IL',
    true,
    ARRAY['Blue Cross', 'Self-Pay']
  )
ON CONFLICT (id) DO NOTHING;
