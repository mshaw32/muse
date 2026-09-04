/**
 * Real Copilot Studio integration layer for the MUSE backend.
 *
 * This is created separately from the mock CopilotService so we can:
 * 1. Keep the mock CopilotService for fallback / testing
 * 2. Gradually migrate endpoints to use real Copilot Studio
 * 3. Control auth via environment variables
 *
 * In production, set env vars to enable real integration:
 * - COPILOT_STUDIO_ENDPOINT
 * - COPILOT_STUDIO_CLIENT_ID
 * - COPILOT_STUDIO_CLIENT_SECRET (OAuth2)
 * - COPILOT_STUDIO_TENANT_ID (OAuth2)
 */

import { Logger } from "@muse/shared";
import {
  CopilotStudioAuth,
  CopilotStudioAdapter,
  CopilotSessionManager,
  createAuthFromEnv,
} from "@muse/services";

let copilotIntegration: CopilotStudioIntegration | null = null;

/**
 * Singleton Copilot Studio integration.
 * Lazily initializes on first call; returns null if auth config is missing.
 */
export function getCopilotIntegration(): CopilotStudioIntegration {
  if (!copilotIntegration) {
    copilotIntegration = new CopilotStudioIntegration();
  }
  return copilotIntegration;
}

/**
 * Wrapper around CopilotStudioAdapter and CopilotStudioAuth.
 */
export class CopilotStudioIntegration {
  readonly auth: CopilotStudioAuth;
  readonly adapter: CopilotStudioAdapter;
  readonly chat: CopilotStudioAdapter;
  readonly retrieval: CopilotStudioRetrieval;
  readonly conversation: CopilotStudioConversationManager;
  private logger: Logger;

  constructor() {
    this.logger = new Logger("muse:backend:copilot-integration");

    try {
      this.auth = createAuthFromEnv();
      const sessionManager = new CopilotSessionManager();
      this.adapter = new CopilotStudioAdapter(this.auth, sessionManager);
      this.chat = this.adapter;
      this.retrieval = new CopilotStudioRetrieval(this.auth);
      this.conversation = new CopilotStudioConversationManager(sessionManager);
      this.logger.info("Copilot Studio integration initialized");
    } catch (error) {
      this.logger.warn("Copilot Studio auth config missing or invalid", {
        error: error instanceof Error ? error.message : String(error),
        hint: "Set COPILOT_STUDIO_ENDPOINT and COPILOT_STUDIO_CLIENT_ID to enable real integration",
      });

      // Fallback: create dummy auth/adapter that will fail gracefully
      this.auth = createDummyAuth();
      const sessionManager = new CopilotSessionManager();
      this.adapter = new CopilotStudioAdapter(this.auth, sessionManager);
      this.chat = this.adapter;
      this.retrieval = new CopilotStudioRetrieval(this.auth);
      this.conversation = new CopilotStudioConversationManager(sessionManager);
    }
  }
}

/**
 * Retrieval operations against Copilot Studio / Microsoft Graph.
 */
class CopilotStudioRetrieval {
  private auth: CopilotStudioAuth;
  private logger: Logger;

  constructor(auth: CopilotStudioAuth) {
    this.auth = auth;
    this.logger = new Logger("muse:copilot:retrieval");
  }

  async searchFiles(query: string, limit = 10) {
    this.logger.debug("searchFiles", { query, limit });
    // TODO: Call Copilot Studio retrieval API or Microsoft Graph /search/query
    return {
      sources: [
        { title: "Placeholder File Result", sourceType: "file" as const, url: "https://example.com/file" },
      ],
    };
  }

  async searchMeetings(query: string, limit = 10) {
    this.logger.debug("searchMeetings", { query, limit });
    return {
      sources: [
        { title: "Placeholder Meeting Result", sourceType: "meeting" as const },
      ],
    };
  }

  async searchProjects(query: string, limit = 10) {
    this.logger.debug("searchProjects", { query, limit });
    return { sources: [] };
  }

  async searchTasks(query: string, limit = 10) {
    this.logger.debug("searchTasks", { query, limit });
    return { sources: [] };
  }

  async searchContext(query: string, limit = 10) {
    this.logger.debug("searchContext", { query, limit });
    // General search across all work context (files, meetings, projects, tasks)
    return { sources: [] };
  }
}

/**
 * Conversation management via Copilot Studio sessions.
 */
class CopilotStudioConversationManager {
  private sessionManager: CopilotSessionManager;
  private logger: Logger;

  constructor(sessionManager: CopilotSessionManager) {
    this.sessionManager = sessionManager;
    this.logger = new Logger("muse:copilot:conversation");
  }

  startNew() {
    const session = this.sessionManager.createSession();
    this.logger.info("New conversation started", { conversationId: session.conversationId });
    return session;
  }

  getActive() {
    // In a real implementation, track which session is active
    return null;
  }

  clearActive() {
    // In a real implementation, clear active session messages
    return null;
  }

  history() {
    // In a real implementation, return all sessions
    return [];
  }

  async exportConversation(conversationId: string, format: "json" | "markdown") {
    const history = this.sessionManager.getHistory(conversationId as any);
    if (!history.length) {
      throw new Error("Conversation not found");
    }

    if (format === "json") {
      return JSON.stringify(history, null, 2);
    }

    // Markdown format
    const lines = history.map((msg) => `**${msg.role}:** ${msg.content}`).join("\n\n");
    return lines;
  }

  async summarizeConversation(conversationId: string) {
    // TODO: Call Copilot Studio to summarize
    return {
      summary: "Conversation summary placeholder",
      keyPoints: ["Key point 1", "Key point 2"],
    };
  }
}

/**
 * Dummy auth that always fails, used when env vars are missing.
 * This allows the backend to start even without Copilot Studio credentials.
 */
function createDummyAuth(): CopilotStudioAuth {
  return new (class extends CopilotStudioAuth {
    constructor() {
      super({
        endpoint: "https://copilot.microsoft.com/api",
        clientId: "dummy",
        clientSecret: "dummy",
      });
    }
  })();
}

export { CopilotStudioAuth, CopilotStudioAdapter } from "@muse/services";
