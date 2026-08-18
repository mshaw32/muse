/**
 * Barrel export for the Azure AI Foundry Voice ("real provider") layer.
 *
 * Everything here is additive to the Phase 4 mock voice stack in
 * `services/src/voice/` — nothing in the parent directory is modified.
 * `VoiceService` selects between mock and Foundry implementations via
 * `FoundryVoiceConfiguration`/`VOICE_PROVIDER`.
 */

export * from "./FoundryTokenProvider";
export * from "./FoundryVoiceConfiguration";
export * from "./FoundryVoiceLiveClient";
export * from "./FoundryVoiceLogger";
export * from "./FoundrySpeechToText";
export * from "./FoundryTextToSpeech";
export * from "./VoiceDiagnostics";
