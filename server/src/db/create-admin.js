/**
 * Creates the first (or another) platform ADMIN account.
 * Admins can never be created through the public registration form - only here.
 *
 * Usage:
 *   npm run create-admin -- admin@yourdomain.com "Full Name" "AStrongPassword123"
 * or with environment variables:
 *   ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npm run create-admin
 */
import bcrypt from 'bcryptjs';
import { autoSetupDb, query, closeDb } from './index.js';

const [argEmail, argName, argPassword] = process.argv.slice(2);
const email = (argEmail || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const fullName = (argName || process.env.ADMIN_NAME || '').trim();
const password = argPassword || process.env.ADMIN_PASSWORD || '';

async function main() {
  if (!email || !fullName || !password) {
    console.error('Usage: npm run create-admin -- <email> "<Full Name>" "<password>"');
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('That email address does not look valid.');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error('Admin password must be at least 10 characters.');
    process.exit(1);
  }

  await autoSetupDb(); // makes sure the tables exist

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.error(`A user with email ${email} already exists.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const res = await query(
    `INSERT INTO users (email, password_hash, role, full_name)
     VALUES ($1, $2, 'admin', $3)
     RETURNING id, email, role, full_name`,
    [email, hash, fullName]
  );
  console.log('Admin account created:', res.rows[0]);
}

main()
  .then(() => closeDb())
  .catch(async (err) => {
    console.error('Failed to create admin:', err.message);
    await closeDb().catch(() => {});
    process.exit(1);
  });
