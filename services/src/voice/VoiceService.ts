/**
 * Public facade for the Azure AI Foundry Voice layer.
 *
 * Combines speech-to-text, text-to-speech, session lifecycle, and audio
 * device management behind a single entry point. Backend routes and the
 * Electron shell should depend on VoiceService rather than the individual
 * engines, keeping a single seam for swapping in the real Azure AI Foundry
 * Voice Live SDK in Phase 3.
 */

import { Logger } from "@muse/shared";
import { MockSpeechToText, SpeechToTextEngine } from "./SpeechToText";
import { MockTextToSpeech, TextToSpeechEngine } from "./TextToSpeech";
import { VoiceSession } from "./VoiceSession";
import { AudioManager } from "./AudioManager";
import {
  SynthesisRequest,
  SynthesisResult,
  TranscriptionChunk,
  TranscriptionResult,
  VoiceSessionInfo,
} from "./VoiceModels";

export class VoiceService {
  private readonly stt: SpeechToTextEngine;
  private readonly tts: TextToSpeechEngine;
  readonly audio: AudioManager;
  private readonly logger: Logger;
  private activeSession: VoiceSession | null = null;

  constructor(
    stt: SpeechToTextEngine = new MockSpeechToText(),
    tts: TextToSpeechEngine = new MockTextToSpeech(),
    logger: Logger = new Logger("muse:voice"),
  ) {
    this.stt = stt;
    this.tts = tts;
    this.audio = new AudioManager();
    this.logger = logger;
  }

  startPushToTalk(onChunk?: (chunk: TranscriptionChunk) => void): VoiceSessionInfo {
    this.activeSession = new VoiceSession();
    const info = this.activeSession.transition("listening");
    this.logger.info("Push-to-talk started", { sessionId: info.id });

    // Fire and forget: the mock STT engine streams chunks synchronously-ish.
    void this.stt.startStreaming((chunk) => onChunk?.(chunk));

    return info;
  }

  async stopPushToTalk(): Promise<{ session: VoiceSessionInfo; transcription: TranscriptionResult }> {
    if (!this.activeSession) {
      throw new Error("No active voice session to stop.");
    }

    const transcription = await this.stt.stopStreaming();
    const session = this.activeSession.transition("processing");
    this.logger.info("Push-to-talk stopped", { sessionId: session.id });

    return { session, transcription };
  }

  async speak(request: SynthesisRequest): Promise<SynthesisResult> {
    if (this.activeSession) {
      this.activeSession.transition("speaking");
    }
    const result = await this.tts.synthesize(request);
    if (this.activeSession) {
      this.activeSession.transition("idle");
    }
    return result;
  }

  getActiveSession(): VoiceSessionInfo | null {
    return this.activeSession?.getInfo() ?? null;
  }
}

export * from "./VoiceModels";
