import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");

export async function POST(request: NextRequest) {
  try {
    const { oldText, newText, date } = await request.json();
    if (!oldText || !newText) {
      return NextResponse.json({ error: "oldText and newText required" }, { status: 400 });
    }

    // Find the note — use provided date or today
    const targetDate = date || new Date().toISOString().split("T")[0];
    const d = new Date(targetDate + "T12:00:00");
    const monthFolder = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const notePath = path.join(DAILY_NOTES_DIR, monthFolder, `${targetDate}.md`);

    let content: string;
    try {
      content = await fs.readFile(notePath, "utf-8");
    } catch {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Find and replace the task text (preserve checkbox state)
    const escapedOld = oldText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(- \\[[ x]\\] )${escapedOld}`);
    const match = content.match(regex);

    if (match) {
      content = content.replace(regex, `$1${newText}`);
      await fs.writeFile(notePath, content);
      return NextResponse.json({ success: true });
    }

    // Also try matching without checkbox (for priorities)
    if (content.includes(oldText)) {
      content = content.replace(oldText, newText);
      await fs.writeFile(notePath, content);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Text not found in note" }, { status: 404 });
  } catch (error) {
    console.error("Task edit error:", error);
    return NextResponse.json({ error: "Failed to edit" }, { status: 500 });
  }
}
