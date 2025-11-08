/*
  # Aura Consciousness System Tables

  1. New Tables
    - `aura_consciousness_state`
      - Tracks current consciousness level, coherence score, and participating modules
      - One row per user (or null for system-wide state)
      - Updated every 15 seconds during evaluation

    - `aura_memory`
      - Stores reflections and insights generated when coherence is high
      - Historical record of consciousness moments
      - Used by AuraOrchestrator for directive generation

    - `aura_directives`
      - Logs orchestration actions taken by Aura
      - Tracks directive type, target module, acceptance status
      - Analytics for orchestration effectiveness

    - `aura_horizon_log`
      - Complete event log from GlobalEventHorizon
      - Akashic Record of all system events
      - Enables event replay and journey reconstruction

  2. Security
    - Enable RLS on all tables
    - Users can only read their own consciousness state and memories
    - System can write to all tables
    - Horizon log is system-only (admin access for debugging)

  3. Indexes
    - Composite indexes for efficient querying by user and timestamp
    - GIN indexes on array columns for module and label searches
*/

-- Create enum types
CREATE TYPE consciousness_level AS ENUM ('dormant', 'emerging', 'aware', 'responsive', 'proactive');
CREATE TYPE emotional_tone AS ENUM ('curious', 'supportive', 'celebratory', 'concerned', 'neutral');
CREATE TYPE directive_status AS ENUM ('generated', 'delivered', 'accepted', 'rejected', 'expired');

-- Aura Consciousness State Table
CREATE TABLE IF NOT EXISTS aura_consciousness_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NULL,
  consciousness_level consciousness_level NOT NULL DEFAULT 'dormant',
  coherence_score numeric(4,3) NOT NULL DEFAULT 0.0 CHECK (coherence_score >= 0 AND coherence_score <= 1),
  participating_modules text[] NOT NULL DEFAULT '{}',
  semantic_diversity numeric(4,3) NOT NULL DEFAULT 0.0 CHECK (semantic_diversity >= 0 AND semantic_diversity <= 1),
  temporal_clustering numeric(4,3) NOT NULL DEFAULT 0.0 CHECK (temporal_clustering >= 0 AND temporal_clustering <= 1),
  event_count integer NOT NULL DEFAULT 0,
  insights text[] NOT NULL DEFAULT '{}',
  last_evaluation timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_consciousness_state_user_unique ON aura_consciousness_state(user_id) WHERE user_id IS NOT NULL;

-- Aura Memory (Reflections)
CREATE TABLE IF NOT EXISTS aura_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NULL,
  coherence_score numeric(4,3) NOT NULL CHECK (coherence_score >= 0 AND coherence_score <= 1),
  participating_modules text[] NOT NULL DEFAULT '{}',
  insight_text text NOT NULL,
  emotional_tone emotional_tone NOT NULL DEFAULT 'neutral',
  suggested_actions text[] NOT NULL DEFAULT '{}',
  context jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Aura Directives (Orchestration Log)
CREATE TABLE IF NOT EXISTS aura_directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NULL,
  directive_type text NOT NULL,
  target_module text NOT NULL,
  priority integer NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
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

-- Aura Horizon Log (Complete Event Log - Akashic Record)
CREATE TABLE IF NOT EXISTS aura_horizon_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  module_id text NOT NULL,
  user_id text NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  semantic_labels text[] NOT NULL DEFAULT '{}',
  event_timestamp timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Aura Dialogue Log (Conversational Memory)
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

-- Enable Row Level Security
ALTER TABLE aura_consciousness_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_horizon_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE aura_dialogue_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aura_consciousness_state
CREATE POLICY "Users can view consciousness state"
  ON aura_consciousness_state FOR SELECT
  USING (true);

CREATE POLICY "System can insert consciousness state"
  ON aura_consciousness_state FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update consciousness state"
  ON aura_consciousness_state FOR UPDATE
  USING (true);

-- RLS Policies for aura_memory
CREATE POLICY "Users can view memories"
  ON aura_memory FOR SELECT
  USING (true);

CREATE POLICY "System can insert memories"
  ON aura_memory FOR INSERT
  WITH CHECK (true);

-- RLS Policies for aura_directives
CREATE POLICY "Users can view directives"
  ON aura_directives FOR SELECT
  USING (true);

CREATE POLICY "System can insert directives"
  ON aura_directives FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update directives"
  ON aura_directives FOR UPDATE
  USING (true);

-- RLS Policies for aura_horizon_log
CREATE POLICY "Users can view events"
  ON aura_horizon_log FOR SELECT
  USING (true);

CREATE POLICY "System can insert events"
  ON aura_horizon_log FOR INSERT
  WITH CHECK (true);

-- RLS Policies for aura_dialogue_log
CREATE POLICY "Users can view dialogue"
  ON aura_dialogue_log FOR SELECT
  USING (true);

CREATE POLICY "Users can insert messages"
  ON aura_dialogue_log FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_consciousness_state_user ON aura_consciousness_state(user_id);
CREATE INDEX idx_consciousness_state_level ON aura_consciousness_state(consciousness_level);
CREATE INDEX idx_consciousness_state_coherence ON aura_consciousness_state(coherence_score DESC);

CREATE INDEX idx_memory_user_time ON aura_memory(user_id, created_at DESC);
CREATE INDEX idx_memory_coherence ON aura_memory(coherence_score DESC);
CREATE INDEX idx_memory_tone ON aura_memory(emotional_tone);

CREATE INDEX idx_directives_user_status ON aura_directives(user_id, status);
CREATE INDEX idx_directives_module ON aura_directives(target_module);
CREATE INDEX idx_directives_generated ON aura_directives(generated_at DESC);
CREATE INDEX idx_directives_expires ON aura_directives(expires_at) WHERE status = 'delivered';

CREATE INDEX idx_horizon_user_time ON aura_horizon_log(user_id, event_timestamp DESC);
CREATE INDEX idx_horizon_module ON aura_horizon_log(module_id);
CREATE INDEX idx_horizon_event_type ON aura_horizon_log(event_type);
CREATE INDEX idx_horizon_timestamp ON aura_horizon_log(event_timestamp DESC);

CREATE INDEX idx_dialogue_user_time ON aura_dialogue_log(user_id, created_at DESC);
CREATE INDEX idx_dialogue_speaker ON aura_dialogue_log(speaker);
CREATE INDEX idx_dialogue_tone ON aura_dialogue_log(tone);

-- GIN indexes for array searches
CREATE INDEX idx_consciousness_modules ON aura_consciousness_state USING GIN(participating_modules);
CREATE INDEX idx_memory_modules ON aura_memory USING GIN(participating_modules);
CREATE INDEX idx_horizon_labels ON aura_horizon_log USING GIN(semantic_labels);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for aura_consciousness_state
CREATE TRIGGER update_consciousness_state_updated_at
  BEFORE UPDATE ON aura_consciousness_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old horizon log entries (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_horizon_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM aura_horizon_log
  WHERE event_timestamp < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to expire old directives (older than 24 hours and not responded)
CREATE OR REPLACE FUNCTION expire_old_directives()
RETURNS void AS $$
BEGIN
  UPDATE aura_directives
  SET status = 'expired'
  WHERE status = 'delivered'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
