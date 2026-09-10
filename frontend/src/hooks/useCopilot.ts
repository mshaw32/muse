/**
 * useCopilot — convenience hook wrapping `copilotStore` for components.
 *
 * Ensures the Copilot status is polled on mount and exposes the send/stream
 * actions the `ChatInput`/`SourcePanel`/`CopilotStatus` components need.
 */

import { useCallback, useEffect } from "react";
import { useCopilotStore } from "../store/copilotStore";

const STATUS_POLL_INTERVAL_MS = 15000;

export function useCopilot() {
  const currentConversation = useCopilotStore((state) => state.currentConversation);
  const copilotStatus = useCopilotStore((state) => state.copilotStatus);
  const sources = useCopilotStore((state) => state.sources);
  const streamingState = useCopilotStore((state) => state.streamingState);
  const streamingText = useCopilotStore((state) => state.streamingText);
  const retrievalResults = useCopilotStore((state) => state.retrievalResults);
  const error = useCopilotStore((state) => state.error);

  const refreshStatus = useCopilotStore((state) => state.refreshStatus);
  const login = useCopilotStore((state) => state.login);
  const logout = useCopilotStore((state) => state.logout);
  const startNewConversation = useCopilotStore((state) => state.startNewConversation);
  const loadActiveConversation = useCopilotStore((state) => state.loadActiveConversation);
  const clearConversation = useCopilotStore((state) => state.clearConversation);
  const loadHistory = useCopilotStore((state) => state.loadHistory);
  const exportConversation = useCopilotStore((state) => state.exportConversation);
  const sendPrompt = useCopilotStore((state) => state.sendPrompt);
  const streamPrompt = useCopilotStore((state) => state.streamPrompt);
  const retrieve = useCopilotStore((state) => state.retrieve);

  useEffect(() => {
    void refreshStatus();
    void loadActiveConversation();

    const interval = setInterval(() => {
      void refreshStatus();
    }, STATUS_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refreshStatus, loadActiveConversation]);

  const ask = useCallback(
    (prompt: string, streaming = true) => (streaming ? streamPrompt(prompt) : sendPrompt(prompt)),
    [streamPrompt, sendPrompt],
  );

  /**
   * Sends a prompt to Copilot (non-streaming) and resolves with the
   * assistant's final reply text — used by voice/push-to-talk so the
   * response can be spoken back via TTS once it's fully available.
   */
  const sendPromptAndGetReply = useCallback(
    async (prompt: string): Promise<string | null> => {
      await sendPrompt(prompt);
      const conversation = useCopilotStore.getState().currentConversation;
      const lastAssistantMessage = [...(conversation?.messages ?? [])]
        .reverse()
        .find((message) => message.role === "assistant");
      return lastAssistantMessage?.content ?? null;
    },
    [sendPrompt],
  );

  return {
    currentConversation,
    copilotStatus,
    sources,
    streamingState,
    streamingText,
    retrievalResults,
    error,
    ask,
    login,
    logout,
    startNewConversation,
    clearConversation,
    loadHistory,
    exportConversation,
    retrieve,
    sendPromptAndGetReply,
  };
}
