"use client";

import { cn } from "@/lib/utils";
import type { TranscriptEntry } from "@/lib/types";
import { User, Bot } from "lucide-react";

interface TranscriptMessageProps {
  entry: TranscriptEntry;
  onCorrect?: (id: string, text: string) => void;
}

export function TranscriptMessage({ entry, onCorrect }: TranscriptMessageProps) {
  const isUser = entry.role === "user";

  return (
    <div
      className={cn(
        "flex gap-2 px-4 py-2",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm",
          entry.isStreaming && "min-w-[40px]"
        )}
        onClick={() => {
          if (isUser && onCorrect) {
            onCorrect(entry.id, entry.text);
          }
        }}
      >
        <p className="whitespace-pre-wrap break-words">
          {entry.text}
          {entry.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-current opacity-70 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </p>
        {isUser && !entry.isStreaming && entry.text && (
          <p className="text-[10px] opacity-50 mt-1 cursor-pointer hover:opacity-80">
            Tap to correct
          </p>
        )}
      </div>
    </div>
  );
}
