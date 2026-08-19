import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMin;

    // Get first incomplete must-do task for today
    const taskRows = await sql`
      SELECT id, text, energy, done, recurring
      FROM tasks
      WHERE date = ${dateStr} AND done = FALSE AND category = 'must'
      ORDER BY position ASC, created_at ASC
      LIMIT 1
    `;

    let currentTask = null;
    if (taskRows.length > 0) {
      const t = taskRows[0];
      currentTask = {
        id: String(t.id),
        text: t.text,
        energy: t.energy,
        done: false,
        recurring: t.recurring,
      };
    }

    // Get next upcoming meeting
    const meetingRows = await sql`
      SELECT time, title
      FROM meetings
      WHERE date = ${dateStr}
      ORDER BY time ASC
    `;

    let nextMeeting = null;
    for (const m of meetingRows) {
      // Parse time string like "10:00 AM - 11:30 AM" or "10:00 AM"
      const timeMatch = m.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const min = parseInt(timeMatch[2]);
        const ampm = timeMatch[3].toUpperCase();
        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;

        const meetingMinutes = hour * 60 + min;
        if (meetingMinutes > currentMinutes) {
          nextMeeting = {
            time: m.time,
            title: m.title,
            in_minutes: meetingMinutes - currentMinutes,
          };
          break;
        }
      }
    }

    return NextResponse.json({ currentTask, nextMeeting });
  } catch (error) {
    console.error("Now API error:", error);
    return NextResponse.json({ currentTask: null, nextMeeting: null });
  }
}
