/**
 * VoiceSessionManager — Phase 4 bookkeeping layer for voice sessions.
 *
 * Tracks a rolling history of started/stopped voice sessions (in-memory)
 * so the backend can report recent session activity to the frontend
 * (e.g. session history / diagnostics) without querying the runtime's
 * single active-session state directly.
 */

import { generateId, nowISO } from "@muse/shared";
import type { VoiceSessionSnapshot, VoiceTranscript } from "@muse/services";

export interface VoiceSessionRecord {
  id: string;
  startedAt: string;
  endedAt: string | null;
  transcript: VoiceTranscript | null;
}

export class VoiceSessionManager {
  private readonly records: VoiceSessionRecord[] = [];
  private readonly maxRecords = 100;

  recordStart(session: VoiceSessionSnapshot | null): VoiceSessionRecord {
    const record: VoiceSessionRecord = {
      id: session?.id ?? generateId("voice-session"),
      startedAt: session?.startedAt ?? nowISO(),
      endedAt: null,
      transcript: null,
    };
    this.records.push(record);
    if (this.records.length > this.maxRecords) {
      this.records.splice(0, this.records.length - this.maxRecords);
    }
    return record;
  }

  recordStop(sessionId: string | undefined, transcript: VoiceTranscript | null): void {
    const record = [...this.records].reverse().find((entry) => entry.id === sessionId && entry.endedAt === null);
    if (record) {
      record.endedAt = nowISO();
      record.transcript = transcript;
    }
  }

  history(limit = 20): VoiceSessionRecord[] {
    return this.records.slice(-limit).reverse();
  }
}
