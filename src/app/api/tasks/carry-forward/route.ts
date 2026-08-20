import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * POST /api/tasks/carry-forward
 *
 * Moves all incomplete tasks from yesterday (or a specified date) to today
 * with the "carry" category. Skips tasks that already exist today.
 *
 * Body (optional): { fromDate?: string }
 * If no fromDate provided, uses yesterday.
 *
 * Call this from a morning workflow or the agent's scheduled run.
 */
export async function POST(request: NextRequest) {
  try {
    const sql = getDb();

    let fromDate: string;
    try {
      const body = await request.json();
      fromDate = body.fromDate || getYesterday();
    } catch {
      fromDate = getYesterday();
    }

    const today = new Date().toISOString().split("T")[0];

    // Get incomplete tasks from the source date
    const incompleteTasks = await sql`
      SELECT text, energy, recurring
      FROM tasks
      WHERE date = ${fromDate} AND done = FALSE
    `;

    if (incompleteTasks.length === 0) {
      return NextResponse.json({ success: true, carried: 0, message: "No tasks to carry forward" });
    }

    // Get existing tasks for today to avoid duplicates
    const todayTasks = await sql`
      SELECT text FROM tasks WHERE date = ${today}
    `;
    const existingTexts = new Set(todayTasks.map((t) => t.text));

    let carried = 0;
    for (const task of incompleteTasks) {
      if (existingTexts.has(task.text)) continue;

      await sql`
        INSERT INTO tasks (date, text, category, energy, recurring, position)
        VALUES (
          ${today},
          ${task.text},
          'carry',
          ${task.energy},
          ${task.recurring},
          (SELECT COALESCE(MAX(position), 0) + 1 FROM tasks WHERE date = ${today})
        )
      `;
      carried++;
    }

    return NextResponse.json({ success: true, carried, from: fromDate });
  } catch (error) {
    console.error("Carry-forward error:", error);
    return NextResponse.json({ error: "Failed to carry forward" }, { status: 500 });
  }
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}
