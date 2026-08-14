/**
 * Public facade for the MUSE Action Framework.
 *
 * Wires the registry and executor together, and seeds the registry with the
 * example plugin actions on construction. Real integrations will register
 * additional plugins the same way — via `registerAction`.
 */

import { Logger } from "@muse/shared";
import { ActionDefinition } from "./ActionModels";
import { ActionRegistry } from "./ActionRegistry";
import { ActionExecutor } from "./ActionExecutor";
import { ActionRequest } from "./ActionRequest";
import { ActionResult } from "./ActionResult";
import { ALL_MOCK_PLUGINS } from "./plugins";

export class ActionService {
  private readonly registry: ActionRegistry;
  private readonly executor: ActionExecutor;
  private readonly logger: Logger;

  constructor(logger: Logger = new Logger("muse:actions")) {
    this.registry = new ActionRegistry();
    this.executor = new ActionExecutor(this.registry);
    this.logger = logger;

    for (const plugin of ALL_MOCK_PLUGINS) {
      this.registry.register(plugin);
    }
    this.logger.info("Action plugins registered", { count: ALL_MOCK_PLUGINS.length });
  }

  registerAction(action: ActionDefinition): void {
    this.registry.register(action);
  }

  listActions(): ActionDefinition[] {
    return this.registry.list();
  }

  execute(request: ActionRequest): Promise<ActionResult> {
    return this.executor.execute(request);
  }
}

export * from "./ActionModels";
export * from "./ActionRequest";
export * from "./ActionResult";
