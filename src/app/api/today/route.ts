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
    const dateStr = now.toISOString().split("T")[0];
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

    // Fetch daily note metadata
    const noteRows = await sql`
      SELECT intention, priorities, out_today
      FROM daily_notes
      WHERE date = ${dateStr}
      LIMIT 1
    `;

    const note = noteRows[0] || { intention: "", priorities: [], out_today: [] };

    // Fetch tasks for today
    const taskRows = await sql`
      SELECT id, text, category, energy, done, recurring
      FROM tasks
      WHERE date = ${dateStr}
      ORDER BY position ASC, created_at ASC
    `;

    const mustDo = taskRows
      .filter((t) => t.category === "must")
      .map((t) => ({ text: t.text, done: t.done }));
    const shouldDo = taskRows
      .filter((t) => t.category === "should")
      .map((t) => ({ text: t.text, done: t.done }));
    const carryForward = taskRows
      .filter((t) => t.category === "carry")
      .map((t) => ({ text: t.text, done: t.done }));

    // Fetch meetings for today
    const meetingRows = await sql`
      SELECT time, title, notes
      FROM meetings
      WHERE date = ${dateStr}
      ORDER BY time ASC
    `;
    const meetings = meetingRows
      .map((m) => ({
        time: m.time,
        title: m.title,
        notes: m.notes || "",
      }))
      .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

    // Fetch schedule blocks for today
    const scheduleRows = await sql`
      SELECT time, block
      FROM schedule_blocks
      WHERE date = ${dateStr}
      ORDER BY position ASC
    `;
    const schedule = scheduleRows.map((s) => ({
      time: s.time,
      block: s.block,
    }));

    return NextResponse.json({
      date: dateStr,
      dayOfWeek,
      priorities: note.priorities || [],
      intention: note.intention || "",
      meetings,
      schedule,
      mustDo,
      shouldDo,
      carryForward,
      outToday: note.out_today || [],
    });
  } catch (error) {
    console.error("Today API error:", error);
    return NextResponse.json(null);
  }
}
