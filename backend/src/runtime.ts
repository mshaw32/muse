/**
 * Singleton MuseRuntime instance for the Express backend process.
 *
 * The vault root resolves to the repository's top-level `vault/` directory
 * so Memory/Conversation services read and write alongside the rest of the
 * user's personal knowledge base.
 */

import * as path from "path";
import { MuseRuntime } from "@muse/services";

const vaultRoot = path.resolve(__dirname, "..", "..", "vault");
const dataDirectory = path.resolve(__dirname, "..", ".muse-data");

let runtime: MuseRuntime | null = null;

export function getRuntime(): MuseRuntime {
  if (!runtime) {
    runtime = new MuseRuntime({ vaultRoot, dataDirectory });
  }
  return runtime;
}
