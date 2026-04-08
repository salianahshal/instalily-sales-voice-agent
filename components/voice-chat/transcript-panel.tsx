"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptMessage } from "./transcript-message";
import { ToolCallCard } from "./tool-call-card";
import type { FeedItem } from "@/lib/types";
import { Mic } from "lucide-react";

interface TranscriptPanelProps {
  feed: FeedItem[];
  isConnected: boolean;
  onCorrect?: (id: string, text: string) => void;
}

export function TranscriptPanel({
  feed,
  isConnected,
  onCorrect,
}: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feed]);

  if (feed.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Mic className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg">Sales Voice Assistant</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isConnected
              ? "Listening... Start speaking to ask about customers, capture call notes, or create follow-up tasks."
              : "Tap the microphone to start a voice session. Ask about customers, capture call notes, or create follow-up tasks."}
          </p>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {[
              "\"Save notes from my call with Sarah\"",
              "\"Remind me to send the proposal\"",
              "\"What's the status on TechFlow?\"",
            ].map((hint) => (
              <span
                key={hint}
                className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground"
              >
                {hint}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="py-4 space-y-1">
        {feed.map((item, i) => {
          if (item.type === "message") {
            return (
              <TranscriptMessage
                key={item.data.id || i}
                entry={item.data}
                onCorrect={onCorrect}
              />
            );
          }
          return (
            <ToolCallCard key={item.data.id || i} entry={item.data} />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
