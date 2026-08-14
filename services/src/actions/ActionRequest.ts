/**
 * Invocation payload for executing a registered action.
 */

import { EntityId } from "@muse/shared";

export interface ActionRequest {
  actionId: string;
  /** Arbitrary, action-specific parameters. */
  parameters: Record<string, unknown>;
  /** Set when the user has already approved a previously-recommended action. */
  approvedByUser?: boolean;
  requestedBy?: string;
  conversationId?: EntityId;
}
