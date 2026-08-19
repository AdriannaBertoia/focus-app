import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const now = new Date();

    // Calculate Monday of current week
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const fromStr = monday.toISOString().split("T")[0];
    const toStr = friday.toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    // Fetch all meetings and tasks for the week in two queries
    const meetingRows = await sql`
      SELECT date, time, title
      FROM meetings
      WHERE date >= ${fromStr} AND date <= ${toStr}
      ORDER BY date ASC, time ASC
    `;

    const taskRows = await sql`
      SELECT id, date, text, done
      FROM tasks
      WHERE date >= ${fromStr} AND date <= ${toStr}
      ORDER BY date ASC, position ASC, created_at ASC
    `;

    // Group by date
    const days = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateStr = day.toISOString().split("T")[0];
      const dayName = day.toLocaleDateString("en-US", { weekday: "long" });
      const shortDate = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isToday = dateStr === todayStr;

      const meetings = meetingRows
        .filter((m) => m.date === dateStr)
        .map((m) => ({ time: m.time, title: m.title }));

      const tasks = taskRows
        .filter((t) => t.date === dateStr)
        .map((t) => ({ id: String(t.id), text: t.text, done: t.done }));

      days.push({ date: dateStr, dayName, shortDate, isToday, meetings, tasks });
    }

    return NextResponse.json({ days });
  } catch (error) {
    console.error("Week API error:", error);
    return NextResponse.json({ days: [] });
  }
}
