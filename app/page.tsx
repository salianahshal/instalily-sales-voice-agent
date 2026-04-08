"use client";

import { useState, useCallback } from "react";
import { useRealtime } from "@/components/voice-chat/use-realtime";
import { TranscriptPanel } from "@/components/voice-chat/transcript-panel";
import { VoiceControls } from "@/components/voice-chat/voice-controls";
import { CorrectionDialog } from "@/components/voice-chat/correction-dialog";
import { Badge } from "@/components/ui/badge";
import { Phone, Wifi, WifiOff } from "lucide-react";

export default function VoiceChatPage() {
  const {
    connectionState,
    feed,
    isMuted,
    connect,
    disconnect,
    sendText,
    toggleMute,
    getLocalStream,
  } = useRealtime();

  const [correctionState, setCorrectionState] = useState<{
    open: boolean;
    id: string;
    text: string;
  }>({ open: false, id: "", text: "" });

  const handleCorrect = useCallback((id: string, text: string) => {
    setCorrectionState({ open: true, id, text });
  }, []);

  const handleCorrectionSubmit = useCallback(
    (correctedText: string) => {
      sendText(
        `Correction: I actually said "${correctedText}", not what was transcribed.`
      );
    },
    [sendText]
  );

  const isConnected = connectionState === "connected";

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-base">Sales Voice Agent</h1>
        </div>
        <Badge
          variant={isConnected ? "default" : "secondary"}
          className="gap-1.5 text-xs"
        >
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              Live
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Offline
            </>
          )}
        </Badge>
      </header>

      {/* Transcript / Feed */}
      <TranscriptPanel
        feed={feed}
        isConnected={isConnected}
        onCorrect={handleCorrect}
      />

      {/* Controls */}
      <VoiceControls
        connectionState={connectionState}
        isMuted={isMuted}
        localStream={getLocalStream()}
        onConnect={connect}
        onDisconnect={disconnect}
        onToggleMute={toggleMute}
        onSendText={sendText}
      />

      {/* Correction dialog */}
      <CorrectionDialog
        open={correctionState.open}
        originalText={correctionState.text}
        onClose={() =>
          setCorrectionState({ open: false, id: "", text: "" })
        }
        onSubmit={handleCorrectionSubmit}
      />
    </div>
  );
}
