import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");

type Energy = "low" | "medium" | "high";

interface Task {
  id: string;
  text: string;
  energy: Energy;
  done: boolean;
  category: "must" | "should" | "carry";
}

function inferEnergy(text: string): Energy {
  const lower = text.toLowerCase();
  // High focus: writing, deep work, strategy, review docs
  if (lower.includes("deep focus") || lower.includes("write") || lower.includes("draft") ||
      lower.includes("review") || lower.includes("strategy") || lower.includes("plan")) {
    return "high";
  }
  // Low energy: recurring, send, forward, schedule, input
  if (lower.includes("[recurring]") || lower.includes("send") || lower.includes("forward") ||
      lower.includes("schedule") || lower.includes("input") || lower.includes("update")) {
    return "low";
  }
  return "medium";
}

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
      return NextResponse.json({ tasks: [] });
    }

    const tasks: Task[] = [];
    let idCounter = 0;

    const parseSection = (section: string, category: "must" | "should" | "carry") => {
      for (const line of section.split("\n")) {
        const doneMatch = line.match(/^- \[x\] (.+?)(?:\s*✅.*)?$/);
        const todoMatch = line.match(/^- \[ \] (.+)$/);
        if (doneMatch) {
          const text = doneMatch[1].trim();
          tasks.push({ id: `task-${idCounter++}`, text, energy: inferEnergy(text), done: true, category });
        } else if (todoMatch && todoMatch[1].trim() !== "-") {
          const text = todoMatch[1].trim();
          tasks.push({ id: `task-${idCounter++}`, text, energy: inferEnergy(text), done: false, category });
        }
      }
    };

    const mustMatch = content.match(/\*\*Must-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
    if (mustMatch) parseSection(mustMatch[1], "must");

    const shouldMatch = content.match(/\*\*Should-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
    if (shouldMatch) parseSection(shouldMatch[1], "should");

    const carryMatch = content.match(/\*\*Carry-forward.*?\*\*\n([\s\S]*?)(?=\n---|\n##)/);
    if (carryMatch) parseSection(carryMatch[1], "carry");

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json({ tasks: [] });
  }
}
