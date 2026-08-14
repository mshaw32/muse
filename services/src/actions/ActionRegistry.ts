/**
 * Central plugin registry for all MUSE actions.
 *
 * Every capability (current and future: Outlook, Planner, OneDrive,
 * SharePoint, Teams, OneNote, Loop, Word, Excel, PowerPoint) registers here
 * as an `ActionDefinition`. The registry itself has no knowledge of any
 * specific integration — it is purely a plugin catalog.
 */

import { Logger } from "@muse/shared";
import { ActionDefinition } from "./ActionModels";

export class ActionRegistry {
  private readonly actions: Map<string, ActionDefinition> = new Map();
  private readonly logger: Logger;

  constructor(logger: Logger = new Logger("muse:actions:registry")) {
    this.logger = logger;
  }

  register(action: ActionDefinition): void {
    if (this.actions.has(action.id)) {
      this.logger.warn("Overwriting existing action registration", { actionId: action.id });
    }
    this.actions.set(action.id, action);
    this.logger.debug("Registered action", { actionId: action.id, integration: action.integration });
  }

  unregister(actionId: string): boolean {
    return this.actions.delete(actionId);
  }

  get(actionId: string): ActionDefinition | undefined {
    return this.actions.get(actionId);
  }

  list(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  listByCategory(category: ActionDefinition["category"]): ActionDefinition[] {
    return this.list().filter((action) => action.category === category);
  }

  listByIntegration(integration: ActionDefinition["integration"]): ActionDefinition[] {
    return this.list().filter((action) => action.integration === integration);
  }
}
