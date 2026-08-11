import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");
const LISTENING_AGENT_PATH =
  process.env.LISTENING_AGENT_PATH || "/Users/abertoia/AI Brain Dump/listening-agent";

/**
 * Fetch meetings from the listening agent's calendar client for a specific date.
 * Falls back gracefully if the agent or calendar data isn't available.
 */
async function getCalendarMeetings(dateStr: string): Promise<{ time: string; title: string }[]> {
  try {
    // Use the listening agent's Python environment to query the calendar
    const script = `
import sys, json
sys.path.insert(0, '${LISTENING_AGENT_PATH}')
from src.calendar_client import CalendarClient
from datetime import date

cal = CalendarClient(
    ics_url='https://outlook.office365.com/owa/calendar/f827cbccd3f64b52a83ae21f82a12e22@learninga-z.com/ad9590a51ef04ea2b2c074e41630342e8688648332849205356/calendar.ics',
    refresh_interval=300,
    match_tolerance_minutes=45,
    timezone='America/Los_Angeles',
)
cal.refresh()
target = date.fromisoformat('${dateStr}')
events = cal._parse_events_fast(cal._raw_ics, target)
result = []
for e in events:
    if e.start:
        time_str = e.start.strftime('%I:%M %p')
        end_str = e.end.strftime('%I:%M %p') if e.end else ''
        title = e.title
        # Skip non-meeting items
        if any(x in title.lower() for x in ['pto', 'ooo', 'arlo', 'holiday']):
            continue
        result.append({'time': f'{time_str} - {end_str}' if end_str else time_str, 'title': title})
print(json.dumps(result))
`;
    const pythonPath = path.join(LISTENING_AGENT_PATH, "venv", "bin", "python");
    const output = execSync(`${pythonPath} -c "${script.replace(/"/g, '\\"')}"`, {
      timeout: 30000,
      encoding: "utf-8",
      env: { ...process.env, PATH: `/opt/homebrew/bin:${process.env.PATH}` },
    });
    return JSON.parse(output.trim());
  } catch {
    // Calendar fetch failed — return empty
    return [];
  }
}

export async function GET() {
  try {
    const now = new Date();
    // Find Monday of this week
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);

    const days = [];

    for (let i = 0; i < 5; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateStr = day.toISOString().split("T")[0];
      const monthFolder = day.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const notePath = path.join(DAILY_NOTES_DIR, monthFolder, `${dateStr}.md`);

      const dayName = day.toLocaleDateString("en-US", { weekday: "long" });
      const shortDate = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isToday = dateStr === now.toISOString().split("T")[0];

      let meetings: { time: string; title: string }[] = [];
      let tasks: { id: string; text: string; done: boolean }[] = [];
      let hasNote = false;

      // Try reading from the daily note first
      try {
        const content = await fs.readFile(notePath, "utf-8");
        hasNote = true;

        // Parse meetings from note
        const meetingsMatch = content.match(
          /## Today's Meetings\n\n[\s\S]*?\|[\s\S]*?\|\n([\s\S]*?)(?=\n---|\n\*\*Out|\n##)/
        );
        if (meetingsMatch) {
          const rows = meetingsMatch[1].split("\n").filter((r) => r.startsWith("|"));
          for (const row of rows) {
            const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
            if (cols.length >= 2 && !cols[0].startsWith("---") && !cols[0].startsWith("(")) {
              const title = cols[1];
              if (title.toLowerCase().includes("pto") || title.toLowerCase().includes("ooo")) continue;
              if (title.toLowerCase() === "arlo") continue;
              meetings.push({ time: cols[0], title });
            }
          }
        }

        // Parse tasks
        let idCounter = 0;
        const parseTaskLines = (section: string) => {
          for (const line of section.split("\n")) {
            const doneMatch = line.match(/^- \[x\] (.+?)(?:\s*✅.*)?$/);
            const todoMatch = line.match(/^- \[ \] (.+)$/);
            if (doneMatch) {
              tasks.push({ id: `${dateStr}-${idCounter++}`, text: doneMatch[1].trim(), done: true });
            } else if (todoMatch && todoMatch[1].trim() !== "-") {
              tasks.push({ id: `${dateStr}-${idCounter++}`, text: todoMatch[1].trim(), done: false });
            }
          }
        };

        const mustMatch = content.match(/\*\*Must-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
        if (mustMatch) parseTaskLines(mustMatch[1]);

        const shouldMatch = content.match(/\*\*Should-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
        if (shouldMatch) parseTaskLines(shouldMatch[1]);
      } catch {
        // Note doesn't exist
      }

      // If no meetings found from the note, pull from calendar directly
      if (meetings.length === 0) {
        meetings = await getCalendarMeetings(dateStr);
      }

      days.push({ date: dateStr, dayName, shortDate, isToday, meetings, tasks, hasNote });
    }

    return NextResponse.json({ days });
  } catch (error) {
    console.error("Week API error:", error);
    return NextResponse.json({ days: [] });
  }
}
