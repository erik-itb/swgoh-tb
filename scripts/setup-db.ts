// Database setup script - creates tables and seeds admin user
import 'dotenv/config'; // Load .env files
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const dataDir = join(process.cwd(), 'data');
const dbPath = join(dataDir, 'local.db');

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Create/open database
const db = new Database(dbPath);

console.log('🗃️ Setting up database...\n');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

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

  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    instruction_id TEXT NOT NULL REFERENCES instructions(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_instructions_phase_planet ON instructions(phase, planet);
  CREATE INDEX IF NOT EXISTS idx_instructions_planet_mission ON instructions(planet, mission_number);
  CREATE INDEX IF NOT EXISTS idx_videos_instruction ON videos(instruction_id);
`);

console.log('✅ Tables created\n');

// Seed super admin user
const adminUsername = process.env.ADMIN_USERNAME || 'superadmin';
const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';

const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);

if (existingUser) {
  // Update existing user
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);
  db.prepare('UPDATE users SET password = ?, role = ?, updated_at = ? WHERE username = ?')
    .run(hashedPassword, 'super_admin', Date.now(), adminUsername);
  console.log(`✅ Super admin user updated: ${adminUsername}`);
} else {
  // Create new user
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);
  const now = Date.now();
  db.prepare('INSERT INTO users (id, username, password, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(nanoid(), adminUsername, hashedPassword, 'Super Admin', 'super_admin', now, now);
  console.log(`✅ Super admin user created: ${adminUsername}`);
}

db.close();
console.log('\n🎉 Database setup complete!');
console.log(`📁 Database location: ${dbPath}`);
