export const toolDefinitions = [
  {
    type: "function" as const,
    name: "create_follow_up_task",
    description:
      "Create a follow-up task for the sales rep. Use when the rep mentions needing to do something later, scheduling a meeting, sending materials, or any clear action item.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short task title" },
        description: {
          type: "string",
          description: "Detailed task description",
        },
        due_date: {
          type: "string",
          description: "When this should be done, e.g. 'tomorrow', 'next Monday', or ISO date",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Task priority level",
        },
        customer_name: {
          type: "string",
          description: "Associated customer name if mentioned",
        },
      },
      required: ["title"],
    },
  },
  {
    type: "function" as const,
    name: "save_call_note",
    description:
      "Save a structured note from a sales call. Use when the rep asks to capture notes, summarize a call, or log key information.",
    parameters: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Customer or company name" },
        summary: { type: "string", description: "Brief call summary" },
        key_points: {
          type: "array",
          items: { type: "string" },
          description: "Key discussion points",
        },
        sentiment: {
          type: "string",
          enum: ["positive", "neutral", "negative"],
          description: "Overall call sentiment",
        },
        next_steps: {
          type: "array",
          items: { type: "string" },
          description: "Agreed next steps",
        },
        deal_stage: {
          type: "string",
          enum: [
            "prospecting",
            "qualification",
            "proposal",
            "negotiation",
            "closed_won",
            "closed_lost",
          ],
          description: "Current deal stage",
        },
      },
      required: ["customer_name", "summary"],
    },
  },
  {
    type: "function" as const,
    name: "search_customer_context",
    description:
      "Search for customer information and context. Use when the rep asks about a customer's history, past interactions, deal status, or any customer-related information.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query - customer name, company, or topic",
        },
      },
      required: ["query"],
    },
  },
];
