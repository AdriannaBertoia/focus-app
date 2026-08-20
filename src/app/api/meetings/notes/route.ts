import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * GET /api/meetings/notes
 * Returns recorded meeting notes, most recent first.
 * Supports ?limit= (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const rows = await sql`
      SELECT id, title, date, time, app, attendees, retain,
             key_topics, decisions, action_items, questions, next_steps, my_notes, transcript,
             created_at
      FROM meeting_notes
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    const meetings = rows.map((r) => ({
      id: String(r.id),
      title: r.title,
      date: r.date,
      time: r.time || "",
      app: r.app || "Teams",
      attendees: r.attendees || "",
      retain: r.retain || false,
      sections: {
        keyTopics: r.key_topics || "",
        decisions: r.decisions || "",
        actionItems: r.action_items || "",
        questions: r.questions || "",
        nextSteps: r.next_steps || "",
        myNotes: r.my_notes || "",
        transcript: r.transcript || "",
      },
    }));

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Meeting notes GET error:", error);
    return NextResponse.json({ meetings: [] });
  }
}

/**
 * POST /api/meetings/notes
 * Save a recorded meeting note from the agent.
 *
 * Body: {
 *   title: string,
 *   date: string,
 *   time?: string,
 *   app?: string,
 *   attendees?: string,
 *   keyTopics?: string,
 *   decisions?: string,
 *   actionItems?: string,
 *   questions?: string,
 *   nextSteps?: string,
 *   myNotes?: string,
 *   transcript?: string,
 *   retain?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, date } = body;

    if (!title || !date) {
      return NextResponse.json({ error: "title and date are required" }, { status: 400 });
    }

    const sql = getDb();

    const result = await sql`
      INSERT INTO meeting_notes (
        title, date, time, app, attendees, retain,
        key_topics, decisions, action_items, questions, next_steps, my_notes, transcript
      ) VALUES (
        ${title},
        ${date},
        ${body.time || ""},
        ${body.app || "Teams"},
        ${body.attendees || ""},
        ${body.retain || false},
        ${body.keyTopics || ""},
        ${body.decisions || ""},
        ${body.actionItems || ""},
        ${body.questions || ""},
        ${body.nextSteps || ""},
        ${body.myNotes || ""},
        ${body.transcript || ""}
      )
      RETURNING id
    `;

    // Also push any action items to the inbox if present
    if (body.actionItems && body.actionItems.trim()) {
      const lines = body.actionItems.split("\n").filter((l: string) => l.trim().startsWith("-"));
      if (lines.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        for (const line of lines) {
          const text = line.replace(/^-\s*/, "").trim();
          if (text) {
            await sql`
              INSERT INTO tasks (date, text, category, energy, position)
              VALUES (
                ${today},
                ${text},
                'must',
                'medium',
                (SELECT COALESCE(MAX(position), 0) + 1 FROM tasks WHERE date = ${today})
              )
            `;
          }
        }
      }
    }

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("Meeting notes POST error:", error);
    return NextResponse.json({ error: "Failed to save meeting note" }, { status: 500 });
  }
}
