/**
 * Thin fetch wrapper for the MUSE Express backend. Requests are routed
 * through the Vite dev proxy (see vite.config.ts) so relative paths work
 * both in the browser and inside the Electron renderer.
 */

export interface HealthResponse {
  status: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`MUSE backend request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export const museApiClient = {
  health: () => request<HealthResponse>("/health"),

  copilotChat: (question: string, conversationId?: string) =>
    request("/api/copilot/chat", {
      method: "POST",
      body: JSON.stringify({ question, conversationId }),
    }),

  copilotRetrieve: (type: "work-context" | "files" | "meetings" | "projects" | "tasks", query?: string) =>
    request("/api/copilot/retrieve", {
      method: "POST",
      body: JSON.stringify({ type, query }),
    }),

  memorySearch: (query: string) =>
    request("/api/memory/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),

  memoryStore: (payload: { category: string; title: string; content: string; tags?: string[] }) =>
    request("/api/memory/store", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listActions: () => request("/api/actions"),

  executeAction: (actionId: string, parameters: Record<string, unknown> = {}, approvedByUser = false) =>
    request("/api/actions/execute", {
      method: "POST",
      body: JSON.stringify({ actionId, parameters, approvedByUser }),
    }),

  startSession: (title?: string) =>
    request("/api/session/start", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  endSession: () => request("/api/session/end", { method: "POST" }),
};
