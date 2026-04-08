import { NextRequest, NextResponse } from "next/server";

// In-memory store for prototype
const tasks: Array<Record<string, unknown>> = [];

export async function POST(request: NextRequest) {
  const body = await request.json();

  const task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: body.title,
    description: body.description || null,
    due_date: body.due_date || null,
    priority: body.priority || "medium",
    customer_name: body.customer_name || null,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  tasks.push(task);

  return NextResponse.json({
    success: true,
    task,
    message: `Follow-up task "${task.title}" created successfully.`,
  });
}

export async function GET() {
  return NextResponse.json({ tasks });
}
