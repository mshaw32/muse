/**
 * System tray integration.
 *
 * Menu: Open MUSE, Hide MUSE, Settings, Exit — per the Phase 2 spec.
 */

import { Menu, Tray, app, nativeImage } from "electron";
import { WindowManager } from "./windowManager";

/** 1x1 transparent PNG used as a safe cross-platform fallback tray icon. */
const FALLBACK_ICON_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export interface TrayHandles {
  tray: Tray;
  destroy: () => void;
}

export function createTray(windowManager: WindowManager, onOpenSettings: () => void): TrayHandles {
  const icon = nativeImage.createFromBuffer(Buffer.from(FALLBACK_ICON_BASE64, "base64"));
  const tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("MUSE — Michael's Unified Strategy Engine");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open MUSE",
      click: () => windowManager.showAndFocus(),
    },
    {
      label: "Hide MUSE",
      click: () => windowManager.hide(),
    },
    { type: "separator" },
    {
      label: "Settings",
      click: () => {
        windowManager.showAndFocus();
        onOpenSettings();
      },
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => windowManager.toggleVisibility());

  return {
    tray,
    destroy: () => tray.destroy(),
  };
}
