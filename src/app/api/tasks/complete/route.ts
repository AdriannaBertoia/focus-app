import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "No task id" }, { status: 400 });

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const monthFolder = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const notePath = path.join(DAILY_NOTES_DIR, monthFolder, `${dateStr}.md`);

    let content: string;
    try {
      content = await fs.readFile(notePath, "utf-8");
    } catch {
      return NextResponse.json({ error: "Daily note not found" }, { status: 404 });
    }

    // Find the task text and mark it done
    // The id is the task text (or a prefix of it)
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`- \\[ \\] (${escapedId}[^\n]*)`, "");
    const match = content.match(regex);

    if (match) {
      const doneStamp = now.toISOString().split("T")[0];
      content = content.replace(
        `- [ ] ${match[1]}`,
        `- [x] ${match[1]} ✅ ${doneStamp}`
      );
      await fs.writeFile(notePath, content);
      return NextResponse.json({ success: true, completed: match[1] });
    }

    return NextResponse.json({ error: "Task not found in note" }, { status: 404 });
  } catch (error) {
    console.error("Task complete error:", error);
    return NextResponse.json({ error: "Failed to complete task" }, { status: 500 });
  }
}
