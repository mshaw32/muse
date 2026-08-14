/**
 * Speech-to-text abstraction.
 *
 * Defines the streaming transcription contract MUSE will use against Azure
 * AI Foundry Voice Live. The mock implementation simulates a short
 * streaming transcription so the rest of the application (UI states,
 * conversation logging) can be built and tested end-to-end today.
 */

import { Logger, nowISO } from "@muse/shared";
import { TranscriptionChunk, TranscriptionResult } from "./VoiceModels";

export interface SpeechToTextEngine {
  startStreaming(onChunk: (chunk: TranscriptionChunk) => void): Promise<void>;
  stopStreaming(): Promise<TranscriptionResult>;
}

const MOCK_PHRASES = [
  "Hey MUSE, what's on my calendar today?",
  "Summarize my latest project notes.",
  "Draft a follow up email for the Contoso account.",
];

export class MockSpeechToText implements SpeechToTextEngine {
  private readonly logger: Logger;
  private chunks: TranscriptionChunk[] = [];
  private startedAt = 0;
  private streaming = false;

  constructor(logger: Logger = new Logger("muse:voice:stt")) {
    this.logger = logger;
  }

  async startStreaming(onChunk: (chunk: TranscriptionChunk) => void): Promise<void> {
    this.streaming = true;
    this.chunks = [];
    this.startedAt = Date.now();

    const phrase = MOCK_PHRASES[Math.floor(Math.random() * MOCK_PHRASES.length)];
    const words = phrase.split(" ");

    this.logger.debug("startStreaming (mock)");

    let partial = "";
    for (let i = 0; i < words.length; i += 1) {
      if (!this.streaming) break;
      partial = partial ? `${partial} ${words[i]}` : words[i];
      const chunk: TranscriptionChunk = {
        text: partial,
        isFinal: i === words.length - 1,
        confidence: 0.85 + Math.random() * 0.14,
        timestamp: nowISO(),
      };
      this.chunks.push(chunk);
      onChunk(chunk);
    }
  }

  async stopStreaming(): Promise<TranscriptionResult> {
    this.streaming = false;
    const fullText = this.chunks[this.chunks.length - 1]?.text ?? "";

    return {
      fullText,
      chunks: [...this.chunks],
      durationMs: Date.now() - this.startedAt,
    };
  }
}
