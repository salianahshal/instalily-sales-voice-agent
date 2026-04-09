# Sales Voice Agent

A voice-first chat experience that helps sales reps quickly ask questions during/after calls, capture structured post-call notes, and create follow-up tasks using OpenAI's Realtime API.

## Quick Start

```bash
cd sales-voice-agent
npm install
cp .env.example .env.local
# Add your OpenAI API key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and tap the microphone button to start.

## Architecture

### High-Level Flow

```
Browser (WebRTC)  <──────>  OpenAI Realtime API
       │                           │
       │ (ephemeral token)         │ (voice + tool calls)
       v                           v
  Next.js API Route          Data Channel (JSON events)
  /api/realtime-session            │
                                   v
                            Client-side tool handlers
                                   │
                            /api/tools/*  (mock backends)
```

### Transport Choice: WebRTC

**Why WebRTC over WebSocket?**

- **Lower latency**: WebRTC uses UDP-based media transport, achieving sub-100ms audio latency vs 200-500ms with WebSocket-based approaches. For a voice assistant used during live sales calls, this latency difference is the difference between a natural conversation and an awkward one.
- **Built-in echo cancellation**: WebRTC's `getUserMedia` includes AEC (Acoustic Echo Cancellation) by default, critical when the agent's audio response is playing while the rep continues speaking.
- **Native browser support**: No additional libraries needed for audio capture, encoding, or playback. The browser handles opus codec negotiation automatically.
- **Separate data channel**: Events (transcripts, tool calls) flow through a reliable ordered data channel while audio streams independently, preventing audio dropouts during JSON event bursts.

**Trade-off**: WebRTC requires the SDP offer/answer exchange, adding ~200ms to initial connection time. This is acceptable since sessions are long-lived (minutes, not seconds).

### Route Structure

```
app/
  page.tsx                         # Main voice chat page (single-page app)
  layout.tsx                       # Root layout with fonts and metadata
  api/
    realtime-session/route.ts      # POST: mints ephemeral OpenAI token
    tools/
      create-task/route.ts         # POST: creates follow-up task
      save-note/route.ts           # POST: saves structured call note
      search-customer/route.ts     # POST: searches mock customer DB
```

**Why a single page?** The voice chat is an immersive, full-screen experience. There's no navigation during a session. The API routes exist as a thin server layer to:
1. Keep the OpenAI API key server-side (security boundary)
2. Provide a clean interface that could be swapped for real CRM backends

### How Tool Calls Are Surfaced in the UI

1. OpenAI's model decides to call a tool based on conversation context
2. The `response.function_call_arguments.done` event arrives via the WebRTC data channel
3. The client emits a `tool_call_start` event, which the React reducer picks up and adds a `ToolCallCard` to the feed (with "pending" spinner)
4. The client-side handler calls our API route (e.g., `POST /api/tools/create-task`)
5. On completion, the reducer updates the card to show the result (green checkmark + details)
6. The function output is sent back to OpenAI via the data channel
7. The model generates a verbal confirmation (e.g., "Got it, task created for tomorrow")

This means the user sees the tool action in their feed **before** the model even confirms it verbally, creating a responsive feel.

## Voice Chat UX Flow

### Happy Path

1. Rep opens the app on their phone/desktop after a call
2. Taps the mic button → WebRTC connection established (~1s)
3. Badge changes from "Offline" to "Live"
4. Rep speaks: *"Just got off a great call with Sarah Chen at TechFlow. She's interested in the enterprise plan and needs SSO integration. Budget is approved for Q2."*
5. User's speech appears as a transcribed bubble in the feed
6. **Save Note** tool card appears (pending → complete) — customer_name: "Sarah Chen", summary, sentiment: positive
7. Agent says: *"Got it, note saved. Anything you'd like me to follow up on?"*
8. Rep: *"Remind me to send the SSO integration docs to Sarah."*
9. **Create Task** tool card appears — title: "Send SSO integration docs to Sarah Chen"
10. Agent confirms: *"Done, task created."*
11. Rep: *"What do we know about TechFlow?"*
12. **Search Customer** card appears → shows TechFlow at proposal stage, $45k, VP of Engineering is decision maker
13. Agent summarizes the context verbally
14. Rep taps the stop button to end session

### Edge Case: Transcription Error

1. Rep says: *"Schedule a follow-up with Marcus at RetailPro Solutions"*
2. Agent creates the task but may truncate the name (e.g., "Follow up with Marcus") dropping the company
3. Rep taps the transcribed message → correction dialog opens with original text pre-filled
4. Rep corrects to: *"Marcus at RetailPro Solutions"*
5. A correction message is sent to the model: *"Correction: I actually said 'Marcus at RetailPro Solutions', not what was transcribed."*
6. Agent acknowledges and creates an updated task with the correct name

## Additional Goals Implemented

### 1. Responsive Layout (Desktop + Mobile)
- Single-column layout with `max-w-2xl mx-auto` centers on desktop
- `h-dvh` uses dynamic viewport height for proper mobile browser handling
- Mic button is large (64px) for easy thumb access on mobile
- Text input is hidden by default on mobile, revealed via keyboard icon

### 2. Real-Time Transcription with Trust/Correction
- User speech is transcribed in real-time via OpenAI's Whisper integration
- Transcripts appear as chat bubbles, clearly attributed to user vs assistant
- Each user message has a "Tap to correct" hint
- Correction dialog allows editing and sends clarification to the model

### 3. Real Tool Integrations (Mock Backend)
Three fully functional tools with structured input/output:
- **create_follow_up_task**: Title, description, due date, priority, customer
- **save_call_note**: Customer, summary, key points, sentiment, deal stage, next steps
- **search_customer_context**: Searches a mock database of 5 customers with realistic data

## Tech Stack

- **Next.js 16** (App Router) with TypeScript
- **shadcn/ui** components (Card, Badge, Button, Input, Dialog, ScrollArea)
- **Tailwind CSS v4** for styling
- **OpenAI Realtime API** (gpt-4o-realtime-preview) via WebRTC
- **lucide-react** for icons

## Deployment

Live at: [https://instalily-sales-voice-agent.vercel.app/](https://instalily-sales-voice-agent.vercel.app/)


## Key Files

| File | Purpose |
|------|---------|
| `lib/realtime-client.ts` | WebRTC connection manager, data channel event handling, tool execution |
| `lib/tools.ts` | Tool definitions (OpenAI function-calling schema) |
| `lib/tool-handlers.ts` | Client-side tool execution handlers |
| `components/voice-chat/use-realtime.ts` | React hook wrapping the realtime client with reducer state |
| `components/voice-chat/transcript-panel.tsx` | Scrollable feed of messages + tool call cards |
| `components/voice-chat/tool-call-card.tsx` | Visual representation of tool actions with status |
| `components/voice-chat/voice-controls.tsx` | Mic button, mute, text input, audio visualizer |
| `app/api/realtime-session/route.ts` | Server-side ephemeral token minting |
