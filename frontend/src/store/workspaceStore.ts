import { create } from "zustand";
import { museApiClient } from "../lib/api";
import { useSystemStatusStore } from "./systemStatusStore";
import type {
  ActionResultSummary,
  RegisteredAction,
  SourceCitation,
  VaultResult,
  WorkspaceProject,
} from "../types/Workspace";

interface CopilotRetrieveFilesResult {
  files: { name: string; path: string }[];
}

interface CopilotRetrieveProjectsResult {
  projects: { id: string; name: string; status: string; owner: string }[];
}

interface MemorySearchResponse {
  vaultResults: VaultResult[];
}

interface ActionsListResponse {
  actions: RegisteredAction[];
}

interface ActionExecuteResponse {
  result: ActionResultSummary;
}

interface WorkspaceStore {
  projects: WorkspaceProject[];
  vaultResults: VaultResult[];
  activeSources: SourceCitation[];
  recentFiles: { name: string; path: string }[];
  registeredActions: RegisteredAction[];
  actionResults: ActionResultSummary[];
  loading: boolean;

  refreshProjects: () => Promise<void>;
  refreshRecentFiles: () => Promise<void>;
  searchVault: (query: string) => Promise<void>;
  refreshActions: () => Promise<void>;
  runAction: (actionId: string, approvedByUser?: boolean) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  projects: [],
  vaultResults: [],
  activeSources: [
    { title: "Microsoft 365 Copilot", sourceType: "enterprise-intelligence" },
    { title: "Azure AI Foundry Voice", sourceType: "voice" },
  ],
  recentFiles: [],
  registeredActions: [],
  actionResults: [],
  loading: false,

  refreshProjects: async () => {
    set({ loading: true });
    useSystemStatusStore.getState().setRetrievingContext(true);
    try {
      const response = (await museApiClient.copilotRetrieve("projects")) as CopilotRetrieveProjectsResult;
      set({
        projects: response.projects.map((project) => ({
          id: project.id,
          title: project.name,
          summary: `${project.status} · owned by ${project.owner}`,
        })),
      });
      useSystemStatusStore.getState().setCopilot("ready");
    } catch {
      useSystemStatusStore.getState().setCopilot("unavailable");
    } finally {
      set({ loading: false });
      useSystemStatusStore.getState().setRetrievingContext(false);
    }
  },

  refreshRecentFiles: async () => {
    useSystemStatusStore.getState().setRetrievingContext(true);
    try {
      const response = (await museApiClient.copilotRetrieve("files")) as CopilotRetrieveFilesResult;
      set({ recentFiles: response.files });
      useSystemStatusStore.getState().setCopilot("ready");
    } catch {
      useSystemStatusStore.getState().setCopilot("unavailable");
    } finally {
      useSystemStatusStore.getState().setRetrievingContext(false);
    }
  },

  searchVault: async (query: string) => {
    if (!query.trim()) {
      set({ vaultResults: [] });
      return;
    }
    useSystemStatusStore.getState().setMemory("indexing");
    try {
      const response = (await museApiClient.memorySearch(query)) as MemorySearchResponse;
      set({ vaultResults: response.vaultResults ?? [] });
      useSystemStatusStore.getState().setMemory("ready");
    } catch {
      useSystemStatusStore.getState().setMemory("error");
    }
  },

  refreshActions: async () => {
    try {
      const response = (await museApiClient.listActions()) as ActionsListResponse;
      set({ registeredActions: response.actions });
    } catch {
      // Actions list is best-effort; leave the previous list in place.
    }
  },

  runAction: async (actionId: string, approvedByUser = false) => {
    useSystemStatusStore.getState().setExecutingAction(true);
    try {
      const response = (await museApiClient.executeAction(actionId, {}, approvedByUser)) as ActionExecuteResponse;
      set({ actionResults: [response.result, ...get().actionResults].slice(0, 10) });
    } finally {
      useSystemStatusStore.getState().setExecutingAction(false);
    }
  },
}));
