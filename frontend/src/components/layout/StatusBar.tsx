import { motion } from "framer-motion";
import { useMuseStore } from "../../store/museStore";
import { useSystemStatusStore } from "../../store/systemStatusStore";
import "./StatusBar.css";

const CONNECTION_COLORS: Record<string, string> = {
  connected: "#22c55e",
  connecting: "#ffa62b",
  disconnected: "#ef4444",
};

const SYNC_COLORS: Record<string, string> = {
  idle: "#0078d4",
  syncing: "#7a5af8",
  error: "#ef4444",
};

const COPILOT_COLORS: Record<string, string> = {
  ready: "#22c55e",
  retrieving: "#7a5af8",
  unavailable: "#ef4444",
};

const MEMORY_COLORS: Record<string, string> = {
  ready: "#22c55e",
  indexing: "#7a5af8",
  error: "#ef4444",
};

function StatusDot({ color }: { color: string }) {
  return (
    <motion.span
      className="status-dot"
      style={{ backgroundColor: color }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function StatusBar() {
  const museState = useMuseStore((state) => state.museState);
  const { connection, sync, copilot, memory, executingAction, retrievingContext } =
    useSystemStatusStore((state) => state);

  return (
    <footer className="status-bar glass-card">
      <div className="status-item">
        <StatusDot color={CONNECTION_COLORS[connection]} />
        <span>Connection: {connection}</span>
      </div>

      <div className="status-item">
        <StatusDot color={SYNC_COLORS[sync]} />
        <span>Memory Sync: {sync}</span>
      </div>

      <div className="status-item">
        <StatusDot color={COPILOT_COLORS[copilot]} />
        <span>Copilot: {copilot}</span>
      </div>

      <div className="status-item">
        <StatusDot color={MEMORY_COLORS[memory]} />
        <span>Memory: {memory}</span>
      </div>

      <div className="status-item status-item--muted">
        <span>Voice: {museState}</span>
      </div>

      {executingAction && (
        <div className="status-item status-item--highlight">
          <span>Executing Action…</span>
        </div>
      )}

      {retrievingContext && (
        <div className="status-item status-item--highlight">
          <span>Retrieving Context…</span>
        </div>
      )}
    </footer>
  );
}
