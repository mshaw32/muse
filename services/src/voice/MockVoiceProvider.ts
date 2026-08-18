/**
 * MockVoiceProvider — Phase 4 mock voice provider.
 *
 * Bundles the mock speech-to-text engine, mock text-to-speech engine, and
 * mock audio device manager behind a single object so voice functionality
 * (session lifecycle, transcripts, synthesized speech, device selection)
 * can be fully exercised without any Azure AI Foundry Voice connectivity.
 * This is the default provider until real credentials are configured (see
 * `VoiceConfiguration.isMockProvider()`).
 */

import { MockSpeechToText } from "./SpeechToText";
import { MockTextToSpeech } from "./TextToSpeech";
import { AudioManager } from "./AudioManager";
import { SpeechToTextService } from "./SpeechToTextService";
import { TextToSpeechService } from "./TextToSpeechService";
import { AudioDeviceService } from "./AudioDeviceService";
import { VoiceConfigurationValues } from "./VoiceModels";

export class MockVoiceProvider {
  readonly speechToText: SpeechToTextService;
  readonly textToSpeech: TextToSpeechService;
  readonly audioDevices: AudioDeviceService;

  constructor(config: VoiceConfigurationValues) {
    this.speechToText = new SpeechToTextService(new MockSpeechToText());
    this.textToSpeech = new TextToSpeechService(new MockTextToSpeech(), config.defaultVolume, config.defaultVoiceProfileId);
    this.audioDevices = new AudioDeviceService(new AudioManager());
  }

  readonly isMock = true;
}
