/**
 * CopilotConversationService — Phase 3 conversation lifecycle management
 * layered on top of `CopilotChatService`.
 *
 * Provides the higher-level "New / Continue / Clear / History / Export"
 * operations the frontend Conversation Management UI needs, independent of
 * the lower-level prompt/response mechanics in `CopilotChatService`.
 */

import { EntityId, Logger } from "@muse/shared";
import { CopilotChatService } from "./CopilotChatService";
import { Conversation, ConversationExport } from "./CopilotModels";

export class CopilotConversationService {
  private readonly chat: CopilotChatService;
  private readonly logger: Logger;
  private activeConversationId: EntityId | null = null;

  constructor(chat: CopilotChatService, logger: Logger = new Logger("muse:copilot:conversation")) {
    this.chat = chat;
    this.logger = logger;
  }

  startNew(): Conversation {
    const { conversation } = this.createEmptyConversation();
    this.activeConversationId = conversation.id;
    this.logger.info("New Copilot conversation started", { id: conversation.id });
    return conversation;
  }

  private createEmptyConversation(): { conversation: Conversation } {
    // Reuse chat service's own conversation creation by resetting a fresh id.
    const conversation = this.chat.resetConversation(cryptoRandomId());
    return { conversation };
  }

  getActive(): Conversation | undefined {
    if (!this.activeConversationId) return undefined;
    return this.chat.getConversation(this.activeConversationId);
  }

  continueActive(): Conversation | undefined {
    return this.getActive();
  }

  setActive(conversationId: EntityId): Conversation | undefined {
    const conversation = this.chat.getConversation(conversationId);
    if (conversation) {
      this.activeConversationId = conversationId;
    }
    return conversation;
  }

  clearActive(): Conversation | undefined {
    if (!this.activeConversationId) return undefined;
    return this.chat.resetConversation(this.activeConversationId);
  }

  history(): Conversation[] {
    return this.chat.listConversations();
  }

  async exportConversation(conversationId: EntityId, format: "json" | "markdown"): Promise<ConversationExport> {
    const conversation = this.chat.getConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation "${conversationId}" not found.`);
    }

    const content =
      format === "json"
        ? JSON.stringify(conversation, null, 2)
        : this.toMarkdown(conversation);

    return {
      conversationId,
      format,
      content,
      exportedAt: new Date().toISOString(),
    };
  }

  private toMarkdown(conversation: Conversation): string {
    const lines = [`# ${conversation.title}`, ""];
    for (const message of conversation.messages) {
      const speaker = message.role === "user" ? "You" : "MUSE";
      lines.push(`**${speaker}** (${message.createdAt}): ${message.content}`);
      if (message.citations && message.citations.length > 0) {
        lines.push("", "Sources:");
        for (const citation of message.citations) {
          lines.push(`- ${citation.marker} ${citation.title}`);
        }
      }
      lines.push("");
    }
    return lines.join("\n");
  }
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `conv_${crypto.randomUUID()}`;
  }
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
