/**
 * AudioDeviceService — Phase 4 microphone/speaker discovery, selection, and
 * persistence.
 *
 * Wraps the existing Phase 2/3 `AudioManager` (kept intact for backward
 * compatibility with `VoiceService`) and adds default-device lookup plus
 * persisted-selection support (backed by `SettingsStore` at the call site —
 * this service itself remains storage-agnostic and simply tracks the
 * in-memory current selection, matching `AudioManager`'s existing shape).
 */

import { Logger } from "@muse/shared";
import { AudioManager } from "./AudioManager";
import { VoiceDevice } from "./VoiceModels";
import { VoiceLogger, voiceLogger } from "./VoiceLogger";

export class AudioDeviceService {
  private readonly audio: AudioManager;
  private readonly logger: Logger;
  private readonly events: VoiceLogger;

  constructor(audio: AudioManager = new AudioManager(), events: VoiceLogger = voiceLogger, logger: Logger = new Logger("muse:voice:devices")) {
    this.audio = audio;
    this.events = events;
    this.logger = logger;
  }

  listMicrophones(): VoiceDevice[] {
    return this.audio.listMicrophones();
  }

  listSpeakers(): VoiceDevice[] {
    return this.audio.listSpeakers();
  }

  getDefaultMicrophone(): VoiceDevice | null {
    return this.audio.listMicrophones().find((device) => device.isDefault) ?? null;
  }

  getDefaultSpeaker(): VoiceDevice | null {
    return this.audio.listSpeakers().find((device) => device.isDefault) ?? null;
  }

  getSelectedMicrophone(): VoiceDevice | null {
    const id = this.audio.getSelectedMicrophone();
    return this.audio.listMicrophones().find((device) => device.id === id) ?? null;
  }

  getSelectedSpeaker(): VoiceDevice | null {
    const id = this.audio.getSelectedSpeaker();
    return this.audio.listSpeakers().find((device) => device.id === id) ?? null;
  }

  /** Changes and persists (in-memory) the active microphone. */
  selectMicrophone(deviceId: string): VoiceDevice | null {
    this.audio.selectMicrophone(deviceId);
    this.events.logDeviceChange("microphone", deviceId);
    this.logger.info("Microphone selected", { deviceId });
    return this.getSelectedMicrophone();
  }

  /** Changes and persists (in-memory) the active speaker. */
  selectSpeaker(deviceId: string): VoiceDevice | null {
    this.audio.selectSpeaker(deviceId);
    this.events.logDeviceChange("speaker", deviceId);
    this.logger.info("Speaker selected", { deviceId });
    return this.getSelectedSpeaker();
  }

  /** Allows the Electron/renderer layer to report real enumerated devices. */
  registerDevices(devices: VoiceDevice[]): void {
    this.audio.registerDevices(devices);
  }

  listVoiceProfiles() {
    return this.audio.listVoiceProfiles();
  }
}
