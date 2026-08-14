/**
 * Composition root for all MUSE services.
 *
 * A single `MuseRuntime` instance wires together Memory, Copilot, Voice,
 * Actions, and Conversation services with consistent storage locations.
 * Both the Express backend and the Electron main process construct one of
 * these at startup rather than instantiating services ad hoc.
 */

import * as path from "path";
import { Logger, SettingsService, SettingsStore } from "@muse/shared";
import { MemoryService } from "./memory/MemoryService";
import { CopilotService } from "./copilot/CopilotService";
import { VoiceService } from "./voice/VoiceService";
import { ActionService } from "./actions/ActionService";
import { ConversationService } from "./conversation/ConversationService";
import { ConversationManager } from "./conversation/ConversationManager";
import { ConversationStore } from "./conversation/ConversationStore";

export interface MuseRuntimeOptions {
  /** Root of the MUSE vault (contains projects/, customers/, sessions/, etc). */
  vaultRoot: string;
  /** Directory used for MUSE-internal data files (settings, ledgers). */
  dataDirectory: string;
}

export class MuseRuntime {
  readonly memory: MemoryService;
  readonly copilot: CopilotService;
  readonly voice: VoiceService;
  readonly actions: ActionService;
  readonly conversation: ConversationService;
  readonly conversationManager: ConversationManager;
  readonly settings: SettingsService;
  private readonly logger: Logger;

  constructor(options: MuseRuntimeOptions) {
    this.logger = new Logger("muse:runtime");

    this.memory = new MemoryService({
      dataDirectory: path.join(options.vaultRoot, "sessions"),
      vaultRoot: options.vaultRoot,
    });

    this.copilot = new CopilotService();
    this.voice = new VoiceService();
    this.actions = new ActionService();

    const conversationStore = new ConversationStore(path.join(options.vaultRoot, "sessions"));
    this.conversation = new ConversationService(conversationStore, this.copilot.chat);
    this.conversationManager = new ConversationManager(this.conversation);

    this.settings = new SettingsService(new SettingsStore(options.dataDirectory));

    this.logger.info("MUSE runtime initialized", {
      vaultRoot: options.vaultRoot,
      dataDirectory: options.dataDirectory,
    });
  }
}
