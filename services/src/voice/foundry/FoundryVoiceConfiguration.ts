/**
 * FoundryVoiceConfiguration — Azure AI Foundry Voice Live configuration.
 *
 * Resolution order for every value: environment variable first, falling
 * back to the documented resource values in `docs/azure-resources.md`
 * (mirrored as constants, exactly like the Phase 4 `VoiceConfiguration`
 * does). No secrets, keys, or client credentials are ever read or
 * required here — only the non-secret resource identifiers needed to
 * target the correct Cognitive Services / Azure AI Foundry endpoint, plus
 * model/voice selection and the `VOICE_PROVIDER` switch.
 */

const DOCUMENTED_DEFAULTS = {
  projectName: "mbgsol-muse-dev",
  projectEndpoint: "https://mbgsol-muse-dev-resource.services.ai.azure.com/api/projects/mbgsol-muse-dev",
  resourceName: "mbgsol-muse-dev-resource",
  resourceGroup: "rg-mbgsol-muse-dev",
  subscriptionId: "e37ff56d-6804-43a3-b7eb-a4952f1f89e3",
  keyVault: "kv-mbgsol-muse-dev",
  storageAccount: "stmbgsolmusedev",
  applicationInsights: "mbgsol-muse-dev-resource-appinsights",
  /**
   * Cognitive Services custom-subdomain endpoint for AAD-token-based Speech
   * SDK/REST auth (distinct from the AI Foundry *project* endpoint above).
   * Derived from `resourceName` unless overridden.
   */
  speechEndpoint: "https://mbgsol-muse-dev-resource.cognitiveservices.azure.com/",
  speechRegion: "eastus2",
};

export type VoiceProviderKind = "mock" | "foundry";

export interface FoundryVoiceConfigurationValues {
  provider: VoiceProviderKind;
  projectName: string;
  projectEndpoint: string;
  resourceName: string;
  resourceGroup: string;
  subscriptionId: string;
  keyVault: string;
  storageAccount: string;
  applicationInsights: string;
  /** Cognitive Services custom-subdomain endpoint (Speech SDK `fromEndpoint`). */
  speechEndpoint: string;
  /** Azure region hosting the Speech/AIServices resource (e.g. "eastus2"). */
  speechRegion: string;
  /** Speech recognition locale, e.g. "en-US". */
  sttLanguage: string;
  /** Neural voice name used for text-to-speech synthesis. */
  ttsVoiceName: string;
}

function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : fallback;
}

function resolveProvider(): VoiceProviderKind {
  const raw = (process.env.VOICE_PROVIDER ?? "").trim().toLowerCase();
  if (raw === "foundry") return "foundry";
  if (raw === "mock") return "mock";
  // Default: mock unless the caller has explicitly opted into "foundry".
  return "mock";
}

/**
 * Loads Azure AI Foundry Voice Live configuration (endpoint, model/voice
 * selection, provider switch). Mirrors `VoiceConfiguration`'s pattern of
 * "env var, else documented default" and never reads or exposes API keys —
 * authentication is handled exclusively by `FoundryTokenProvider` via
 * Entra ID (`az login` / DefaultAzureCredential / AzureCliCredential).
 */
export class FoundryVoiceConfiguration {
  private readonly values: FoundryVoiceConfigurationValues;

  constructor(overrides: Partial<FoundryVoiceConfigurationValues> = {}) {
    const resourceName = envOrDefault("AZURE_AI_FOUNDRY_RESOURCE_NAME", DOCUMENTED_DEFAULTS.resourceName);

    this.values = {
      provider: resolveProvider(),
      projectName: envOrDefault("AZURE_AI_FOUNDRY_PROJECT_NAME", DOCUMENTED_DEFAULTS.projectName),
      projectEndpoint: envOrDefault("AZURE_AI_FOUNDRY_PROJECT_ENDPOINT", DOCUMENTED_DEFAULTS.projectEndpoint),
      resourceName,
      resourceGroup: envOrDefault("AZURE_RESOURCE_GROUP", DOCUMENTED_DEFAULTS.resourceGroup),
      subscriptionId: envOrDefault("AZURE_SUBSCRIPTION_ID", DOCUMENTED_DEFAULTS.subscriptionId),
      keyVault: envOrDefault("AZURE_KEY_VAULT_NAME", DOCUMENTED_DEFAULTS.keyVault),
      storageAccount: envOrDefault("AZURE_STORAGE_ACCOUNT", DOCUMENTED_DEFAULTS.storageAccount),
      applicationInsights: envOrDefault(
        "AZURE_APPLICATION_INSIGHTS_NAME",
        DOCUMENTED_DEFAULTS.applicationInsights,
      ),
      speechEndpoint: envOrDefault(
        "AZURE_AI_FOUNDRY_SPEECH_ENDPOINT",
        `https://${resourceName}.cognitiveservices.azure.com/`,
      ),
      speechRegion: envOrDefault("AZURE_AI_FOUNDRY_SPEECH_REGION", DOCUMENTED_DEFAULTS.speechRegion),
      sttLanguage: envOrDefault("MUSE_VOICE_STT_LANGUAGE", "en-US"),
      ttsVoiceName: envOrDefault("MUSE_VOICE_TTS_VOICE", "en-US-AvaMultilingualNeural"),
      ...overrides,
    };
  }

  getValues(): FoundryVoiceConfigurationValues {
    return { ...this.values };
  }

  getProvider(): VoiceProviderKind {
    return this.values.provider;
  }

  isFoundryProvider(): boolean {
    return this.values.provider === "foundry";
  }

  getEndpoint(): string {
    return this.values.speechEndpoint;
  }

  getRegion(): string {
    return this.values.speechRegion;
  }

  getModel(): string {
    return this.values.sttLanguage;
  }

  getVoiceProfile(): string {
    return this.values.ttsVoiceName;
  }

  /**
   * Validates that the configuration has everything required to attempt a
   * real Foundry connection (non-empty endpoint/region). Does NOT validate
   * authentication — see `FoundryTokenProvider.validateAuthentication()`
   * and `VoiceDiagnostics.testConnectivity()` for that.
   */
  validate(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    if (!this.values.speechEndpoint) issues.push("speechEndpoint is not configured.");
    if (!this.values.speechRegion) issues.push("speechRegion is not configured.");
    if (!this.values.resourceName) issues.push("resourceName is not configured.");
    return { valid: issues.length === 0, issues };
  }
}

export const foundryVoiceConfiguration = new FoundryVoiceConfiguration();
