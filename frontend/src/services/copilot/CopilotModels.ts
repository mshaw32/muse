/**
 * Phase 3 Copilot domain models used by the frontend.
 *
 * Intentionally mirrors `backend/src/services/copilot/CopilotModels.ts`
 * structurally, without importing across the frontend/backend boundary
 * (the frontend does not depend on backend or Node-only packages).
 */

export type ConversationRole = "user" | "assistant" | "system";

export type ConversationState = "idle" | "streaming" | "complete" | "error";

export type SourceType = "file" | "meeting" | "project" | "task" | "conversation" | "context";

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  snippet: string;
  url?: string;
  updatedAt: string;
}

export interface Citation {
  marker: string;
  sourceId: string;
  title: string;
}

export interface Message {
  id: string;
  role: ConversationRole;
  content: string;
  createdAt: string;
  sources?: Source[];
  citations?: Citation[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  state: ConversationState;
  messages: Message[];
}

export type CopilotConnectionStatus = "connected" | "disconnected" | "authenticating" | "error";

export interface CopilotAuthStatus {
  state: "unauthenticated" | "authenticating" | "authenticated" | "error";
  connectionStatus: CopilotConnectionStatus;
  account: string | null;
  lastError: string | null;
  token: {
    hasToken: boolean;
    tokenPreview: string | null;
    issuedAt: string | null;
    expiresAt: string | null;
    scopes: string[];
  };
}

export interface StreamChunk {
  conversationId: string;
  delta: string;
  done: boolean;
  message?: Message;
}
