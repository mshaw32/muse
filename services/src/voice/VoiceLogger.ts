/**
 * Structured logger for the Phase 4 Azure AI Foundry Voice layer.
 *
 * Mirrors the `CopilotLogger` convention: a rolling in-memory event buffer
 * plus console logging via `@muse/shared` `Logger`, so voice telemetry can
 * later be swapped for real Application Insights instrumentation without
 * touching call sites.
 */

import { Logger, nowISO } from "@muse/shared";
import { VoiceEvent, VoiceEventType } from "./VoiceModels";

export class VoiceLogger {
  private readonly logger: Logger;
  private readonly events: VoiceEvent[] = [];
  private readonly maxEvents = 200;

  constructor(logger: Logger = new Logger("muse:voice")) {
    this.logger = logger;
  }

  logSessionStart(sessionId: string, detail?: Record<string, unknown>): void {
    this.record("session_start", sessionId, detail);
    this.logger.info("Voice session started", { sessionId, ...detail });
  }

  logSessionStop(sessionId: string, detail?: Record<string, unknown>): void {
    this.record("session_stop", sessionId, detail);
    this.logger.info("Voice session stopped", { sessionId, ...detail });
  }

  logSessionPause(sessionId: string): void {
    this.record("session_pause", sessionId);
    this.logger.debug("Voice session paused", { sessionId });
  }

  logSessionResume(sessionId: string): void {
    this.record("session_resume", sessionId);
    this.logger.debug("Voice session resumed", { sessionId });
  }

  logTranscript(sessionId: string, isFinal: boolean, textLength: number): void {
    this.record(isFinal ? "transcript_final" : "transcript_partial", sessionId, { textLength });
    this.logger.debug(isFinal ? "Final transcript" : "Partial transcript", { sessionId, textLength });
  }

  logSpeechStart(sessionId: string | undefined, textLength: number): void {
    this.record("speech_start", sessionId, { textLength });
    this.logger.debug("Speech synthesis started", { sessionId, textLength });
  }

  logSpeechEnd(sessionId: string | undefined, durationMs: number): void {
    this.record("speech_end", sessionId, { durationMs });
    this.logger.debug("Speech synthesis finished", { sessionId, durationMs });
  }

  logDeviceChange(kind: "microphone" | "speaker", deviceId: string): void {
    this.record("device_change", undefined, { kind, deviceId });
    this.logger.info("Voice device changed", { kind, deviceId });
  }

  logError(sessionId: string | undefined, error: string): void {
    this.record("error", sessionId, { error });
    this.logger.error("Voice error", { sessionId, error });
  }

  recentEvents(limit = 50): VoiceEvent[] {
    return this.events.slice(-limit);
  }

  private record(type: VoiceEventType, sessionId?: string, detail?: Record<string, unknown>): void {
    this.events.push({ type, sessionId, detail, timestamp: nowISO() });
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
  }
}

export const voiceLogger = new VoiceLogger();
