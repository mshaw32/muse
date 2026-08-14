/**
 * Preload script: the only bridge between the sandboxed renderer (React
 * frontend) and privileged main-process capabilities. Exposes a minimal,
 * explicit `window.museAPI` surface via contextBridge — no direct Node or
 * Electron APIs are exposed to the renderer.
 */

import { contextBridge, ipcRenderer } from "electron";
import type { MuseSettings, WindowMode } from "@muse/shared";

export interface MuseDesktopAPI {
  platform: NodeJS.Platform;
  isElectron: true;

  onStartConversation: (callback: () => void) => () => void;
  onOpenSettings: (callback: () => void) => () => void;

  getWindowMode: () => Promise<WindowMode>;
  setWindowMode: (mode: WindowMode) => Promise<WindowMode>;

  getSettings: () => Promise<MuseSettings>;
  updateSettings: (partial: Partial<MuseSettings>) => Promise<MuseSettings>;

  setLaunchAtLogin: (enabled: boolean) => Promise<boolean>;

  minimizeToTray: () => void;
  quit: () => void;
}

const api: MuseDesktopAPI = {
  platform: process.platform,
  isElectron: true,

  onStartConversation: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("muse:start-conversation", listener);
    return () => ipcRenderer.removeListener("muse:start-conversation", listener);
  },

  onOpenSettings: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("muse:open-settings", listener);
    return () => ipcRenderer.removeListener("muse:open-settings", listener);
  },

  getWindowMode: () => ipcRenderer.invoke("muse:get-window-mode"),
  setWindowMode: (mode) => ipcRenderer.invoke("muse:set-window-mode", mode),

  getSettings: () => ipcRenderer.invoke("muse:get-settings"),
  updateSettings: (partial) => ipcRenderer.invoke("muse:update-settings", partial),

  setLaunchAtLogin: (enabled) => ipcRenderer.invoke("muse:set-launch-at-login", enabled),

  minimizeToTray: () => ipcRenderer.send("muse:minimize-to-tray"),
  quit: () => ipcRenderer.send("muse:quit"),
};

contextBridge.exposeInMainWorld("museAPI", api);
