/**
 * FoundryVoiceLogger — structured telemetry for the real Azure AI Foundry
 * Voice pipeline (connection/auth/session/transcript/speech events plus
 * latency), separate from the Phase 4 mock `VoiceLogger` so real-provider
 * diagnostics stay distinguishable from mock telemetry in logs and in the
 * `VoiceDiagnostics` report.
 */

import { Logger, nowISO } from "@muse/shared";

export type FoundryVoiceEventType =
  | "connection"
  | "authentication"
  | "session"
  | "transcript"
  | "speech"
  | "error"
  | "latency";

export interface FoundryVoiceEvent {
  type: FoundryVoiceEventType;
  detail: Record<string, unknown>;
  timestamp: string;
}

export class FoundryVoiceLogger {
  private readonly logger: Logger;
  private readonly events: FoundryVoiceEvent[] = [];
  private readonly maxEvents = 200;

  constructor(logger: Logger = new Logger("muse:voice:foundry")) {
    this.logger = logger;
  }

  logConnection(state: string): void {
    this.record("connection", { state });
    this.logger.info("Foundry connection event", { state });
  }

  logAuthentication(mode: string, authenticated: boolean, message?: string): void {
    this.record("authentication", { mode, authenticated, message });
    this.logger.info("Foundry authentication event", { mode, authenticated, message });
  }

  logSession(action: "start" | "end"): void {
    this.record("session", { action });
    this.logger.info("Foundry session event", { action });
  }

  logTranscript(isFinal: boolean, textLength: number): void {
    this.record("transcript", { isFinal, textLength });
    this.logger.debug(isFinal ? "Foundry final transcript" : "Foundry partial transcript", { textLength });
  }

  logSpeech(action: "start" | "end", durationMs?: number): void {
    this.record("speech", { action, durationMs });
    this.logger.debug("Foundry speech event", { action, durationMs });
  }

  logLatency(operation: string, durationMs: number): void {
    this.record("latency", { operation, durationMs });
    this.logger.debug("Foundry latency", { operation, durationMs });
  }

  logError(message: string): void {
    this.record("error", { message });
    this.logger.error("Foundry voice error", { message });
  }

  recentEvents(limit = 50): FoundryVoiceEvent[] {
    return this.events.slice(-limit);
  }

  private record(type: FoundryVoiceEventType, detail: Record<string, unknown>): void {
    this.events.push({ type, detail, timestamp: nowISO() });
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
  }
}

export const foundryVoiceLogger = new FoundryVoiceLogger();
