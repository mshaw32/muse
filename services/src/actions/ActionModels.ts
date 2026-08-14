/**
 * Domain models for the MUSE Action Framework.
 *
 * All executable capabilities (Outlook, Planner, OneDrive, SharePoint,
 * Teams, OneNote, Loop, Word, Excel, PowerPoint, ...) register as plugins
 * conforming to `ActionDefinition`. This module defines that plugin
 * contract plus the category/approval model.
 */

import { ActionRequest } from "./ActionRequest";
import { ActionResult } from "./ActionResult";

export type ActionCategory = "information" | "create" | "update" | "delete" | "approval";

/** Integration surface an action plugin targets. Future integrations only. */
export type ActionIntegration =
  | "outlook"
  | "planner"
  | "onedrive"
  | "sharepoint"
  | "teams"
  | "onenote"
  | "loop"
  | "word"
  | "excel"
  | "powerpoint"
  | "muse";

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  category: ActionCategory;
  integration: ActionIntegration;
  /** Whether invoking this action requires explicit human approval first. */
  requiresApproval: boolean;
  execute: (request: ActionRequest) => Promise<ActionResult>;
}

/** Categories that always require approval regardless of plugin metadata,
 * per the MUSE human-approval security model. */
export const ALWAYS_APPROVAL_CATEGORIES: ActionCategory[] = ["delete", "approval"];
