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
import { ClientSecretCredential } from "@azure/identity";

// Phase 3/4: Local stubs for Copilot Studio integration
// Real implementations will replace these when Azure Copilot credentials are configured
interface CopilotAuthConfig {
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
}

/**
 * Real Copilot Studio Auth using Azure Identity (MSAL)
 * Authenticates with Azure AD to obtain real access tokens
 */
class CopilotStudioAuth {
  private credential: ClientSecretCredential | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private authenticated: boolean = false;
  private lastError: string | null = null;
  private readonly scopes = ["https://cognitiveservices.azure.com/.default"];

  constructor(private config: CopilotAuthConfig) {
    if (config.clientId && config.clientSecret && config.tenantId) {
      this.credential = new ClientSecretCredential(
        config.tenantId,
        config.clientId,
        config.clientSecret
      );
      console.log("[CopilotStudioAuth] Real Azure AD credential configured");
    } else {
      console.log("[CopilotStudioAuth] Missing credentials; falling back to mock");
    }
  }

  async authenticate(): Promise<any> {
    if (!this.credential) {
      console.warn("[CopilotStudioAuth] No credential available; returning mock token");
      return { token: "mock-token", expiresIn: 3600, authenticated: false };
    }

    try {
      const token = await this.credential.getToken(this.scopes);
      this.accessToken = token.token;
      this.tokenExpiresAt = new Date(token.expiresOnTimestamp * 1000);
      this.authenticated = true;
      this.lastError = null;

      console.log("[CopilotStudioAuth] Successfully authenticated with Azure AD");
      return {
        token: this.accessToken,
        expiresIn: Math.floor((this.tokenExpiresAt.getTime() - Date.now()) / 1000),
        authenticated: true,
      };
    } catch (error) {
      this.authenticated = false;
      this.lastError = error instanceof Error ? error.message : String(error);
      console.error("[CopilotStudioAuth] Authentication failed:", this.lastError);
      return {
        token: null,
        error: this.lastError,
        authenticated: false,
      };
    }
  }

  /**
   * Get current authentication status
   * If token is expired, attempt to refresh or mark as disconnected
   */
  getStatus(): any {
    // Check if token is expired
    if (this.tokenExpiresAt && new Date() > this.tokenExpiresAt) {
      this.authenticated = false;
      this.accessToken = null;
    }

    return {
      authenticated: this.authenticated,
      state: this.authenticated ? "authenticated" : "unauthenticated",
      connectionStatus: this.authenticated ? "connected" : "disconnected",
      hasToken: Boolean(this.accessToken),
      tokenExpiresAt: this.tokenExpiresAt?.toISOString() || null,
      lastError: this.lastError,
      user: this.authenticated ? { authenticated: true } : null,
    };
  }

  async logout(): Promise<void> {
    this.authenticated = false;
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.lastError = null;
    console.log("[CopilotStudioAuth] Logged out");
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.authenticated || !this.accessToken) {
      return null;
    }

    // Check if token is near expiry (within 5 minutes)
    if (
      this.tokenExpiresAt &&
      this.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000
    ) {
      // Token is expiring soon, attempt to refresh
      await this.authenticate();
    }

    return this.accessToken;
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
 * 1. Real Copilot Studio (if credentials present) - uses real Azure AD auth
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
    const clientId = process.env.COPILOT_STUDIO_CLIENT_ID;
    const clientSecret = process.env.COPILOT_STUDIO_CLIENT_SECRET;
    const tenantId = process.env.COPILOT_STUDIO_TENANT_ID;
    const hasCopilotStudioConfig = clientId && clientSecret && tenantId;

    if (hasCopilotStudioConfig) {
      console.log("[CopilotIntegration] Using real Copilot Studio implementation with Azure AD");
      // Use real Copilot Studio implementation
      const csAuth = new CopilotStudioAuth({
        clientId,
        clientSecret,
        tenantId,
      });
      const sessionManager = new CopilotSessionManager();
      this.auth = csAuth;
      this.chat = new CopilotStudioAdapter(csAuth, sessionManager);
      this.retrieval = new CopilotRetrievalService(); // Keep mock for now
      this.conversation = new CopilotConversationService(this.chat as any);
      
      // Automatically authenticate on startup
      csAuth.authenticate().then((result: any) => {
        if (result.authenticated) {
          console.log("[CopilotIntegration] ✅ Successfully authenticated with Azure AD on startup");
        } else {
          console.warn("[CopilotIntegration] ⚠️ Failed to authenticate on startup:", result.error);
        }
      });
    } else {
      console.log("[CopilotIntegration] Copilot Studio not configured; using mocks");
      console.log("[CopilotIntegration] Set COPILOT_STUDIO_CLIENT_ID, COPILOT_STUDIO_CLIENT_SECRET, and COPILOT_STUDIO_TENANT_ID to enable real auth");
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
