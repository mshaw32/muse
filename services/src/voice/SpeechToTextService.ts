/**
 * SpeechToTextService — Phase 4 event-driven speech-to-text abstraction.
 *
 * Wraps the existing `SpeechToTextEngine` contract (implemented today by
 * `MockSpeechToText`) with a richer start/stop + partial/final/error event
 * API expected by the Phase 4 spec, while leaving the underlying Phase 2/3
 * engine and its contract untouched.
 */

import { Logger, generateId, nowISO } from "@muse/shared";
import { MockSpeechToText, SpeechToTextEngine } from "./SpeechToText";
import { TranscriptionChunk, TranscriptionResult, VoiceTranscript } from "./VoiceModels";
import { VoiceLogger, voiceLogger } from "./VoiceLogger";

export interface SpeechToTextEvents {
  onPartialTranscript?: (transcript: VoiceTranscript) => void;
  onFinalTranscript?: (transcript: VoiceTranscript) => void;
  onError?: (message: string) => void;
}

export class SpeechToTextService {
  private readonly engine: SpeechToTextEngine;
  private readonly logger: Logger;
  private readonly events: VoiceLogger;
  private listening = false;

  constructor(
    engine: SpeechToTextEngine = new MockSpeechToText(),
    events: VoiceLogger = voiceLogger,
    logger: Logger = new Logger("muse:voice:stt"),
  ) {
    this.engine = engine;
    this.events = events;
    this.logger = logger;
  }

  isListening(): boolean {
    return this.listening;
  }

  async startListening(sessionId: string, handlers: SpeechToTextEvents = {}): Promise<void> {
    this.listening = true;
    this.logger.info("Start listening", { sessionId });

    try {
      await this.engine.startStreaming((chunk: TranscriptionChunk) => {
        const transcript: VoiceTranscript = {
          id: generateId("voice-transcript"),
          sessionId,
          text: chunk.text,
          isFinal: chunk.isFinal,
          confidence: chunk.confidence,
          timestamp: chunk.timestamp,
        };
        this.events.logTranscript(sessionId, chunk.isFinal, chunk.text.length);
        if (chunk.isFinal) {
          handlers.onFinalTranscript?.(transcript);
        } else {
          handlers.onPartialTranscript?.(transcript);
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "speech_to_text_failed";
      this.events.logError(sessionId, message);
      handlers.onError?.(message);
    }
  }

  async stopListening(sessionId: string): Promise<TranscriptionResult> {
    this.listening = false;
    const result = await this.engine.stopStreaming();
    this.logger.info("Stop listening", { sessionId, textLength: result.fullText.length });
    return result;
  }

  /** Builds a final VoiceTranscript directly from a stopListening() result. */
  toFinalTranscript(sessionId: string, result: TranscriptionResult): VoiceTranscript {
    return {
      id: generateId("voice-transcript"),
      sessionId,
      text: result.fullText,
      isFinal: true,
      confidence: result.chunks[result.chunks.length - 1]?.confidence ?? 0.9,
      timestamp: nowISO(),
    };
  }
}
