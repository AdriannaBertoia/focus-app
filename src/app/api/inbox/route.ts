import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * POST /api/inbox
 *
 * Accepts action items from an external agent (e.g. a copilot that scans
 * emails/chats) and writes them into the inbox, optionally adding them
 * to today's task list.
 *
 * Body (JSON):
 *   items: Array<{ text: string; source?: string; priority?: "must" | "should" }>
 *   addToToday?: boolean
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: { text: string; source?: string; priority?: "must" | "should" }[] = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Provide a non-empty `items` array" },
        { status: 400 }
      );
    }

    const sql = getDb();
    let created = 0;

    for (const item of items) {
      if (!item.text?.trim()) continue;

      await sql`
        INSERT INTO inbox_items (text, source, priority)
        VALUES (${item.text.trim()}, ${item.source || "copilot-agent"}, ${item.priority || "should"})
      `;
      created++;

      // Optionally add to today's task list
      if (body.addToToday) {
        const today = new Date().toISOString().split("T")[0];
        const category = item.priority === "must" ? "must" : "should";
        await sql`
          INSERT INTO tasks (date, text, category, energy, position)
          VALUES (
            ${today},
            ${item.text.trim()},
            ${category},
            'medium',
            (SELECT COALESCE(MAX(position), 0) + 1 FROM tasks WHERE date = ${today})
          )
        `;
      }
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error("Inbox POST error:", error);
    return NextResponse.json({ error: "Failed to process items" }, { status: 500 });
  }
}

/**
 * GET /api/inbox
 *
 * Returns unprocessed action items.
 */
export async function GET() {
  try {
    const sql = getDb();

    const rows = await sql`
      SELECT id, text, source, priority, created_at
      FROM inbox_items
      WHERE processed = FALSE
      ORDER BY created_at DESC
    `;

    const items = rows.map((r) => ({
      id: String(r.id),
      text: r.text,
      source: r.source,
      priority: r.priority,
      created: r.created_at,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Inbox GET error:", error);
    return NextResponse.json({ items: [] });
  }
}
