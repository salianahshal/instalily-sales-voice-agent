"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CorrectionDialogProps {
  open: boolean;
  originalText: string;
  onClose: () => void;
  onSubmit: (correctedText: string) => void;
}

export function CorrectionDialog({
  open,
  originalText,
  onClose,
  onSubmit,
}: CorrectionDialogProps) {
  const [text, setText] = useState(originalText);

  useEffect(() => {
    setText(originalText);
  }, [originalText]);

  function handleSubmit() {
    if (text.trim() && text.trim() !== originalText.trim()) {
      onSubmit(text.trim());
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Correct Transcription</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Original: &ldquo;{originalText}&rdquo;
          </p>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="Corrected text..."
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Send Correction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
