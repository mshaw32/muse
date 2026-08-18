/**
 * FoundryTextToSpeech — real Azure AI Foundry text-to-speech.
 *
 * Implements the existing `TextToSpeechEngine` contract exactly (same
 * `SynthesisRequest`/`SynthesisResult` shapes as `MockTextToSpeech`) so it
 * can be swapped in via configuration alone. Runs entirely server-side —
 * synthesis does not require microphone access, only outbound network
 * access to the configured Azure AI Foundry Speech endpoint, authenticated
 * via the caller's signed-in Entra ID identity.
 */

import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { Logger } from "@muse/shared";
import { TextToSpeechEngine } from "../TextToSpeech";
import { SynthesisRequest, SynthesisResult } from "../VoiceModels";
import { FoundryVoiceLiveClient, foundryVoiceLiveClient } from "./FoundryVoiceLiveClient";
import { FoundryVoiceConfiguration, foundryVoiceConfiguration } from "./FoundryVoiceConfiguration";
import { FoundryVoiceLogger, foundryVoiceLogger } from "./FoundryVoiceLogger";

export class FoundryTextToSpeech implements TextToSpeechEngine {
  private readonly client: FoundryVoiceLiveClient;
  private readonly config: FoundryVoiceConfiguration;
  private readonly logger: Logger;
  private readonly voiceLogger: FoundryVoiceLogger;

  constructor(
    client: FoundryVoiceLiveClient = foundryVoiceLiveClient,
    config: FoundryVoiceConfiguration = foundryVoiceConfiguration,
    logger: Logger = new Logger("muse:voice:foundry:tts"),
    voiceLogger: FoundryVoiceLogger = foundryVoiceLogger,
  ) {
    this.client = client;
    this.config = config;
    this.logger = logger;
    this.voiceLogger = voiceLogger;
  }

  async synthesize(request: SynthesisRequest): Promise<SynthesisResult> {
    const startedAt = Date.now();
    this.voiceLogger.logSpeech("start");

    const speechConfig = await this.client.createSpeechConfig();
    speechConfig.speechSynthesisVoiceName = request.voiceProfileId
      ? mapVoiceProfileToNeuralVoice(request.voiceProfileId, this.config.getVoiceProfile())
      : this.config.getVoiceProfile();
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    // Null audio output config: we want the raw audio bytes returned to us
    // (to send to the frontend for playback), not played on this machine's
    // (server-side) default speaker.
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);

    try {
      const ssml = buildSsml(request, speechConfig.speechSynthesisVoiceName);
      const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) => {
        synthesizer.speakSsmlAsync(
          ssml,
          (r) => resolve(r),
          (error) => reject(new Error(`Foundry speech synthesis failed: ${error}`)),
        );
      });

      if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
        const details = sdk.CancellationDetails.fromResult(result);
        throw new Error(`Foundry speech synthesis did not complete: ${details.errorDetails ?? result.reason}`);
      }

      const audioBase64 = Buffer.from(result.audioData).toString("base64");
      const durationMs = Math.round(Date.now() - startedAt);
      this.voiceLogger.logSpeech("end", durationMs);

      return {
        audioBase64,
        mimeType: "audio/mpeg",
        durationMs,
        voiceProfileId: speechConfig.speechSynthesisVoiceName,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Foundry text-to-speech failed", { message });
      this.voiceLogger.logError(message);
      throw error;
    } finally {
      synthesizer.close();
    }
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSsml(request: SynthesisRequest, voiceName: string): string {
  const rate = request.rate ? `${Math.round(request.rate * 100)}%` : "100%";
  const pitch = request.pitch ? `${request.pitch > 0 ? "+" : ""}${Math.round(request.pitch * 100)}%` : "0%";

  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">` +
    `<voice name="${voiceName}">` +
    `<prosody rate="${rate}" pitch="${pitch}">${escapeXml(request.text)}</prosody>` +
    `</voice></speak>`
  );
}

/** MUSE voice profile IDs (mock-era names) mapped onto real Azure neural voices. */
const VOICE_PROFILE_MAP: Record<string, string> = {
  "muse-default": "en-US-AvaMultilingualNeural",
  "muse-calm": "en-US-EmmaMultilingualNeural",
  "muse-energetic": "en-US-AndrewMultilingualNeural",
};

function mapVoiceProfileToNeuralVoice(voiceProfileId: string, fallback: string): string {
  return VOICE_PROFILE_MAP[voiceProfileId] ?? fallback;
}
