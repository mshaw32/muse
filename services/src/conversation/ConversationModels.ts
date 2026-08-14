/**
 * Domain models for the MUSE Conversation System.
 */

import { EntityId, ISOTimestamp } from "@muse/shared";

export interface ConversationMessage {
  id: EntityId;
  role: "user" | "assistant";
  text: string;
  timestamp: ISOTimestamp;
}

export interface Conversation {
  id: EntityId;
  title: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  messages: ConversationMessage[];
}

export interface ConversationSummary {
  conversationId: EntityId;
  summary: string;
  keyPoints: string[];
  generatedAt: ISOTimestamp;
}

export type ConversationExportFormat = "json" | "markdown";
