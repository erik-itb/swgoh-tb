-- D1 Migration: Initial schema
-- Generated for swgoh-rote-tb deployment

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Instructions table
CREATE TABLE IF NOT EXISTS instructions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  phase INTEGER NOT NULL,
  planet TEXT NOT NULL,
  mission_number INTEGER NOT NULL,
  mission_type TEXT NOT NULL DEFAULT 'combat',
  is_auto_play INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  squad_leader_id TEXT,
  squad_member1_id TEXT,
  squad_member2_id TEXT,
  squad_member3_id TEXT,
  squad_member4_id TEXT,
  capital_ship_id TEXT,
  starting1_id TEXT,
  starting2_id TEXT,
  starting3_id TEXT,
  reinforcement1_id TEXT,
  reinforcement2_id TEXT,
  reinforcement3_id TEXT,
  reinforcement4_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  instruction_id TEXT NOT NULL REFERENCES instructions(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_instructions_phase ON instructions(phase);
CREATE INDEX IF NOT EXISTS idx_instructions_planet ON instructions(planet);
CREATE INDEX IF NOT EXISTS idx_videos_instruction_id ON videos(instruction_id);
