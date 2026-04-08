import { NextRequest, NextResponse } from "next/server";

const notes: Array<Record<string, unknown>> = [];

export async function POST(request: NextRequest) {
  const body = await request.json();

  const note = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    customer_name: body.customer_name,
    summary: body.summary,
    key_points: body.key_points || [],
    sentiment: body.sentiment || "neutral",
    next_steps: body.next_steps || [],
    deal_stage: body.deal_stage || null,
    created_at: new Date().toISOString(),
  };

  notes.push(note);

  return NextResponse.json({
    success: true,
    note,
    message: `Call note for "${note.customer_name}" saved successfully.`,
  });
}

export async function GET() {
  return NextResponse.json({ notes });
}
