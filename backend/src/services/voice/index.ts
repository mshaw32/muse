export * from "./AzureVoiceService";
export * from "./VoiceSessionManager";

import { getRuntime } from "../../runtime";
import { AzureVoiceService } from "./AzureVoiceService";
import { VoiceSessionManager } from "./VoiceSessionManager";

/**
 * Facade bundling the Phase 4 voice integration services. Backend routes
 * depend on this single instance rather than constructing services ad hoc.
 * Built lazily against `getRuntime().voice` so it always shares the same
 * `VoiceService` composition root as the rest of MUSE.
 */
export class VoiceIntegration {
  readonly azureVoice: AzureVoiceService;
  readonly sessionManager: VoiceSessionManager;

  constructor() {
    this.azureVoice = new AzureVoiceService(getRuntime().voice);
    this.sessionManager = new VoiceSessionManager();
  }
}

let integration: VoiceIntegration | null = null;

export function getVoiceIntegration(): VoiceIntegration {
  if (!integration) {
    integration = new VoiceIntegration();
  }
  return integration;
}
