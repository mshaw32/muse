/**
 * VoiceDiagnostics — troubleshooting/health-check surface for the Azure AI
 * Foundry Voice pipeline.
 *
 * Used by the `/api/voice/status` route (and any future diagnostics UI) to
 * report authentication, connectivity, and end-to-end STT/TTS health
 * without requiring a live push-to-talk session.
 */

import { Logger } from "@muse/shared";
import { FoundryTokenProvider, foundryTokenProvider, FoundryAuthenticationStatus } from "./FoundryTokenProvider";
import { FoundryVoiceConfiguration, foundryVoiceConfiguration } from "./FoundryVoiceConfiguration";
import { FoundryVoiceLiveClient, foundryVoiceLiveClient, ConnectionState } from "./FoundryVoiceLiveClient";
import { FoundryTextToSpeech } from "./FoundryTextToSpeech";

export interface DiagnosticResult {
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export class VoiceDiagnostics {
  private readonly tokenProvider: FoundryTokenProvider;
  private readonly config: FoundryVoiceConfiguration;
  private readonly client: FoundryVoiceLiveClient;
  private readonly logger: Logger;

  constructor(
    tokenProvider: FoundryTokenProvider = foundryTokenProvider,
    config: FoundryVoiceConfiguration = foundryVoiceConfiguration,
    client: FoundryVoiceLiveClient = foundryVoiceLiveClient,
    logger: Logger = new Logger("muse:voice:diagnostics"),
  ) {
    this.tokenProvider = tokenProvider;
    this.config = config;
    this.client = client;
    this.logger = logger;
  }

  async testAuthentication(): Promise<DiagnosticResult> {
    const startedAt = Date.now();
    const status: FoundryAuthenticationStatus = await this.tokenProvider.validateAuthentication();
    return {
      name: "testAuthentication",
      passed: status.authenticated,
      message: status.message,
      durationMs: Date.now() - startedAt,
    };
  }

  async testConnectivity(): Promise<DiagnosticResult> {
    const startedAt = Date.now();
    try {
      await this.client.connect();
      const state: ConnectionState = this.client.getState();
      return {
        name: "testConnectivity",
        passed: state === "Connected",
        message: `Connection state: ${state}`,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: "testConnectivity",
        passed: false,
        message: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      };
    }
  }

  /**
   * Verifies the speech-to-text pipeline can be constructed and started
   * against Azure (auth + connection + recognizer creation). Does not
   * require live microphone audio — it starts and immediately stops a
   * recognition session against silence, which is sufficient to prove the
   * Foundry connection, auth token, and SDK wiring are all functional.
   */
  async testSpeechToText(): Promise<DiagnosticResult> {
    const startedAt = Date.now();
    try {
      const { FoundrySpeechToText } = await import("./FoundrySpeechToText");
      const stt = new FoundrySpeechToText(this.client);
      await stt.startStreaming(() => {});
      await new Promise((resolve) => setTimeout(resolve, 500));
      await stt.stopStreaming();
      return {
        name: "testSpeechToText",
        passed: true,
        message: "Speech-to-text session started and stopped successfully.",
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: "testSpeechToText",
        passed: false,
        message: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      };
    }
  }

  async testTextToSpeech(): Promise<DiagnosticResult> {
    const startedAt = Date.now();
    try {
      const tts = new FoundryTextToSpeech(this.client, this.config);
      const result = await tts.synthesize({ text: "MUSE voice diagnostics check." });
      return {
        name: "testTextToSpeech",
        passed: result.audioBase64.length > 0,
        message: `Synthesized ${result.audioBase64.length} base64 chars, ${result.durationMs}ms.`,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: "testTextToSpeech",
        passed: false,
        message: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      };
    }
  }

  getConfiguration() {
    return {
      provider: this.config.getProvider(),
      endpoint: this.config.getEndpoint(),
      region: this.config.getRegion(),
      model: this.config.getModel(),
      voiceProfile: this.config.getVoiceProfile(),
      authenticationMode: this.tokenProvider.getCurrentAuthenticationMode(),
      connectionState: this.client.getState(),
    };
  }

  /** Runs all four diagnostics in sequence and returns a combined report. */
  async runAll(): Promise<{ results: DiagnosticResult[]; configuration: ReturnType<VoiceDiagnostics["getConfiguration"]> }> {
    const results: DiagnosticResult[] = [];
    results.push(await this.testAuthentication());
    results.push(await this.testConnectivity());
    results.push(await this.testSpeechToText());
    results.push(await this.testTextToSpeech());
    this.logger.info("Voice diagnostics run complete", { results });
    return { results, configuration: this.getConfiguration() };
  }
}

export const voiceDiagnostics = new VoiceDiagnostics();
