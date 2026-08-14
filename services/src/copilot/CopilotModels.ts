/**
 * Domain models for the Microsoft 365 Copilot integration layer.
 *
 * MUSE treats Microsoft 365 Copilot as the "Enterprise Intelligence Layer":
 * it never crawls Microsoft Graph directly, and always defers enterprise
 * search/reasoning/grounding to these Copilot API abstractions.
 */

import { EntityId, ISOTimestamp } from "@muse/shared";

export interface CopilotChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: ISOTimestamp;
}

export interface CopilotChatRequest {
  conversationId?: EntityId;
  question: string;
  context?: string;
}

export interface CopilotChatResponse {
  conversationId: EntityId;
  answer: string;
  citations: CopilotCitation[];
  createdAt: ISOTimestamp;
}

export interface CopilotCitation {
  title: string;
  sourceType: "file" | "meeting" | "email" | "chat" | "site";
  url?: string;
}

export interface CopilotSummaryRequest {
  conversationId?: EntityId;
  content: string;
}

export interface CopilotSummaryResponse {
  summary: string;
  keyPoints: string[];
}

export interface CopilotMeetingSummaryRequest {
  meetingId: string;
  transcript?: string;
}

export interface CopilotMeetingSummaryResponse {
  meetingId: string;
  summary: string;
  actionItems: string[];
  decisions: string[];
}

export interface CopilotDocumentRequest {
  title: string;
  instructions: string;
  documentType: "word" | "loop" | "note";
}

export interface CopilotDocumentResponse {
  title: string;
  content: string;
  documentType: CopilotDocumentRequest["documentType"];
}

export interface CopilotTaskGenerationRequest {
  content: string;
  maxTasks?: number;
}

export interface CopilotGeneratedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

export interface CopilotTaskGenerationResponse {
  tasks: CopilotGeneratedTask[];
}

/** Retrieval-oriented models. */
export type WorkContextScope = "mine" | "team" | "organization";

export interface CopilotRetrievalRequest {
  scope?: WorkContextScope;
  query?: string;
  limit?: number;
}

export interface WorkContextItem {
  id: string;
  type: "file" | "meeting" | "task" | "project" | "person";
  title: string;
  summary: string;
  updatedAt: ISOTimestamp;
}

export interface CopilotWorkContextResponse {
  items: WorkContextItem[];
}

export interface CopilotFileItem {
  id: string;
  name: string;
  path: string;
  webUrl: string;
  lastModified: ISOTimestamp;
}

export interface CopilotFileResponse {
  files: CopilotFileItem[];
}

export interface CopilotMeetingItem {
  id: string;
  subject: string;
  start: ISOTimestamp;
  end: ISOTimestamp;
  organizer: string;
  hasTranscript: boolean;
}

export interface CopilotMeetingResponse {
  meetings: CopilotMeetingItem[];
}

export interface CopilotProjectItem {
  id: string;
  name: string;
  status: "on-track" | "at-risk" | "blocked" | "complete";
  owner: string;
}

export interface CopilotProjectResponse {
  projects: CopilotProjectItem[];
}

export interface CopilotTaskItem {
  id: string;
  title: string;
  dueDate: ISOTimestamp | null;
  completed: boolean;
}

export interface CopilotTaskResponse {
  tasks: CopilotTaskItem[];
}
