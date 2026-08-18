/**
 * VoicePanel — Phase 4 voice control center.
 *
 * Displays current voice state, selected microphone/speaker, transcript
 * preview, and voice activity. Composes VoiceStatus, MicrophoneSelector,
 * SpeakerSelector behind a single panel, plus start/stop listening
 * controls that exercise the Phase 4 realtime voice session API.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useVoice } from "../hooks/useVoice";
import VoiceStatus from "./VoiceStatus";
import MicrophoneSelector from "./MicrophoneSelector";
import SpeakerSelector from "./SpeakerSelector";
import "./VoicePanel.css";

export default function VoicePanel() {
  const {
    voiceState,
    isListening,
    isMock,
    provider,
    connectionState,
    currentTranscript,
    partialTranscript,
    error,
    startListening,
    stopListening,
  } = useVoice();

  const previewText = partialTranscript || currentTranscript;

  return (
    <div className="voice-panel glass-card">
      <div className="voice-panel-header">
        <h2>Voice</h2>
        <VoiceStatus state={voiceState} isMock={isMock} provider={provider} connectionState={connectionState} />
      </div>

      <div className="voice-panel-devices">
        <MicrophoneSelector />
        <SpeakerSelector />
      </div>

      <div className="voice-panel-transcript">
        <span className="voice-panel-transcript-label">Transcript preview</span>
        <AnimatePresence mode="wait">
          <motion.p
            key={previewText || "empty"}
            className="voice-panel-transcript-text"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {previewText || "Nothing captured yet."}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="voice-panel-activity" aria-hidden>
        {Array.from({ length: 10 }, (_, index) => (
          <motion.span
            key={index}
            className="voice-panel-activity-bar"
            animate={
              isListening
                ? { scaleY: [0.2, 0.6 + (index % 4) * 0.15, 0.3] }
                : { scaleY: 0.15 }
            }
            transition={{
              duration: 0.7 + (index % 3) * 0.1,
              repeat: isListening ? Infinity : 0,
              ease: "easeInOut",
              delay: index * 0.04,
            }}
          />
        ))}
      </div>

      <div className="voice-panel-controls">
        <button
          type="button"
          className="voice-panel-btn voice-panel-btn--start"
          onClick={() => void startListening()}
          disabled={isListening}
        >
          Start Listening
        </button>
        <button
          type="button"
          className="voice-panel-btn voice-panel-btn--stop"
          onClick={() => void stopListening()}
          disabled={!isListening}
        >
          Stop Listening
        </button>
      </div>

      {error && <p className="voice-panel-error">{error}</p>}
    </div>
  );
}
