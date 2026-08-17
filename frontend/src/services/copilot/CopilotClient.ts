/**
 * CopilotClient — frontend client for the Phase 3 `/api/copilot/*` backend
 * routes. Wraps plain `fetch` calls (routed through the Vite dev proxy) and
 * exposes a `streamPrompt` helper that consumes the backend's
 * Server-Sent-Events endpoint and reports incremental chunks via callback.
 */

import type { Conversation, CopilotAuthStatus, Message, Source, StreamChunk } from "./CopilotModels";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Copilot request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export interface ChatResponse {
  status: string;
  conversationId: string;
  reply: string;
  sources: Source[];
  conversation: Conversation;
  message: Message;
}

export interface RetrieveResponse {
  status: string;
  type: string;
  results: Source[];
}

export interface StatusResponse extends CopilotAuthStatus {
  connected: boolean;
}

export const copilotClient = {
  status: () => request<StatusResponse>("/api/copilot/status"),

  login: () => request<{ status: string; auth: CopilotAuthStatus }>("/api/copilot/auth/login", { method: "POST" }),

  logout: () => request<{ status: string; auth: CopilotAuthStatus }>("/api/copilot/auth/logout", { method: "POST" }),

  chat: (prompt: string, conversationId?: string) =>
    request<ChatResponse>("/api/copilot/chat", {
      method: "POST",
      body: JSON.stringify({ prompt, conversationId }),
    }),

  retrieve: (type: "work-context" | "files" | "meetings" | "projects" | "tasks", query: string, limit?: number) =>
    request<RetrieveResponse>("/api/copilot/retrieve", {
      method: "POST",
      body: JSON.stringify({ type, query, limit }),
    }),

  newConversation: () => request<{ status: string; conversation: Conversation }>("/api/copilot/conversation/new", { method: "POST" }),

  activeConversation: () =>
    request<{ status: string; conversation: Conversation | null }>("/api/copilot/conversation/active"),

  clearConversation: () =>
    request<{ status: string; conversation: Conversation | null }>("/api/copilot/conversation/clear", { method: "POST" }),

  history: () => request<{ status: string; conversations: Conversation[] }>("/api/copilot/conversation/history"),

  exportConversation: (conversationId: string, format: "json" | "markdown") =>
    request<{ status: string; export: { content: string; format: string } }>("/api/copilot/conversation/export", {
      method: "POST",
      body: JSON.stringify({ conversationId, format }),
    }),

  summarize: (conversationId: string) =>
    request<{ status: string; summary: string; keyPoints: string[] }>("/api/copilot/conversation/summarize", {
      method: "POST",
      body: JSON.stringify({ conversationId }),
    }),

  /**
   * Streams a prompt response via Server-Sent Events, invoking `onChunk`
   * for every incremental delta and resolving with the final message once
   * the stream completes.
   */
  async streamPrompt(
    prompt: string,
    conversationId: string | undefined,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal,
  ): Promise<Message | undefined> {
    const response = await fetch("/api/copilot/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, conversationId }),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Copilot stream failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalMessage: Message | undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const rawEvent of events) {
        const line = rawEvent.trim();
        if (!line.startsWith("data:")) continue;

        const jsonText = line.slice(5).trim();
        if (!jsonText) continue;

        try {
          const chunk = JSON.parse(jsonText) as StreamChunk;
          onChunk(chunk);
          if (chunk.done && chunk.message) {
            finalMessage = chunk.message;
          }
        } catch {
          // Ignore malformed SSE frames.
        }
      }
    }

    return finalMessage;
  },
};
