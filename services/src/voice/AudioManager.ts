/**
 * Manages available audio input/output devices and active voice profiles.
 *
 * Device enumeration in a real deployment happens in the renderer/Electron
 * process (via `navigator.mediaDevices`); this manager provides a
 * transport-agnostic model plus mock defaults so backend/service code can
 * reason about device selection without depending on the DOM.
 */

import { AudioDevice, VoiceProfile } from "./VoiceModels";

const MOCK_INPUT_DEVICES: AudioDevice[] = [
  { id: "default-mic", label: "Default Microphone", kind: "audioinput", isDefault: true },
  { id: "headset-mic", label: "Headset Microphone", kind: "audioinput", isDefault: false },
];

const MOCK_OUTPUT_DEVICES: AudioDevice[] = [
  { id: "default-speaker", label: "Default Speakers", kind: "audiooutput", isDefault: true },
  { id: "headset-speaker", label: "Headset Speakers", kind: "audiooutput", isDefault: false },
];

const VOICE_PROFILES: VoiceProfile[] = [
  { id: "muse-default", name: "MUSE", description: "Balanced, professional assistant voice.", language: "en-US" },
  { id: "muse-calm", name: "MUSE Calm", description: "Slower, calmer delivery for focus sessions.", language: "en-US" },
  { id: "muse-energetic", name: "MUSE Energetic", description: "Upbeat delivery for quick updates.", language: "en-US" },
];

export class AudioManager {
  private inputDevices: AudioDevice[] = MOCK_INPUT_DEVICES;
  private outputDevices: AudioDevice[] = MOCK_OUTPUT_DEVICES;
  private selectedInputId = MOCK_INPUT_DEVICES[0].id;
  private selectedOutputId = MOCK_OUTPUT_DEVICES[0].id;

  listMicrophones(): AudioDevice[] {
    return [...this.inputDevices];
  }

  listSpeakers(): AudioDevice[] {
    return [...this.outputDevices];
  }

  listVoiceProfiles(): VoiceProfile[] {
    return [...VOICE_PROFILES];
  }

  /** Allows the Electron/renderer layer to report real enumerated devices. */
  registerDevices(devices: AudioDevice[]): void {
    this.inputDevices = devices.filter((device) => device.kind === "audioinput");
    this.outputDevices = devices.filter((device) => device.kind === "audiooutput");
  }

  selectMicrophone(deviceId: string): void {
    this.selectedInputId = deviceId;
  }

  selectSpeaker(deviceId: string): void {
    this.selectedOutputId = deviceId;
  }

  getSelectedMicrophone(): string {
    return this.selectedInputId;
  }

  getSelectedSpeaker(): string {
    return this.selectedOutputId;
  }
}
