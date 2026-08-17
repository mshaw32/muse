/**
 * ChatInput — multiline Copilot prompt input.
 *
 * - Enter sends the prompt.
 * - Shift+Enter inserts a newline.
 * - Send button disabled while empty or while a response is streaming.
 */

import { useCallback, useRef, useState } from "react";
import "./ChatInput.css";

export interface ChatInputProps {
  onSend: (prompt: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    });
  }, [value, disabled, onSend]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
    // Shift+Enter falls through to the default newline behavior.
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="chat-input glass-card">
      <textarea
        ref={textareaRef}
        className="chat-input-textarea"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Ask Copilot anything about your work…"}
        rows={1}
        disabled={disabled}
      />
      <button
        type="button"
        className="chat-input-send-btn"
        onClick={handleSend}
        disabled={disabled || value.trim().length === 0}
        aria-label="Send prompt"
        title="Send (Enter) · New line (Shift+Enter)"
      >
        {disabled ? "…" : "Send"}
      </button>
    </div>
  );
}
