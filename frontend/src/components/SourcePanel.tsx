/**
 * SourcePanel — displays grounding sources returned by the Copilot Chat and
 * Retrieval services (files, meetings, projects, conversations, and general
 * work context). Purely presentational; data comes from `useCopilot()`.
 */

import { motion, AnimatePresence } from "framer-motion";
import type { Source, SourceType } from "../services/copilot/CopilotModels";
import "./SourcePanel.css";

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  file: "File",
  meeting: "Meeting",
  project: "Project",
  task: "Task",
  conversation: "Conversation",
  context: "Work Context",
};

const SOURCE_TYPE_ICONS: Record<SourceType, string> = {
  file: "📄",
  meeting: "🗓️",
  project: "📁",
  task: "✅",
  conversation: "💬",
  context: "🧠",
};

export interface SourcePanelProps {
  sources: Source[];
  title?: string;
}

export default function SourcePanel({ sources, title = "Sources" }: SourcePanelProps) {
  return (
    <div className="source-panel glass-card">
      <h3 className="source-panel-title">{title}</h3>

      {sources.length === 0 ? (
        <p className="source-panel-empty">
          No sources yet. Ask Copilot a question to see grounded citations here.
        </p>
      ) : (
        <ul className="source-panel-list">
          <AnimatePresence initial={false}>
            {sources.map((source) => (
              <motion.li
                key={source.id}
                className="source-panel-item"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="source-panel-item-header">
                  <span className="source-panel-icon" aria-hidden="true">
                    {SOURCE_TYPE_ICONS[source.type]}
                  </span>
                  <span className="source-panel-item-title">{source.title}</span>
                  <span className="source-panel-badge">{SOURCE_TYPE_LABELS[source.type]}</span>
                </div>
                <p className="source-panel-snippet">{source.snippet}</p>
                {source.url && (
                  <a className="source-panel-link" href={source.url} target="_blank" rel="noreferrer">
                    Open source ↗
                  </a>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
