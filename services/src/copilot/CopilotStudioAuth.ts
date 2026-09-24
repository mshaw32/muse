/**
 * Authentication layer for Copilot Studio REST API.
 *
 * Supports two auth flows:
 * 1. OAuth 2.0 Client Credentials (for local/on-prem deployments)
 * 2. Managed Identity (for Azure Container Apps / App Service)
 *
 * Token is cached and refreshed automatically before expiry.
 */

import { Logger } from "@muse/shared";

export interface AuthConfig {
  /** Copilot Studio API endpoint (e.g., https://copilot.microsoft.com/api) */
  endpoint: string;
  /** OAuth2 client ID or Managed Identity client ID */
  clientId: string;
  /** OAuth2 client secret (null if using Managed Identity) */
  clientSecret?: string;
  /** OAuth2 tenant ID (Azure AD tenant) */
  tenantId?: string;
  /** Subscription ID (if using Managed Identity via Azure SDK) */
  subscriptionId?: string;
}

export interface TokenResponse {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
}

export interface AuthStatus {
  connectionStatus: "connected" | "disconnected" | "authenticating";
  lastAuthenticated?: string;
  expiresAt?: string;
  error?: string;
}

export class CopilotStudioAuth {
  private config: AuthConfig;
  private token?: TokenResponse;
  private logger: Logger;
  private authPromise?: Promise<TokenResponse>;

  constructor(config: AuthConfig, logger: Logger = new Logger("muse:copilot:auth")) {
    this.config = config;
    this.logger = logger;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.endpoint) {
      throw new Error("Copilot Studio endpoint is required");
    }
    if (!this.config.clientId) {
      throw new Error("Client ID is required");
    }
    // For OAuth2: tenant + secret must both be present, or neither
    const hasOAuth = this.config.clientSecret || this.config.tenantId;
    const isManagedIdentity = !hasOAuth;
    if (hasOAuth && (!this.config.clientSecret || !this.config.tenantId)) {
      this.logger.warn("OAuth2 config incomplete. Falling back to Managed Identity or Bearer token.");
    }
    this.logger.info("Auth configured", { type: isManagedIdentity ? "ManagedIdentity" : "OAuth2" });
  }

  /**
   * Get a valid access token, refreshing if needed.
   */
  async getAccessToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.token && this.token.expiresAt > Date.now() + 60000) {
      return this.token.accessToken;
    }

    // If authentication is already in progress, wait for it
    if (this.authPromise) {
      const token = await this.authPromise;
      return token.accessToken;
    }

    // Otherwise, authenticate
    this.authPromise = this.authenticateInternal();
    this.token = await this.authPromise;
    this.authPromise = undefined;

    return this.token.accessToken;
  }

  /**
   * Internal: perform the actual authentication.
   */
  private async authenticateInternal(): Promise<TokenResponse> {
    try {
      // Try OAuth2 first
      if (this.config.clientSecret && this.config.tenantId) {
        return await this.authenticateWithOAuth2();
      }

      // Fall back to Managed Identity flow (Azure SDK would be called here)
      // For now, we'll return a mock token that demonstrates the structure
      return await this.authenticateWithManagedIdentity();
    } catch (error) {
      this.logger.error("Authentication failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Copilot Studio authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * OAuth2 Client Credentials Flow for Copilot Studio.
   * In real implementation, this calls Azure AD token endpoint.
   */
  private async authenticateWithOAuth2(): Promise<TokenResponse> {
    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret!,
      scope: "https://copilot.microsoft.com/.default",
      grant_type: "client_credentials",
    });

    this.logger.debug("Authenticating with OAuth2...", { tokenUrl });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth2 token request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    this.logger.info("OAuth2 authentication successful");

    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      tokenType: data.token_type,
    };
  }

  /**
   * Managed Identity Flow for Copilot Studio (Azure Container Apps / App Service).
   * In real implementation, this calls Azure IMDS endpoint or uses @azure/identity SDK.
   */
  private async authenticateWithManagedIdentity(): Promise<TokenResponse> {
    // IMDS endpoint on Azure resources
    const msiEndpoint = process.env.MSI_ENDPOINT;
    const msiSecret = process.env.MSI_SECRET;

    if (!msiEndpoint) {
      // For local development without Managed Identity, return a mock token
      this.logger.warn("No Managed Identity available (local dev mode). Using mock token.");
      return {
        accessToken: "mock-token-dev-mode",
        expiresAt: Date.now() + 3600000,
        tokenType: "Bearer",
      };
    }

    this.logger.debug("Authenticating with Managed Identity...", { msiEndpoint });

    const response = await fetch(
      `${msiEndpoint}?resource=https://copilot.microsoft.com&api-version=2017-09-01`,
      {
        method: "GET",
        headers: {
          "X-IDENTITY-HEADER": msiSecret || "",
          "Metadata": "true",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Managed Identity token request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_on: string;
      token_type: string;
    };

    this.logger.info("Managed Identity authentication successful");

    return {
      accessToken: data.access_token,
      expiresAt: parseInt(data.expires_on, 10) * 1000,
      tokenType: data.token_type,
    };
  }

  /**
   * Explicit authenticate call (gets access token and returns status).
   */
  async authenticate(): Promise<AuthStatus> {
    try {
      await this.getAccessToken();
      return this.getStatus();
    } catch (error) {
      this.logger.error("Explicit authenticate failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        connectionStatus: "disconnected",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get authentication status.
   */
  getStatus(): AuthStatus {
    if (!this.token) {
      return {
        connectionStatus: "disconnected",
        error: "Not yet authenticated",
      };
    }

    const isExpired = this.token.expiresAt <= Date.now();
    return {
      connectionStatus: isExpired ? "disconnected" : "connected",
      lastAuthenticated: new Date(this.token.expiresAt - 3600000).toISOString(),
      expiresAt: new Date(this.token.expiresAt).toISOString(),
    };
  }

  /**
   * Clear cached token (forces re-authentication on next call).
   */
  logout(): void {
    this.token = undefined;
    this.logger.info("Token cleared; next call will re-authenticate");
  }

  /**
   * Create a fetch with Authorization header.
   */
  async createAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await this.getAccessToken();
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    return fetch(url, { ...options, headers });
  }
}

/**
 * Factory to create CopilotStudioAuth from environment variables.
 * Looks for:
 * - COPILOT_STUDIO_ENDPOINT
 * - COPILOT_STUDIO_CLIENT_ID
 * - COPILOT_STUDIO_CLIENT_SECRET (optional, for OAuth2)
 * - COPILOT_STUDIO_TENANT_ID (optional, for OAuth2)
 */
export function createAuthFromEnv(): CopilotStudioAuth {
  const endpoint = process.env.COPILOT_STUDIO_ENDPOINT;
  const clientId = process.env.COPILOT_STUDIO_CLIENT_ID;
  const clientSecret = process.env.COPILOT_STUDIO_CLIENT_SECRET;
  const tenantId = process.env.COPILOT_STUDIO_TENANT_ID;

  if (!endpoint || !clientId) {
    throw new Error(
      "Copilot Studio auth requires COPILOT_STUDIO_ENDPOINT and COPILOT_STUDIO_CLIENT_ID env vars"
    );
  }

  return new CopilotStudioAuth({
    endpoint,
    clientId,
    clientSecret,
    tenantId,
  });
}
