import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const rows = await sql`
      SELECT id, text, category, energy, done, recurring, position, completed_at, created_at
      FROM tasks
      WHERE date = ${date}
      ORDER BY position ASC, created_at ASC
    `;

    const tasks = rows.map((r) => ({
      id: String(r.id),
      text: r.text,
      category: r.category,
      energy: r.energy,
      done: r.done,
      recurring: r.recurring,
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json({ tasks: [] });
  }
}
