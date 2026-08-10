import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");
const LISTENING_AGENT_PATH = process.env.LISTENING_AGENT_PATH || "/Users/abertoia/AI Brain Dump/listening-agent";

interface MeetingPrep {
  title: string;
  time: string;
  description: string;
  links: string[];
  prework: string[];
  location: string;
}

function extractLinks(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const matches = text.match(urlRegex) || [];
  // Filter out common tracking/noise URLs
  return matches.filter(
    (url) =>
      !url.includes("aka.ms/JoinTeamsMeeting") &&
      !url.includes("teams.microsoft.com/meetingOptions") &&
      !url.includes("aka.ms/")
  );
}

function extractPrework(description: string): string[] {
  const prework: string[] = [];
  const lines = description.split(/\n|\r\n?/);

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    // Look for pre-work indicators
    if (
      lower.includes("pre-read") ||
      lower.includes("pre-work") ||
      lower.includes("please review") ||
      lower.includes("please read") ||
      lower.includes("before the meeting") ||
      lower.includes("prepare") ||
      lower.includes("bring") ||
      lower.includes("draft") ||
      lower.includes("agenda:")
    ) {
      if (line.trim()) prework.push(line.trim());
    }
  }

  // If description mentions deadlines
  const deadlineMatch = description.match(
    /(?:by|before|due|deadline)[:\s]+([^.\n]+)/i
  );
  if (deadlineMatch) {
    prework.push(`Deadline: ${deadlineMatch[1].trim()}`);
  }

  return prework;
}

export async function GET() {
  try {
    // Read from the Power Automate calendar JSON if available
    // This has richer data than the daily note table
    const calendarJsonPath = path.join(
      LISTENING_AGENT_PATH,
      "data",
      "calendar-today.json"
    );

    let meetings: MeetingPrep[] = [];

    // Try Power Automate calendar data first
    try {
      const calData = await fs.readFile(calendarJsonPath, "utf-8");
      const events = JSON.parse(calData);
      const eventList = events.value || events;

      for (const event of eventList) {
        if (!event.subject) continue;

        const description = event.bodyPreview || event.body?.content || "";
        const location = event.location?.displayName || "";
        const links = extractLinks(description + " " + location);
        const prework = extractPrework(description);

        // Parse time
        let time = "";
        if (event.start?.dateTime) {
          const start = new Date(event.start.dateTime + "Z");
          time = start.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: "America/Los_Angeles",
          });
        }

        meetings.push({
          title: event.subject,
          time,
          description: description.slice(0, 300),
          links,
          prework,
          location,
        });
      }
    } catch {
      // Fall back to parsing from daily note
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const monthFolder = now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const notePath = path.join(DAILY_NOTES_DIR, monthFolder, `${dateStr}.md`);

      try {
        const content = await fs.readFile(notePath, "utf-8");
        const meetingsMatch = content.match(
          /## Today's Meetings\n\n[\s\S]*?\|[\s\S]*?\|\n([\s\S]*?)(?=\n---|\n##)/
        );
        if (meetingsMatch) {
          const rows = meetingsMatch[1]
            .split("\n")
            .filter((r) => r.startsWith("|"));
          for (const row of rows) {
            const cols = row
              .split("|")
              .map((c) => c.trim())
              .filter(Boolean);
            if (cols.length >= 2 && !cols[0].startsWith("(")) {
              meetings.push({
                title: cols[1],
                time: cols[0],
                description: "",
                links: [],
                prework: [],
                location: "",
              });
            }
          }
        }
      } catch {
        // No daily note
      }
    }

    // Filter out non-meeting items
    meetings = meetings.filter(
      (m) =>
        !m.title.toLowerCase().includes("pto") &&
        !m.title.toLowerCase().includes("ooo") &&
        m.title.toLowerCase() !== "arlo"
    );

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Calendar prep API error:", error);
    return NextResponse.json({ meetings: [] });
  }
}
