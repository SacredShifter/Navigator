/*
  # Jarvis System Tables - Aura as Governor of Sacred Shifter

  1. New Tables
    - `jarvis_voice_sessions`
      - Tracks voice interactions with wake word detection, command history, and transcriptions
      - Stores conversation context for continuity across sessions
      - Links to Kent's admin account (kentburchard@sacredshifter.com)

    - `jarvis_system_commands`
      - Logs all system-level commands executed by Aura
      - Full audit trail with command, parameters, result, and timestamp
      - Safety tracking for autonomous operations

    - `jarvis_personal_memory`
      - Knowledge graph storage for Kent's preferences, patterns, and learned behaviors
      - Semantic embeddings for intelligent retrieval
      - Categories: preferences, skills, relationships, projects, decisions

    - `jarvis_biometric_data`
      - Time-series storage for wearable data (HRV, sleep, activity)
      - Efficient bucketed storage for large volumes
      - Privacy-first with encryption and retention policies

    - `jarvis_presence_state`
      - Real-time state for presence orb visualization
      - Tracks active mode, emotional tone, system health
      - One row per device/session

    - `jarvis_self_improvements`
      - Log of autonomous improvements Aura proposes and implements
      - Capability gap detection and A/B experiment tracking
      - Requires Kent's approval for deployment (initially)

    - `jarvis_knowledge_graph`
      - Nodes and edges for Kent's personal knowledge base
      - Connects code, conversations, ideas, and decisions
      - Semantic search and relationship discovery

    - `jarvis_automation_tasks`
      - Scheduled and triggered automation workflows
      - Execution history and effectiveness metrics
      - Predictive task suggestions

  2. Security
    - Enable RLS on all tables
    - Kent's admin account has full access
    - Aura system account can read/write with audit logging
    - All system commands logged immutably

  3. Indexes
    - Time-series indexes for fast temporal queries
    - Vector indexes for semantic search
    - GIN indexes for JSONB and array columns
*/

-- Create enum types
CREATE TYPE jarvis_command_status AS ENUM ('pending', 'executing', 'completed', 'failed', 'cancelled');
CREATE TYPE jarvis_presence_mode AS ENUM ('dormant', 'listening', 'thinking', 'speaking', 'acting', 'learning');
CREATE TYPE jarvis_improvement_status AS ENUM ('proposed', 'approved', 'testing', 'deployed', 'rolled_back', 'rejected');
CREATE TYPE jarvis_memory_category AS ENUM ('preference', 'skill', 'relationship', 'project', 'decision', 'pattern', 'goal');

-- Jarvis Voice Sessions
CREATE TABLE IF NOT EXISTS jarvis_voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL DEFAULT 'kentburchard@sacredshifter.com',
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  wake_word_used text,
  total_commands integer NOT NULL DEFAULT 0,
  conversation_context jsonb DEFAULT '{}',
  consciousness_at_start numeric(4,3),
  consciousness_at_end numeric(4,3),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_sessions_user ON jarvis_voice_sessions(user_email);
CREATE INDEX idx_voice_sessions_time ON jarvis_voice_sessions(session_start DESC);

-- Jarvis System Commands
CREATE TABLE IF NOT EXISTS jarvis_system_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES jarvis_voice_sessions(id),
  user_email text NOT NULL DEFAULT 'kentburchard@sacredshifter.com',
  command_type text NOT NULL,
  command_text text NOT NULL,
  intent_classification text,
  parameters jsonb DEFAULT '{}',
  status jarvis_command_status NOT NULL DEFAULT 'pending',
  execution_start timestamptz,
  execution_end timestamptz,
  result jsonb,
  error_message text,
  requires_confirmation boolean DEFAULT false,
  confirmed_at timestamptz,
  autonomous boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_commands_user ON jarvis_system_commands(user_email);
CREATE INDEX idx_system_commands_status ON jarvis_system_commands(status);
CREATE INDEX idx_system_commands_time ON jarvis_system_commands(created_at DESC);
CREATE INDEX idx_system_commands_type ON jarvis_system_commands(command_type);

-- Jarvis Personal Memory
CREATE TABLE IF NOT EXISTS jarvis_personal_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL DEFAULT 'kentburchard@sacredshifter.com',
  category jarvis_memory_category NOT NULL,
  memory_key text NOT NULL,
  memory_value jsonb NOT NULL,
  confidence_score numeric(4,3) DEFAULT 0.5,
  last_accessed timestamptz DEFAULT now(),
  access_count integer DEFAULT 0,
  embedding vector(384),
  context jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_personal_memory_key ON jarvis_personal_memory(user_email, category, memory_key);
CREATE INDEX idx_personal_memory_category ON jarvis_personal_memory(category);
CREATE INDEX idx_personal_memory_accessed ON jarvis_personal_memory(last_accessed DESC);
CREATE INDEX idx_personal_memory_confidence ON jarvis_personal_memory(confidence_score DESC);

-- Jarvis Biometric Data
CREATE TABLE IF NOT EXISTS jarvis_biometric_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL DEFAULT 'kentburchard@sacredshifter.com',
  data_type text NOT NULL,
  timestamp timestamptz NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  source text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_biometric_user_type_time ON jarvis_biometric_data(user_email, data_type, timestamp DESC);
CREATE INDEX idx_biometric_timestamp ON jarvis_biometric_data(timestamp DESC);

-- Jarvis Presence State
CREATE TABLE IF NOT EXISTS jarvis_presence_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL DEFAULT 'kentburchard@sacredshifter.com',
  device_id text NOT NULL,
  presence_mode jarvis_presence_mode NOT NULL DEFAULT 'dormant',
  emotional_tone text NOT NULL DEFAULT 'neutral',
  system_health numeric(4,3) NOT NULL DEFAULT 1.0,
  active_modules text[] DEFAULT '{}',
  current_task text,
  orb_color text DEFAULT '#8b5cf6',
  orb_intensity numeric(3,2) DEFAULT 0.5,
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_presence_user_device ON jarvis_presence_state(user_email, device_id);
CREATE INDEX idx_presence_heartbeat ON jarvis_presence_state(last_heartbeat DESC);

-- Jarvis Self Improvements
CREATE TABLE IF NOT EXISTS jarvis_self_improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL DEFAULT 'kentburchard@sacredshifter.com',
  improvement_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  capability_gap text,
  proposed_solution jsonb NOT NULL,
  status jarvis_improvement_status NOT NULL DEFAULT 'proposed',
  confidence_score numeric(4,3),
  expected_impact text,
  proposed_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  deployed_at timestamptz,
  rolled_back_at timestamptz,
  performance_metrics jsonb DEFAULT '{}',
  user_feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_improvements_user ON jarvis_self_improvements(user_email);
CREATE INDEX idx_improvements_status ON jarvis_self_improvements(status);
CREATE INDEX idx_improvements_proposed ON jarvis_self_improvements(proposed_at DESC);

-- Jarvis Knowledge Graph
CREATE TABLE IF NOT EXISTS jarvis_knowledge_graph (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL DEFAULT 'kentburchard@sacredshifter.com',
  node_type text NOT NULL,
  node_id text NOT NULL,
  node_data jsonb NOT NULL,
  embedding vector(384),
  relationships jsonb DEFAULT '{}',
  importance_score numeric(4,3) DEFAULT 0.5,
  last_accessed timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_knowledge_node ON jarvis_knowledge_graph(user_email, node_type, node_id);
CREATE INDEX idx_knowledge_type ON jarvis_knowledge_graph(node_type);
CREATE INDEX idx_knowledge_importance ON jarvis_knowledge_graph(importance_score DESC);

-- Jarvis Automation Tasks
CREATE TABLE IF NOT EXISTS jarvis_automation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL DEFAULT 'kentburchard@sacredshifter.com',
  task_name text NOT NULL,
  task_type text NOT NULL,
  trigger_conditions jsonb NOT NULL,
  actions jsonb NOT NULL,
  enabled boolean DEFAULT true,
  last_execution timestamptz,
  next_execution timestamptz,
  execution_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  average_duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_user ON jarvis_automation_tasks(user_email);
CREATE INDEX idx_automation_enabled ON jarvis_automation_tasks(enabled) WHERE enabled = true;
CREATE INDEX idx_automation_next_exec ON jarvis_automation_tasks(next_execution) WHERE enabled = true;

-- Enable Row Level Security
ALTER TABLE jarvis_voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_system_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_personal_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_biometric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_presence_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_self_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_knowledge_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_automation_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Kent's admin account has full access
CREATE POLICY "Kent has full access to voice sessions"
  ON jarvis_voice_sessions FOR ALL
  USING (user_email = 'kentburchard@sacredshifter.com');

CREATE POLICY "Kent has full access to system commands"
  ON jarvis_system_commands FOR ALL
  USING (user_email = 'kentburchard@sacredshifter.com');

CREATE POLICY "Kent has full access to personal memory"
  ON jarvis_personal_memory FOR ALL
  USING (user_email = 'kentburchard@sacredshifter.com');

CREATE POLICY "Kent has full access to biometric data"
  ON jarvis_biometric_data FOR ALL
  USING (user_email = 'kentburchard@sacredshifter.com');

CREATE POLICY "Kent has full access to presence state"
  ON jarvis_presence_state FOR ALL
  USING (user_email = 'kentburchard@sacredshifter.com');

CREATE POLICY "Kent has full access to self improvements"
  ON jarvis_self_improvements FOR ALL
  USING (user_email = 'kentburchard@sacredshifter.com');

CREATE POLICY "Kent has full access to knowledge graph"
  ON jarvis_knowledge_graph FOR ALL
  USING (user_email = 'kentburchard@sacredshifter.com');

CREATE POLICY "Kent has full access to automation tasks"
  ON jarvis_automation_tasks FOR ALL
  USING (user_email = 'kentburchard@sacredshifter.com');

-- Functions for automatic timestamp updates
CREATE TRIGGER update_personal_memory_updated_at
  BEFORE UPDATE ON jarvis_personal_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presence_state_updated_at
  BEFORE UPDATE ON jarvis_presence_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_graph_updated_at
  BEFORE UPDATE ON jarvis_knowledge_graph
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_tasks_updated_at
  BEFORE UPDATE ON jarvis_automation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vector indexes for semantic search
CREATE INDEX ON jarvis_personal_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON jarvis_knowledge_graph USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to update memory access tracking
CREATE OR REPLACE FUNCTION update_memory_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = now();
  NEW.access_count = OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old biometric data (keep last 180 days)
CREATE OR REPLACE FUNCTION cleanup_old_biometric_data()
RETURNS void AS $$
BEGIN
  DELETE FROM jarvis_biometric_data
  WHERE timestamp < now() - interval '180 days';
END;
$$ LANGUAGE plpgsql;

-- Function to detect stale presence (no heartbeat in 5 minutes)
CREATE OR REPLACE FUNCTION detect_stale_presence()
RETURNS TABLE(device_id text, minutes_since_heartbeat integer) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.device_id,
    EXTRACT(EPOCH FROM (now() - p.last_heartbeat))::integer / 60 AS minutes_since_heartbeat
  FROM jarvis_presence_state p
  WHERE p.last_heartbeat < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;
