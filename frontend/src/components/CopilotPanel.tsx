/**
 * CopilotPanel — Phase 3 Copilot chat experience.
 *
 * Composes CopilotStatus (connection header), a streaming-aware message
 * list with source attribution/citations/timestamps/copy buttons,
 * SourcePanel, and ChatInput. This is an entirely new panel — it does not
 * modify the Phase 1 `TranscriptPanel` (voice transcript) in any way.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCopilot } from "../hooks/useCopilot";
import ChatInput from "./ChatInput";
import SourcePanel from "./SourcePanel";
import CopilotStatus from "./CopilotStatus";
import type { Message } from "../services/copilot/CopilotModels";
import "./CopilotPanel.css";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — silently ignore.
    }
  };

  return (
    <button type="button" className="copilot-message-copy-btn" onClick={handleCopy} title="Copy response">
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

function CopilotMessageBubble({ message }: { message: Message }) {
  return (
    <motion.div
      className={`copilot-message copilot-message--${message.role}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="copilot-message-meta">
        <span className="copilot-message-role">{message.role === "user" ? "You" : "Copilot"}</span>
        <span className="copilot-message-timestamp">{formatTimestamp(message.createdAt)}</span>
      </div>
      <p className="copilot-message-text">{message.content}</p>

      {message.citations && message.citations.length > 0 && (
        <div className="copilot-message-citations">
          {message.citations.map((citation) => (
            <span key={citation.sourceId} className="copilot-citation-chip" title={citation.title}>
              {citation.marker} {citation.title}
            </span>
          ))}
        </div>
      )}

      {message.role === "assistant" && (
        <div className="copilot-message-actions">
          <CopyButton text={message.content} />
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="copilot-typing-indicator" aria-label="Copilot is responding">
      <span />
      <span />
      <span />
    </div>
  );
}

export default function CopilotPanel() {
  const {
    currentConversation,
    copilotStatus,
    sources,
    streamingState,
    streamingText,
    error,
    ask,
    login,
    logout,
    startNewConversation,
    clearConversation,
    exportConversation,
  } = useCopilot();

  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = currentConversation?.messages ?? [];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamingText]);

  const handleExport = async (format: "json" | "markdown") => {
    const content = await exportConversation(format);
    if (!content) return;

    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${currentConversation?.title || "conversation"}.${format === "json" ? "json" : "md"}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="copilot-panel glass-card">
      <div className="copilot-panel-header">
        <div className="copilot-panel-header-title">
          <h2>Copilot</h2>
          <span className="copilot-panel-subtitle">
            {currentConversation?.title ?? "No active conversation"}
          </span>
        </div>
        <CopilotStatus status={copilotStatus} onLogin={() => void login()} onLogout={() => void logout()} />
      </div>

      <div className="copilot-panel-toolbar">
        <button type="button" className="copilot-toolbar-btn" onClick={() => void startNewConversation()}>
          New Conversation
        </button>
        <button type="button" className="copilot-toolbar-btn" onClick={() => void clearConversation()}>
          Clear
        </button>
        <button type="button" className="copilot-toolbar-btn" onClick={() => void handleExport("markdown")}>
          Export .md
        </button>
        <button type="button" className="copilot-toolbar-btn" onClick={() => void handleExport("json")}>
          Export .json
        </button>
      </div>

      <div className="copilot-panel-body">
        <div className="copilot-panel-messages" ref={scrollRef}>
          {messages.length === 0 && streamingState !== "streaming" && (
            <p className="copilot-panel-empty">
              Ask Copilot about your files, meetings, projects, or tasks to get started.
            </p>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <CopilotMessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>

          {streamingState === "streaming" && (
            <motion.div
              className="copilot-message copilot-message--assistant copilot-message--streaming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="copilot-message-meta">
                <span className="copilot-message-role">Copilot</span>
                <TypingIndicator />
              </div>
              <p className="copilot-message-text">{streamingText || "…"}</p>
            </motion.div>
          )}

          {error && <p className="copilot-panel-error">{error}</p>}
        </div>

        <SourcePanel sources={sources} />
      </div>

      <ChatInput
        disabled={streamingState === "streaming"}
        onSend={(prompt) => void ask(prompt, true)}
      />
    </div>
  );
}
