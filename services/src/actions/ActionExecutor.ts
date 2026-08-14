/**
 * Executes registered actions while enforcing the MUSE human-approval model.
 *
 * MUSE may recommend actions, but must request explicit user approval
 * before anything consequential: deleting content, sending messages,
 * modifying existing documents, moving files, updating Planner, or
 * modifying Outlook. This executor is the single choke point where that
 * policy is enforced, regardless of which plugin implements the action.
 */

import { AuditLogger, Logger, nowISO, rootAuditLogger } from "@muse/shared";
import { ALWAYS_APPROVAL_CATEGORIES } from "./ActionModels";
import { ActionRegistry } from "./ActionRegistry";
import { ActionRequest } from "./ActionRequest";
import { ActionResult } from "./ActionResult";

export class ActionExecutor {
  private readonly registry: ActionRegistry;
  private readonly logger: Logger;
  private readonly auditLogger: AuditLogger;

  constructor(
    registry: ActionRegistry,
    logger: Logger = new Logger("muse:actions:executor"),
    auditLogger: AuditLogger = rootAuditLogger,
  ) {
    this.registry = registry;
    this.logger = logger;
    this.auditLogger = auditLogger;
  }

  async execute(request: ActionRequest): Promise<ActionResult> {
    const action = this.registry.get(request.actionId);

    if (!action) {
      return {
        actionId: request.actionId,
        status: "failed",
        approvalStatus: "not_required",
        message: `No action registered with id "${request.actionId}".`,
        executedAt: nowISO(),
      };
    }

    const needsApproval =
      action.requiresApproval || ALWAYS_APPROVAL_CATEGORIES.includes(action.category);

    if (needsApproval && !request.approvedByUser) {
      this.auditLogger.record("action", `Action awaiting approval: ${action.id}`, request.requestedBy, {
        actionId: action.id,
        category: action.category,
      });

      return {
        actionId: action.id,
        status: "awaiting_approval",
        approvalStatus: "pending",
        message: `"${action.name}" requires your approval before it can run.`,
        executedAt: nowISO(),
      };
    }

    try {
      const result = await action.execute(request);
      this.auditLogger.record("action", `Action executed: ${action.id}`, request.requestedBy, {
        actionId: action.id,
        status: result.status,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown action execution error.";
      this.logger.error("Action execution failed", { actionId: action.id, message });
      this.auditLogger.record("action", `Action failed: ${action.id}`, request.requestedBy, { message });

      return {
        actionId: action.id,
        status: "failed",
        approvalStatus: needsApproval ? "approved" : "not_required",
        message,
        executedAt: nowISO(),
      };
    }
  }
}
