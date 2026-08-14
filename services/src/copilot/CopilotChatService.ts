/**
 * Mock implementation of the Microsoft 365 Copilot Chat API surface.
 *
 * These methods define the exact contract MUSE will call once real
 * Copilot Chat API access is granted (Phase 4). Every method currently
 * returns deterministic, clearly-labeled mock data — there is no hardcoded
 * Microsoft Graph crawling here.
 */

import { Logger, nowISO } from "@muse/shared";
import { CopilotSessionManager } from "./CopilotSessionManager";
import {
  CopilotChatRequest,
  CopilotChatResponse,
  CopilotDocumentRequest,
  CopilotDocumentResponse,
  CopilotMeetingSummaryRequest,
  CopilotMeetingSummaryResponse,
  CopilotSummaryRequest,
  CopilotSummaryResponse,
  CopilotTaskGenerationRequest,
  CopilotTaskGenerationResponse,
} from "./CopilotModels";

export class CopilotChatService {
  private readonly sessionManager: CopilotSessionManager;
  private readonly logger: Logger;

  constructor(sessionManager: CopilotSessionManager, logger: Logger = new Logger("muse:copilot:chat")) {
    this.sessionManager = sessionManager;
    this.logger = logger;
  }

  async askQuestion(request: CopilotChatRequest): Promise<CopilotChatResponse> {
    const session = this.sessionManager.getOrCreate(request.conversationId);

    this.sessionManager.appendMessage(session.conversationId, {
      role: "user",
      content: request.question,
      timestamp: nowISO(),
    });

    const answer = `[Mock Copilot Chat] Based on your Microsoft 365 context, here is a preliminary answer to: "${request.question}"`;

    this.sessionManager.appendMessage(session.conversationId, {
      role: "assistant",
      content: answer,
      timestamp: nowISO(),
    });

    this.logger.debug("askQuestion", { conversationId: session.conversationId });

    return {
      conversationId: session.conversationId,
      answer,
      citations: [
        { title: "Mock Source Document.docx", sourceType: "file" },
        { title: "Weekly Sync", sourceType: "meeting" },
      ],
      createdAt: nowISO(),
    };
  }

  async continueConversation(request: CopilotChatRequest): Promise<CopilotChatResponse> {
    if (!request.conversationId) {
      throw new Error("continueConversation requires an existing conversationId");
    }
    return this.askQuestion(request);
  }

  async summarizeContext(request: CopilotSummaryRequest): Promise<CopilotSummaryResponse> {
    this.logger.debug("summarizeContext");
    const trimmed = request.content.trim();
    const preview = trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed;

    return {
      summary: `[Mock Copilot Summary] ${preview || "No content supplied."}`,
      keyPoints: [
        "Key point extraction is mocked pending Copilot API access.",
        "Grounding sources will be attached once enterprise data access is enabled.",
      ],
    };
  }

  async summarizeMeeting(request: CopilotMeetingSummaryRequest): Promise<CopilotMeetingSummaryResponse> {
    this.logger.debug("summarizeMeeting", { meetingId: request.meetingId });

    return {
      meetingId: request.meetingId,
      summary: `[Mock Copilot Meeting Summary] Summary for meeting ${request.meetingId}.`,
      actionItems: ["Follow up with stakeholders.", "Share notes with the team."],
      decisions: ["Proceed with the proposed plan pending final review."],
    };
  }

  async generateDocument(request: CopilotDocumentRequest): Promise<CopilotDocumentResponse> {
    this.logger.debug("generateDocument", { documentType: request.documentType });

    return {
      title: request.title,
      documentType: request.documentType,
      content: `[Mock Generated Document]\n\nTitle: ${request.title}\n\n${request.instructions}`,
    };
  }

  async generateTasks(request: CopilotTaskGenerationRequest): Promise<CopilotTaskGenerationResponse> {
    this.logger.debug("generateTasks");
    const maxTasks = request.maxTasks ?? 3;

    const tasks = Array.from({ length: maxTasks }, (_, index) => ({
      title: `Mock task ${index + 1} derived from provided content`,
      description: `Generated from: "${request.content.slice(0, 80)}"`,
      priority: (["low", "medium", "high"] as const)[index % 3],
    }));

    return { tasks };
  }
}
