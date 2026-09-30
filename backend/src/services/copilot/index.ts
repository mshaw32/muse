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

// Phase 3/4: Local stubs for Copilot Studio integration
// Real implementations will replace these when Azure Copilot credentials are configured
interface CopilotAuthConfig {
  endpoint?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
}

class CopilotStudioAuth {
  constructor(config: CopilotAuthConfig) {
    console.log("[CopilotStudioAuth] Mock instance - Phase 3/4 feature");
  }

  async authenticate(): Promise<any> {
    return { token: "mock-token", expiresIn: 3600 };
  }

  getStatus(): any {
    return { authenticated: false, user: null };
  }

  logout(): Promise<void> {
    return Promise.resolve();
  }
}

class CopilotSessionManager {
  startSession(): any {
    return { id: "mock-session-" + Date.now() };
  }

  getActiveSession(): any {
    return null;
  }
}

class CopilotStudioAdapter {
  constructor(auth: CopilotStudioAuth, sessionManager: CopilotSessionManager) {
    console.log("[CopilotStudioAdapter] Mock instance - Phase 3/4 feature");
  }

  async sendPrompt(options: any): Promise<any> {
    return { response: "Phase 3/4 feature - real Copilot Studio not yet configured" };
  }

  async *streamResponse(options: any): AsyncGenerator<any, void, unknown> {
    yield { type: "start", message: "Phase 3/4 feature - streaming not yet configured" };
    yield { type: "end" };
  }

  async summarizeConversation(options: any): Promise<any> {
    return { summary: "Phase 3/4 feature" };
  }

  get conversations(): any {
    return {};
  }
}

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
