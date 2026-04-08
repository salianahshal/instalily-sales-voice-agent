export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: number;
  isStreaming: boolean;
}

export interface ToolCallEntry {
  id: string;
  callId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: unknown | null;
  status: "pending" | "complete" | "error";
  timestamp: number;
}

export type FeedItem =
  | { type: "message"; data: TranscriptEntry }
  | { type: "tool_call"; data: ToolCallEntry };

export interface FollowUpTask {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: "low" | "medium" | "high";
  customer_name?: string;
  created_at: string;
}

export interface CallNote {
  id: string;
  customer_name: string;
  summary: string;
  key_points?: string[];
  sentiment?: "positive" | "neutral" | "negative";
  next_steps?: string[];
  deal_stage?: string;
  created_at: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  company: string;
  last_contact: string;
  deal_stage: string;
  deal_value: string;
  notes: string[];
}

export type ConnectionState = "idle" | "connecting" | "connected" | "error";
