import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function inferEnergy(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("deep focus") || lower.includes("write") || lower.includes("draft") ||
      lower.includes("review") || lower.includes("strategy") || lower.includes("plan")) {
    return "high";
  }
  if (lower.includes("[recurring]") || lower.includes("send") || lower.includes("forward") ||
      lower.includes("schedule") || lower.includes("input") || lower.includes("update")) {
    return "low";
  }
  return "medium";
}

export async function POST(request: NextRequest) {
  try {
    const { text, date, category, energy } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const sql = getDb();
    const taskDate = date || new Date().toISOString().split("T")[0];
    const taskCategory = category || "must";
    const taskEnergy = energy || inferEnergy(text);
    const recurring = text.includes("[RECURRING]");

    const result = await sql`
      INSERT INTO tasks (date, text, category, energy, recurring, position)
      VALUES (
        ${taskDate},
        ${text},
        ${taskCategory},
        ${taskEnergy},
        ${recurring},
        (SELECT COALESCE(MAX(position), 0) + 1 FROM tasks WHERE date = ${taskDate})
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("Add task error:", error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}
