/**
 * Text-to-speech abstraction.
 *
 * Defines the synthesis contract MUSE will use against Azure AI Foundry
 * Voice Live. The mock implementation returns a small silent WAV payload
 * so the audio playback pipeline can be exercised without a real backend.
 */

import { Logger } from "@muse/shared";
import { SynthesisRequest, SynthesisResult } from "./VoiceModels";

export interface TextToSpeechEngine {
  synthesize(request: SynthesisRequest): Promise<SynthesisResult>;
}

/** Minimal valid silent WAV file (44-byte header, no samples), base64-encoded. */
const SILENT_WAV_BASE64 =
  "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

export class MockTextToSpeech implements TextToSpeechEngine {
  private readonly logger: Logger;

  constructor(logger: Logger = new Logger("muse:voice:tts")) {
    this.logger = logger;
  }

  async synthesize(request: SynthesisRequest): Promise<SynthesisResult> {
    this.logger.debug("synthesize (mock)", { textLength: request.text.length });

    const estimatedDurationMs = Math.max(400, request.text.length * 55);

    return {
      audioBase64: SILENT_WAV_BASE64,
      mimeType: "audio/wav",
      durationMs: estimatedDurationMs,
      voiceProfileId: request.voiceProfileId ?? "muse-default",
    };
  }
}
