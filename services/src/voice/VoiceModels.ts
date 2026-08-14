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

export type VoiceSessionState = "idle" | "listening" | "processing" | "speaking" | "error";

export interface VoiceSessionInfo {
  id: EntityId;
  state: VoiceSessionState;
  startedAt: ISOTimestamp;
  lastActivityAt: ISOTimestamp;
}
