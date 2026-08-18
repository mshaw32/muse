/**
 * Phase 4 Voice domain models used by the frontend.
 *
 * Intentionally mirrors `services/src/voice/VoiceModels.ts` structurally,
 * without importing across the frontend/backend boundary (the frontend
 * does not depend on backend, services, or Node-only packages).
 */

export type VoiceState = "Idle" | "Listening" | "Processing" | "Speaking" | "Disconnected" | "Error";

export interface VoiceDevice {
  id: string;
  label: string;
  kind: "audioinput" | "audiooutput";
  isDefault: boolean;
}

export interface VoiceTranscript {
  id: string;
  sessionId: string;
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: string;
}

export interface VoiceSessionSnapshot {
  id: string;
  state: VoiceState;
  startedAt: string;
  lastActivityAt: string;
  microphoneId: string | null;
  speakerId: string | null;
}

export interface VoiceStatusSnapshot {
  status: string;
  session: VoiceSessionSnapshot | null;
  microphone: VoiceDevice | null;
  speaker: VoiceDevice | null;
  isMock: boolean;
  partialTranscript: VoiceTranscript | null;
  finalTranscript: VoiceTranscript | null;
  /** Phase 4.1 — real Azure AI Foundry Voice provider status. */
  provider?: "mock" | "foundry";
  connectionState?: string;
  authenticationMode?: string;
  model?: string;
  voiceProfile?: string;
}

export interface DiagnosticResult {
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  language: string;
}
