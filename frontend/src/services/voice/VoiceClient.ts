/**
 * VoiceClient — frontend client for the Phase 4 `/api/voice/*` backend
 * routes. Wraps plain `fetch` calls (routed through the Vite dev proxy).
 */

import type {
  DiagnosticResult,
  VoiceDevice,
  VoiceProfile,
  VoiceSessionSnapshot,
  VoiceStatusSnapshot,
} from "./VoiceModels";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Voice request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export interface DevicesResponse {
  status: string;
  microphones: VoiceDevice[];
  speakers: VoiceDevice[];
  voiceProfiles: VoiceProfile[];
}

export interface SynthesisResponse {
  status: string;
  result: {
    audioBase64: string;
    mimeType: string;
    durationMs: number;
    voiceProfileId: string;
  };
}

export const voiceClient = {
  devices: () => request<DevicesResponse>("/api/voice/devices"),

  status: () => request<VoiceStatusSnapshot>("/api/voice/status"),

  start: () => request<{ status: string; session: VoiceSessionSnapshot }>("/api/voice/start", { method: "POST" }),

  stop: () =>
    request<{ status: string; session: VoiceSessionSnapshot | null; transcript: unknown }>("/api/voice/stop", {
      method: "POST",
    }),

  speak: (text: string, voiceProfileId?: string, rate?: number, pitch?: number) =>
    request<SynthesisResponse>("/api/voice/speak", {
      method: "POST",
      body: JSON.stringify({ text, voiceProfileId, rate, pitch }),
    }),

  selectMicrophone: (deviceId: string) =>
    request<{ status: string; device: VoiceDevice | null }>("/api/voice/devices/microphone", {
      method: "POST",
      body: JSON.stringify({ deviceId }),
    }),

  selectSpeaker: (deviceId: string) =>
    request<{ status: string; device: VoiceDevice | null }>("/api/voice/devices/speaker", {
      method: "POST",
      body: JSON.stringify({ deviceId }),
    }),

  /** Phase 4.1 — streams a chunk of real microphone PCM audio to the active Foundry STT session. */
  sendAudio: (audioBase64: string) =>
    request<{ status: string }>("/api/voice/audio", {
      method: "POST",
      body: JSON.stringify({ audioBase64 }),
    }),

  /** Phase 4.1 — runs testAuthentication/testConnectivity/testSpeechToText/testTextToSpeech. */
  diagnostics: () =>
    request<{ status: string; results: DiagnosticResult[]; configuration: Record<string, unknown> }>(
      "/api/voice/diagnostics",
    ),
};
