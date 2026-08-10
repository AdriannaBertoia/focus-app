import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const INBOX_DIR = path.join(process.env.VAULT_PATH || "", "00_Inbox");

export async function POST(request: NextRequest) {
  try {
    const { text, timestamp } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Ensure inbox directory exists
    await fs.mkdir(INBOX_DIR, { recursive: true });

    // Create a new brain dump file
    const date = new Date(timestamp || Date.now());
    const filename = `brain-dump-${date.toISOString().replace(/[:.]/g, "-")}.md`;
    const filepath = path.join(INBOX_DIR, filename);

    const content = `---
type: brain-dump
created: ${date.toISOString()}
processed: false
---

${text}
`;

    await fs.writeFile(filepath, content);

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error("Brain dump save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await fs.mkdir(INBOX_DIR, { recursive: true });
    const files = await fs.readdir(INBOX_DIR);
    const dumps = [];

    for (const file of files.filter((f) => f.startsWith("brain-dump-"))) {
      const content = await fs.readFile(path.join(INBOX_DIR, file), "utf-8");
      const textMatch = content.match(/---\n[\s\S]*?---\n\n([\s\S]*)/);
      const text = textMatch ? textMatch[1].trim() : content;
      const createdMatch = content.match(/created: (.+)/);
      const created = createdMatch ? createdMatch[1] : "";

      dumps.push({ id: file, text, created, filename: file });
    }

    return NextResponse.json({ dumps: dumps.sort((a, b) => b.created.localeCompare(a.created)) });
  } catch (error) {
    console.error("Brain dump read error:", error);
    return NextResponse.json({ dumps: [] });
  }
}
