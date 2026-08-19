import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "No task id" }, { status: 400 });
    }

    const sql = getDb();

    const result = await sql`
      UPDATE tasks
      SET done = TRUE, completed_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING id, text
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, completed: result[0].text });
  } catch (error) {
    console.error("Task complete error:", error);
    return NextResponse.json({ error: "Failed to complete task" }, { status: 500 });
  }
}
