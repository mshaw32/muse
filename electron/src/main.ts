/**
 * Electron main process entry point.
 *
 * Boots the window manager, tray, global hotkeys, and settings-backed IPC
 * handlers that let the renderer (React frontend) control window modes and
 * preferences without direct Node/Electron access.
 */

import { app, ipcMain, session, systemPreferences } from "electron";
import { Logger, SettingsService, SettingsStore, WindowMode } from "@muse/shared";
import { getSettingsDirectory } from "./config";
import { WindowManager } from "./windowManager";
import { createTray } from "./tray";
import { registerHotkeys } from "./hotkeys";
import { setLaunchAtLogin, syncStartupModeFromSettings } from "./startup";

const logger = new Logger("muse:electron:main");

// macOS/Windows single-instance lock: focus the existing window instead of
// spawning a second MUSE process when the user re-launches or hits the hotkey.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

let isQuitting = false;

app.whenReady().then(() => {
  // Phase 4.1 — real Azure AI Foundry Voice requires genuine microphone
  // access via getUserMedia in the renderer. Grant Electron's own media
  // permission requests automatically (MUSE is a trusted, single-purpose
  // app), but this does NOT bypass the OS-level microphone permission
  // prompt (e.g. macOS System Settings > Privacy > Microphone) — that must
  // still be granted by the user the first time, or getUserMedia will
  // reject and the frontend will surface a real "Error" state.
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === "media") {
      callback(true);
      return;
    }
    callback(false);
  });

  // On macOS, proactively request OS-level microphone access on startup so
  // the user sees the system permission dialog immediately instead of
  // getUserMedia silently failing the first time Push-To-Talk is pressed.
  if (process.platform === "darwin" && systemPreferences.getMediaAccessStatus) {
    const micStatus = systemPreferences.getMediaAccessStatus("microphone");
    if (micStatus !== "granted") {
      void systemPreferences.askForMediaAccess("microphone");
    }
  }

  const settingsService = new SettingsService(new SettingsStore(getSettingsDirectory()));
  const windowManager = new WindowManager();

  const mainWindow = windowManager.createMainWindow();
  windowManager.setWindowMode(settingsService.getSettings().windowMode);

  syncStartupModeFromSettings(settingsService);

  const { unregisterAll } = registerHotkeys(
    settingsService.getSettings().hotkeys.toggleMuse,
    windowManager,
    () => mainWindow.webContents.send("muse:start-conversation"),
  );

  createTray(windowManager, () => {
    mainWindow.webContents.send("muse:open-settings");
  });

  ipcMain.handle("muse:get-window-mode", () => windowManager.getWindowMode());

  ipcMain.handle("muse:set-window-mode", (_event, mode: WindowMode) => {
    windowManager.setWindowMode(mode);
    settingsService.updateSettings({ windowMode: mode });
    return windowManager.getWindowMode();
  });

  ipcMain.handle("muse:get-settings", () => settingsService.getSettings());

  ipcMain.handle("muse:update-settings", (_event, partial) => settingsService.updateSettings(partial));

  ipcMain.handle("muse:set-launch-at-login", (_event, enabled: boolean) => {
    setLaunchAtLogin(settingsService, enabled);
    return enabled;
  });

  ipcMain.on("muse:minimize-to-tray", () => windowManager.hide());

  ipcMain.on("muse:quit", () => {
    isQuitting = true;
    app.quit();
  });

  app.on("before-quit", () => {
    isQuitting = true;
    unregisterAll();
  });

  // Keep MUSE running in the tray when the window is closed, matching the
  // "Hide MUSE" tray behavior, unless the user explicitly chose Exit.
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      windowManager.hide();
    }
  });

  app.on("activate", () => {
    windowManager.showAndFocus();
  });

  logger.info("MUSE Electron shell ready.");
});

app.on("second-instance", () => {
  logger.info("Second MUSE instance blocked; focusing existing window.");
});

app.on("window-all-closed", () => {
  // MUSE lives in the tray; do not quit on window close for any platform.
});
