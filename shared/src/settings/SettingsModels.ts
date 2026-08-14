/**
 * Persisted application settings shared by the frontend (via backend API),
 * the Electron shell, and backend services.
 */

export type ThemeMode = "dark" | "light";

export type WindowMode = "normal" | "always-on-top" | "mini" | "floating";

export type StartupMode = "manual" | "launch-at-login";

export interface HotkeySettings {
  /** Electron accelerator string, e.g. "CommandOrControl+Shift+Space". */
  toggleMuse: string;
}

export interface VoiceSettingsConfig {
  inputDeviceId: string | null;
  outputDeviceId: string | null;
  voiceProfile: string;
  volume: number;
  wakeWordEnabled: boolean;
  pushToTalkEnabled: boolean;
}

export interface MemoryPreferences {
  autoStoreConversationSummaries: boolean;
  autoIndexVault: boolean;
  retentionDays: number;
}

export interface CopilotPreferences {
  enterpriseGroundingEnabled: boolean;
  defaultWorkContextScope: "mine" | "team" | "organization";
}

export interface NotificationPreferences {
  desktopNotificationsEnabled: boolean;
  soundEnabled: boolean;
  actionApprovalAlertsEnabled: boolean;
}

export interface MuseSettings {
  theme: ThemeMode;
  windowMode: WindowMode;
  startupMode: StartupMode;
  hotkeys: HotkeySettings;
  voice: VoiceSettingsConfig;
  memory: MemoryPreferences;
  copilot: CopilotPreferences;
  notifications: NotificationPreferences;
}

export const DEFAULT_SETTINGS: MuseSettings = {
  theme: "dark",
  windowMode: "normal",
  startupMode: "manual",
  hotkeys: {
    toggleMuse: "CommandOrControl+Shift+Space",
  },
  voice: {
    inputDeviceId: null,
    outputDeviceId: null,
    voiceProfile: "muse-default",
    volume: 0.8,
    wakeWordEnabled: false,
    pushToTalkEnabled: true,
  },
  memory: {
    autoStoreConversationSummaries: true,
    autoIndexVault: true,
    retentionDays: 365,
  },
  copilot: {
    enterpriseGroundingEnabled: true,
    defaultWorkContextScope: "mine",
  },
  notifications: {
    desktopNotificationsEnabled: true,
    soundEnabled: true,
    actionApprovalAlertsEnabled: true,
  },
};
