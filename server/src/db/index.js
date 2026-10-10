import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

/**
 * Connects to PostgreSQL. This is a REAL database only:
 * if DATABASE_URL is missing or unreachable the server refuses to start,
 * instead of silently falling back to a throw-away in-memory database.
 */
export async function initDb() {
  if (pool) return pool;

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      'DATABASE_URL is not set. Add it to server/.env, e.g. ' +
        'DATABASE_URL=postgresql://postgres:YOURPASSWORD@localhost:5432/laundry_db'
    );
  }

  const candidate = new pg.Pool({
    connectionString: dbUrl,
    // Hosted databases (Render, Neon, Supabase...) usually need SSL: set DATABASE_SSL=true
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    const res = await candidate.query('SELECT NOW() AS now');
    console.log('Connected to PostgreSQL at', res.rows[0].now);
  } catch (err) {
    await candidate.end().catch(() => {});
    throw new Error(`Could not connect to PostgreSQL: ${err.message}`);
  }

  pool = candidate;
  return pool;
}

/** Creates any missing tables. Safe to run on every start (uses IF NOT EXISTS). No demo data. */
export async function autoSetupDb() {
  await initDb();
  const { runMigrations } = await import('./migrate.js');
  await runMigrations();
}

export async function query(text, params) {
  if (!pool) await initDb();
  return pool.query(text, params);
}

/**
 * Runs several queries as ONE all-or-nothing unit.
 * If anything inside throws, every change is rolled back.
 *   const result = await withTransaction(async (tx) => { await tx.query(...); ... });
 */
export async function withTransaction(fn) {
  if (!pool) await initDb();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default { initDb, autoSetupDb, query, withTransaction, closeDb };
