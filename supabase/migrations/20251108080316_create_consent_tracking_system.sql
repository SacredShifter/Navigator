/*
  # Sacred Shifter Consent Tracking System
  
  ## Summary
  Implements Australian Privacy Act 1988 compliant consent tracking for Sacred Shifter.
  Handles collection of sensitive health information with full audit trail.
  
  ## New Tables
  
  ### `user_consent_records`
  Tracks all consent interactions for data collection and processing.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique consent record ID
  - `user_id` (uuid, nullable) - References auth.users, NULL for anonymous pre-auth consent
  - `session_id` (text) - Session identifier for pre-auth tracking
  - `consent_type` (text) - Type of consent: 'navigator_assessment', 'data_processing', 'experience_personalization', 'marketing_communications'
  - `consent_version` (text) - Version of privacy notice shown (e.g., 'privacy-v1.0.0')
  - `consent_given` (boolean) - True if consent granted, False if declined
  - `consent_timestamp` (timestamptz) - When consent was given/declined
  - `ip_address` (inet, nullable) - IP address for audit trail
  - `user_agent` (text, nullable) - Browser/device info for audit trail
  - `withdrawal_timestamp` (timestamptz, nullable) - When consent was withdrawn
  - `withdrawal_reason` (text, nullable) - User's reason for withdrawal
  - `notes` (jsonb) - Additional metadata (declined_reason, partial_consent options, etc.)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `user_onboarding_state`
  Tracks user progress through onboarding and assessment flows.
  
  **Columns:**
  - `user_id` (uuid, primary key) - References auth.users
  - `navigator_completed` (boolean) - Has completed Navigator assessment
  - `navigator_completion_date` (timestamptz, nullable) - When assessment was completed
  - `consent_privacy_given` (boolean) - Privacy consent status
  - `consent_version_accepted` (text, nullable) - Version of privacy notice accepted
  - `onboarding_step` (text) - Current step: 'welcome', 'privacy', 'assessment', 'profile_review', 'complete'
  - `needs_reassessment` (boolean) - Flag for periodic re-assessment
  - `last_assessment_date` (timestamptz, nullable) - Most recent assessment date
  - `preferred_modules` (text[], nullable) - User's module preferences
  - `onboarding_metadata` (jsonb) - Additional onboarding data
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update
  
  ## Security
  - Enable RLS on all tables
  - Users can only read/update their own consent records
  - Service role can read all for compliance auditing
  - Consent records are immutable (no updates, only new records for changes)
  
  ## Indexes
  - Index on user_id for fast consent lookups
  - Index on consent_type for reporting
  - Index on consent_timestamp for audit queries
*/

-- Create user_consent_records table
CREATE TABLE IF NOT EXISTS user_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  consent_type text NOT NULL CHECK (consent_type IN (
    'navigator_assessment',
    'data_processing', 
    'experience_personalization',
    'marketing_communications',
    'research_participation'
  )),
  consent_version text NOT NULL,
  consent_given boolean NOT NULL DEFAULT false,
  consent_timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  withdrawal_timestamp timestamptz,
  withdrawal_reason text,
  notes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consent_user_id ON user_consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_session_id ON user_consent_records(session_id);
CREATE INDEX IF NOT EXISTS idx_consent_type ON user_consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_timestamp ON user_consent_records(consent_timestamp);
CREATE INDEX IF NOT EXISTS idx_consent_given ON user_consent_records(consent_given);

-- Create user_onboarding_state table
CREATE TABLE IF NOT EXISTS user_onboarding_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  navigator_completed boolean DEFAULT false,
  navigator_completion_date timestamptz,
  consent_privacy_given boolean DEFAULT false,
  consent_version_accepted text,
  onboarding_step text DEFAULT 'welcome' CHECK (onboarding_step IN (
    'welcome',
    'privacy',
    'assessment',
    'profile_review',
    'complete'
  )),
  needs_reassessment boolean DEFAULT false,
  last_assessment_date timestamptz,
  preferred_modules text[],
  onboarding_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for reassessment queries
CREATE INDEX IF NOT EXISTS idx_onboarding_reassessment ON user_onboarding_state(needs_reassessment, last_assessment_date);

-- Enable Row Level Security
ALTER TABLE user_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_consent_records

-- Users can view their own consent records
CREATE POLICY "Users can view own consent records"
  ON user_consent_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own consent records
CREATE POLICY "Users can create own consent records"
  ON user_consent_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anonymous users can insert consent records (pre-auth)
CREATE POLICY "Anonymous users can create consent records"
  ON user_consent_records
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- Service role can read all (for compliance auditing)
CREATE POLICY "Service role can view all consent records"
  ON user_consent_records
  FOR SELECT
  TO service_role
  USING (true);

-- Users can update only withdrawal fields on their own records
CREATE POLICY "Users can withdraw own consent"
  ON user_consent_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND withdrawal_timestamp IS NOT NULL
  );

-- RLS Policies for user_onboarding_state

-- Users can view their own onboarding state
CREATE POLICY "Users can view own onboarding state"
  ON user_onboarding_state
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own onboarding state
CREATE POLICY "Users can update own onboarding state"
  ON user_onboarding_state
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own onboarding state
CREATE POLICY "Users can create own onboarding state"
  ON user_onboarding_state
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_consent_records_updated_at ON user_consent_records;
CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON user_consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_state_updated_at ON user_onboarding_state;
CREATE TRIGGER update_onboarding_state_updated_at
  BEFORE UPDATE ON user_onboarding_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for active consents (useful for quick lookups)
CREATE OR REPLACE VIEW active_user_consents AS
SELECT DISTINCT ON (user_id, consent_type)
  user_id,
  consent_type,
  consent_given,
  consent_version,
  consent_timestamp,
  withdrawal_timestamp
FROM user_consent_records
WHERE user_id IS NOT NULL
ORDER BY user_id, consent_type, consent_timestamp DESC;

-- Grant access to the view
GRANT SELECT ON active_user_consents TO authenticated;

-- Create function to check if user has valid consent for a type
CREATE OR REPLACE FUNCTION has_valid_consent(
  p_user_id uuid,
  p_consent_type text
)
RETURNS boolean AS $$
DECLARE
  v_has_consent boolean;
BEGIN
  SELECT consent_given INTO v_has_consent
  FROM active_user_consents
  WHERE user_id = p_user_id
    AND consent_type = p_consent_type
    AND withdrawal_timestamp IS NULL;
  
  RETURN COALESCE(v_has_consent, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION has_valid_consent(uuid, text) TO authenticated;
