/**
 * Structural typing for the `window.museAPI` bridge exposed by the Electron
 * preload script (electron/src/preload.ts). Duplicated here (rather than
 * imported from the electron package) so the frontend can be built and
 * type-checked independently of the desktop shell, and still runs fine as a
 * plain web app when `window.museAPI` is undefined.
 */

export type WindowMode = "normal" | "always-on-top" | "mini" | "floating";

export interface MuseDesktopSettings {
  theme: "dark" | "light";
  windowMode: WindowMode;
  startupMode: "manual" | "launch-at-login";
  hotkeys: { toggleMuse: string };
  voice: {
    voiceEnabled: boolean;
    inputDeviceId: string | null;
    outputDeviceId: string | null;
    voiceProfile: string;
    volume: number;
    wakeWordEnabled: boolean;
    pushToTalkEnabled: boolean;
    autoStartListening: boolean;
  };
  memory: {
    autoStoreConversationSummaries: boolean;
    autoIndexVault: boolean;
    retentionDays: number;
  };
  copilot: {
    enterpriseGroundingEnabled: boolean;
    defaultWorkContextScope: "mine" | "team" | "organization";
  };
  notifications: {
    desktopNotificationsEnabled: boolean;
    soundEnabled: boolean;
    actionApprovalAlertsEnabled: boolean;
  };
}

export interface MuseDesktopAPI {
  platform: string;
  isElectron: true;

  onStartConversation: (callback: () => void) => () => void;
  onOpenSettings: (callback: () => void) => () => void;

  getWindowMode: () => Promise<WindowMode>;
  setWindowMode: (mode: WindowMode) => Promise<WindowMode>;

  getSettings: () => Promise<MuseDesktopSettings>;
  updateSettings: (partial: Partial<MuseDesktopSettings>) => Promise<MuseDesktopSettings>;

  setLaunchAtLogin: (enabled: boolean) => Promise<boolean>;

  minimizeToTray: () => void;
  quit: () => void;
}

declare global {
  interface Window {
    museAPI?: MuseDesktopAPI;
  }
}

export {};
