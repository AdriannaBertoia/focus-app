import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // For now, just acknowledge — the task will carry forward naturally
  // via the next-day note generator
  const { id } = await request.json();
  return NextResponse.json({ success: true, swept: id });
}
