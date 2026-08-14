import { motion } from "framer-motion";
import { useMuseStore } from "../store/museStore";
import type { MuseState } from "../types/MuseState";
import "./SettingsPanel.css";

const DEMO_STATES: MuseState[] = [
  "idle",
  "listening",
  "thinking",
  "speaking",
  "alert",
  "error",
];

export default function SettingsPanel() {
  const settings = useMuseStore((state) => state.settings);
  const updateSettings = useMuseStore((state) => state.updateSettings);
  const sessionId = useMuseStore((state) => state.sessionId);
  const museState = useMuseStore((state) => state.museState);
  const setState = useMuseStore((state) => state.setState);

  return (
    <div className="settings-panel glass-card">
      <h2>Settings</h2>

      <div className="settings-row">
        <label htmlFor="voice-enabled">Voice Responses</label>
        <input
          id="voice-enabled"
          type="checkbox"
          checked={settings.voiceEnabled}
          onChange={(event) =>
            updateSettings({ voiceEnabled: event.target.checked })
          }
        />
      </div>

      <div className="settings-row">
        <label htmlFor="wake-word">Wake Word</label>
        <input
          id="wake-word"
          type="checkbox"
          checked={settings.wakeWordEnabled}
          onChange={(event) =>
            updateSettings({ wakeWordEnabled: event.target.checked })
          }
        />
      </div>

      <div className="settings-row settings-row--column">
        <label htmlFor="volume">Volume ({Math.round(settings.volume * 100)}%)</label>
        <input
          id="volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.volume}
          onChange={(event) =>
            updateSettings({ volume: Number(event.target.value) })
          }
        />
      </div>

      <div className="settings-row settings-row--column">
        <span className="settings-label">Session</span>
        <code className="settings-session-id">{sessionId}</code>
      </div>

      <div className="settings-row settings-row--column">
        <span className="settings-label">Visualizer State (demo)</span>
        <div className="settings-state-grid">
          {DEMO_STATES.map((state) => (
            <motion.button
              key={state}
              type="button"
              className={`settings-state-btn${
                state === museState ? " active" : ""
              }`}
              onClick={() => setState(state)}
              whileTap={{ scale: 0.95 }}
            >
              {state}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
