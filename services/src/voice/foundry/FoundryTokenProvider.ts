/**
 * FoundryTokenProvider — Entra ID authentication for Azure AI Foundry Voice.
 *
 * MUSE authenticates as the currently signed-in Azure user. No App
 * Registration, client secret, service principal, or managed identity is
 * required or supported here — only interactive/CLI-based credentials that
 * work out of the box for a developer who has already run `az login`.
 *
 * Token acquisition uses the Cognitive Services resource scope
 * (`https://cognitiveservices.azure.com/.default`), which Azure AI Foundry
 * Speech (a Cognitive Services "AIServices" account) accepts for
 * AAD-token-based Speech SDK/REST authentication.
 */

import { Logger } from "@muse/shared";
import { AzureCliCredential, DefaultAzureCredential, TokenCredential } from "@azure/identity";

const COGNITIVE_SERVICES_SCOPE = "https://cognitiveservices.azure.com/.default";

export type FoundryAuthenticationMode = "default-azure-credential" | "azure-cli-credential" | "unauthenticated";

export interface FoundryAuthenticationStatus {
  mode: FoundryAuthenticationMode;
  authenticated: boolean;
  message: string;
  checkedAt: string;
}

/**
 * Resolves and caches an Entra ID credential for Azure AI Foundry Voice,
 * preferring `DefaultAzureCredential` (which itself tries the Azure CLI,
 * environment, managed identity, etc. in order) and falling back to an
 * explicit `AzureCliCredential` if `DefaultAzureCredential` cannot resolve
 * a token — this keeps `az login` working even in environments where
 * `DefaultAzureCredential`'s other probes (e.g. environment variables)
 * would otherwise short-circuit before reaching the CLI credential.
 */
export class FoundryTokenProvider {
  private readonly logger: Logger;
  private credential: TokenCredential | null = null;
  private mode: FoundryAuthenticationMode = "unauthenticated";
  private cachedToken: { token: string; expiresOnTimestamp: number } | null = null;

  constructor(logger: Logger = new Logger("muse:voice:foundry:auth")) {
    this.logger = logger;
  }

  /** Lazily resolves the credential, preferring DefaultAzureCredential then AzureCliCredential. */
  getCredential(): TokenCredential {
    if (this.credential) return this.credential;

    try {
      this.credential = new DefaultAzureCredential();
      this.mode = "default-azure-credential";
      this.logger.info("Using DefaultAzureCredential (will include Azure CLI login).");
    } catch (error) {
      this.logger.warn("DefaultAzureCredential unavailable, falling back to AzureCliCredential", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.credential = new AzureCliCredential();
      this.mode = "azure-cli-credential";
    }

    return this.credential;
  }

  getCurrentAuthenticationMode(): FoundryAuthenticationMode {
    return this.mode;
  }

  /**
   * Returns a valid Entra ID access token for the Cognitive Services scope,
   * refreshing when the cached token is near expiry. Throws a descriptive
   * error (never a raw SDK stack trace) when no signed-in Azure session is
   * available (e.g. `az login` was never run).
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresOnTimestamp - now > 60_000) {
      return this.cachedToken.token;
    }

    const credential = this.getCredential();

    try {
      const token = await credential.getToken(COGNITIVE_SERVICES_SCOPE);
      if (!token) {
        throw new Error("No token returned by credential.");
      }
      this.cachedToken = { token: token.token, expiresOnTimestamp: token.expiresOnTimestamp };
      return token.token;
    } catch (error) {
      // AzureCliCredential is the last resort — try it explicitly before giving up,
      // in case DefaultAzureCredential picked a different (failing) probe first.
      if (this.mode !== "azure-cli-credential") {
        try {
          const cliCredential = new AzureCliCredential();
          const token = await cliCredential.getToken(COGNITIVE_SERVICES_SCOPE);
          if (token) {
            this.credential = cliCredential;
            this.mode = "azure-cli-credential";
            this.cachedToken = { token: token.token, expiresOnTimestamp: token.expiresOnTimestamp };
            return token.token;
          }
        } catch (cliError) {
          this.logger.error("AzureCliCredential fallback also failed", {
            error: cliError instanceof Error ? cliError.message : String(cliError),
          });
        }
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Azure AI Foundry Voice authentication failed. Run "az login" and ensure your account has ` +
          `access to the configured Cognitive Services resource. Original error: ${message}`,
      );
    }
  }

  /**
   * Validates that a token can currently be acquired (used by
   * `VoiceDiagnostics.testAuthentication()`), without throwing.
   */
  async validateAuthentication(): Promise<FoundryAuthenticationStatus> {
    const checkedAt = new Date().toISOString();
    try {
      await this.getAccessToken();
      return {
        mode: this.mode,
        authenticated: true,
        message: `Authenticated via ${this.mode}.`,
        checkedAt,
      };
    } catch (error) {
      return {
        mode: this.mode,
        authenticated: false,
        message: error instanceof Error ? error.message : String(error),
        checkedAt,
      };
    }
  }

  /** Clears any cached token, forcing the next call to re-authenticate. */
  reset(): void {
    this.cachedToken = null;
  }
}

export const foundryTokenProvider = new FoundryTokenProvider();
