/**
 * File-backed persistence for MuseSettings.
 *
 * Works identically in the Electron main process and the Express backend:
 * both are Node processes with filesystem access. The storage location can
 * be overridden (Electron will point this at `app.getPath("userData")`).
 */

import * as fs from "fs";
import * as path from "path";
import { DEFAULT_SETTINGS, MuseSettings } from "./SettingsModels";

export class SettingsStore {
  private readonly filePath: string;
  private cache: MuseSettings | null = null;

  constructor(directory: string, fileName = "muse-settings.json") {
    this.filePath = path.join(directory, fileName);
  }

  load(): MuseSettings {
    if (this.cache) {
      return this.cache;
    }

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw) as Partial<MuseSettings>;
        this.cache = mergeWithDefaults(parsed);
        return this.cache;
      }
    } catch {
      // Corrupt or unreadable settings file — fall back to defaults below.
    }

    this.cache = { ...DEFAULT_SETTINGS };
    this.persist(this.cache);
    return this.cache;
  }

  save(settings: MuseSettings): MuseSettings {
    this.cache = settings;
    this.persist(settings);
    return settings;
  }

  update(partial: Partial<MuseSettings>): MuseSettings {
    const current = this.load();
    const merged = mergeWithDefaults({ ...current, ...partial });
    return this.save(merged);
  }

  private persist(settings: MuseSettings): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(settings, null, 2), "utf-8");
    } catch {
      // Settings persistence is best-effort; failures should not crash MUSE.
    }
  }
}

function mergeWithDefaults(partial: Partial<MuseSettings>): MuseSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    hotkeys: { ...DEFAULT_SETTINGS.hotkeys, ...partial.hotkeys },
    voice: { ...DEFAULT_SETTINGS.voice, ...partial.voice },
    memory: { ...DEFAULT_SETTINGS.memory, ...partial.memory },
    copilot: { ...DEFAULT_SETTINGS.copilot, ...partial.copilot },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...partial.notifications },
  };
}
