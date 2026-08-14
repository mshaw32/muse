import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMuseStore } from "../store/museStore";
import "./TranscriptPanel.css";

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function TranscriptPanel() {
  const transcript = useMuseStore((state) => state.transcript);
  const clearMessages = useMuseStore((state) => state.clearMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [transcript.length]);

  return (
    <div className="transcript-panel glass-card">
      <div className="transcript-header">
        <h2>Transcript</h2>
        <button
          type="button"
          className="transcript-clear-btn"
          onClick={clearMessages}
          disabled={transcript.length === 0}
        >
          Clear
        </button>
      </div>

      <div className="transcript-scroll" ref={scrollRef}>
        {transcript.length === 0 && (
          <p className="transcript-empty">
            No messages yet. Press and hold the talk button to begin.
          </p>
        )}

        <AnimatePresence initial={false}>
          {transcript.map((message) => (
            <motion.div
              key={message.id}
              className={`transcript-message transcript-message--${message.role}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="transcript-message-meta">
                <span className="transcript-role">
                  {message.role === "user" ? "You" : "MUSE"}
                </span>
                <span className="transcript-timestamp">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <p className="transcript-text">{message.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
