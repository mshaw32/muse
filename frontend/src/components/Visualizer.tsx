import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { useMuseStore } from "../store/museStore";
import type { MuseState } from "../types/MuseState";
import "./Visualizer.css";

const STATE_COLORS: Record<MuseState, string> = {
  idle: "#0078D4",
  listening: "#0078D4",
  thinking: "#7A5AF8",
  speaking: "#0078D4",
  alert: "#FFA62B",
  error: "#EF4444",
};

const STATE_LABELS: Record<MuseState, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  alert: "Alert",
  error: "Error",
};

/** Deterministic pseudo-random bar heights for the speaking visualizer */
const BAR_SEEDS = [0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.3, 0.7, 0.55, 0.95, 0.45, 0.65];

function IdleVisualizer({ color }: { color: string }) {
  return (
    <motion.div
      className="visualizer-core"
      style={{ backgroundColor: color }}
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.55, 0.9, 0.55],
        boxShadow: [
          `0 0 20px 6px ${color}55`,
          `0 0 45px 18px ${color}88`,
          `0 0 20px 6px ${color}55`,
        ],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function ListeningVisualizer({ color }: { color: string }) {
  const bars = useMemo(() => BAR_SEEDS, []);
  return (
    <div className="visualizer-waveform" aria-hidden>
      {bars.map((seed, index) => (
        <motion.span
          key={index}
          className="waveform-bar"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}aa` }}
          animate={{ scaleY: [0.2, seed, 0.3, seed * 0.8, 0.2] }}
          transition={{
            duration: 0.9 + (index % 4) * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.05,
          }}
        />
      ))}
    </div>
  );
}

function ThinkingVisualizer({ color }: { color: string }) {
  const particles = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);
  return (
    <div className="visualizer-orbit">
      <motion.div
        className="orbit-ring"
        style={{ borderColor: `${color}66` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="orbit-track"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        {particles.map((i) => {
          const angle = (360 / particles.length) * i;
          return (
            <motion.span
              key={i}
              className="orbit-particle"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 10px 2px ${color}aa`,
                transform: `rotate(${angle}deg) translate(60px) rotate(-${angle}deg)`,
              }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12,
              }}
            />
          );
        })}
      </motion.div>
      <div className="visualizer-core small" style={{ backgroundColor: color }} />
    </div>
  );
}

function SpeakingVisualizer({ color }: { color: string }) {
  const bars = useMemo(() => BAR_SEEDS, []);
  return (
    <div className="visualizer-bars" aria-hidden>
      {bars.map((seed, index) => (
        <motion.span
          key={index}
          className="audio-bar"
          style={{ backgroundColor: color, boxShadow: `0 0 14px ${color}aa` }}
          animate={{ scaleY: [seed * 0.3, seed, seed * 0.5, seed * 1, seed * 0.4] }}
          transition={{
            duration: 0.5 + (index % 5) * 0.08,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.04,
          }}
        />
      ))}
    </div>
  );
}

function AlertVisualizer({ color }: { color: string }) {
  return (
    <motion.div
      className="visualizer-core alert"
      style={{ backgroundColor: color }}
      animate={{
        scale: [1, 1.25, 1],
        boxShadow: [
          `0 0 15px 5px ${color}66`,
          `0 0 60px 24px ${color}bb`,
          `0 0 15px 5px ${color}66`,
        ],
      }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function ErrorVisualizer({ color }: { color: string }) {
  return (
    <motion.div
      className="visualizer-core error"
      style={{ backgroundColor: color }}
      animate={{
        scale: [1, 1.08, 1, 1.08, 1],
        opacity: [1, 0.6, 1, 0.6, 1],
        boxShadow: [
          `0 0 15px 5px ${color}88`,
          `0 0 8px 2px ${color}44`,
          `0 0 15px 5px ${color}88`,
        ],
      }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function Visualizer() {
  const museState = useMuseStore((state) => state.museState);
  const color = STATE_COLORS[museState];

  const renderVisual = () => {
    switch (museState) {
      case "idle":
        return <IdleVisualizer color={color} />;
      case "listening":
        return <ListeningVisualizer color={color} />;
      case "thinking":
        return <ThinkingVisualizer color={color} />;
      case "speaking":
        return <SpeakingVisualizer color={color} />;
      case "alert":
        return <AlertVisualizer color={color} />;
      case "error":
        return <ErrorVisualizer color={color} />;
      default:
        return null;
    }
  };

  return (
    <div className="visualizer-container glass-card">
      <div className="visualizer-stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={museState}
            className="visualizer-stage-inner"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {renderVisual()}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="visualizer-label" style={{ color }}>
        {STATE_LABELS[museState]}
      </div>
    </div>
  );
}
