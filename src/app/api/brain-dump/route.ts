import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { text, timestamp } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const sql = getDb();
    const created = timestamp ? new Date(timestamp) : new Date();

    const result = await sql`
      INSERT INTO brain_dumps (text, created_at)
      VALUES (${text}, ${created.toISOString()})
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error("Brain dump save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sql = getDb();

    const rows = await sql`
      SELECT id, text, created_at
      FROM brain_dumps
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const dumps = rows.map((r) => ({
      id: String(r.id),
      text: r.text,
      created: r.created_at,
      filename: `brain-dump-${r.id}`,
    }));

    return NextResponse.json({ dumps });
  } catch (error) {
    console.error("Brain dump read error:", error);
    return NextResponse.json({ dumps: [] });
  }
}
