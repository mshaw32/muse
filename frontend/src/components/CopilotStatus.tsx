/**
 * CopilotStatus — connection/authentication indicator for the Microsoft 365
 * Copilot integration layer.
 *
 * States: Connected, Disconnected, Authenticating, Error (mock only).
 */

import { motion } from "framer-motion";
import type { CopilotConnectionStatus } from "../services/copilot/CopilotModels";
import "./CopilotStatus.css";

const STATUS_LABELS: Record<CopilotConnectionStatus, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  authenticating: "Authenticating…",
  error: "Error",
};

export interface CopilotStatusProps {
  status: CopilotConnectionStatus;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function CopilotStatus({ status, onLogin, onLogout }: CopilotStatusProps) {
  return (
    <div className={`copilot-status copilot-status--${status}`}>
      <motion.span
        className="copilot-status-dot"
        animate={status === "authenticating" ? { opacity: [0.35, 1, 0.35] } : { opacity: 1 }}
        transition={status === "authenticating" ? { duration: 1.2, repeat: Infinity } : undefined}
      />
      <span className="copilot-status-label">{STATUS_LABELS[status]}</span>

      {status === "disconnected" && onLogin && (
        <button type="button" className="copilot-status-action" onClick={onLogin}>
          Connect
        </button>
      )}

      {status === "connected" && onLogout && (
        <button type="button" className="copilot-status-action" onClick={onLogout}>
          Disconnect
        </button>
      )}

      {status === "error" && onLogin && (
        <button type="button" className="copilot-status-action" onClick={onLogin}>
          Retry
        </button>
      )}
    </div>
  );
}
