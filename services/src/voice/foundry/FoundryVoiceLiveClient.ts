/**
 * FoundryVoiceLiveClient — connection/session lifecycle for Azure AI
 * Foundry Voice (Speech SDK), authenticated purely via Entra ID
 * (`FoundryTokenProvider`) rather than a subscription key.
 *
 * This client owns the `SpeechConfig` (built from an authorization token,
 * refreshed on demand) and exposes connect/disconnect/session lifecycle
 * plus a `ConnectionState` machine that `FoundrySpeechToText`,
 * `FoundryTextToSpeech`, and `VoiceDiagnostics` build on top of.
 */

import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { Logger } from "@muse/shared";
import { FoundryTokenProvider, foundryTokenProvider } from "./FoundryTokenProvider";
import { FoundryVoiceConfiguration, foundryVoiceConfiguration } from "./FoundryVoiceConfiguration";
import { FoundryVoiceLogger, foundryVoiceLogger } from "./FoundryVoiceLogger";

export type ConnectionState =
  | "Disconnected"
  | "Connecting"
  | "Connected"
  | "AuthenticationFailed"
  | "Error"
  | "Reconnecting";

export class FoundryVoiceLiveClient {
  private readonly tokenProvider: FoundryTokenProvider;
  private readonly config: FoundryVoiceConfiguration;
  private readonly logger: Logger;
  private readonly voiceLogger: FoundryVoiceLogger;

  private state: ConnectionState = "Disconnected";
  private sessionActive = false;
  private lastError: string | null = null;

  constructor(
    tokenProvider: FoundryTokenProvider = foundryTokenProvider,
    config: FoundryVoiceConfiguration = foundryVoiceConfiguration,
    logger: Logger = new Logger("muse:voice:foundry:client"),
    voiceLogger: FoundryVoiceLogger = foundryVoiceLogger,
  ) {
    this.tokenProvider = tokenProvider;
    this.config = config;
    this.logger = logger;
    this.voiceLogger = voiceLogger;
  }

  getState(): ConnectionState {
    return this.state;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  isConnected(): boolean {
    return this.state === "Connected";
  }

  /**
   * Builds a fresh `SpeechConfig` authorized via the current Entra ID
   * access token (never a subscription key). Callers should request a new
   * `SpeechConfig` per recognizer/synthesizer since authorization tokens
   * are short-lived and the SDK does not auto-refresh them.
   */
  async createSpeechConfig(): Promise<sdk.SpeechConfig> {
    const token = await this.tokenProvider.getAccessToken();
    const values = this.config.getValues();
    const speechConfig = sdk.SpeechConfig.fromEndpoint(new URL(values.speechEndpoint));
    speechConfig.authorizationToken = token;
    speechConfig.speechRecognitionLanguage = values.sttLanguage;
    speechConfig.speechSynthesisVoiceName = values.ttsVoiceName;
    return speechConfig;
  }

  /**
   * Establishes connectivity: verifies authentication and that a
   * `SpeechConfig` can be constructed against the configured endpoint.
   * Does not open a long-lived socket by itself — individual
   * recognizer/synthesizer sessions manage their own connections, but this
   * gives callers (and `VoiceDiagnostics`) a single connect/disconnect seam
   * and connection-state to observe.
   */
  async connect(): Promise<void> {
    this.setState("Connecting");
    try {
      await this.createSpeechConfig();
      this.setState("Connected");
      this.lastError = null;
      this.voiceLogger.logConnection("Connected");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = message;
      const isAuthError = message.toLowerCase().includes("authentication") || message.toLowerCase().includes("login");
      this.setState(isAuthError ? "AuthenticationFailed" : "Error");
      this.voiceLogger.logError(message);
      throw error;
    }
  }

  disconnect(): void {
    this.sessionActive = false;
    this.setState("Disconnected");
    this.voiceLogger.logConnection("Disconnected");
  }

  startSession(): void {
    this.sessionActive = true;
    this.voiceLogger.logSession("start");
  }

  endSession(): void {
    this.sessionActive = false;
    this.voiceLogger.logSession("end");
  }

  isSessionActive(): boolean {
    return this.sessionActive;
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.logger.info("Foundry connection state changed", { state });
  }
}

export const foundryVoiceLiveClient = new FoundryVoiceLiveClient();
