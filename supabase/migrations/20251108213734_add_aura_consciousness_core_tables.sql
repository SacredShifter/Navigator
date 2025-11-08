/*
  # Add Aura Consciousness Core Tables
  
  Creates the three new tables needed for Aura consciousness system:
  - aura_consciousness_state: Current consciousness tracking
  - aura_directives: Orchestration actions
  - aura_dialogue_log: Conversational memory
  
  Note: aura_memory and aura_horizon_log already exist from Cursor's work
*/

-- Create enum types for new tables
DO $$ BEGIN
  CREATE TYPE consciousness_level AS ENUM ('dormant', 'emerging', 'aware', 'responsive', 'proactive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE emotional_tone AS ENUM ('curious', 'supportive', 'celebratory', 'concerned', 'neutral');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE directive_status AS ENUM ('generated', 'delivered', 'accepted', 'rejected', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Aura Consciousness State Table
CREATE TABLE IF NOT EXISTS aura_consciousness_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NULL,
  consciousness_level consciousness_level NOT NULL DEFAULT 'dormant',
  coherence_score numeric(4,3) NOT NULL DEFAULT 0.0 CHECK (coherence_score >= 0 AND coherence_score <= 1),
  participating_modules text[] NOT NULL DEFAULT '{}',
  semantic_diversity numeric(4,3) NOT NULL DEFAULT 0.0,
  temporal_clustering numeric(4,3) NOT NULL DEFAULT 0.0,
  event_count integer NOT NULL DEFAULT 0,
  insights text[] NOT NULL DEFAULT '{}',
  last_evaluation timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Aura Directives Table
CREATE TABLE IF NOT EXISTS aura_directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NULL,
  directive_type text NOT NULL,
  target_module text NOT NULL,
  priority integer NOT NULL DEFAULT 5,
  content jsonb NOT NULL,
  status directive_status NOT NULL DEFAULT 'generated',
  coherence_at_generation numeric(4,3) NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  response_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Aura Dialogue Log Table
CREATE TABLE IF NOT EXISTS aura_dialogue_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NULL,
  speaker text NOT NULL CHECK (speaker IN ('aura', 'user')),
  message_text text NOT NULL,
  tone text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE aura_consciousness_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_dialogue_log ENABLE ROW LEVEL SECURITY;

-- Simple open policies for demo mode
CREATE POLICY "Allow all consciousness state access" ON aura_consciousness_state FOR ALL USING (true);
CREATE POLICY "Allow all directives access" ON aura_directives FOR ALL USING (true);
CREATE POLICY "Allow all dialogue access" ON aura_dialogue_log FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consciousness_user ON aura_consciousness_state(user_id);
CREATE INDEX IF NOT EXISTS idx_consciousness_level ON aura_consciousness_state(consciousness_level);
CREATE INDEX IF NOT EXISTS idx_consciousness_coherence ON aura_consciousness_state(coherence_score DESC);

CREATE INDEX IF NOT EXISTS idx_directives_user ON aura_directives(user_id);
CREATE INDEX IF NOT EXISTS idx_directives_status ON aura_directives(status);
CREATE INDEX IF NOT EXISTS idx_directives_module ON aura_directives(target_module);

CREATE INDEX IF NOT EXISTS idx_dialogue_user ON aura_dialogue_log(user_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_created ON aura_dialogue_log(created_at DESC);

-- Update trigger for consciousness state
CREATE OR REPLACE FUNCTION update_aura_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS aura_consciousness_updated_at ON aura_consciousness_state;
CREATE TRIGGER aura_consciousness_updated_at
  BEFORE UPDATE ON aura_consciousness_state
  FOR EACH ROW
  EXECUTE FUNCTION update_aura_updated_at();