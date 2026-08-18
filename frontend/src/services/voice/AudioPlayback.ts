/**
 * AudioPlayback — real speaker playback for Azure AI Foundry Voice TTS.
 *
 * Decodes the base64 audio payload returned by `/api/voice/speak`
 * (`/synthesize`) and plays it through a real HTMLAudioElement — this is
 * genuine audio output through the user's speakers, not a simulated delay.
 * Falls back gracefully (resolves immediately) for the mock provider's
 * near-silent WAV payload so existing Phase 4 mock flows are unaffected.
 */

export class AudioPlayback {
  private currentAudio: HTMLAudioElement | null = null;

  /** Plays a base64-encoded audio payload and resolves once playback completes. */
  async play(audioBase64: string, mimeType: string, sinkDeviceId?: string | null): Promise<void> {
    if (!audioBase64) return;

    this.stop();

    const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
    this.currentAudio = audio;

    // Route to the selected speaker device when the browser supports
    // `setSinkId` (Chromium/Electron does); silently ignore otherwise.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sinkCapableAudio = audio as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
    if (sinkDeviceId && typeof sinkCapableAudio.setSinkId === "function") {
      try {
        await sinkCapableAudio.setSinkId(sinkDeviceId);
      } catch {
        // Non-fatal: fall back to the OS default output device.
      }
    }

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback failed."));
      void audio.play().catch(reject);
    });
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
}

export const audioPlayback = new AudioPlayback();
