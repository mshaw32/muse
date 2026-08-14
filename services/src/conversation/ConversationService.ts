/**
 * Business logic for conversation history, persistence, search, export,
 * and summaries.
 *
 * Summaries are produced through the Copilot Chat Service abstraction
 * (`summarizeContext`), keeping conversation intelligence consistent with
 * the rest of MUSE's Enterprise Intelligence Layer story.
 */

import { EntityId, Logger, generateId, nowISO } from "@muse/shared";
import { CopilotChatService } from "../copilot/CopilotChatService";
import {
  Conversation,
  ConversationExportFormat,
  ConversationMessage,
  ConversationSummary,
} from "./ConversationModels";
import { ConversationStore } from "./ConversationStore";

export class ConversationService {
  private readonly store: ConversationStore;
  private readonly copilotChat?: CopilotChatService;
  private readonly logger: Logger;

  constructor(store: ConversationStore, copilotChat?: CopilotChatService, logger: Logger = new Logger("muse:conversation")) {
    this.store = store;
    this.copilotChat = copilotChat;
    this.logger = logger;
  }

  createConversation(title = "New Conversation"): Conversation {
    const timestamp = nowISO();
    const conversation: Conversation = {
      id: generateId("conv"),
      title,
      createdAt: timestamp,
      updatedAt: timestamp,
      messages: [],
    };
    this.store.upsert(conversation);
    this.logger.info("Conversation created", { id: conversation.id });
    return conversation;
  }

  addMessage(conversationId: EntityId, role: ConversationMessage["role"], text: string): Conversation {
    const conversation = this.store.getById(conversationId) ?? this.createConversation();

    const message: ConversationMessage = {
      id: generateId("msg"),
      role,
      text,
      timestamp: nowISO(),
    };

    conversation.messages.push(message);
    conversation.updatedAt = nowISO();

    return this.store.upsert(conversation);
  }

  getConversation(conversationId: EntityId): Conversation | undefined {
    return this.store.getById(conversationId);
  }

  listConversations(): Conversation[] {
    return this.store.all().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  deleteConversation(conversationId: EntityId): boolean {
    return this.store.remove(conversationId);
  }

  search(query: string): Conversation[] {
    const normalized = query.toLowerCase();
    return this.listConversations().filter((conversation) =>
      conversation.title.toLowerCase().includes(normalized) ||
      conversation.messages.some((message) => message.text.toLowerCase().includes(normalized)),
    );
  }

  export(conversationId: EntityId, format: ConversationExportFormat): string {
    const conversation = this.store.getById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation "${conversationId}" not found.`);
    }

    if (format === "json") {
      return JSON.stringify(conversation, null, 2);
    }

    const lines = [`# ${conversation.title}`, ""];
    for (const message of conversation.messages) {
      const speaker = message.role === "user" ? "You" : "MUSE";
      lines.push(`**${speaker}** (${message.timestamp}): ${message.text}`, "");
    }
    return lines.join("\n");
  }

  async summarize(conversationId: EntityId): Promise<ConversationSummary> {
    const conversation = this.store.getById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation "${conversationId}" not found.`);
    }

    const transcriptText = conversation.messages
      .map((message) => `${message.role}: ${message.text}`)
      .join("\n");

    if (this.copilotChat) {
      const result = await this.copilotChat.summarizeContext({
        conversationId,
        content: transcriptText,
      });

      return {
        conversationId,
        summary: result.summary,
        keyPoints: result.keyPoints,
        generatedAt: nowISO(),
      };
    }

    return {
      conversationId,
      summary: `[Local Summary] Conversation with ${conversation.messages.length} messages.`,
      keyPoints: [],
      generatedAt: nowISO(),
    };
  }
}
