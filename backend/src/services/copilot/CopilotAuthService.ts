/**
 * CopilotAuthService — authentication abstraction for the Microsoft 365
 * Copilot integration layer.
 *
 * This is a mock implementation. It never contacts any real identity
 * provider, never stores secrets/credentials, and never issues a real
 * access token. It exists so the rest of MUSE (and the frontend
 * `CopilotStatus` component) has a stable authentication contract to code
 * against ahead of real MSAL/Entra ID integration in a later phase.
 */

import { Logger, generateId, nowISO } from "@muse/shared";
import { CopilotAuthStatus, CopilotAuthState, CopilotConnectionStatus } from "./CopilotTypes";

const MOCK_AUTH_LATENCY_MS = 350;
const MOCK_TOKEN_LIFETIME_MS = 60 * 60 * 1000;

export class CopilotAuthService {
  private state: CopilotAuthState = "unauthenticated";
  private account: string | null = null;
  private tokenPreview: string | null = null;
  private issuedAt: string | null = null;
  private expiresAt: string | null = null;
  private lastError: string | null = null;
  private readonly scopes = ["Copilot.Chat", "Copilot.Retrieval"];
  private readonly logger: Logger;

  constructor(logger: Logger = new Logger("muse:copilot:auth")) {
    this.logger = logger;
  }

  isAuthenticated(): boolean {
    if (this.state !== "authenticated") return false;
    if (this.expiresAt && new Date(this.expiresAt).getTime() <= Date.now()) {
      // Mock token has expired — fall back to unauthenticated.
      this.state = "unauthenticated";
      this.tokenPreview = null;
      return false;
    }
    return true;
  }

  async authenticate(): Promise<CopilotAuthStatus> {
    this.state = "authenticating";
    this.lastError = null;
    this.logger.info("Authenticating with mock Microsoft 365 Copilot identity provider");

    await delay(MOCK_AUTH_LATENCY_MS);

    this.state = "authenticated";
    this.account = "mock.user@contoso.com";
    this.tokenPreview = `mock_${generateId("tok")}`;
    this.issuedAt = nowISO();
    this.expiresAt = new Date(Date.now() + MOCK_TOKEN_LIFETIME_MS).toISOString();

    this.logger.info("Authenticated (mock)", { account: this.account });
    return this.getStatus();
  }

  logout(): CopilotAuthStatus {
    this.logger.info("Logging out (mock)");
    this.state = "unauthenticated";
    this.account = null;
    this.tokenPreview = null;
    this.issuedAt = null;
    this.expiresAt = null;
    this.lastError = null;
    return this.getStatus();
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.tokenPreview;
  }

  getStatus(): CopilotAuthStatus {
    const connectionStatus = this.getConnectionStatus();
    return {
      state: this.state,
      connectionStatus,
      account: this.account,
      lastError: this.lastError,
      token: {
        hasToken: Boolean(this.tokenPreview) && this.isAuthenticated(),
        tokenPreview: this.tokenPreview,
        issuedAt: this.issuedAt,
        expiresAt: this.expiresAt,
        scopes: this.scopes,
      },
    };
  }

  private getConnectionStatus(): CopilotConnectionStatus {
    switch (this.state) {
      case "authenticated":
        return this.isAuthenticated() ? "connected" : "disconnected";
      case "authenticating":
        return "authenticating";
      case "error":
        return "error";
      case "unauthenticated":
      default:
        return "disconnected";
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
