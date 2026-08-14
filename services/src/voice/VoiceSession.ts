/**
 * Represents a single push-to-talk / streaming voice interaction lifecycle.
 */

import { EntityId, generateId, nowISO } from "@muse/shared";
import { VoiceSessionInfo, VoiceSessionState } from "./VoiceModels";

export class VoiceSession {
  private readonly info: VoiceSessionInfo;

  constructor(id: EntityId = generateId("voice-session")) {
    const timestamp = nowISO();
    this.info = {
      id,
      state: "idle",
      startedAt: timestamp,
      lastActivityAt: timestamp,
    };
  }

  getInfo(): VoiceSessionInfo {
    return { ...this.info };
  }

  transition(state: VoiceSessionState): VoiceSessionInfo {
    this.info.state = state;
    this.info.lastActivityAt = nowISO();
    return this.getInfo();
  }
}
