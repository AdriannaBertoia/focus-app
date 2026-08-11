import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");
const ICS_URL = "https://outlook.office365.com/owa/calendar/f827cbccd3f64b52a83ae21f82a12e22@learninga-z.com/ad9590a51ef04ea2b2c074e41630342e8688648332849205356/calendar.ics";

// Simple ICS parser — extract events for a date without heavy dependencies
async function getCalendarEventsForDate(dateStr: string): Promise<{ time: string; title: string }[]> {
  try {
    // Download ICS (cached for 5 min)
    const cacheDir = path.join(process.cwd(), ".next", "cache");
    const cachePath = path.join(cacheDir, "calendar.ics");
    let icsText: string;

    try {
      const stat = await fs.stat(cachePath);
      const age = Date.now() - stat.mtimeMs;
      if (age < 5 * 60 * 1000) {
        icsText = await fs.readFile(cachePath, "utf-8");
      } else {
        throw new Error("stale");
      }
    } catch {
      const res = await fetch(ICS_URL, { signal: AbortSignal.timeout(30000) });
      icsText = await res.text();
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(cachePath, icsText);
    }

    // Parse: extract VEVENT blocks that have DTSTART matching our date
    // Also handle RRULE weekly events
    const targetDate = dateStr.replace(/-/g, ""); // "20260812"
    const targetDay = new Date(dateStr + "T12:00:00").getDay(); // 0=Sun, 1=Mon...
    const dayMap: Record<number, string> = { 0: "SU", 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR", 6: "SA" };
    const targetDayAbbr = dayMap[targetDay];

    const events: { time: string; title: string }[] = [];
    const blocks: string[] = [];
    let current: string[] = [];
    let inEvent = false;

    for (const line of icsText.split("\n")) {
      const stripped = line.trim();
      if (stripped === "BEGIN:VEVENT") { inEvent = true; current = []; }
      else if (stripped === "END:VEVENT") {
        inEvent = false;
        blocks.push(current.join("\n"));
      } else if (inEvent) { current.push(line); }
    }

    for (const block of blocks) {
      const summaryMatch = block.match(/SUMMARY:(.*)/);
      const title = summaryMatch ? summaryMatch[1].trim() : "";
      if (!title) continue;

      // Skip non-meeting items
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("pto") || lowerTitle.includes("ooo") ||
          lowerTitle === "arlo" || lowerTitle.includes("holiday")) continue;

      // Check if this event occurs on our target date
      let matches = false;

      // Direct DTSTART match
      if (block.includes(`DTSTART:${targetDate}`) || block.includes(`DTSTART;VALUE=DATE:${targetDate}`)) {
        matches = true;
      }
      // DTSTART with timezone
      const dtMatch = block.match(/DTSTART[^:]*:(\d{8})T/);
      if (dtMatch && dtMatch[1] === targetDate) {
        matches = true;
      }
      // RRULE weekly on this day
      if (block.includes("FREQ=WEEKLY") && block.includes(`BYDAY=${targetDayAbbr}`)) {
        // Check it's not cancelled for this date (EXDATE)
        if (!block.includes(`EXDATE`) || !block.includes(targetDate)) {
          // Check DTSTART is before our target
          const startMatch = block.match(/DTSTART[^:]*:(\d{8})/);
          if (startMatch && startMatch[1] <= targetDate) {
            // Check UNTIL if present
            const untilMatch = block.match(/UNTIL=(\d{8})/);
            if (!untilMatch || untilMatch[1] >= targetDate) {
              matches = true;
            }
          }
        }
      }
      // RRULE daily
      if (block.includes("FREQ=DAILY") && !block.includes("BYDAY=")) {
        const startMatch = block.match(/DTSTART[^:]*:(\d{8})/);
        if (startMatch && startMatch[1] <= targetDate) {
          const untilMatch = block.match(/UNTIL=(\d{8})/);
          if (!untilMatch || untilMatch[1] >= targetDate) {
            matches = true;
          }
        }
      }

      if (!matches) continue;

      // Extract time
      let time = "All Day";
      const timeMatch = block.match(/DTSTART[^:]*:\d{8}T(\d{2})(\d{2})/);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const min = timeMatch[2];
        // Convert UTC to PST (rough: -7 or -8 hours)
        hour -= 7;
        if (hour < 0) hour += 24;
        const ampm = hour >= 12 ? "PM" : "AM";
        const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        time = `${h12}:${min} ${ampm}`;

        // Get end time
        const endMatch = block.match(/DTEND[^:]*:\d{8}T(\d{2})(\d{2})/);
        if (endMatch) {
          let endHour = parseInt(endMatch[1]) - 7;
          if (endHour < 0) endHour += 24;
          const endAmpm = endHour >= 12 ? "PM" : "AM";
          const endH12 = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
          time += ` - ${endH12}:${endMatch[2]} ${endAmpm}`;
        }
      }

      if (time === "All Day") continue; // Skip all-day events in week view

      events.push({ time, title });
    }

    // Sort by time
    events.sort((a, b) => a.time.localeCompare(b.time));
    return events;
  } catch (e) {
    console.error("Calendar fetch error:", e);
    return [];
  }
}

export async function GET() {
  try {
    const now = new Date();
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

      // Read from daily note if it exists
      try {
        const content = await fs.readFile(notePath, "utf-8");

        const meetingsMatch = content.match(
          /## Today's Meetings\n\n[\s\S]*?\|[\s\S]*?\|\n([\s\S]*?)(?=\n---|\n\*\*Out|\n##)/
        );
        if (meetingsMatch) {
          for (const row of meetingsMatch[1].split("\n").filter((r) => r.startsWith("|"))) {
            const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
            if (cols.length >= 2 && !cols[0].startsWith("---") && !cols[0].startsWith("(")) {
              const title = cols[1];
              if (title.toLowerCase().includes("pto") || title.toLowerCase().includes("ooo") || title.toLowerCase() === "arlo") continue;
              meetings.push({ time: cols[0], title });
            }
          }
        }

        let idCounter = 0;
        const parseLines = (section: string) => {
          for (const line of section.split("\n")) {
            const doneMatch = line.match(/^- \[x\] (.+?)(?:\s*✅.*)?$/);
            const todoMatch = line.match(/^- \[ \] (.+)$/);
            if (doneMatch) tasks.push({ id: `${dateStr}-${idCounter++}`, text: doneMatch[1].trim(), done: true });
            else if (todoMatch && todoMatch[1].trim() !== "-") tasks.push({ id: `${dateStr}-${idCounter++}`, text: todoMatch[1].trim(), done: false });
          }
        };

        const mustMatch = content.match(/\*\*Must-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
        if (mustMatch) parseLines(mustMatch[1]);
        const shouldMatch = content.match(/\*\*Should-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
        if (shouldMatch) parseLines(shouldMatch[1]);
      } catch {
        // Note doesn't exist
      }

      // If no meetings from note, get from calendar
      if (meetings.length === 0) {
        meetings = await getCalendarEventsForDate(dateStr);
      }

      days.push({ date: dateStr, dayName, shortDate, isToday, meetings, tasks });
    }

    return NextResponse.json({ days });
  } catch (error) {
    console.error("Week API error:", error);
    return NextResponse.json({ days: [] });
  }
}
