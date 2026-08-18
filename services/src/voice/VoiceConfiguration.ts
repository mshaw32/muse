/**
 * Configuration provider for the Azure AI Foundry Voice layer.
 *
 * Resolution order for every value: environment variable first, falling
 * back to the documented resource values in `docs/azure-resources.md`.
 * No secrets or resource identifiers are ever hardcoded in source — the
 * fallbacks below simply mirror the checked-in documentation file so local
 * development works out of the box, exactly like `docs/azure-resources.md`
 * describes as "source of truth".
 *
 * Real credentials (API keys, connection strings) are never read from this
 * file — only non-secret resource identifiers used to target the correct
 * Azure AI Foundry project. Secrets are expected to be supplied purely via
 * environment variables / Key Vault at runtime, never checked in.
 */

import { VoiceConfigurationValues } from "./VoiceModels";

/** Mirrors docs/azure-resources.md — used only when the equivalent env var is unset. */
const DOCUMENTED_DEFAULTS = {
  projectName: "mbgsol-muse-dev",
  projectEndpoint: "https://mbgsol-muse-dev-resource.services.ai.azure.com/api/projects/mbgsol-muse-dev",
  resourceName: "mbgsol-muse-dev-resource",
  resourceGroup: "rg-mbgsol-muse-dev",
  subscriptionId: "e37ff56d-6804-43a3-b7eb-a4952f1f89e3",
  keyVault: "kv-mbgsol-muse-dev",
  storageAccount: "stmbgsolmusedev",
  applicationInsights: "mbgsol-muse-dev-resource-appinsights",
};

function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

function envNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Loads Azure AI Foundry Voice configuration. `AZURE_AI_FOUNDRY_API_KEY` /
 * `AZURE_AI_FOUNDRY_CONNECTION_STRING` (if present) are intentionally NOT
 * exposed here — this provider only resolves non-secret resource
 * identifiers plus feature flags for the voice stack.
 */
export class VoiceConfiguration {
  private readonly values: VoiceConfigurationValues;

  constructor(overrides: Partial<VoiceConfigurationValues> = {}) {
    // No real Azure AI Foundry Voice SDK credentials are configured yet in
    // this environment, so the mock provider is used unless explicitly
    // overridden. Phase 4.1 adds `VOICE_PROVIDER=foundry`, which switches to
    // the real Azure AI Foundry Voice provider authenticated via the
    // signed-in Azure user (Entra ID / `az login`) rather than an API key —
    // so `hasApiKey` below is one of two ways to opt into the real
    // provider, `VOICE_PROVIDER=foundry` is the other (and the documented
    // one; see docs/PHASE-4.1-FOUNDRY-VOICE-LIVE-BUILD-SPEC.md).
    const hasApiKey = Boolean(process.env.AZURE_AI_FOUNDRY_API_KEY || process.env.AZURE_VOICE_API_KEY);
    const voiceProvider = (process.env.VOICE_PROVIDER ?? "").trim().toLowerCase();
    const wantsFoundryProvider = voiceProvider === "foundry";
    const wantsMockProvider = voiceProvider === "mock";

    this.values = {
      projectName: envOrDefault("AZURE_AI_FOUNDRY_PROJECT_NAME", DOCUMENTED_DEFAULTS.projectName),
      projectEndpoint: envOrDefault("AZURE_AI_FOUNDRY_PROJECT_ENDPOINT", DOCUMENTED_DEFAULTS.projectEndpoint),
      resourceName: envOrDefault("AZURE_AI_FOUNDRY_RESOURCE_NAME", DOCUMENTED_DEFAULTS.resourceName),
      resourceGroup: envOrDefault("AZURE_RESOURCE_GROUP", DOCUMENTED_DEFAULTS.resourceGroup),
      subscriptionId: envOrDefault("AZURE_SUBSCRIPTION_ID", DOCUMENTED_DEFAULTS.subscriptionId),
      keyVault: envOrDefault("AZURE_KEY_VAULT_NAME", DOCUMENTED_DEFAULTS.keyVault),
      storageAccount: envOrDefault("AZURE_STORAGE_ACCOUNT", DOCUMENTED_DEFAULTS.storageAccount),
      applicationInsights: envOrDefault(
        "AZURE_APPLICATION_INSIGHTS_NAME",
        DOCUMENTED_DEFAULTS.applicationInsights,
      ),
      useMockProvider: wantsFoundryProvider
        ? false
        : wantsMockProvider
          ? true
          : envBool("MUSE_VOICE_USE_MOCK", !hasApiKey),
      defaultVoiceProfileId: envOrDefault("MUSE_VOICE_DEFAULT_PROFILE", "muse-default"),
      defaultVolume: envNumber("MUSE_VOICE_DEFAULT_VOLUME", 0.8),
      ...overrides,
    };
  }

  getValues(): VoiceConfigurationValues {
    return { ...this.values };
  }

  isMockProvider(): boolean {
    return this.values.useMockProvider;
  }
}
