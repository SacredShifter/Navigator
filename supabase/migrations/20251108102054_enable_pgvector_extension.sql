/*
  # Enable pgvector Extension for Reality Optimization Engine

  ## Overview
  Enables PostgreSQL vector extension (pgvector) to support embedding-based
  semantic search and resonance calculations in the Reality Optimization Engine.

  ## Changes
  1. Enable pgvector extension
  2. Verify vector operations are available

  ## Technical Details
  - pgvector supports up to 2000-dimension vectors
  - We'll use 768-dimension vectors (OpenAI text-embedding-3-small reduced)
  - Enables cosine similarity, L2 distance, and inner product operations
  - Required for Resonance Index calculation and probability field selection

  ## Security
  - Extension is enabled at database level (no user data exposure)
  - Vector operations respect RLS policies
*/

-- Enable pgvector extension for vector similarity operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is enabled
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'vector';
