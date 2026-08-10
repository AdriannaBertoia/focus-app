import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");

export async function GET() {
  try {
    // Get today's date and find the daily note
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const monthFolder = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const notePath = path.join(DAILY_NOTES_DIR, monthFolder, `${dateStr}.md`);

    let currentTask = null;
    let nextMeeting = null;

    // Read today's daily note for tasks
    try {
      const content = await fs.readFile(notePath, "utf-8");

      // Find the first unchecked Must-do item
      const mustDoMatch = content.match(/\*\*Must-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
      if (mustDoMatch) {
        const lines = mustDoMatch[1].split("\n");
        for (const line of lines) {
          const taskMatch = line.match(/^- \[ \] (.+)$/);
          if (taskMatch) {
            const text = taskMatch[1].trim();
            // Determine energy level from context
            let energy: "low" | "medium" | "high" = "medium";
            if (text.includes("[RECURRING]") || text.toLowerCase().includes("send")) energy = "low";
            if (text.toLowerCase().includes("deep focus") || text.toLowerCase().includes("write")) energy = "high";

            currentTask = { id: text.slice(0, 20), text, energy, done: false };
            break;
          }
        }
      }

      // Find next meeting from Today's Meetings table
      const meetingsMatch = content.match(/## Today's Meetings\n\n[\s\S]*?\|[\s\S]*?\|[\s\S]*?\|\n([\s\S]*?)(?=\n---|\n##)/);
      if (meetingsMatch) {
        const rows = meetingsMatch[1].split("\n").filter((r) => r.startsWith("|"));
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        for (const row of rows) {
          const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
          if (cols.length >= 2) {
            const timeStr = cols[0];
            const title = cols[1];

            // Parse time (e.g. "10:00 AM - 11:30 AM")
            const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (timeMatch) {
              let hour = parseInt(timeMatch[1]);
              const min = parseInt(timeMatch[2]);
              const ampm = timeMatch[3].toUpperCase();
              if (ampm === "PM" && hour !== 12) hour += 12;
              if (ampm === "AM" && hour === 12) hour = 0;

              // Is this meeting in the future?
              const meetingMinutes = hour * 60 + min;
              const currentMinutes = currentHour * 60 + currentMin;

              if (meetingMinutes > currentMinutes) {
                const inMinutes = meetingMinutes - currentMinutes;
                nextMeeting = {
                  time: timeStr,
                  title: title.replace(/\[\[.*?\|(.*?)\]\]/g, "$1"), // Strip Obsidian links
                  in_minutes: inMinutes,
                };
                break;
              }
            }
          }
        }
      }
    } catch {
      // Daily note doesn't exist yet
    }

    return NextResponse.json({ currentTask, nextMeeting });
  } catch (error) {
    console.error("Now API error:", error);
    return NextResponse.json({ currentTask: null, nextMeeting: null });
  }
}
