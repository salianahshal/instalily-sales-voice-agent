"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AudioVisualizer } from "./audio-visualizer";
import type { ConnectionState } from "@/lib/types";
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  Send,
  Keyboard,
} from "lucide-react";

interface VoiceControlsProps {
  connectionState: ConnectionState;
  isMuted: boolean;
  localStream: MediaStream | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
  onSendText: (text: string) => void;
}

export function VoiceControls({
  connectionState,
  isMuted,
  localStream,
  onConnect,
  onDisconnect,
  onToggleMute,
  onSendText,
}: VoiceControlsProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState("");
  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";

  function toggleTextInput() {
    const next = !showTextInput;
    setShowTextInput(next);
    // Mute mic while typing to prevent VAD picking up keyboard noise
    if (next && !isMuted) onToggleMute();
    if (!next && isMuted) onToggleMute();
  }

  function handleSendText() {
    const trimmed = textValue.trim();
    if (trimmed) {
      onSendText(trimmed);
      setTextValue("");
    }
  }

  return (
    <div className="border-t bg-background p-4 space-y-3">
      {/* Text input row */}
      {showTextInput && isConnected && (
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendText();
            }}
            className="flex-1"
          />
          <Button size="icon" variant="ghost" onClick={handleSendText}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main controls */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-4">
          {/* Keyboard toggle */}
          {isConnected && (
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full h-10 w-10"
              onClick={toggleTextInput}
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          )}

          {/* Mute button */}
          {isConnected && (
            <Button
              size="icon"
              variant={isMuted ? "destructive" : "ghost"}
              className="rounded-full h-10 w-10"
              onClick={onToggleMute}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Main mic / connect button */}
          {!isConnected && !isConnecting && (
            <Button
              size="lg"
              className="rounded-full h-16 w-16 shadow-lg"
              onClick={onConnect}
            >
              <Mic className="h-6 w-6" />
            </Button>
          )}

          {isConnecting && (
            <Button
              size="lg"
              className="rounded-full h-16 w-16"
              disabled
            >
              <Loader2 className="h-6 w-6 animate-spin" />
            </Button>
          )}

          {isConnected && (
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full h-16 w-16 shadow-lg"
              onClick={onDisconnect}
            >
              <Square className="h-5 w-5" />
            </Button>
          )}

          {/* Audio visualizer */}
          {isConnected && (
            <div className="w-10 h-10 flex items-center justify-center">
              <AudioVisualizer
                stream={localStream}
                isActive={isConnected && !isMuted}
              />
            </div>
          )}
        </div>

        {/* Status text — always centered under the button */}
        <p className="text-xs text-muted-foreground">
          {connectionState === "idle" && "Tap to start voice session"}
          {connectionState === "connecting" && "Connecting..."}
          {connectionState === "connected" &&
            (isMuted ? "Muted — tap mic to unmute" : "Listening...")}
          {connectionState === "error" && "Connection failed — tap to retry"}
        </p>
      </div>
    </div>
  );
}
