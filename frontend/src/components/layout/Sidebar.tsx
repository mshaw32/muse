import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMuseStore } from "../../store/museStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import DesktopControls from "./DesktopControls";
import "./Sidebar.css";

function RecentConversations() {
  const transcript = useMuseStore((state) => state.transcript);
  const recent = [...transcript].slice(-5).reverse();

  return (
    <div className="sidebar-section">
      <h3>Recent Conversations</h3>
      {recent.length === 0 ? (
        <p className="sidebar-empty">No conversation turns yet.</p>
      ) : (
        <ul className="sidebar-list">
          {recent.map((message) => (
            <li key={message.id} className="sidebar-list-item">
              <span className="sidebar-list-item-label">
                {message.role === "user" ? "You" : "MUSE"}
              </span>
              <span className="sidebar-list-item-text">{message.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CurrentProjects() {
  const projects = useWorkspaceStore((state) => state.projects);
  const refreshProjects = useWorkspaceStore((state) => state.refreshProjects);
  const loading = useWorkspaceStore((state) => state.loading);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <h3>Current Projects</h3>
        <button type="button" className="sidebar-refresh-btn" onClick={() => void refreshProjects()}>
          {loading ? "…" : "↻"}
        </button>
      </div>
      {projects.length === 0 ? (
        <p className="sidebar-empty">No projects retrieved yet.</p>
      ) : (
        <ul className="sidebar-list">
          {projects.map((project) => (
            <li key={project.id} className="sidebar-list-item">
              <span className="sidebar-list-item-label">{project.title}</span>
              <span className="sidebar-list-item-text">{project.summary}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MemoryShortcuts() {
  const [query, setQuery] = useState("");
  const vaultResults = useWorkspaceStore((state) => state.vaultResults);
  const searchVault = useWorkspaceStore((state) => state.searchVault);

  return (
    <div className="sidebar-section">
      <h3>Memory Shortcuts</h3>
      <form
        className="sidebar-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          void searchVault(query);
        }}
      >
        <input
          type="text"
          placeholder="Search vault memory…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="sidebar-search-input"
        />
      </form>
      {vaultResults.length > 0 && (
        <ul className="sidebar-list">
          {vaultResults.slice(0, 4).map((result) => (
            <li key={result.relativePath} className="sidebar-list-item">
              <span className="sidebar-list-item-label">{result.title}</span>
              <span className="sidebar-list-item-text">{result.excerpt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Actions() {
  const registeredActions = useWorkspaceStore((state) => state.registeredActions);
  const refreshActions = useWorkspaceStore((state) => state.refreshActions);
  const runAction = useWorkspaceStore((state) => state.runAction);

  useEffect(() => {
    void refreshActions();
  }, [refreshActions]);

  return (
    <div className="sidebar-section">
      <h3>Actions</h3>
      {registeredActions.length === 0 ? (
        <p className="sidebar-empty">No actions registered yet.</p>
      ) : (
        <ul className="sidebar-action-list">
          {registeredActions.slice(0, 6).map((action) => (
            <motion.li key={action.id} whileTap={{ scale: 0.97 }}>
              <button
                type="button"
                className="sidebar-action-btn"
                onClick={() => void runAction(action.id)}
                title={action.description}
              >
                <span>{action.name}</span>
                {action.requiresApproval && <span className="sidebar-action-badge">approval</span>}
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar glass-card">
      <CurrentProjects />
      <RecentConversations />
      <MemoryShortcuts />
      <Actions />
      <div className="sidebar-section">
        <h3>Settings</h3>
        <DesktopControls />
      </div>
    </aside>
  );
}
