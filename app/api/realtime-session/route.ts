import { NextResponse } from "next/server";
import { toolDefinitions } from "@/lib/tools";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const model = "gpt-4o-realtime-preview";

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          voice: "ash",
          modalities: ["text", "audio"],
          instructions: `You are a fast, action-oriented sales assistant for a sales rep. You help them capture information quickly during and after sales calls.

Your capabilities:
- Answer questions about customers, deals, and sales context
- Capture structured post-call notes when the rep describes what happened
- Create follow-up tasks and reminders immediately
- Search for customer information and history

Behavior guidelines:
- The rep is busy — act immediately, don't ask clarifying questions before using tools
- When the rep says "schedule a follow-up", "remind me", or any task-like phrase: create the task NOW with whatever details are available, then confirm briefly
- When the rep describes a call or mentions saving notes: save the note immediately, don't ask for permission
- If the rep asks about a customer: search first, then answer using the results
- Use partial information — a task with just a title and customer is valid; don't block on missing due dates or priorities
- Confirm actions in one short sentence: "Done, task created." / "Note saved." Then offer one optional follow-up if natural
- Never ask more than one question at a time`,
          tools: toolDefinitions,
          tool_choice: "auto",
          input_audio_transcription: {
            model: "whisper-1",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI session error:", error);
      return NextResponse.json(
        { error: "Failed to create realtime session" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      client_secret: data.client_secret?.value || data.client_secret,
      model,
    });
  } catch (err) {
    console.error("Session creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
