import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");

export async function GET() {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const monthFolder = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const notePath = path.join(DAILY_NOTES_DIR, monthFolder, `${dateStr}.md`);

    let content: string;
    try {
      content = await fs.readFile(notePath, "utf-8");
    } catch {
      return NextResponse.json(null);
    }

    // Parse priorities
    const priorities: string[] = [];
    const prioritiesMatch = content.match(/## Top 3 Priorities\n\n([\s\S]*?)(?=\n---)/);
    if (prioritiesMatch) {
      const lines = prioritiesMatch[1].split("\n");
      for (const line of lines) {
        const m = line.match(/^\d+\.\s+(.+)$/);
        if (m && m[1].trim()) priorities.push(m[1].trim());
      }
    }

    // Parse intention
    let intention = "";
    const intentionMatch = content.match(/## Intention for the Day\n\n>\s*(.+)/);
    if (intentionMatch) intention = intentionMatch[1].trim();

    // Parse meetings table
    const meetings: { time: string; title: string; notes: string }[] = [];
    const meetingsMatch = content.match(/## Today's Meetings\n\n[\s\S]*?\|[\s\S]*?\|\n([\s\S]*?)(?=\n---|\n\*\*Out)/);
    if (meetingsMatch) {
      const rows = meetingsMatch[1].split("\n").filter((r) => r.startsWith("|"));
      for (const row of rows) {
        const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
        if (cols.length >= 2 && !cols[0].startsWith("---") && !cols[0].startsWith("(")) {
          meetings.push({ time: cols[0], title: cols[1], notes: cols[2] || "" });
        }
      }
    }

    // Parse schedule table
    const schedule: { time: string; block: string }[] = [];
    const scheduleMatch = content.match(/## Time-Blocked Schedule\n\n[\s\S]*?\|[\s\S]*?\|\n([\s\S]*?)(?=\n---)/);
    if (scheduleMatch) {
      const rows = scheduleMatch[1].split("\n").filter((r) => r.startsWith("|"));
      for (const row of rows) {
        const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
        if (cols.length >= 2 && !cols[0].startsWith("---")) {
          schedule.push({ time: cols[0], block: cols[1] });
        }
      }
    }

    // Parse tasks
    const parseTasks = (section: string): { text: string; done: boolean }[] => {
      const tasks: { text: string; done: boolean }[] = [];
      const lines = section.split("\n");
      for (const line of lines) {
        const doneMatch = line.match(/^- \[x\] (.+?)(?:\s*✅.*)?$/);
        const todoMatch = line.match(/^- \[ \] (.+)$/);
        if (doneMatch) tasks.push({ text: doneMatch[1].trim(), done: true });
        else if (todoMatch && todoMatch[1].trim() !== "-") tasks.push({ text: todoMatch[1].trim(), done: false });
      }
      return tasks;
    };

    let mustDo: { text: string; done: boolean }[] = [];
    let shouldDo: { text: string; done: boolean }[] = [];
    let carryForward: { text: string; done: boolean }[] = [];

    const mustDoMatch = content.match(/\*\*Must-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
    if (mustDoMatch) mustDo = parseTasks(mustDoMatch[1]);

    const shouldDoMatch = content.match(/\*\*Should-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
    if (shouldDoMatch) shouldDo = parseTasks(shouldDoMatch[1]);

    const carryMatch = content.match(/\*\*Carry-forward.*?\*\*\n([\s\S]*?)(?=\n---|\n##)/);
    if (carryMatch) carryForward = parseTasks(carryMatch[1]);

    // Parse out today
    const outToday: string[] = [];
    const outMatch = content.match(/\*\*Out today:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
    if (outMatch) {
      for (const line of outMatch[1].split("\n")) {
        const m = line.match(/^- (.+)$/);
        if (m && m[1].trim() !== "-" && m[1].trim()) outToday.push(m[1].trim());
      }
    }

    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

    return NextResponse.json({
      date: dateStr,
      dayOfWeek,
      priorities,
      intention,
      meetings,
      schedule,
      mustDo,
      shouldDo,
      carryForward,
      outToday,
    });
  } catch (error) {
    console.error("Today API error:", error);
    return NextResponse.json(null);
  }
}
