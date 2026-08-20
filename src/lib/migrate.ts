/**
 * Database migration script.
 * Run with: npx tsx src/lib/migrate.ts
 *
 * Creates all tables needed for the focus app.
 * Safe to run multiple times (uses IF NOT EXISTS).
 */
import { neon } from "@neondatabase/serverless";

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL env var is required");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log("Running migrations...");

  // ── Daily Notes ──────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS daily_notes (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      day_of_week TEXT NOT NULL,
      intention TEXT DEFAULT '',
      priorities TEXT[] DEFAULT '{}',
      out_today TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("  ✓ daily_notes");

  // ── Tasks ────────────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      text TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'must',
      energy TEXT NOT NULL DEFAULT 'medium',
      done BOOLEAN NOT NULL DEFAULT FALSE,
      recurring BOOLEAN NOT NULL DEFAULT FALSE,
      position INT NOT NULL DEFAULT 0,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`;
  console.log("  ✓ tasks");

  // ── Schedule ─────────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS schedule_blocks (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      block TEXT NOT NULL,
      position INT NOT NULL DEFAULT 0
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule_blocks(date)`;
  console.log("  ✓ schedule_blocks");

  // ── Meetings ─────────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS meetings (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT DEFAULT '',
      prep TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date)`;
  console.log("  ✓ meetings");

  // ── Inbox Items (from copilot agent) ─────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS inbox_items (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      source TEXT DEFAULT 'copilot-agent',
      priority TEXT DEFAULT 'should',
      processed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_processed ON inbox_items(processed)`;
  console.log("  ✓ inbox_items");

  // ── Brain Dumps ──────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS brain_dumps (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      processed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("  ✓ brain_dumps");

  // ── Meeting Notes (longer form notes from meetings folder) ───────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS meeting_notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      meeting_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("  ✓ meeting_notes");

  // ── Recurring Tasks ───────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS recurring_tasks (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'must',
      energy TEXT NOT NULL DEFAULT 'medium',
      days TEXT[] NOT NULL DEFAULT '{}',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("  ✓ recurring_tasks");

  console.log("\nMigration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
