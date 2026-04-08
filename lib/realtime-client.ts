import { toolHandlers } from "./tool-handlers";

export type ConnectionState = "idle" | "connecting" | "connected" | "error";

export interface RealtimeEvent {
  type: string;
  transcript?: string;
  delta?: string;
  text?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type EventCallback = (event: RealtimeEvent) => void;

export class RealtimeClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private localStream: MediaStream | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private _connectionState: ConnectionState = "idle";
  private pendingFunctionCall: {
    callId: string;
    name: string;
    args: string;
  } | null = null;

  get connectionState() {
    return this._connectionState;
  }

  on(event: string, cb: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  private emit(event: string, data: RealtimeEvent) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
    this.listeners.get("*")?.forEach((cb) => cb({ ...data, _event: event }));
  }

  private setConnectionState(state: ConnectionState) {
    this._connectionState = state;
    this.emit("connection_state", { type: "connection_state", state } as RealtimeEvent);
  }

  async connect() {
    try {
      this.setConnectionState("connecting");

      // 1. Get ephemeral token from our API
      const tokenRes = await fetch("/api/realtime-session", { method: "POST" });
      if (!tokenRes.ok) {
        throw new Error(`Failed to get session token: ${tokenRes.status}`);
      }
      const { client_secret, model } = await tokenRes.json();

      // 2. Set up peer connection
      this.pc = new RTCPeerConnection();

      // 3. Set up audio playback for agent responses
      this.audioEl = document.createElement("audio");
      this.audioEl.autoplay = true;
      this.pc.ontrack = (e) => {
        this.audioEl!.srcObject = e.streams[0];
      };

      // 4. Get microphone and add track
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });

      // 5. Create data channel for events
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.onopen = () => {
        this.setConnectionState("connected");
      };
      this.dc.onmessage = (e) => this.handleDataChannelMessage(e);

      // 6. Create and set local SDP offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 7. Send offer to OpenAI Realtime API
      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime?model=${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${client_secret}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpRes.ok) {
        throw new Error(`SDP exchange failed: ${sdpRes.status}`);
      }

      const answerSdp = await sdpRes.text();
      await this.pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
    } catch (err) {
      console.error("Connection failed:", err);
      this.setConnectionState("error");
      this.cleanup();
      throw err;
    }
  }

  disconnect() {
    this.cleanup();
    this.setConnectionState("idle");
  }

  private cleanup() {
    this.dc?.close();
    this.dc = null;
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.pc?.close();
    this.pc = null;
    if (this.audioEl) {
      this.audioEl.srcObject = null;
      this.audioEl = null;
    }
  }

  sendEvent(event: Record<string, unknown>) {
    if (this.dc?.readyState === "open") {
      this.dc.send(JSON.stringify(event));
    }
  }

  sendTextMessage(text: string) {
    this.sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
    this.sendEvent({ type: "response.create" });
  }

  toggleMute(muted: boolean) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  private handleDataChannelMessage(e: MessageEvent) {
    try {
      const event: RealtimeEvent = JSON.parse(e.data);
      this.emit(event.type, event);

      switch (event.type) {
        case "session.created":
        case "session.updated":
          break;

        // User audio committed — add placeholder immediately so ordering is correct
        // Only for audio items; text items sent via keyboard are already added by sendTextMessage()
        case "conversation.item.created": {
          const isAudioInput =
            event.item?.role === "user" &&
            event.item?.type === "message" &&
            Array.isArray(event.item?.content) &&
            event.item.content.some(
              (c: { type: string }) => c.type === "input_audio"
            );
          if (isAudioInput) {
            this.emit("user_message_placeholder", {
              type: "user_message_placeholder",
              item_id: event.item.id,
            });
          }
          break;
        }

        // User input transcription — fill in the placeholder
        case "conversation.item.input_audio_transcription.completed":
          this.emit("user_transcript", {
            type: "user_transcript",
            transcript: event.transcript,
            item_id: event.item_id,
          });
          break;

        // Assistant audio transcript (streaming)
        case "response.audio_transcript.delta":
          this.emit("assistant_transcript_delta", {
            type: "assistant_transcript_delta",
            delta: event.delta,
            response_id: event.response_id,
            item_id: event.item_id,
          });
          break;

        case "response.audio_transcript.done":
          this.emit("assistant_transcript_done", {
            type: "assistant_transcript_done",
            transcript: event.transcript,
            response_id: event.response_id,
            item_id: event.item_id,
          });
          break;

        // Text response (for text-mode replies)
        case "response.text.delta":
          this.emit("assistant_transcript_delta", {
            type: "assistant_transcript_delta",
            delta: event.delta,
            response_id: event.response_id,
            item_id: event.item_id,
          });
          break;

        case "response.text.done":
          this.emit("assistant_transcript_done", {
            type: "assistant_transcript_done",
            transcript: event.text,
            response_id: event.response_id,
            item_id: event.item_id,
          });
          break;

        // Function calls
        case "response.function_call_arguments.delta":
          if (!this.pendingFunctionCall) {
            this.pendingFunctionCall = {
              callId: event.call_id,
              name: event.name,
              args: "",
            };
          }
          this.pendingFunctionCall.args += event.delta || "";
          break;

        case "response.function_call_arguments.done":
          this.handleFunctionCall(
            event.call_id,
            event.name,
            event.arguments
          );
          this.pendingFunctionCall = null;
          break;

        case "response.done":
          this.emit("response_done", event);
          break;

        case "error":
          console.error("Realtime API error:", event);
          this.emit("error", event);
          break;
      }
    } catch (err) {
      console.error("Failed to parse data channel message:", err);
    }
  }

  private async handleFunctionCall(
    callId: string,
    name: string,
    argsString: string
  ) {
    const args = JSON.parse(argsString);

    // Emit that a tool call has started
    this.emit("tool_call_start", {
      type: "tool_call_start",
      call_id: callId,
      name,
      args,
    } as RealtimeEvent);

    try {
      const handler = toolHandlers[name];
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }
      const result = await handler(args);

      // Emit tool call completion
      this.emit("tool_call_complete", {
        type: "tool_call_complete",
        call_id: callId,
        name,
        args,
        result: JSON.parse(result),
      } as RealtimeEvent);

      // Send result back to the model
      this.sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: result,
        },
      });

      // Prompt the model to continue
      this.sendEvent({ type: "response.create" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Tool execution failed";

      this.emit("tool_call_error", {
        type: "tool_call_error",
        call_id: callId,
        name,
        error: errorMsg,
      } as RealtimeEvent);

      this.sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify({ error: errorMsg }),
        },
      });
      this.sendEvent({ type: "response.create" });
    }
  }
}
