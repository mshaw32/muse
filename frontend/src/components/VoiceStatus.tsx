/**
 * VoiceStatus — connection/session state indicator for the Azure AI
 * Foundry Voice layer.
 *
 * States: Idle, Listening, Processing, Speaking, Disconnected, Error.
 */

import { motion } from "framer-motion";
import type { VoiceState } from "../services/voice/VoiceModels";
import "./VoiceStatus.css";

const STATUS_LABELS: Record<VoiceState, string> = {
  Idle: "Idle",
  Listening: "Listening",
  Processing: "Processing",
  Speaking: "Speaking",
  Disconnected: "Disconnected",
  Error: "Error",
};

export interface VoiceStatusProps {
  state: VoiceState;
  isMock?: boolean;
}

export default function VoiceStatus({ state, isMock }: VoiceStatusProps) {
  const pulsing = state === "Listening" || state === "Processing" || state === "Speaking";

  return (
    <div className={`voice-status voice-status--${state.toLowerCase()}`}>
      <motion.span
        className="voice-status-dot"
        animate={pulsing ? { opacity: [0.35, 1, 0.35] } : { opacity: 1 }}
        transition={pulsing ? { duration: 1.1, repeat: Infinity } : undefined}
      />
      <span className="voice-status-label">{STATUS_LABELS[state]}</span>
      {isMock && <span className="voice-status-mock-badge">Mock</span>}
    </div>
  );
}
