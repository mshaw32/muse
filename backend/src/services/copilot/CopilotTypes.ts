/**
 * Phase 3 — Microsoft 365 Copilot integration types.
 *
 * These types describe the authentication and session lifecycle for the
 * Copilot integration layer. No credentials, tokens, or secrets are ever
 * hardcoded here — `CopilotAuthService` only ever produces mock values.
 */

import { ISOTimestamp } from "@muse/shared";

/** High level authentication state machine for the Copilot connection. */
export type CopilotAuthState = "unauthenticated" | "authenticating" | "authenticated" | "error";

/** Connection status surfaced to the frontend `CopilotStatus` component. */
export type CopilotConnectionStatus = "connected" | "disconnected" | "authenticating" | "error";

export interface CopilotTokenStatus {
  hasToken: boolean;
  /** Never a real token — only a mock/opaque identifier used for local bookkeeping. */
  tokenPreview: string | null;
  issuedAt: ISOTimestamp | null;
  expiresAt: ISOTimestamp | null;
  scopes: string[];
}

export interface CopilotAuthStatus {
  state: CopilotAuthState;
  connectionStatus: CopilotConnectionStatus;
  account: string | null;
  token: CopilotTokenStatus;
  lastError: string | null;
}
