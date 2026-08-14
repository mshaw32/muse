/**
 * Runtime configuration shared by the Electron main process modules.
 *
 * Determines whether MUSE is running against the Vite dev server or a
 * production build of the frontend, and resolves the on-disk locations
 * used for settings persistence.
 */

import * as path from "path";
import { app } from "electron";

export const isDev = !app.isPackaged;

export const DEV_SERVER_URL = process.env.MUSE_DEV_SERVER_URL ?? "http://localhost:5173";

/** Path to the built frontend's index.html (production mode). */
export function getProductionEntryPoint(): string {
  return path.join(__dirname, "..", "..", "frontend", "dist", "index.html");
}

/** Directory used to persist MUSE desktop settings (per-OS user data dir). */
export function getSettingsDirectory(): string {
  return app.getPath("userData");
}

export const DEFAULT_WINDOW_SIZE = { width: 1280, height: 820 };
export const MINI_WINDOW_SIZE = { width: 380, height: 520 };
export const FLOATING_WINDOW_SIZE = { width: 240, height: 240 };
