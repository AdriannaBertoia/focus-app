import { neon } from "@neondatabase/serverless";

/**
 * Returns a SQL tagged-template function connected to the Neon Postgres database.
 * Uses the DATABASE_URL env var (set automatically by Vercel when you add a Neon integration).
 *
 * Usage:
 *   const sql = getDb();
 *   const rows = await sql`SELECT * FROM tasks WHERE date = ${date}`;
 */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(process.env.DATABASE_URL);
}
