/**
 * TextToSpeechService — Phase 4 speech synthesis abstraction.
 *
 * Wraps the existing `TextToSpeechEngine` contract (implemented today by
 * `MockTextToSpeech`) with generate/stream/cancel + volume/voice-selection
 * controls expected by the Phase 4 spec, while leaving the underlying
 * Phase 2/3 engine and its contract untouched.
 */

import { Logger } from "@muse/shared";
import { MockTextToSpeech, TextToSpeechEngine } from "./TextToSpeech";
import { SynthesisRequest, SynthesisResult } from "./VoiceModels";
import { VoiceLogger, voiceLogger } from "./VoiceLogger";

export class TextToSpeechService {
  private readonly engine: TextToSpeechEngine;
  private readonly logger: Logger;
  private readonly events: VoiceLogger;
  private volume: number;
  private voiceProfileId: string;
  private cancelled = false;

  constructor(
    engine: TextToSpeechEngine = new MockTextToSpeech(),
    initialVolume = 0.8,
    initialVoiceProfileId = "muse-default",
    events: VoiceLogger = voiceLogger,
    logger: Logger = new Logger("muse:voice:tts"),
  ) {
    this.engine = engine;
    this.volume = initialVolume;
    this.voiceProfileId = initialVoiceProfileId;
    this.events = events;
    this.logger = logger;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  selectVoice(voiceProfileId: string): void {
    this.voiceProfileId = voiceProfileId;
    this.logger.info("Voice profile selected", { voiceProfileId });
  }

  getSelectedVoice(): string {
    return this.voiceProfileId;
  }

  async generate(sessionId: string | undefined, request: SynthesisRequest): Promise<SynthesisResult> {
    this.cancelled = false;
    const effectiveRequest: SynthesisRequest = {
      ...request,
      voiceProfileId: request.voiceProfileId ?? this.voiceProfileId,
    };

    this.events.logSpeechStart(sessionId, request.text.length);
    const result = await this.engine.synthesize(effectiveRequest);

    if (this.cancelled) {
      this.logger.info("Speech synthesis cancelled before completion", { sessionId });
      return { ...result, audioBase64: "" };
    }

    this.events.logSpeechEnd(sessionId, result.durationMs);
    return result;
  }

  /**
   * Streams speech by chunking `text` into sentence-sized segments and
   * synthesizing each, invoking `onChunk` as each becomes available. This
   * mirrors the eventual streaming contract of a real Azure AI Foundry
   * Voice Live text-to-speech stream.
   */
  async *stream(
    sessionId: string | undefined,
    request: SynthesisRequest,
  ): AsyncGenerator<SynthesisResult, void, void> {
    this.cancelled = false;
    const segments = request.text
      .split(/(?<=[.!?])\s+/)
      .map((segment) => segment.trim())
      .filter(Boolean);
    const chunks = segments.length > 0 ? segments : [request.text];

    this.events.logSpeechStart(sessionId, request.text.length);
    let totalDurationMs = 0;

    for (const chunk of chunks) {
      if (this.cancelled) break;
      const result = await this.engine.synthesize({ ...request, text: chunk, voiceProfileId: request.voiceProfileId ?? this.voiceProfileId });
      totalDurationMs += result.durationMs;
      yield result;
    }

    this.events.logSpeechEnd(sessionId, totalDurationMs);
  }

  cancel(): void {
    this.cancelled = true;
    this.logger.info("Speech synthesis cancel requested");
  }
}
