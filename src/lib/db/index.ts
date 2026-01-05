import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create libsql client for Turso (production) or local SQLite (development)
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create Drizzle instance
const db = drizzle(client, { schema });

export default db;
export { schema };
