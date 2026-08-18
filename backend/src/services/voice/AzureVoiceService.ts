/**
 * AzureVoiceService — Phase 4 backend-facing Azure AI Foundry Voice
 * service.
 *
 * Thin wrapper around the shared `@muse/services` `VoiceService` (the
 * runtime's single voice composition root). Provides the async surface the
 * `/api/voice/*` routes need: session start/stop, speech synthesis, status,
 * and device queries. Falls back to the `MockVoiceProvider` automatically
 * whenever `VoiceConfiguration.isMockProvider()` is true (i.e. no real
 * Azure AI Foundry Voice credentials are configured), so this service
 * behaves identically today and once real Azure connectivity lands.
 */

import { VoiceService, VoiceStatusSnapshot, VoiceTranscript } from "@muse/services";

export interface StartSessionResult {
  session: ReturnType<VoiceService["session"]["getActiveSession"]>;
}

export class AzureVoiceService {
  private readonly voice: VoiceService;
  private lastTranscript: VoiceTranscript | null = null;
  private partialTranscript: VoiceTranscript | null = null;

  constructor(voice: VoiceService) {
    this.voice = voice;
  }

  isMock(): boolean {
    return this.voice.config.isMockProvider();
  }

  start(): StartSessionResult {
    const session = this.voice.startSession({
      onPartialTranscript: (transcript) => {
        this.partialTranscript = transcript as VoiceTranscript;
      },
      onFinalTranscript: (transcript) => {
        this.lastTranscript = transcript as VoiceTranscript;
        this.partialTranscript = null;
      },
    });
    return { session };
  }

  async stop() {
    const result = await this.voice.stopSession();
    this.lastTranscript = result.transcript;
    return result;
  }

  async speak(text: string, voiceProfileId?: string, rate?: number, pitch?: number) {
    return this.voice.speakPhase4({ text, voiceProfileId, rate, pitch });
  }

  getStatus(): VoiceStatusSnapshot {
    return this.voice.getStatus();
  }

  getLastTranscript(): VoiceTranscript | null {
    return this.lastTranscript;
  }

  getPartialTranscript(): VoiceTranscript | null {
    return this.partialTranscript;
  }

  listMicrophones() {
    return this.voice.devices.listMicrophones();
  }

  listSpeakers() {
    return this.voice.devices.listSpeakers();
  }

  selectMicrophone(deviceId: string) {
    return this.voice.devices.selectMicrophone(deviceId);
  }

  selectSpeaker(deviceId: string) {
    return this.voice.devices.selectSpeaker(deviceId);
  }
}
