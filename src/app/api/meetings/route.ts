import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const MEETINGS_DIR = path.join(VAULT_PATH, "07_Meetings");

export interface MeetingNote {
  id: string;
  filename: string;
  title: string;
  date: string;
  time: string;
  app: string;
  attendees: string;
  retain: boolean;
  sections: {
    myNotes: string;
    keyTopics: string;
    decisions: string;
    actionItems: string;
    questions: string;
    nextSteps: string;
    transcript: string;
  };
}

function parseMeetingNote(content: string, filename: string): MeetingNote {
  // Extract frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = fmMatch ? fmMatch[1] : "";

  const getValue = (key: string) => {
    const match = frontmatter.match(new RegExp(`${key}:\\s*(.+)`));
    return match ? match[1].trim() : "";
  };

  // Extract title from first H1
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : filename.replace(".md", "");

  // Extract attendees line
  const attendeesMatch = content.match(/\*\*Attendees:\*\*\s*(.+)/);
  const attendees = attendeesMatch ? attendeesMatch[1] : "";

  // Extract sections
  const getSection = (header: string, nextHeaders: string[]): string => {
    const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nextPattern = nextHeaders.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const regex = new RegExp(
      `## ${escapedHeader}\\n([\\s\\S]*?)(?=\\n## (?:${nextPattern})|\\n---\\n|<details>|$)`
    );
    const match = content.match(regex);
    return match ? match[1].trim() : "";
  };

  const myNotes = getSection("My Notes", ["Quadrant 1", "Key Topics"]);
  const keyTopics = getSection("Quadrant 1: Key Topics & Discussion", ["Quadrant 2", "Decisions"]);
  const decisions = getSection("Quadrant 2: Decisions Made", ["Quadrant 3", "Action Items"]);
  const actionItems = getSection("Quadrant 3: Action Items & Owners", ["Quadrant 4", "Questions"]);
  const questions = getSection("Quadrant 4: Questions & Follow-ups", ["My Next Steps"]);
  const nextSteps = getSection("My Next Steps", ["Quick Note", "Full Transcript"]);

  // Extract transcript from collapsible
  let transcript = "";
  const transcriptMatch = content.match(/<details>[\s\S]*?<summary>[\s\S]*?<\/summary>\n\n([\s\S]*?)\n\n<\/details>/);
  if (transcriptMatch) {
    transcript = transcriptMatch[1].trim();
  }

  return {
    id: filename.replace(".md", ""),
    filename,
    title,
    date: getValue("date"),
    time: getValue("time"),
    app: getValue("app"),
    attendees,
    retain: frontmatter.includes("retain: true"),
    sections: {
      myNotes,
      keyTopics,
      decisions,
      actionItems,
      questions,
      nextSteps,
      transcript,
    },
  };
}

export async function GET() {
  try {
    await fs.mkdir(MEETINGS_DIR, { recursive: true });
    const files = await fs.readdir(MEETINGS_DIR);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort().reverse();

    const meetings: MeetingNote[] = [];

    for (const file of mdFiles.slice(0, 20)) {
      // Last 20 meetings
      try {
        const content = await fs.readFile(path.join(MEETINGS_DIR, file), "utf-8");
        meetings.push(parseMeetingNote(content, file));
      } catch {
        continue;
      }
    }

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Meetings API error:", error);
    return NextResponse.json({ meetings: [] });
  }
}
