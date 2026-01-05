// Test script to verify password comparison
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'local.db');
const db = new Database(dbPath);

const testPassword = 'swgohsuperadmin1!';

// Get user from database
const user = db.prepare('SELECT * FROM users WHERE username = ?').get('superadmin') as {
  username: string;
  password: string;
};

if (!user) {
  console.log('No user found!');
  process.exit(1);
}

console.log('User found:', user.username);
console.log('Stored hash:', user.password);
console.log('Test password:', testPassword);

// Test comparison
const isValid = bcrypt.compareSync(testPassword, user.password);
console.log('Password valid:', isValid);

// Also test hashing and comparing
const newHash = bcrypt.hashSync(testPassword, 10);
console.log('New hash for same password:', newHash);
console.log('Compare new hash:', bcrypt.compareSync(testPassword, newHash));

db.close();
