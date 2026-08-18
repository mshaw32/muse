/**
 * VoiceSessionService — Phase 4 realtime voice session lifecycle manager.
 *
 * Tracks a single active voice session (start/stop/pause/resume) using the
 * Phase 4 6-state model (Idle/Listening/Processing/Speaking/Disconnected/
 * Error). Wraps the existing `VoiceSession` class (kept intact) so the
 * Phase 2/3 `VoiceService` facade continues to work unmodified.
 */

import { EntityId, Logger, generateId, nowISO } from "@muse/shared";
import { VoiceSession as LegacyVoiceSession } from "./VoiceSession";
import { SESSION_STATE_TO_VOICE_STATE, VoiceSessionSnapshot, VoiceSessionState, VoiceState } from "./VoiceModels";
import { VoiceLogger, voiceLogger } from "./VoiceLogger";

export class VoiceSessionService {
  private readonly logger: Logger;
  private readonly events: VoiceLogger;
  private active: LegacyVoiceSession | null = null;
  private activeMicrophoneId: string | null = null;
  private activeSpeakerId: string | null = null;

  constructor(events: VoiceLogger = voiceLogger, logger: Logger = new Logger("muse:voice:session")) {
    this.events = events;
    this.logger = logger;
  }

  startSession(microphoneId?: string | null, speakerId?: string | null): VoiceSessionSnapshot {
    this.active = new LegacyVoiceSession();
    this.activeMicrophoneId = microphoneId ?? null;
    this.activeSpeakerId = speakerId ?? null;
    const info = this.active.transition("listening");
    this.events.logSessionStart(info.id, { microphoneId, speakerId });
    this.logger.info("Voice session started", { sessionId: info.id });
    return this.toVoiceSession(info.id, "listening");
  }

  stopSession(): VoiceSessionSnapshot | null {
    if (!this.active) return null;
    const info = this.active.transition("idle");
    this.events.logSessionStop(info.id);
    this.logger.info("Voice session stopped", { sessionId: info.id });
    const session = this.toVoiceSession(info.id, "idle");
    this.active = null;
    return session;
  }

  pauseSession(): VoiceSessionSnapshot | null {
    if (!this.active) return null;
    // "processing" doubles as the paused state — no state removal/renames
    // are made to the shared VoiceSessionState union to keep this additive.
    const info = this.active.transition("processing");
    this.events.logSessionPause(info.id);
    return this.toVoiceSession(info.id, "processing");
  }

  resumeSession(): VoiceSessionSnapshot | null {
    if (!this.active) return null;
    const info = this.active.transition("listening");
    this.events.logSessionResume(info.id);
    return this.toVoiceSession(info.id, "listening");
  }

  transition(state: VoiceSessionState): VoiceSessionSnapshot | null {
    if (!this.active) return null;
    const info = this.active.transition(state);
    return this.toVoiceSession(info.id, state);
  }

  disconnect(reason?: string): VoiceSessionSnapshot | null {
    if (!this.active) return null;
    const info = this.active.transition("disconnected");
    this.events.logError(info.id, reason ?? "disconnected");
    return this.toVoiceSession(info.id, "disconnected");
  }

  markError(message: string): VoiceSessionSnapshot | null {
    const sessionId = this.active?.getInfo().id;
    if (this.active) {
      this.active.transition("error");
    }
    this.events.logError(sessionId, message);
    return this.active ? this.toVoiceSession(this.active.getInfo().id, "error") : null;
  }

  getActiveSession(): VoiceSessionSnapshot | null {
    if (!this.active) return null;
    const info = this.active.getInfo();
    return this.toVoiceSession(info.id, info.state);
  }

  hasActiveSession(): boolean {
    return this.active !== null;
  }

  getCurrentVoiceState(): VoiceState {
    if (!this.active) return "Idle";
    return SESSION_STATE_TO_VOICE_STATE[this.active.getInfo().state];
  }

  private toVoiceSession(id: EntityId, state: VoiceSessionState): VoiceSessionSnapshot {
    const info = this.active?.getInfo();
    return {
      id: id ?? generateId("voice-session"),
      state: SESSION_STATE_TO_VOICE_STATE[state],
      startedAt: info?.startedAt ?? nowISO(),
      lastActivityAt: info?.lastActivityAt ?? nowISO(),
      microphoneId: this.activeMicrophoneId,
      speakerId: this.activeSpeakerId,
    };
  }
}
