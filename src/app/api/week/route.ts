import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");

export async function GET() {
  try {
    const now = new Date();
    // Find Monday of this week
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1); // Monday

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

      try {
        const content = await fs.readFile(notePath, "utf-8");

        // Parse meetings
        const meetingsMatch = content.match(
          /## Today's Meetings\n\n[\s\S]*?\|[\s\S]*?\|\n([\s\S]*?)(?=\n---|\n\*\*Out|\n##)/
        );
        if (meetingsMatch) {
          const rows = meetingsMatch[1].split("\n").filter((r) => r.startsWith("|"));
          for (const row of rows) {
            const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
            if (cols.length >= 2 && !cols[0].startsWith("---") && !cols[0].startsWith("(")) {
              const title = cols[1];
              // Skip all-day/non-meeting items
              if (title.toLowerCase().includes("pto") || title.toLowerCase().includes("ooo")) continue;
              meetings.push({ time: cols[0], title });
            }
          }
        }

        // Parse tasks (all sections)
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
        // Note doesn't exist for this day
      }

      days.push({ date: dateStr, dayName, shortDate, isToday, meetings, tasks });
    }

    return NextResponse.json({ days });
  } catch (error) {
    console.error("Week API error:", error);
    return NextResponse.json({ days: [] });
  }
}
