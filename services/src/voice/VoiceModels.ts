/**
 * Domain models for the Azure AI Foundry Voice layer.
 *
 * These interfaces define the contract MUSE's voice stack will use once
 * real Azure AI Foundry Voice Live integration lands (Phase 3). Today they
 * are backed by mock implementations.
 */

import { EntityId, ISOTimestamp } from "@muse/shared";

export interface AudioDevice {
  id: string;
  label: string;
  kind: "audioinput" | "audiooutput";
  isDefault: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  language: string;
}

export interface TranscriptionChunk {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: ISOTimestamp;
}

export interface TranscriptionResult {
  fullText: string;
  chunks: TranscriptionChunk[];
  durationMs: number;
}

export interface SynthesisRequest {
  text: string;
  voiceProfileId?: string;
  rate?: number;
  pitch?: number;
}

export interface SynthesisResult {
  audioBase64: string;
  mimeType: string;
  durationMs: number;
  voiceProfileId: string;
}

export type VoiceSessionState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "disconnected"
  | "error";

export interface VoiceSessionInfo {
  id: EntityId;
  state: VoiceSessionState;
  startedAt: ISOTimestamp;
  lastActivityAt: ISOTimestamp;
}

// ---------------------------------------------------------------------------
// Phase 4 — Azure AI Foundry Voice integration models.
//
// These extend (rather than replace) the Phase 2/3 mock voice contracts
// above so existing wiring (VoiceService, AudioManager, MockSpeechToText,
// MockTextToSpeech, VoiceSession) keeps working unmodified.
// ---------------------------------------------------------------------------

/** Alias of VoiceSessionState using the Phase 4 spec's capitalized names. */
export type VoiceState = "Idle" | "Listening" | "Processing" | "Speaking" | "Disconnected" | "Error";

export const VOICE_STATE_TO_SESSION_STATE: Record<VoiceState, VoiceSessionState> = {
  Idle: "idle",
  Listening: "listening",
  Processing: "processing",
  Speaking: "speaking",
  Disconnected: "disconnected",
  Error: "error",
};

export const SESSION_STATE_TO_VOICE_STATE: Record<VoiceSessionState, VoiceState> = {
  idle: "Idle",
  listening: "Listening",
  processing: "Processing",
  speaking: "Speaking",
  disconnected: "Disconnected",
  error: "Error",
};

export interface VoiceDevice {
  id: string;
  label: string;
  kind: "audioinput" | "audiooutput";
  isDefault: boolean;
}

export interface VoiceTranscript {
  id: EntityId;
  sessionId: EntityId;
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: ISOTimestamp;
}

export type VoiceEventType =
  | "session_start"
  | "session_stop"
  | "session_pause"
  | "session_resume"
  | "transcript_partial"
  | "transcript_final"
  | "speech_start"
  | "speech_end"
  | "device_change"
  | "error";

export interface VoiceEvent {
  type: VoiceEventType;
  sessionId?: EntityId;
  detail?: Record<string, unknown>;
  timestamp: ISOTimestamp;
}

export type VoiceErrorKind =
  | "microphone_missing"
  | "speaker_missing"
  | "connection_failure"
  | "session_timeout"
  | "permission_denied"
  | "unknown";

export interface VoiceErrorInfo {
  kind: VoiceErrorKind;
  message: string;
  timestamp: ISOTimestamp;
}

/** Azure AI Foundry Voice resource configuration, loaded from env/config — never hardcoded. */
export interface VoiceConfigurationValues {
  projectName: string;
  projectEndpoint: string;
  resourceName: string;
  resourceGroup: string;
  subscriptionId: string;
  keyVault: string;
  storageAccount: string;
  applicationInsights: string;
  /** True when running against the mock voice provider instead of real Azure AI Foundry Voice. */
  useMockProvider: boolean;
  defaultVoiceProfileId: string;
  defaultVolume: number;
}

export interface VoiceSessionSnapshot {
  id: EntityId;
  state: VoiceState;
  startedAt: ISOTimestamp;
  lastActivityAt: ISOTimestamp;
  microphoneId: string | null;
  speakerId: string | null;
}

export interface VoiceStatusSnapshot {
  session: VoiceSessionSnapshot | null;
  microphone: VoiceDevice | null;
  speaker: VoiceDevice | null;
  isMock: boolean;
  lastError: VoiceErrorInfo | null;
}
