/**
 * Seed script — imports existing Obsidian daily notes into the Neon database.
 *
 * Run with:
 *   DATABASE_URL="your-neon-url" VAULT_PATH="/Users/abertoia/Desktop/Second Brain" npx tsx src/lib/seed.ts
 *
 * Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING where possible.
 */
import { neon } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;
const VAULT_PATH = process.env.VAULT_PATH || "/Users/abertoia/Desktop/Second Brain";
const DAILY_NOTES_DIR = path.join(VAULT_PATH, "06_Daily Notes");
const INBOX_DIR = path.join(VAULT_PATH, "00_Inbox");
const MEETINGS_DIR = path.join(VAULT_PATH, "07_Meetings");

if (!DATABASE_URL) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

function inferEnergy(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("deep focus") || lower.includes("write") || lower.includes("draft") ||
      lower.includes("review") || lower.includes("strategy") || lower.includes("plan")) {
    return "high";
  }
  if (lower.includes("[recurring]") || lower.includes("send") || lower.includes("forward") ||
      lower.includes("schedule") || lower.includes("input") || lower.includes("update")) {
    return "low";
  }
  return "medium";
}

async function seedDailyNotes() {
  console.log("\n📅 Importing daily notes...");
  let count = 0;

  let monthFolders: string[];
  try {
    monthFolders = await fs.readdir(DAILY_NOTES_DIR);
  } catch {
    console.log("  No daily notes directory found, skipping.");
    return;
  }

  for (const monthFolder of monthFolders) {
    const monthPath = path.join(DAILY_NOTES_DIR, monthFolder);
    const stat = await fs.stat(monthPath);
    if (!stat.isDirectory()) continue;

    const files = await fs.readdir(monthPath);
    for (const file of files.filter((f) => f.endsWith(".md"))) {
      const dateStr = file.replace(".md", "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

      const content = await fs.readFile(path.join(monthPath, file), "utf-8");
      const date = new Date(dateStr + "T12:00:00");
      const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });

      // Parse intention
      let intention = "";
      const intentionMatch = content.match(/## Intention for the Day\n\n>\s*(.+)/);
      if (intentionMatch) intention = intentionMatch[1].trim();

      // Parse priorities
      const priorities: string[] = [];
      const prioritiesMatch = content.match(/## Top 3 Priorities\n\n([\s\S]*?)(?=\n---)/);
      if (prioritiesMatch) {
        for (const line of prioritiesMatch[1].split("\n")) {
          const m = line.match(/^\d+\.\s+(.+)$/);
          if (m && m[1].trim()) priorities.push(m[1].trim());
        }
      }

      // Parse out today
      const outToday: string[] = [];
      const outMatch = content.match(/\*\*Out today:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
      if (outMatch) {
        for (const line of outMatch[1].split("\n")) {
          const m = line.match(/^- (.+)$/);
          if (m && m[1].trim() !== "-" && m[1].trim()) outToday.push(m[1].trim());
        }
      }

      // Insert daily note
      await sql`
        INSERT INTO daily_notes (date, day_of_week, intention, priorities, out_today)
        VALUES (${dateStr}, ${dayOfWeek}, ${intention}, ${priorities}, ${outToday})
        ON CONFLICT (date) DO UPDATE SET
          intention = EXCLUDED.intention,
          priorities = EXCLUDED.priorities,
          out_today = EXCLUDED.out_today
      `;

      // Parse and insert tasks
      let position = 0;
      const parseAndInsertTasks = async (section: string, category: string) => {
        for (const line of section.split("\n")) {
          const doneMatch = line.match(/^- \[x\] (.+?)(?:\s*✅.*)?$/);
          const todoMatch = line.match(/^- \[ \] (.+)$/);
          let text = "";
          let done = false;

          if (doneMatch) { text = doneMatch[1].trim(); done = true; }
          else if (todoMatch && todoMatch[1].trim() !== "-") { text = todoMatch[1].trim(); }
          else continue;

          const recurring = text.includes("[RECURRING]");
          const energy = inferEnergy(text);

          await sql`
            INSERT INTO tasks (date, text, category, energy, done, recurring, position)
            VALUES (${dateStr}, ${text}, ${category}, ${energy}, ${done}, ${recurring}, ${position++})
            ON CONFLICT DO NOTHING
          `;
        }
      };

      const mustMatch = content.match(/\*\*Must-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
      if (mustMatch) await parseAndInsertTasks(mustMatch[1], "must");

      const shouldMatch = content.match(/\*\*Should-do:\*\*\n([\s\S]*?)(?=\n\*\*|\n---|\n##)/);
      if (shouldMatch) await parseAndInsertTasks(shouldMatch[1], "should");

      const carryMatch = content.match(/\*\*Carry-forward.*?\*\*\n([\s\S]*?)(?=\n---|\n##)/);
      if (carryMatch) await parseAndInsertTasks(carryMatch[1], "carry");

      // Parse and insert meetings
      const meetingsMatch = content.match(/## Today's Meetings\n\n[\s\S]*?\|[\s\S]*?\|\n([\s\S]*?)(?=\n---|\n\*\*Out)/);
      if (meetingsMatch) {
        for (const row of meetingsMatch[1].split("\n").filter((r) => r.startsWith("|"))) {
          const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
          if (cols.length >= 2 && !cols[0].startsWith("---") && !cols[0].startsWith("(")) {
            const time = cols[0];
            const title = cols[1];
            const notes = cols[2] || "";

            await sql`
              INSERT INTO meetings (date, time, title, notes)
              SELECT ${dateStr}, ${time}, ${title}, ${notes}
              WHERE NOT EXISTS (
                SELECT 1 FROM meetings WHERE date = ${dateStr} AND time = ${time} AND title = ${title}
              )
            `;
          }
        }
      }

      // Parse and insert schedule blocks
      const scheduleMatch = content.match(/## Time-Blocked Schedule\n\n[\s\S]*?\|[\s\S]*?\|\n([\s\S]*?)(?=\n---)/);
      if (scheduleMatch) {
        let schedPos = 0;
        for (const row of scheduleMatch[1].split("\n").filter((r) => r.startsWith("|"))) {
          const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
          if (cols.length >= 2 && !cols[0].startsWith("---")) {
            await sql`
              INSERT INTO schedule_blocks (date, time, block, position)
              SELECT ${dateStr}, ${cols[0]}, ${cols[1]}, ${schedPos++}
              WHERE NOT EXISTS (
                SELECT 1 FROM schedule_blocks WHERE date = ${dateStr} AND time = ${cols[0]}
              )
            `;
          }
        }
      }

      count++;
    }
  }
  console.log(`  ✓ Imported ${count} daily notes (with tasks, meetings, schedule)`);
}

async function seedBrainDumps() {
  console.log("\n🧠 Importing brain dumps...");
  let count = 0;

  let files: string[];
  try {
    files = await fs.readdir(INBOX_DIR);
  } catch {
    console.log("  No inbox directory found, skipping.");
    return;
  }

  for (const file of files.filter((f) => f.startsWith("brain-dump-"))) {
    const content = await fs.readFile(path.join(INBOX_DIR, file), "utf-8");
    const textMatch = content.match(/---\n[\s\S]*?---\n\n([\s\S]*)/);
    const text = textMatch ? textMatch[1].trim() : content;
    const createdMatch = content.match(/created: (.+)/);
    const created = createdMatch ? createdMatch[1].trim() : new Date().toISOString();

    if (text) {
      await sql`
        INSERT INTO brain_dumps (text, created_at)
        VALUES (${text}, ${created})
      `;
      count++;
    }
  }

  // Also import action items from inbox
  for (const file of files.filter((f) => f.startsWith("action-"))) {
    const content = await fs.readFile(path.join(INBOX_DIR, file), "utf-8");
    const textMatch = content.match(/---\n[\s\S]*?---\n\n([\s\S]*)/);
    const text = textMatch ? textMatch[1].trim() : "";
    const sourceMatch = content.match(/source:\s*(.+)/);
    const priorityMatch = content.match(/priority:\s*(.+)/);

    if (text) {
      await sql`
        INSERT INTO inbox_items (text, source, priority)
        VALUES (${text}, ${sourceMatch ? sourceMatch[1].trim() : "unknown"}, ${priorityMatch ? priorityMatch[1].trim() : "should"})
      `;
      count++;
    }
  }

  console.log(`  ✓ Imported ${count} brain dumps and inbox items`);
}

async function seedMeetingNotes() {
  console.log("\n📝 Importing meeting notes...");
  let count = 0;

  let files: string[];
  try {
    files = await fs.readdir(MEETINGS_DIR);
  } catch {
    console.log("  No meetings directory found, skipping.");
    return;
  }

  for (const file of files.filter((f) => f.endsWith(".md"))) {
    const content = await fs.readFile(path.join(MEETINGS_DIR, file), "utf-8");
    const title = file.replace(".md", "");

    // Try to extract date from filename or frontmatter
    const dateMatch = title.match(/(\d{4}-\d{2}-\d{2})/) || content.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
    const meetingDate = dateMatch ? dateMatch[1] : null;

    await sql`
      INSERT INTO meeting_notes (title, content, meeting_date)
      VALUES (${title}, ${content}, ${meetingDate})
    `;
    count++;
  }

  console.log(`  ✓ Imported ${count} meeting notes`);
}

async function main() {
  console.log("🚀 Seeding database from Obsidian vault...");
  console.log(`   Vault: ${VAULT_PATH}`);

  await seedDailyNotes();
  await seedBrainDumps();
  await seedMeetingNotes();

  console.log("\n✅ Seed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
