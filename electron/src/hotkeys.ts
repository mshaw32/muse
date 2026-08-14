/**
 * Global shortcut registration.
 *
 * Default: CommandOrControl+Shift+Space — resolves to CTRL+SHIFT+SPACE on
 * Windows/Linux and CMD+SHIFT+SPACE on macOS automatically via Electron's
 * "CommandOrControl" accelerator alias.
 *
 * Behavior on trigger: show + focus the MUSE window and signal the
 * renderer to start a conversation (push-to-talk auto-engage).
 */

import { globalShortcut } from "electron";
import { WindowManager } from "./windowManager";

export interface HotkeyHandles {
  unregisterAll: () => void;
}

export function registerHotkeys(
  accelerator: string,
  windowManager: WindowManager,
  onStartConversation: () => void,
): HotkeyHandles {
  const registered = globalShortcut.register(accelerator, () => {
    windowManager.showAndFocus();
    onStartConversation();
  });

  if (!registered) {
    // eslint-disable-next-line no-console
    console.warn(`MUSE: failed to register global shortcut "${accelerator}". It may be in use by another app.`);
  }

  return {
    unregisterAll: () => globalShortcut.unregisterAll(),
  };
}
