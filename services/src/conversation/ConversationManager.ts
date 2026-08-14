/**
 * Orchestrates the single "active" conversation for the current MUSE
 * session, on top of the more general-purpose ConversationService (which
 * can manage many historical conversations).
 */

import { EntityId, Logger } from "@muse/shared";
import { ConversationService } from "./ConversationService";
import { Conversation } from "./ConversationModels";

export class ConversationManager {
  private readonly service: ConversationService;
  private readonly logger: Logger;
  private activeConversationId: EntityId | null = null;

  constructor(service: ConversationService, logger: Logger = new Logger("muse:conversation:manager")) {
    this.service = service;
    this.logger = logger;
  }

  startNew(title?: string): Conversation {
    const conversation = this.service.createConversation(title);
    this.activeConversationId = conversation.id;
    this.logger.info("Active conversation started", { id: conversation.id });
    return conversation;
  }

  getActive(): Conversation | undefined {
    if (!this.activeConversationId) return undefined;
    return this.service.getConversation(this.activeConversationId);
  }

  addUserMessage(text: string): Conversation {
    const conversation = this.getActive() ?? this.startNew();
    return this.service.addMessage(conversation.id, "user", text);
  }

  addAssistantMessage(text: string): Conversation {
    const conversation = this.getActive() ?? this.startNew();
    return this.service.addMessage(conversation.id, "assistant", text);
  }

  endActive(): void {
    this.activeConversationId = null;
  }
}
