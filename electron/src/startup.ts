/**
 * "Launch MUSE When Computer Starts" support.
 *
 * Wraps Electron's native login-item APIs and keeps the user's preference
 * in sync with the persisted MuseSettings (StartupMode).
 */

import { app } from "electron";
import { SettingsService, StartupMode } from "@muse/shared";

export function isLaunchAtLoginEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}

export function applyStartupMode(mode: StartupMode): void {
  app.setLoginItemSettings({
    openAtLogin: mode === "launch-at-login",
    openAsHidden: mode === "launch-at-login",
  });
}

/** Reconciles the OS login-item state with persisted settings at startup. */
export function syncStartupModeFromSettings(settingsService: SettingsService): void {
  const settings = settingsService.getSettings();
  applyStartupMode(settings.startupMode);
}

export function setLaunchAtLogin(settingsService: SettingsService, enabled: boolean): StartupMode {
  const mode: StartupMode = enabled ? "launch-at-login" : "manual";
  applyStartupMode(mode);
  settingsService.updateSettings({ startupMode: mode });
  return mode;
}
