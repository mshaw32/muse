/**
 * Frontend-only view models for the Sidebar and Context Panel. These are
 * intentionally lightweight subsets of the richer backend/service models
 * (see services/src/copilot, services/src/memory, services/src/actions) —
 * the frontend only needs enough shape to render, not the full Node-side
 * service contracts.
 */

export interface WorkspaceProject {
  id: string;
  title: string;
  summary: string;
}

export interface VaultResult {
  relativePath: string;
  title: string;
  excerpt: string;
}

export interface SourceCitation {
  title: string;
  sourceType: string;
}

export interface RegisteredAction {
  id: string;
  name: string;
  description: string;
  category: string;
  integration: string;
  requiresApproval: boolean;
}

export interface ActionResultSummary {
  actionId: string;
  status: string;
  message: string;
  executedAt: string;
}
