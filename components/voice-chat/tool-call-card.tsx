"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ToolCallEntry } from "@/lib/types";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  ListTodo,
  FileText,
  Search,
} from "lucide-react";

const toolMeta: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  create_follow_up_task: {
    label: "Create Task",
    icon: <ListTodo className="h-4 w-4" />,
    color: "text-blue-600",
  },
  save_call_note: {
    label: "Save Note",
    icon: <FileText className="h-4 w-4" />,
    color: "text-emerald-600",
  },
  search_customer_context: {
    label: "Search Customer",
    icon: <Search className="h-4 w-4" />,
    color: "text-violet-600",
  },
};

interface ToolCallCardProps {
  entry: ToolCallEntry;
}

export function ToolCallCard({ entry }: ToolCallCardProps) {
  const meta = toolMeta[entry.toolName] || {
    label: entry.toolName,
    icon: null,
    color: "text-muted-foreground",
  };
  const result = entry.result as Record<string, unknown> | null;

  return (
    <Card className="mx-4 my-2 border-dashed">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={meta.color}>{meta.icon}</span>
          <span className="text-sm font-medium">{meta.label}</span>
          {entry.status === "pending" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />
          )}
          {entry.status === "complete" && (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
          )}
          {entry.status === "error" && (
            <AlertCircle className="h-3.5 w-3.5 text-destructive ml-auto" />
          )}
        </div>

        {/* Arguments summary */}
        <div className="text-xs text-muted-foreground mb-2">
          {entry.toolName === "create_follow_up_task" && (
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {String(entry.args.title)}
              </p>
              {entry.args.due_date ? <p>Due: {String(entry.args.due_date)}</p> : null}
              {entry.args.priority ? (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {String(entry.args.priority)}
                </Badge>
              ) : null}
            </div>
          )}
          {entry.toolName === "save_call_note" && (
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {String(entry.args.customer_name)}
              </p>
              <p>{String(entry.args.summary)}</p>
              {entry.args.sentiment ? (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {String(entry.args.sentiment)}
                </Badge>
              ) : null}
            </div>
          )}
          {entry.toolName === "search_customer_context" && (
            <p>
              Searching: &ldquo;{String(entry.args.query)}&rdquo;
            </p>
          )}
        </div>

        {/* Results */}
        {entry.status === "complete" && result && (
          <div className="text-xs border-t pt-2 mt-1">
            {entry.toolName === "search_customer_context" &&
              Array.isArray(result.results) && (
                <div className="space-y-1.5">
                  {(result.results as Array<Record<string, string>>).map(
                    (r, i) => (
                      <div key={i} className="bg-muted/50 rounded p-1.5">
                        <p className="font-medium text-foreground">
                          {r.name} — {r.company}
                        </p>
                        <p className="text-muted-foreground">
                          Stage: {r.deal_stage} · {r.deal_value}
                        </p>
                      </div>
                    )
                  )}
                  {(result.results as Array<unknown>).length === 0 && (
                    <p className="text-muted-foreground italic">
                      No matching customers found.
                    </p>
                  )}
                </div>
              )}
            {entry.toolName !== "search_customer_context" && (
              <p className="text-emerald-600">{result.message as string}</p>
            )}
          </div>
        )}

        {entry.status === "error" && result && (
          <p className="text-xs text-destructive border-t pt-2 mt-1">
            Error: {(result as Record<string, string>).error || "Failed"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
