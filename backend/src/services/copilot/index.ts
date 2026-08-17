export * from "./CopilotTypes";
export * from "./CopilotModels";
export * from "./CopilotLogger";
export * from "./CopilotAuthService";
export * from "./CopilotChatService";
export * from "./CopilotRetrievalService";
export * from "./CopilotConversationService";

import { CopilotAuthService } from "./CopilotAuthService";
import { CopilotChatService } from "./CopilotChatService";
import { CopilotRetrievalService } from "./CopilotRetrievalService";
import { CopilotConversationService } from "./CopilotConversationService";

/**
 * Facade bundling the Phase 3 Copilot integration services. The backend
 * routes depend on this single instance rather than constructing each
 * service ad hoc.
 */
export class CopilotIntegration {
  readonly auth: CopilotAuthService;
  readonly chat: CopilotChatService;
  readonly retrieval: CopilotRetrievalService;
  readonly conversation: CopilotConversationService;

  constructor() {
    this.auth = new CopilotAuthService();
    this.chat = new CopilotChatService();
    this.retrieval = new CopilotRetrievalService();
    this.conversation = new CopilotConversationService(this.chat);
  }
}

let integration: CopilotIntegration | null = null;

export function getCopilotIntegration(): CopilotIntegration {
  if (!integration) {
    integration = new CopilotIntegration();
  }
  return integration;
}
