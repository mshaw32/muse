import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "../../store/workspaceStore";
import "./ContextPanel.css";

export default function ContextPanel() {
  const vaultResults = useWorkspaceStore((state) => state.vaultResults);
  const activeSources = useWorkspaceStore((state) => state.activeSources);
  const recentFiles = useWorkspaceStore((state) => state.recentFiles);
  const actionResults = useWorkspaceStore((state) => state.actionResults);
  const refreshRecentFiles = useWorkspaceStore((state) => state.refreshRecentFiles);

  useEffect(() => {
    void refreshRecentFiles();
  }, [refreshRecentFiles]);

  return (
    <aside className="context-panel glass-card">
      <section className="context-section">
        <h3>Vault Context</h3>
        {vaultResults.length === 0 ? (
          <p className="context-empty">Search memory in the sidebar to see vault context here.</p>
        ) : (
          <ul className="context-list">
            {vaultResults.map((result) => (
              <li key={result.relativePath} className="context-list-item">
                <span className="context-list-title">{result.title}</span>
                <span className="context-list-path">{result.relativePath}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="context-section">
        <h3>Active Sources</h3>
        <ul className="context-tag-list">
          {activeSources.map((source) => (
            <li key={source.title} className="context-tag">
              {source.title}
              <span className="context-tag-type">{source.sourceType}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="context-section">
        <h3>Copilot Sources</h3>
        <p className="context-empty">
          Citations returned by Microsoft 365 Copilot Chat will appear here once a
          question is asked.
        </p>
      </section>

      <section className="context-section">
        <h3>Recent Files</h3>
        {recentFiles.length === 0 ? (
          <p className="context-empty">No files retrieved yet.</p>
        ) : (
          <ul className="context-list">
            {recentFiles.map((file) => (
              <li key={file.path} className="context-list-item">
                <span className="context-list-title">{file.name}</span>
                <span className="context-list-path">{file.path}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="context-section">
        <h3>Action Results</h3>
        <AnimatePresence initial={false}>
          {actionResults.length === 0 ? (
            <p className="context-empty">No actions executed yet.</p>
          ) : (
            <ul className="context-list">
              {actionResults.map((result) => (
                <motion.li
                  key={`${result.actionId}-${result.executedAt}`}
                  className="context-list-item"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="context-list-title">{result.actionId}</span>
                  <span className="context-list-path">{result.status} · {result.message}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </AnimatePresence>
      </section>
    </aside>
  );
}
