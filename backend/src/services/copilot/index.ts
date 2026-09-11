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
import { CopilotStudioAuth, CopilotStudioAdapter, CopilotSessionManager } from "@muse/services";

/**
 * Facade bundling the Phase 3 Copilot integration services. The backend
 * routes depend on this single instance rather than constructing each
 * service ad hoc.
 *
 * Supports two modes:
 * 1. Real Copilot Studio (if env vars present) - uses CopilotStudioAuth + CopilotStudioAdapter
 * 2. Mock implementations (fallback) - uses existing mock services
 */
export class CopilotIntegration {
  readonly auth: CopilotAuthService | CopilotStudioAuth;
  readonly chat: CopilotChatService | CopilotStudioAdapter;
  readonly retrieval: CopilotRetrievalService;
  readonly conversation: CopilotConversationService;
  readonly logger = require("./CopilotLogger").CopilotLogger;

  constructor() {
    // Check if Copilot Studio credentials are configured
    const hasCopilotStudioConfig = 
      process.env.COPILOT_STUDIO_ENDPOINT && 
      process.env.COPILOT_STUDIO_CLIENT_ID;

    if (hasCopilotStudioConfig) {
      console.log("[CopilotIntegration] Using real Copilot Studio implementation");
      // Use real Copilot Studio implementation
      const csAuth = new CopilotStudioAuth({
        endpoint: process.env.COPILOT_STUDIO_ENDPOINT!,
        clientId: process.env.COPILOT_STUDIO_CLIENT_ID!,
        clientSecret: process.env.COPILOT_STUDIO_CLIENT_SECRET,
        tenantId: process.env.COPILOT_STUDIO_TENANT_ID,
      });
      const sessionManager = new CopilotSessionManager();
      this.auth = csAuth;
      this.chat = new CopilotStudioAdapter(csAuth, sessionManager);
      this.retrieval = new CopilotRetrievalService(); // Keep mock for now
      this.conversation = new CopilotConversationService(this.chat as any);
    } else {
      console.log("[CopilotIntegration] Copilot Studio not configured; using mocks");
      // Fall back to mock implementations
      this.auth = new CopilotAuthService();
      this.chat = new CopilotChatService();
      this.retrieval = new CopilotRetrievalService();
      this.conversation = new CopilotConversationService(this.chat);
    }
  }
}

let integration: CopilotIntegration | null = null;

export function getCopilotIntegration(): CopilotIntegration {
  if (!integration) {
    integration = new CopilotIntegration();
  }
  return integration;
}
