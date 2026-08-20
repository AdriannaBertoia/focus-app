import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function parseTimeToMinutes(time: string): number {
  if (time.toLowerCase().includes("all day")) return -1;
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 9999;
  let hour = parseInt(match[1]);
  const min = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return hour * 60 + min;
}

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

    // Fetch all meetings and tasks for the week, casting date to text for reliable comparison
    const meetingRows = await sql`
      SELECT date::text as date, time, title
      FROM meetings
      WHERE date >= ${fromStr}::date AND date <= ${toStr}::date
      ORDER BY date ASC, time ASC
    `;

    const taskRows = await sql`
      SELECT id, date::text as date, text, done
      FROM tasks
      WHERE date >= ${fromStr}::date AND date <= ${toStr}::date
      ORDER BY date ASC, position ASC, created_at ASC
    `;

    // Fetch recurring tasks
    const recurringRows = await sql`
      SELECT id, text, category, energy, days
      FROM recurring_tasks
      WHERE active = TRUE
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
      const dayLower = dayName.toLowerCase();

      const meetings = meetingRows
        .filter((m) => m.date === dateStr)
        .map((m) => ({ time: m.time, title: m.title }))
        .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

      const tasks = taskRows
        .filter((t) => t.date === dateStr)
        .map((t) => ({ id: String(t.id), text: t.text, done: t.done, recurring: false }));

      // Inject recurring tasks for this day of week (if not already in tasks)
      for (const rt of recurringRows) {
        if (rt.days.includes(dayLower)) {
          const alreadyExists = tasks.some((t) => t.text === rt.text || t.text === `[RECURRING] ${rt.text}`);
          if (!alreadyExists) {
            tasks.push({ id: `recurring-${rt.id}`, text: rt.text, done: false, recurring: true });
          }
        }
      }

      days.push({ date: dateStr, dayName, shortDate, isToday, meetings, tasks });
    }

    return NextResponse.json({ days });
  } catch (error) {
    console.error("Week API error:", error);
    return NextResponse.json({ days: [] });
  }
}
