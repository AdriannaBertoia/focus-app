import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { id, ids } = await request.json();
    const sql = getDb();

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    if (ids && Array.isArray(ids)) {
      // Sweep multiple tasks to tomorrow
      const numericIds = ids.map(Number);
      await sql`
        UPDATE tasks
        SET date = ${tomorrowStr}, position = position + 1000
        WHERE id = ANY(${numericIds})
      `;
      return NextResponse.json({ success: true, swept: ids.length });
    }

    if (id) {
      // Sweep single task to tomorrow
      await sql`
        UPDATE tasks
        SET date = ${tomorrowStr}, position = position + 1000
        WHERE id = ${Number(id)}
      `;
      return NextResponse.json({ success: true, swept: id });
    }

    return NextResponse.json({ error: "id or ids required" }, { status: 400 });
  } catch (error) {
    console.error("Sweep error:", error);
    return NextResponse.json({ error: "Failed to sweep" }, { status: 500 });
  }
}
