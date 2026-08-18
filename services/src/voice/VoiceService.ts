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
import { VoiceConfiguration } from "./VoiceConfiguration";
import { VoiceSessionService } from "./VoiceSessionService";
import { AudioDeviceService } from "./AudioDeviceService";
import { SpeechToTextService } from "./SpeechToTextService";
import { TextToSpeechService } from "./TextToSpeechService";
import {
  SynthesisRequest,
  SynthesisResult,
  TranscriptionChunk,
  TranscriptionResult,
  VoiceSessionInfo,
  VoiceStatusSnapshot,
} from "./VoiceModels";

export class VoiceService {
  private readonly stt: SpeechToTextEngine;
  private readonly tts: TextToSpeechEngine;
  readonly audio: AudioManager;
  private readonly logger: Logger;
  private activeSession: VoiceSession | null = null;

  // Phase 4 — Azure AI Foundry Voice abstraction layer. Composed alongside
  // (not replacing) the Phase 2/3 stt/tts/audio/session members above so
  // existing behavior (startPushToTalk/stopPushToTalk/speak/getActiveSession)
  // remains byte-for-byte compatible.
  readonly config: VoiceConfiguration;
  readonly session: VoiceSessionService;
  readonly devices: AudioDeviceService;
  readonly stt4: SpeechToTextService;
  readonly tts4: TextToSpeechService;

  constructor(
    stt: SpeechToTextEngine = new MockSpeechToText(),
    tts: TextToSpeechEngine = new MockTextToSpeech(),
    logger: Logger = new Logger("muse:voice"),
    config: VoiceConfiguration = new VoiceConfiguration(),
  ) {
    this.stt = stt;
    this.tts = tts;
    this.audio = new AudioManager();
    this.logger = logger;

    this.config = config;
    const configValues = config.getValues();
    this.session = new VoiceSessionService();
    this.devices = new AudioDeviceService(this.audio);
    this.stt4 = new SpeechToTextService(stt);
    this.tts4 = new TextToSpeechService(tts, configValues.defaultVolume, configValues.defaultVoiceProfileId);
  }

  /**
   * Phase 4 status snapshot for the `/api/voice/status` route and
   * `VoiceStatus`/`VoicePanel` frontend components.
   */
  getStatus(): VoiceStatusSnapshot {
    return {
      session: this.session.getActiveSession(),
      microphone: this.devices.getSelectedMicrophone(),
      speaker: this.devices.getSelectedSpeaker(),
      isMock: this.config.isMockProvider(),
      lastError: null,
    };
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

  // ---------------------------------------------------------------------
  // Phase 4 — realtime voice session API (used by backend /api/voice/start,
  // /stop, /speak, /status routes). Independent of the Phase 2/3
  // startPushToTalk/stopPushToTalk/speak methods above.
  // ---------------------------------------------------------------------

  /** Starts a Phase 4 realtime voice session and begins streaming transcription. */
  startSession(
    handlers: { onPartialTranscript?: (t: unknown) => void; onFinalTranscript?: (t: unknown) => void } = {},
  ) {
    const microphoneId = this.devices.getSelectedMicrophone()?.id ?? null;
    const speakerId = this.devices.getSelectedSpeaker()?.id ?? null;
    const session = this.session.startSession(microphoneId, speakerId);

    void this.stt4.startListening(session.id, {
      onPartialTranscript: handlers.onPartialTranscript as never,
      onFinalTranscript: handlers.onFinalTranscript as never,
    });

    return session;
  }

  /** Stops the active Phase 4 realtime voice session, returning the final transcript. */
  async stopSession() {
    const activeId = this.session.getActiveSession()?.id ?? "voice-session";
    const result = await this.stt4.stopListening(activeId);
    const transcript = this.stt4.toFinalTranscript(activeId, result);
    const session = this.session.stopSession();
    return { session, transcript };
  }

  /** Synthesizes and (conceptually) speaks text through the Phase 4 TTS pipeline. */
  async speakPhase4(request: SynthesisRequest): Promise<SynthesisResult> {
    const sessionId = this.session.getActiveSession()?.id;
    if (sessionId) this.session.transition("speaking");
    const result = await this.tts4.generate(sessionId, request);
    if (sessionId) this.session.transition("listening");
    return result;
  }
}

export * from "./VoiceModels";
