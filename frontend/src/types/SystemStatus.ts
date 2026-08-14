/**
 * System-level status indicators layered on top of the Phase 1 MuseState.
 * These do not replace or modify the existing visualizer states — they
 * represent orthogonal connectivity/sync/action status shown in the footer
 * status bar and as overlay badges.
 */

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export type SyncStatus = "idle" | "syncing" | "error";

export type CopilotStatus = "ready" | "retrieving" | "unavailable";

export type MemoryStatus = "ready" | "indexing" | "error";

export interface SystemStatusIndicators {
  connection: ConnectionStatus;
  sync: SyncStatus;
  copilot: CopilotStatus;
  memory: MemoryStatus;
  executingAction: boolean;
  retrievingContext: boolean;
}
