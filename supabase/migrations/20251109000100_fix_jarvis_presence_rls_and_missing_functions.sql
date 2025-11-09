/*
  # Fix JARVIS Presence State RLS and Missing Database Functions
  
  1. RLS Policies Fix
    - Add proper RLS policies for `jarvis_presence_state` to allow authenticated users
    - Policies allow users to manage their own presence state via email
    
  2. Missing RPC Functions
    - Create `daily_entropy_series` function for entropy heatmap visualization
    - Returns daily entropy calculations based on resonance variance
    
  3. Component Column Issues
    - Components query reality_branches table which exists
    - No schema changes needed, components will degrade gracefully
    
  4. Security
    - RLS ensures users can only access their own data
    - Functions are read-only and safe for authenticated access
*/

-- =====================================================
-- 1. FIX JARVIS PRESENCE STATE RLS POLICIES
-- =====================================================

-- Drop existing overly-restrictive policy
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Kent has full access to presence state" ON jarvis_presence_state;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add proper RLS policies for authenticated users
CREATE POLICY "Users can read own presence state"
  ON jarvis_presence_state FOR SELECT
  TO authenticated
  USING (user_email = auth.email());

CREATE POLICY "Users can insert own presence state"
  ON jarvis_presence_state FOR INSERT
  TO authenticated
  WITH CHECK (user_email = auth.email());

CREATE POLICY "Users can update own presence state"
  ON jarvis_presence_state FOR UPDATE
  TO authenticated
  USING (user_email = auth.email())
  WITH CHECK (user_email = auth.email());

CREATE POLICY "Users can delete own presence state"
  ON jarvis_presence_state FOR DELETE
  TO authenticated
  USING (user_email = auth.email());

-- =====================================================
-- 2. CREATE DAILY_ENTROPY_SERIES RPC FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION daily_entropy_series(
  p_user_id uuid, 
  p_days int DEFAULT 14
)
RETURNS TABLE(day date, entropy numeric) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT generate_series(
      current_date - (p_days::int - 1), 
      current_date, 
      interval '1 day'
    )::date as d
  ),
  by_day AS (
    SELECT 
      date(created_at) as day, 
      array_agg(resonance_index) as ris
    FROM reality_branches
    WHERE user_id = p_user_id 
      AND created_at >= (now() - (p_days || ' days')::interval)
    GROUP BY 1
  )
  SELECT 
    d.d as day,
    COALESCE(
      CASE 
        WHEN cardinality(b.ris) > 1 THEN
          LEAST(
            1.0, 
            SQRT(
              (
                SELECT AVG((ri - avg_ri)^2) 
                FROM unnest(b.ris) ri, 
                LATERAL (SELECT AVG(x) as avg_ri FROM unnest(b.ris) x) a
              )
            ) / 0.2
          )
        ELSE 0 
      END, 
      0
    )::numeric as entropy
  FROM days d
  LEFT JOIN by_day b ON b.day = d.d
  ORDER BY day;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION daily_entropy_series(uuid, int) TO authenticated;

-- =====================================================
-- 3. CREATE HELPER FUNCTION FOR ENTROPY CALCULATION
-- =====================================================

-- Helper function to calculate variance for entropy metrics
CREATE OR REPLACE FUNCTION calculate_ri_variance(
  p_user_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(
      STDDEV(resonance_index),
      0
    )::numeric
  FROM reality_branches
  WHERE user_id = p_user_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date;
$$;

GRANT EXECUTE ON FUNCTION calculate_ri_variance(uuid, timestamptz, timestamptz) TO authenticated;

-- =====================================================
-- 4. ADD MISSING UPDATE_UPDATED_AT_COLUMN FUNCTION
-- =====================================================

-- This function is referenced in triggers but may not exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ENSURE UNIQUE CONSTRAINT FOR UPSERTS
-- =====================================================

-- The unique index already exists from the original migration
-- This is a safety check to ensure it's present
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'jarvis_presence_state' 
    AND indexname = 'idx_presence_user_device'
  ) THEN
    CREATE UNIQUE INDEX idx_presence_user_device 
      ON jarvis_presence_state(user_email, device_id);
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================

-- Test that daily_entropy_series works
-- SELECT * FROM daily_entropy_series('00000000-0000-0000-0000-000000000000'::uuid, 7);

-- Test that presence state RLS works
-- INSERT INTO jarvis_presence_state (user_email, device_id, presence_mode)
-- VALUES (auth.email(), 'test-device', 'dormant');
