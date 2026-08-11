import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");

export async function POST(request: NextRequest) {
  try {
    const { text, date } = await request.json();
    if (!text || !date) {
      return NextResponse.json({ error: "text and date required" }, { status: 400 });
    }

    const targetDate = new Date(date + "T12:00:00");
    const monthFolder = targetDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const notePath = path.join(DAILY_NOTES_DIR, monthFolder, `${date}.md`);

    let content: string;
    try {
      content = await fs.readFile(notePath, "utf-8");
    } catch {
      // Note doesn't exist — create a minimal one
      await fs.mkdir(path.join(DAILY_NOTES_DIR, monthFolder), { recursive: true });
      content = `---
tags: daily-note
date: ${date}
---

# Daily Note — ${date}

---

## Top 3 Priorities

1.
2.
3.

---

## To-Dos

**Must-do:**
- [ ] ${text}

**Should-do:**

`;
      await fs.writeFile(notePath, content);
      return NextResponse.json({ success: true, created: true });
    }

    // Add to Must-do section
    const mustDoMarker = "**Must-do:**";
    if (content.includes(mustDoMarker)) {
      content = content.replace(
        mustDoMarker,
        `${mustDoMarker}\n- [ ] ${text}`
      );
    } else {
      // Append to end
      content += `\n- [ ] ${text}\n`;
    }

    await fs.writeFile(notePath, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add task error:", error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}
