/**
 * Zustand store for the Phase 4 Azure AI Foundry Voice layer.
 *
 * Kept separate from the Phase 1 `museStore` (voice transcript / visualizer
 * state), the Phase 3 `copilotStore`, and the Phase 2
 * `workspaceStore`/`systemStatusStore` so none of that existing state or
 * behavior is touched. `useVoice` (the hook) is responsible for bridging
 * `voiceState` here onto the existing `museStore.museState` for Visualizer
 * integration.
 */

import { create } from "zustand";
import { voiceClient } from "../services/voice/VoiceClient";
import { microphoneCapture } from "../services/voice/MicrophoneCapture";
import { audioPlayback } from "../services/voice/AudioPlayback";
import type { VoiceDevice, VoiceProfile, VoiceState, VoiceTranscript } from "../services/voice/VoiceModels";

interface VoiceStore {
  voiceEnabled: boolean;
  voiceState: VoiceState;
  microphoneDevice: VoiceDevice | null;
  speakerDevice: VoiceDevice | null;
  microphones: VoiceDevice[];
  speakers: VoiceDevice[];
  voiceProfiles: VoiceProfile[];
  currentTranscript: string;
  partialTranscript: string;
  isSpeaking: boolean;
  isListening: boolean;
  isMock: boolean;
  error: string | null;
  /** Phase 4.1 — real Azure AI Foundry Voice provider status fields. */
  provider: "mock" | "foundry";
  connectionState: string;
  authenticationMode: string;

  setVoiceEnabled: (enabled: boolean) => void;
  loadDevices: () => Promise<void>;
  selectMicrophone: (deviceId: string) => Promise<void>;
  selectSpeaker: (deviceId: string) => Promise<void>;
  startListening: () => Promise<void>;
  stopListening: () => Promise<VoiceTranscript | null>;
  speak: (text: string, voiceProfileId?: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

function mapSessionState(voiceState: VoiceState): { isListening: boolean; isSpeaking: boolean } {
  return {
    isListening: voiceState === "Listening",
    isSpeaking: voiceState === "Speaking",
  };
}

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  voiceEnabled: true,
  voiceState: "Idle",
  microphoneDevice: null,
  speakerDevice: null,
  microphones: [],
  speakers: [],
  voiceProfiles: [],
  currentTranscript: "",
  partialTranscript: "",
  isSpeaking: false,
  isListening: false,
  isMock: true,
  error: null,
  provider: "mock",
  connectionState: "Disconnected",
  authenticationMode: "unauthenticated",

  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),

  loadDevices: async () => {
    try {
      const response = await voiceClient.devices();
      set({
        microphones: response.microphones,
        speakers: response.speakers,
        voiceProfiles: response.voiceProfiles,
        microphoneDevice: response.microphones.find((device) => device.isDefault) ?? response.microphones[0] ?? null,
        speakerDevice: response.speakers.find((device) => device.isDefault) ?? response.speakers[0] ?? null,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "devices_failed" });
    }
  },

  selectMicrophone: async (deviceId) => {
    try {
      const { device } = await voiceClient.selectMicrophone(deviceId);
      set({ microphoneDevice: device });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "select_microphone_failed" });
    }
  },

  selectSpeaker: async (deviceId) => {
    try {
      const { device } = await voiceClient.selectSpeaker(deviceId);
      set({ speakerDevice: device });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "select_speaker_failed" });
    }
  },

  startListening: async () => {
    try {
      const { session } = await voiceClient.start();
      set({
        voiceState: session.state,
        currentTranscript: "",
        partialTranscript: "",
        error: null,
        ...mapSessionState(session.state),
      });

      // Phase 4.1 — real microphone capture. When the backend is running
      // against the mock provider, `/api/voice/audio` calls are harmless
      // no-ops server-side; when running against Foundry, this streams
      // real 16kHz PCM audio into the live Azure speech recognizer.
      const micDeviceId = get().microphoneDevice?.id ?? null;
      await microphoneCapture.start((base64Pcm) => {
        void voiceClient.sendAudio(base64Pcm);
      }, micDeviceId);
    } catch (error) {
      set({ voiceState: "Error", error: error instanceof Error ? error.message : "start_failed" });
    }
  },

  stopListening: async () => {
    microphoneCapture.stop();
    try {
      const { session, transcript } = await voiceClient.stop();
      const finalTranscript = (transcript as VoiceTranscript | null) ?? null;
      set({
        voiceState: session?.state ?? "Idle",
        currentTranscript: finalTranscript?.text ?? get().currentTranscript,
        partialTranscript: "",
        ...mapSessionState(session?.state ?? "Idle"),
      });
      return finalTranscript;
    } catch (error) {
      set({ voiceState: "Error", error: error instanceof Error ? error.message : "stop_failed" });
      return null;
    }
  },

  speak: async (text, voiceProfileId) => {
    set({ voiceState: "Speaking", isSpeaking: true });
    try {
      const response = await voiceClient.speak(text, voiceProfileId);
      // Phase 4.1 — real speaker playback of the synthesized audio (mock
      // provider returns a near-silent WAV, so this is safe either way).
      const speakerId = get().speakerDevice?.id ?? null;
      await audioPlayback.play(response.result.audioBase64, response.result.mimeType, speakerId);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "speak_failed" });
    } finally {
      set({ voiceState: "Idle", isSpeaking: false });
    }
  },

  refreshStatus: async () => {
    try {
      const status = await voiceClient.status();
      set({
        voiceState: status.session?.state ?? "Idle",
        microphoneDevice: status.microphone,
        speakerDevice: status.speaker,
        isMock: status.isMock,
        provider: status.provider ?? "mock",
        connectionState: status.connectionState ?? "Disconnected",
        authenticationMode: status.authenticationMode ?? "unauthenticated",
        partialTranscript: status.partialTranscript?.text ?? "",
        currentTranscript: status.finalTranscript?.text ?? get().currentTranscript,
        ...mapSessionState(status.session?.state ?? "Idle"),
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "status_failed" });
    }
  },
}));
