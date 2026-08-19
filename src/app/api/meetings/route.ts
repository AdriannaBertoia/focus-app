import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * GET /api/meetings
 *
 * Returns meetings. Supports ?date= for a single day or ?from=&to= for a range.
 * Defaults to today if no params given.
 */
export async function GET(request: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let rows;
    if (from && to) {
      rows = await sql`
        SELECT id, date, time, title, notes, prep
        FROM meetings
        WHERE date >= ${from} AND date <= ${to}
        ORDER BY date ASC, time ASC
      `;
    } else {
      const targetDate = date || new Date().toISOString().split("T")[0];
      rows = await sql`
        SELECT id, date, time, title, notes, prep
        FROM meetings
        WHERE date = ${targetDate}
        ORDER BY time ASC
      `;
    }

    const meetings = rows.map((m) => ({
      id: String(m.id),
      date: m.date,
      time: m.time,
      title: m.title,
      notes: m.notes || "",
      prep: m.prep || "",
    }));

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Meetings GET error:", error);
    return NextResponse.json({ meetings: [] });
  }
}

/**
 * POST /api/meetings
 *
 * Accepts meetings from the external agent and upserts them into the DB.
 *
 * Body (JSON):
 *   meetings: Array<{ date: string; time: string; title: string; notes?: string; prep?: string }>
 *
 * If a meeting with the same date + time + title already exists, it's skipped (no duplicates).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const meetings: { date: string; time: string; title: string; notes?: string; prep?: string }[] = body.meetings;

    if (!Array.isArray(meetings) || meetings.length === 0) {
      return NextResponse.json({ error: "Provide a non-empty `meetings` array" }, { status: 400 });
    }

    const sql = getDb();
    let created = 0;

    for (const m of meetings) {
      if (!m.date || !m.time || !m.title) continue;

      // Upsert — skip if already exists for same date/time/title
      const existing = await sql`
        SELECT id FROM meetings
        WHERE date = ${m.date} AND time = ${m.time} AND title = ${m.title}
        LIMIT 1
      `;

      if (existing.length === 0) {
        await sql`
          INSERT INTO meetings (date, time, title, notes, prep)
          VALUES (${m.date}, ${m.time}, ${m.title}, ${m.notes || ""}, ${m.prep || ""})
        `;
        created++;
      }
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error("Meetings POST error:", error);
    return NextResponse.json({ error: "Failed to save meetings" }, { status: 500 });
  }
}
