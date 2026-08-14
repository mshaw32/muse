/**
 * Result envelope returned by every executed (or approval-pending) action.
 */

import { ApprovalStatus, ISOTimestamp } from "@muse/shared";

export type ActionExecutionStatus = "completed" | "failed" | "awaiting_approval" | "rejected";

export interface ActionResult {
  actionId: string;
  status: ActionExecutionStatus;
  approvalStatus: ApprovalStatus;
  message: string;
  data?: unknown;
  executedAt: ISOTimestamp;
}
