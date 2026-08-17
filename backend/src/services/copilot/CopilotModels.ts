/**
 * Phase 3 domain models for the Microsoft 365 Copilot integration layer.
 *
 * These models back the Copilot Chat / Retrieval / Conversation API surface
 * exposed under `/api/copilot/*`. They are intentionally distinct from the
 * Phase 2 `@muse/services` Copilot models — Phase 3 focuses specifically on
 * conversation streaming, source attribution, and grounded responses, and
 * keeps its own request/response contracts stable for the frontend.
 */

import { EntityId, ISOTimestamp } from "@muse/shared";

export type ConversationRole = "user" | "assistant" | "system";

export type ConversationState = "idle" | "streaming" | "complete" | "error";

export interface Message {
  id: EntityId;
  role: ConversationRole;
  content: string;
  createdAt: ISOTimestamp;
  sources?: Source[];
  citations?: Citation[];
}

export interface Conversation {
  id: EntityId;
  title: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  state: ConversationState;
  messages: Message[];
}

export interface Prompt {
  conversationId?: EntityId;
  text: string;
}

export interface Response {
  conversationId: EntityId;
  message: Message;
}

/** A grounding source referenced by a Copilot response. */
export type SourceType = "file" | "meeting" | "project" | "task" | "conversation" | "context";

export interface Source {
  id: EntityId;
  type: SourceType;
  title: string;
  snippet: string;
  url?: string;
  updatedAt: ISOTimestamp;
}

/** An inline citation marker (e.g. "[1]") tying response text to a source. */
export interface Citation {
  marker: string;
  sourceId: EntityId;
  title: string;
}

export interface RetrievalResult {
  query: string;
  sources: Source[];
  generatedAt: ISOTimestamp;
}

export interface ConversationExport {
  conversationId: EntityId;
  format: "json" | "markdown";
  content: string;
  exportedAt: ISOTimestamp;
}
