import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const LISTENING_AGENT_PATH =
  process.env.LISTENING_AGENT_PATH || "/Users/abertoia/AI Brain Dump/listening-agent";
const STATUS_FILE = path.join(LISTENING_AGENT_PATH, "data", "recording-prompt.json");
const RESPONSE_FILE = path.join(LISTENING_AGENT_PATH, "data", "recording-response.json");

// GET: Check if there's a pending recording prompt
export async function GET() {
  try {
    const content = await fs.readFile(STATUS_FILE, "utf-8");
    const data = JSON.parse(content);
    // Only show if prompt is recent (within last 60 seconds)
    const age = Date.now() - new Date(data.timestamp).getTime();
    if (age > 60000) {
      return NextResponse.json({ pending: false });
    }
    return NextResponse.json({ pending: true, ...data });
  } catch {
    return NextResponse.json({ pending: false });
  }
}

// POST: User responds to the recording prompt
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json(); // "record" or "skip"
    const responseData = {
      action,
      timestamp: new Date().toISOString(),
    };
    await fs.mkdir(path.dirname(RESPONSE_FILE), { recursive: true });
    await fs.writeFile(RESPONSE_FILE, JSON.stringify(responseData));

    // Clear the prompt file
    try {
      await fs.unlink(STATUS_FILE);
    } catch {}

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("Recording response error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
