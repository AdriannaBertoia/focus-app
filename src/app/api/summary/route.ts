import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * GET /api/summary?date=YYYY-MM-DD
 * Returns the daily summary for a given date (defaults to today).
 */
export async function GET(request: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const rows = await sql`
      SELECT date, summary, tasks_completed, tasks_carried, highlights, created_at
      FROM daily_summaries
      WHERE date = ${date}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Summary GET error:", error);
    return NextResponse.json(null);
  }
}

/**
 * POST /api/summary
 * Save an end-of-day summary (from the agent or manual).
 * Body: { date?, summary, tasks_completed?, tasks_carried?, highlights?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { summary, tasks_completed, tasks_carried, highlights } = body;

    if (!summary) {
      return NextResponse.json({ error: "summary is required" }, { status: 400 });
    }

    const sql = getDb();
    const date = body.date || new Date().toISOString().split("T")[0];

    // Auto-calculate task stats if not provided
    let completed = tasks_completed;
    let carried = tasks_carried;

    if (completed === undefined || carried === undefined) {
      const stats = await sql`
        SELECT
          COUNT(*) FILTER (WHERE done = TRUE) as completed,
          COUNT(*) FILTER (WHERE done = FALSE) as remaining
        FROM tasks
        WHERE date = ${date}
      `;
      if (stats[0]) {
        completed = completed ?? Number(stats[0].completed);
        carried = carried ?? Number(stats[0].remaining);
      }
    }

    await sql`
      INSERT INTO daily_summaries (date, summary, tasks_completed, tasks_carried, highlights)
      VALUES (${date}, ${summary}, ${completed || 0}, ${carried || 0}, ${highlights || []})
      ON CONFLICT (date) DO UPDATE SET
        summary = EXCLUDED.summary,
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_carried = EXCLUDED.tasks_carried,
        highlights = EXCLUDED.highlights
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Summary POST error:", error);
    return NextResponse.json({ error: "Failed to save summary" }, { status: 500 });
  }
}
