/**
 * Public API for reading/writing MUSE application settings.
 * Thin service wrapper around SettingsStore so callers (backend routes,
 * Electron IPC handlers) don't need to know about the persistence details.
 */

import { DEFAULT_SETTINGS, MuseSettings } from "./SettingsModels";
import { SettingsStore } from "./SettingsStore";
import { Logger } from "../logging/Logger";

export class SettingsService {
  private readonly store: SettingsStore;
  private readonly logger: Logger;

  constructor(store: SettingsStore, logger: Logger = new Logger("muse:settings")) {
    this.store = store;
    this.logger = logger;
  }

  getSettings(): MuseSettings {
    return this.store.load();
  }

  updateSettings(partial: Partial<MuseSettings>): MuseSettings {
    const updated = this.store.update(partial);
    this.logger.info("Settings updated", { keys: Object.keys(partial) });
    return updated;
  }

  resetSettings(): MuseSettings {
    return this.store.save({ ...DEFAULT_SETTINGS });
  }
}
