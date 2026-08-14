import { create } from "zustand";
import type {
  ConnectionStatus,
  CopilotStatus,
  MemoryStatus,
  SyncStatus,
  SystemStatusIndicators,
} from "../types/SystemStatus";

interface SystemStatusStore extends SystemStatusIndicators {
  setConnection: (status: ConnectionStatus) => void;
  setSync: (status: SyncStatus) => void;
  setCopilot: (status: CopilotStatus) => void;
  setMemory: (status: MemoryStatus) => void;
  setExecutingAction: (executing: boolean) => void;
  setRetrievingContext: (retrieving: boolean) => void;
}

export const useSystemStatusStore = create<SystemStatusStore>((set) => ({
  connection: "connecting",
  sync: "idle",
  copilot: "ready",
  memory: "ready",
  executingAction: false,
  retrievingContext: false,

  setConnection: (connection) => set({ connection }),
  setSync: (sync) => set({ sync }),
  setCopilot: (copilot) => set({ copilot }),
  setMemory: (memory) => set({ memory }),
  setExecutingAction: (executingAction) => set({ executingAction }),
  setRetrievingContext: (retrievingContext) => set({ retrievingContext }),
}));
