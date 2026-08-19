import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { id, oldText, newText } = await request.json();
    if (!newText) {
      return NextResponse.json({ error: "newText is required" }, { status: 400 });
    }

    const sql = getDb();

    // Support both id-based and text-based lookups (backward compat)
    let result;
    if (id) {
      result = await sql`
        UPDATE tasks SET text = ${newText} WHERE id = ${Number(id)} RETURNING id
      `;
    } else if (oldText) {
      const date = new Date().toISOString().split("T")[0];
      result = await sql`
        UPDATE tasks SET text = ${newText}
        WHERE text = ${oldText} AND date = ${date}
        RETURNING id
      `;
    } else {
      return NextResponse.json({ error: "id or oldText required" }, { status: 400 });
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task edit error:", error);
    return NextResponse.json({ error: "Failed to edit" }, { status: 500 });
  }
}
