/**
 * FoundrySpeechToText — real Azure AI Foundry speech-to-text.
 *
 * Implements the existing `SpeechToTextEngine` contract exactly (no
 * changes to `TranscriptionChunk`/`TranscriptionResult`) so it can be
 * dropped in wherever `MockSpeechToText` is used today (see
 * `VoiceConfiguration`/`VoiceService` provider switching).
 *
 * Audio capture happens in the renderer/Electron process (real
 * microphone access via `getUserMedia`, which Node cannot do headlessly);
 * raw 16kHz/16-bit/mono PCM chunks are pushed into this engine via
 * `feedAudio()` and streamed to Azure Cognitive Services Speech through a
 * `PushAudioInputStream`, authenticated purely via the caller's signed-in
 * Entra ID identity (`FoundryTokenProvider` — no subscription key).
 */

import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { Logger, nowISO } from "@muse/shared";
import { SpeechToTextEngine } from "../SpeechToText";
import { TranscriptionChunk, TranscriptionResult } from "../VoiceModels";
import { FoundryVoiceLiveClient, foundryVoiceLiveClient } from "./FoundryVoiceLiveClient";
import { FoundryVoiceLogger, foundryVoiceLogger } from "./FoundryVoiceLogger";

/** 16kHz / 16-bit / mono PCM — the format the frontend microphone capture pipeline emits. */
const SAMPLE_RATE = 16000;
const BITS_PER_SAMPLE = 16;
const CHANNELS = 1;

export class FoundrySpeechToText implements SpeechToTextEngine {
  private readonly client: FoundryVoiceLiveClient;
  private readonly logger: Logger;
  private readonly voiceLogger: FoundryVoiceLogger;

  private pushStream: sdk.PushAudioInputStream | null = null;
  private recognizer: sdk.SpeechRecognizer | null = null;
  private chunks: TranscriptionChunk[] = [];
  private startedAt = 0;
  private streaming = false;
  private resolveStop: ((result: TranscriptionResult) => void) | null = null;

  constructor(
    client: FoundryVoiceLiveClient = foundryVoiceLiveClient,
    logger: Logger = new Logger("muse:voice:foundry:stt"),
    voiceLogger: FoundryVoiceLogger = foundryVoiceLogger,
  ) {
    this.client = client;
    this.logger = logger;
    this.voiceLogger = voiceLogger;
  }

  /**
   * Feeds a chunk of raw 16kHz/16-bit/mono PCM audio (captured in the
   * renderer from the real microphone) into the active recognition
   * session. No-ops if no session is currently streaming.
   */
  feedAudio(pcmChunk: Buffer | ArrayBuffer): void {
    if (!this.streaming || !this.pushStream) return;
    const buffer = Buffer.isBuffer(pcmChunk) ? pcmChunk : Buffer.from(new Uint8Array(pcmChunk));
    this.pushStream.write(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
  }

  async startStreaming(onChunk: (chunk: TranscriptionChunk) => void): Promise<void> {
    this.chunks = [];
    this.startedAt = Date.now();
    this.streaming = true;

    const speechConfig = await this.client.createSpeechConfig();
    const audioFormat = sdk.AudioStreamFormat.getWaveFormatPCM(SAMPLE_RATE, BITS_PER_SAMPLE, CHANNELS);
    this.pushStream = sdk.AudioInputStream.createPushStream(audioFormat);
    const audioConfig = sdk.AudioConfig.fromStreamInput(this.pushStream);

    this.recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    this.client.startSession();

    this.recognizer.recognizing = (_sender, event) => {
      if (!event.result.text) return;
      const chunk: TranscriptionChunk = {
        text: event.result.text,
        isFinal: false,
        confidence: 0.0,
        timestamp: nowISO(),
      };
      this.chunks.push(chunk);
      this.voiceLogger.logTranscript(false, chunk.text.length);
      onChunk(chunk);
    };

    this.recognizer.recognized = (_sender, event) => {
      if (event.result.reason !== sdk.ResultReason.RecognizedSpeech) return;
      const confidence = extractConfidence(event.result);
      const chunk: TranscriptionChunk = {
        text: event.result.text,
        isFinal: true,
        confidence,
        timestamp: nowISO(),
      };
      this.chunks.push(chunk);
      this.voiceLogger.logTranscript(true, chunk.text.length);
      onChunk(chunk);
    };

    this.recognizer.canceled = (_sender, event) => {
      const message = `Foundry speech recognition canceled: ${event.errorDetails ?? event.reason}`;
      this.logger.error(message);
      this.voiceLogger.logError(message);
    };

    await new Promise<void>((resolve, reject) => {
      this.recognizer!.startContinuousRecognitionAsync(
        () => {
          this.logger.info("Foundry continuous recognition started");
          resolve();
        },
        (error) => reject(new Error(`Failed to start Foundry speech recognition: ${error}`)),
      );
    });
  }

  async stopStreaming(): Promise<TranscriptionResult> {
    this.streaming = false;

    if (this.recognizer) {
      await new Promise<void>((resolve) => {
        this.recognizer!.stopContinuousRecognitionAsync(
          () => resolve(),
          (error) => {
            this.logger.warn("Error stopping Foundry recognition", { error: String(error) });
            resolve();
          },
        );
      });
      this.recognizer.close();
      this.recognizer = null;
    }

    if (this.pushStream) {
      this.pushStream.close();
      this.pushStream = null;
    }

    this.client.endSession();

    const fullText = this.chunks.filter((chunk) => chunk.isFinal).map((chunk) => chunk.text).join(" ").trim()
      || this.chunks[this.chunks.length - 1]?.text
      || "";

    const result: TranscriptionResult = {
      fullText,
      chunks: [...this.chunks],
      durationMs: Date.now() - this.startedAt,
    };

    this.resolveStop?.(result);
    this.resolveStop = null;

    return result;
  }
}

function extractConfidence(result: sdk.SpeechRecognitionResult): number {
  try {
    const json = result.properties?.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
    if (!json) return 0.9;
    const parsed = JSON.parse(json) as { NBest?: Array<{ Confidence?: number }> };
    return parsed.NBest?.[0]?.Confidence ?? 0.9;
  } catch {
    return 0.9;
  }
}
