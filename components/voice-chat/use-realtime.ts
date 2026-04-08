"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { RealtimeClient } from "@/lib/realtime-client";
import type {
  TranscriptEntry,
  ToolCallEntry,
  ConnectionState,
  FeedItem,
} from "@/lib/types";

interface State {
  connectionState: ConnectionState;
  messages: TranscriptEntry[];
  toolCalls: ToolCallEntry[];
  feed: FeedItem[];
  isMuted: boolean;
}

type Action =
  | { type: "SET_CONNECTION"; state: ConnectionState }
  | { type: "ADD_USER_PLACEHOLDER"; id: string }
  | { type: "FILL_USER_TRANSCRIPT"; id: string; text: string }
  | { type: "ADD_USER_MESSAGE"; id: string; text: string }
  | { type: "ADD_ASSISTANT_MESSAGE"; id: string }
  | { type: "UPDATE_ASSISTANT_DELTA"; id: string; delta: string }
  | { type: "FINISH_ASSISTANT_MESSAGE"; id: string; text: string }
  | { type: "ADD_TOOL_CALL"; entry: ToolCallEntry }
  | {
      type: "UPDATE_TOOL_CALL";
      callId: string;
      result: unknown;
      status: "complete" | "error";
    }
  | { type: "TOGGLE_MUTE" }
  | { type: "CLEAR" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CONNECTION":
      return { ...state, connectionState: action.state };

    case "ADD_USER_PLACEHOLDER": {
      const msg: TranscriptEntry = {
        id: action.id,
        role: "user",
        text: "",
        timestamp: Date.now(),
        isStreaming: true,
      };
      return {
        ...state,
        messages: [...state.messages, msg],
        feed: [...state.feed, { type: "message", data: msg }],
      };
    }

    case "FILL_USER_TRANSCRIPT": {
      const messages = state.messages.map((m) =>
        m.id === action.id ? { ...m, text: action.text, isStreaming: false } : m
      );
      const feed = state.feed.map((f) =>
        f.type === "message" && f.data.id === action.id
          ? { ...f, data: { ...f.data, text: action.text, isStreaming: false } }
          : f
      );
      return { ...state, messages, feed };
    }

    case "ADD_USER_MESSAGE": {
      const msg: TranscriptEntry = {
        id: action.id,
        role: "user",
        text: action.text,
        timestamp: Date.now(),
        isStreaming: false,
      };
      return {
        ...state,
        messages: [...state.messages, msg],
        feed: [...state.feed, { type: "message", data: msg }],
      };
    }

    case "ADD_ASSISTANT_MESSAGE": {
      const msg: TranscriptEntry = {
        id: action.id,
        role: "assistant",
        text: "",
        timestamp: Date.now(),
        isStreaming: true,
      };
      return {
        ...state,
        messages: [...state.messages, msg],
        feed: [...state.feed, { type: "message", data: msg }],
      };
    }

    case "UPDATE_ASSISTANT_DELTA": {
      const messages = state.messages.map((m) =>
        m.id === action.id ? { ...m, text: m.text + action.delta } : m
      );
      const feed = state.feed.map((f) =>
        f.type === "message" && f.data.id === action.id
          ? {
              ...f,
              data: {
                ...f.data,
                text: f.data.text + action.delta,
              },
            }
          : f
      );
      return { ...state, messages, feed };
    }

    case "FINISH_ASSISTANT_MESSAGE": {
      const messages = state.messages.map((m) =>
        m.id === action.id
          ? { ...m, text: action.text, isStreaming: false }
          : m
      );
      const feed = state.feed.map((f) =>
        f.type === "message" && f.data.id === action.id
          ? {
              ...f,
              data: { ...f.data, text: action.text, isStreaming: false },
            }
          : f
      );
      return { ...state, messages, feed };
    }

    case "ADD_TOOL_CALL":
      return {
        ...state,
        toolCalls: [...state.toolCalls, action.entry],
        feed: [...state.feed, { type: "tool_call", data: action.entry }],
      };

    case "UPDATE_TOOL_CALL": {
      const toolCalls = state.toolCalls.map((tc) =>
        tc.callId === action.callId
          ? { ...tc, result: action.result, status: action.status }
          : tc
      );
      const feed = state.feed.map((f) =>
        f.type === "tool_call" && f.data.callId === action.callId
          ? {
              ...f,
              data: {
                ...f.data,
                result: action.result,
                status: action.status,
              },
            }
          : f
      );
      return { ...state, toolCalls, feed };
    }

    case "TOGGLE_MUTE":
      return { ...state, isMuted: !state.isMuted };

    case "CLEAR":
      return {
        connectionState: "idle",
        messages: [],
        toolCalls: [],
        feed: [],
        isMuted: false,
      };

    default:
      return state;
  }
}

const initialState: State = {
  connectionState: "idle",
  messages: [],
  toolCalls: [],
  feed: [],
  isMuted: false,
};

export function useRealtime() {
  const clientRef = useRef<RealtimeClient | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const currentAssistantIdRef = useRef<string | null>(null);

  // Initialize client once
  useEffect(() => {
    clientRef.current = new RealtimeClient();
    const client = clientRef.current;

    // Connection state
    client.on("connection_state", (e) => {
      dispatch({ type: "SET_CONNECTION", state: e.state as ConnectionState });
    });

    // User audio committed — add placeholder immediately to preserve ordering
    client.on("user_message_placeholder", (e) => {
      dispatch({ type: "ADD_USER_PLACEHOLDER", id: e.item_id as string });
    });

    // User transcript complete — fill in the placeholder
    client.on("user_transcript", (e) => {
      if (e.transcript && e.item_id) {
        dispatch({
          type: "FILL_USER_TRANSCRIPT",
          id: e.item_id as string,
          text: e.transcript as string,
        });
      }
    });

    // Assistant transcript streaming
    client.on("assistant_transcript_delta", (e) => {
      let id: string = currentAssistantIdRef.current ?? "";
      if (!id || e.item_id !== id) {
        id = e.item_id || `asst_${Date.now()}`;
        currentAssistantIdRef.current = id;
        dispatch({ type: "ADD_ASSISTANT_MESSAGE", id });
      }
      if (e.delta) {
        dispatch({ type: "UPDATE_ASSISTANT_DELTA", id, delta: e.delta });
      }
    });

    client.on("assistant_transcript_done", (e) => {
      const id = currentAssistantIdRef.current;
      if (id && e.transcript) {
        dispatch({ type: "FINISH_ASSISTANT_MESSAGE", id, text: e.transcript });
      }
      currentAssistantIdRef.current = null;
    });

    // Tool calls
    client.on("tool_call_start", (e) => {
      dispatch({
        type: "ADD_TOOL_CALL",
        entry: {
          id: `tc_${Date.now()}`,
          callId: e.call_id,
          toolName: e.name,
          args: e.args || {},
          result: null,
          status: "pending",
          timestamp: Date.now(),
        },
      });
    });

    client.on("tool_call_complete", (e) => {
      dispatch({
        type: "UPDATE_TOOL_CALL",
        callId: e.call_id,
        result: e.result,
        status: "complete",
      });
    });

    client.on("tool_call_error", (e) => {
      dispatch({
        type: "UPDATE_TOOL_CALL",
        callId: e.call_id,
        result: { error: e.error },
        status: "error",
      });
    });

    return () => {
      client.disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    await clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    currentAssistantIdRef.current = null;
  }, []);

  const sendText = useCallback((text: string) => {
    // Add to feed immediately for text input
    dispatch({
      type: "ADD_USER_MESSAGE",
      id: `user_text_${Date.now()}`,
      text,
    });
    clientRef.current?.sendTextMessage(text);
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: "TOGGLE_MUTE" });
    clientRef.current?.toggleMute(!state.isMuted);
  }, [state.isMuted]);

  const getLocalStream = useCallback(() => {
    return clientRef.current?.getLocalStream() || null;
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendText,
    toggleMute,
    getLocalStream,
  };
}
