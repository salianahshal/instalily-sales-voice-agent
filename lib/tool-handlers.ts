type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

export const toolHandlers: Record<string, ToolHandler> = {
  create_follow_up_task: async (args) => {
    const res = await fetch("/api/tools/create-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const data = await res.json();
    return JSON.stringify(data);
  },

  save_call_note: async (args) => {
    const res = await fetch("/api/tools/save-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const data = await res.json();
    return JSON.stringify(data);
  },

  search_customer_context: async (args) => {
    const res = await fetch("/api/tools/search-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const data = await res.json();
    return JSON.stringify(data);
  },
};
