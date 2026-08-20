import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * GET /api/tasks/recurring
 * Returns all recurring task definitions.
 */
export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, text, category, energy, days, active
      FROM recurring_tasks
      ORDER BY created_at ASC
    `;

    return NextResponse.json({
      recurring: rows.map((r) => ({
        id: String(r.id),
        text: r.text,
        category: r.category,
        energy: r.energy,
        days: r.days,
        active: r.active,
      })),
    });
  } catch (error) {
    console.error("Recurring tasks GET error:", error);
    return NextResponse.json({ recurring: [] });
  }
}

/**
 * POST /api/tasks/recurring
 * Create a new recurring task.
 * Body: { text, category?, energy?, days: string[] }
 * days values: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
 */
export async function POST(request: NextRequest) {
  try {
    const { text, category, energy, days } = await request.json();

    if (!text || !Array.isArray(days) || days.length === 0) {
      return NextResponse.json(
        { error: "text and days[] are required" },
        { status: 400 }
      );
    }

    const sql = getDb();
    const result = await sql`
      INSERT INTO recurring_tasks (text, category, energy, days)
      VALUES (${text}, ${category || "must"}, ${energy || "medium"}, ${days})
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("Recurring tasks POST error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/recurring
 * Delete or deactivate a recurring task.
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const sql = getDb();
    await sql`DELETE FROM recurring_tasks WHERE id = ${Number(id)}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recurring tasks DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
