/**
 * Zustand store for the Phase 3 Copilot Chat/Retrieval/Conversation
 * experience. Kept separate from the Phase 1 `museStore` (voice transcript)
 * and the Phase 2 `workspaceStore`/`systemStatusStore` so none of that
 * existing state or behavior is touched.
 */

import { create } from "zustand";
import { copilotClient } from "../services/copilot/CopilotClient";
import type {
  Conversation,
  CopilotConnectionStatus,
  Message,
  Source,
  StreamChunk,
} from "../services/copilot/CopilotModels";

export type StreamingState = "idle" | "streaming" | "complete" | "error";

interface CopilotStore {
  currentConversation: Conversation | null;
  copilotStatus: CopilotConnectionStatus;
  sources: Source[];
  streamingState: StreamingState;
  streamingText: string;
  retrievalResults: Source[];
  history: Conversation[];
  error: string | null;

  refreshStatus: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;

  startNewConversation: () => Promise<void>;
  loadActiveConversation: () => Promise<void>;
  clearConversation: () => Promise<void>;
  loadHistory: () => Promise<void>;
  exportConversation: (format: "json" | "markdown") => Promise<string | null>;

  sendPrompt: (prompt: string) => Promise<void>;
  streamPrompt: (prompt: string) => Promise<void>;
  retrieve: (type: "work-context" | "files" | "meetings" | "projects" | "tasks", query: string) => Promise<void>;
}

export const useCopilotStore = create<CopilotStore>((set, get) => ({
  currentConversation: null,
  copilotStatus: "disconnected",
  sources: [],
  streamingState: "idle",
  streamingText: "",
  retrievalResults: [],
  history: [],
  error: null,

  refreshStatus: async () => {
    try {
      const status = await copilotClient.status();
      set({ copilotStatus: status.connectionStatus, error: null });
    } catch (error) {
      set({ copilotStatus: "error", error: error instanceof Error ? error.message : "status_failed" });
    }
  },

  login: async () => {
    set({ copilotStatus: "authenticating" });
    try {
      const { auth } = await copilotClient.login();
      set({ copilotStatus: auth.connectionStatus, error: null });
    } catch (error) {
      set({ copilotStatus: "error", error: error instanceof Error ? error.message : "login_failed" });
    }
  },

  logout: async () => {
    try {
      const { auth } = await copilotClient.logout();
      set({ copilotStatus: auth.connectionStatus });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "logout_failed" });
    }
  },

  startNewConversation: async () => {
    const { conversation } = await copilotClient.newConversation();
    set({ currentConversation: conversation, sources: [], streamingState: "idle", streamingText: "" });
  },

  loadActiveConversation: async () => {
    const { conversation } = await copilotClient.activeConversation();
    if (conversation) {
      const lastAssistant = [...conversation.messages].reverse().find((message) => message.role === "assistant");
      set({ currentConversation: conversation, sources: lastAssistant?.sources ?? [] });
    }
  },

  clearConversation: async () => {
    const { conversation } = await copilotClient.clearConversation();
    set({ currentConversation: conversation, sources: [], streamingState: "idle", streamingText: "" });
  },

  loadHistory: async () => {
    const { conversations } = await copilotClient.history();
    set({ history: conversations });
  },

  exportConversation: async (format) => {
    const conversation = get().currentConversation;
    if (!conversation) return null;
    const { export: exported } = await copilotClient.exportConversation(conversation.id, format);
    return exported.content;
  },

  sendPrompt: async (prompt: string) => {
    const conversationId = get().currentConversation?.id;
    set({ streamingState: "streaming", error: null });
    try {
      const response = await copilotClient.chat(prompt, conversationId);
      set({
        currentConversation: response.conversation,
        sources: response.sources,
        streamingState: "complete",
        streamingText: "",
      });
    } catch (error) {
      set({ streamingState: "error", error: error instanceof Error ? error.message : "chat_failed" });
    }
  },

  streamPrompt: async (prompt: string) => {
    const conversationId = get().currentConversation?.id;
    set({ streamingState: "streaming", streamingText: "", error: null });

    try {
      const finalMessage: Message | undefined = await copilotClient.streamPrompt(
        prompt,
        conversationId,
        (chunk: StreamChunk) => {
          if (!chunk.done) {
            set((state) => ({ streamingText: state.streamingText + chunk.delta }));
          }
        },
      );

      if (finalMessage) {
        set((state) => {
          const conversation = state.currentConversation;
          if (!conversation) return { streamingState: "complete", streamingText: "" };

          const alreadyPresent = conversation.messages.some((message) => message.id === finalMessage.id);
          const messages = alreadyPresent ? conversation.messages : [...conversation.messages, finalMessage];

          return {
            currentConversation: { ...conversation, messages, state: "complete" },
            sources: finalMessage.sources ?? [],
            streamingState: "complete",
            streamingText: "",
          };
        });
      } else {
        set({ streamingState: "complete" });
      }
    } catch (error) {
      set({ streamingState: "error", error: error instanceof Error ? error.message : "stream_failed" });
    }
  },

  retrieve: async (type, query) => {
    try {
      const response = await copilotClient.retrieve(type, query);
      set({ retrievalResults: response.results });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "retrieve_failed" });
    }
  },
}));
