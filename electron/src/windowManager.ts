/**
 * Owns the lifecycle of MUSE's BrowserWindow(s) and implements the window
 * modes required by the Phase 2 spec: Normal, Always On Top, Mini, and
 * Floating Assistant Mode.
 */

import { BrowserWindow, screen, shell } from "electron";
import * as path from "path";
import type { WindowMode } from "@muse/shared";
import {
  DEFAULT_WINDOW_SIZE,
  DEV_SERVER_URL,
  FLOATING_WINDOW_SIZE,
  MINI_WINDOW_SIZE,
  getProductionEntryPoint,
  isDev,
} from "./config";

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private currentMode: WindowMode = "normal";

  createMainWindow(): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return this.mainWindow;
    }

    const window = new BrowserWindow({
      ...DEFAULT_WINDOW_SIZE,
      minWidth: 720,
      minHeight: 560,
      backgroundColor: "#050816",
      title: "MUSE",
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    if (isDev) {
      void window.loadURL(DEV_SERVER_URL);
    } else {
      void window.loadFile(getProductionEntryPoint());
    }

    window.once("ready-to-show", () => window.show());

    // Open external links (e.g. future Copilot citation URLs) in the OS
    // browser rather than navigating the MUSE shell away from the app.
    window.webContents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url);
      return { action: "deny" };
    });

    window.on("closed", () => {
      this.mainWindow = null;
    });

    this.mainWindow = window;
    return window;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  showAndFocus(): void {
    const window = this.mainWindow ?? this.createMainWindow();
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  }

  hide(): void {
    this.mainWindow?.hide();
  }

  toggleVisibility(): void {
    const window = this.mainWindow;
    if (!window) {
      this.showAndFocus();
      return;
    }
    if (window.isVisible() && window.isFocused()) {
      this.hide();
    } else {
      this.showAndFocus();
    }
  }

  getWindowMode(): WindowMode {
    return this.currentMode;
  }

  setWindowMode(mode: WindowMode): void {
    const window = this.mainWindow ?? this.createMainWindow();
    this.currentMode = mode;

    switch (mode) {
      case "normal":
        window.setAlwaysOnTop(false);
        window.setResizable(true);
        window.setSize(DEFAULT_WINDOW_SIZE.width, DEFAULT_WINDOW_SIZE.height);
        break;

      case "always-on-top":
        window.setAlwaysOnTop(true, "floating");
        window.setResizable(true);
        break;

      case "mini":
        window.setAlwaysOnTop(true, "floating");
        window.setResizable(false);
        window.setSize(MINI_WINDOW_SIZE.width, MINI_WINDOW_SIZE.height);
        this.snapToCorner(window, MINI_WINDOW_SIZE.width, MINI_WINDOW_SIZE.height);
        break;

      case "floating":
        window.setAlwaysOnTop(true, "floating");
        window.setResizable(false);
        window.setSize(FLOATING_WINDOW_SIZE.width, FLOATING_WINDOW_SIZE.height);
        this.snapToCorner(window, FLOATING_WINDOW_SIZE.width, FLOATING_WINDOW_SIZE.height);
        break;

      default:
        break;
    }
  }

  private snapToCorner(window: BrowserWindow, width: number, height: number): void {
    const display = screen.getPrimaryDisplay();
    const { workArea } = display;
    const margin = 24;
    window.setPosition(
      workArea.x + workArea.width - width - margin,
      workArea.y + workArea.height - height - margin,
    );
  }
}
